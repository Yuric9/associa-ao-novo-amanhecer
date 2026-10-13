// Login, sessão, senha e gestão de usuários.
import { defer } from '../http';
import type { Req as Request, Res as Response, AuthenticatedRequest } from '../http';
import { db, logAudit, getUserRoles, assignUserRole } from '../db';
import { authenticateToken, requireAdmin, getJwtSecret, resolvePrimaryRole, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../auth';
import { hashPassword, verifyPassword, randomToken, signJwt } from '../crypto';
import { isDevMode } from '../env';
import { validateEmail, sanitizeString, checkRateLimit } from '../validation';
import { sendSystemEmail } from '../email';
import { apiRouter } from './router';

// =========================================================================
// 1. AUTENTICAÇÃO REAL E GESTÃO DE USUÁRIOS (RBAC COM TABELA SEPARADA)
// =========================================================================

// Login Real com Verificação de Senha Segura (PBKDF2) e Papel em Tabela Separada
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Por favor, informe e-mail e senha.' });
  }

  const clientIp = req.ip;

  // Proteção contra força bruta: máx 10 tentativas de login por IP a cada 15 minutos
  if (!(await checkRateLimit(clientIp, 'auth_login', 10, 15))) {
    return res.status(429).json({
      error: 'Muitas tentativas de login incorretas. Por segurança, aguarde alguns minutos antes de tentar novamente.',
    });
  }

  const user = await db.prepare(`
    SELECT id, nome, email, password_hash, ativo FROM users WHERE LOWER(email) = LOWER(?)
  `).get(email.trim()) as { id: string; nome: string; email: string; password_hash: string; ativo: number } | undefined;

  if (!user || user.ativo !== 1) {
    await logAudit({
      action: 'LOGIN_FAILED',
      entity: 'USER',
      details: `Tentativa de login falha para o e-mail: ${email}`,
      ipAddress: clientIp,
    });
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  const isPasswordValid = await verifyPassword(password, user.password_hash);
  if (!isPasswordValid) {
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN_FAILED',
      entity: 'USER',
      details: 'Senha incorreta informada.',
      ipAddress: clientIp,
    });
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  // Obter papéis exclusivamente a partir da tabela separada user_roles
  const roles = await getUserRoles(user.id);
  const primaryRole = await resolvePrimaryRole(user.id, roles);
  if (!primaryRole) {
    return res.status(403).json({ error: 'Sua conta não possui nenhum perfil de acesso atribuído. Contate a coordenação.' });
  }

  // Registrar a sessão no banco (o token só vale enquanto ela existir) e limpar as expiradas
  const sessionId = randomToken(24);
  const nowMs = Date.now();
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(nowMs),
    db.prepare('INSERT INTO sessions (id, user_id, expires_at, ip_origem, criado_em) VALUES (?, ?, ?, ?, ?)')
      .bind(sessionId, user.id, nowMs + SESSION_TTL_SECONDS * 1000, clientIp, new Date(nowMs).toISOString()),
  ]);

  // Gerar token JWT seguro com validade de 24 horas, ligado à sessão (sid)
  const token = await signJwt(
    { id: user.id, sid: sessionId, email: user.email, role: primaryRole, roles },
    getJwtSecret(),
    SESSION_TTL_SECONDS
  );

  // O token vai SOMENTE no cookie HttpOnly (não aparece no corpo da resposta,
  // então nenhum script da página consegue lê-lo ou guardá-lo).
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: SESSION_TTL_SECONDS * 1000,
  });

  await logAudit({
    userId: user.id,
    userEmail: user.email,
    userRole: primaryRole,
    action: 'LOGIN_SUCCESS',
    entity: 'USER',
    details: `Login bem-sucedido. Papel verificado no banco: ${primaryRole}`,
    ipAddress: clientIp,
  });

  return res.json({
    message: 'Login realizado com sucesso.',
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: primaryRole,
      roles,
    },
  });
});

// Perfil do Usuário Logado
apiRouter.get('/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    user: req.user,
  });
});

// Logout Seguro (Invalida Cookie e Notifica Sessão)
apiRouter.post('/auth/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  // Apagar a sessão invalida o token na hora, mesmo que alguém tenha copiado o cookie
  await db.prepare('DELETE FROM sessions WHERE id = ?').run(req.sessionId);
  res.clearCookie(SESSION_COOKIE);
  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'LOGOUT',
    entity: 'USER',
    details: 'Usuário encerrou a sessão no painel.',
    ipAddress: req.ip,
  });
  return res.json({ message: 'Sessão encerrada com sucesso.' });
});

// Solicitação de Recuperação de Senha Segura
apiRouter.post('/auth/request-password-reset', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Por favor, informe um endereço de e-mail válido.' });
  }

  const clientIp = req.ip;
  if (!(await checkRateLimit(clientIp, 'password_reset', 5, 15))) {
    return res.status(429).json({ error: 'Muitas solicitações. Aguarde alguns minutos e tente novamente.' });
  }

  const user = await db.prepare('SELECT id, nome, email FROM users WHERE LOWER(email) = LOWER(?)')
    .get(email.trim()) as { id: string; nome: string; email: string } | undefined;

  if (user) {
    // Código imprevisível (antes usava Math.random, que é adivinhável)
    const token = randomToken(24);
    const expiresAt = Date.now() + 60 * 60 * 1000;
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO password_resets (token, user_id, expires_at, usado, criado_em)
      VALUES (?, ?, ?, 0, ?)
    `).run(token, user.id, expiresAt, now);

    await logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'PASSWORD_RESET_REQUESTED',
      entity: 'SECURITY',
      details: 'Token de recuperação de senha gerado.',
      ipAddress: req.ip,
    });

    // O código vai SOMENTE para o e-mail do usuário. Antes ele era devolvido na resposta,
    // o que permitia a qualquer pessoa trocar a senha de qualquer conta (inclusive do admin).
    // O corpo gravado no histórico não contém o código.
    defer(req, sendSystemEmail({
      tipo: 'AVISO_SISTEMA',
      destinatario: user.email,
      assunto: 'Código para redefinir sua senha - Associação Novo Amanhecer',
      corpo: `Olá, ${user.nome}. Foi solicitada a redefinição da sua senha. Seu código de redefinição é: ${token}. Ele expira em 1 hora. Se você não pediu, ignore este e-mail.`,
      corpoLog: 'Código de redefinição enviado (oculto no histórico).',
    }), 'Erro ao enviar código de redefinição');
    if (isDevMode()) {
      console.log(`[DEV] Código de redefinição para ${user.email}: ${token}`);
    }
  }

  return res.json({
    message: 'Se o e-mail estiver cadastrado, você receberá um código de redefinição válido por 1 hora.',
  });
});

// Redefinição de Senha
apiRouter.post('/auth/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  const resetIp = req.ip;
  if (!(await checkRateLimit(resetIp, 'password_reset_confirm', 10, 15))) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  if (typeof token !== 'string' || typeof newPassword !== 'string' || !token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      error: 'A nova senha deve possuir pelo menos 8 caracteres para garantir a segurança.',
    });
  }

  const resetRecord = await db.prepare(`
    SELECT token, user_id, expires_at, usado FROM password_resets WHERE token = ?
  `).get(token) as { token: string; user_id: string; expires_at: number; usado: number } | undefined;

  if (!resetRecord || resetRecord.usado === 1 || resetRecord.expires_at < Date.now()) {
    return res.status(400).json({
      error: 'O token de recuperação é inválido ou expirou. Solicite um novo.',
    });
  }

  const newHash = await hashPassword(newPassword);
  const now = new Date().toISOString();

  await db.prepare('UPDATE users SET password_hash = ?, atualizado_em = ? WHERE id = ?')
    .run(newHash, now, resetRecord.user_id);

  // Invalida este e quaisquer outros códigos pendentes do mesmo usuário
  await db.prepare('UPDATE password_resets SET usado = 1 WHERE user_id = ?')
    .run(resetRecord.user_id);

  // Encerra todas as sessões abertas: quem tinha a senha antiga é desconectado
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').run(resetRecord.user_id);

  await logAudit({
    userId: resetRecord.user_id,
    action: 'PASSWORD_RESET_COMPLETED',
    entity: 'SECURITY',
    details: 'Senha do usuário alterada com sucesso.',
    ipAddress: req.ip,
  });

  return res.json({ message: 'Senha redefinida com sucesso! Você já pode entrar com a nova senha.' });
});

// Listagem de Usuários e Níveis (Somente Administrador - consulta tabela separada user_roles)
apiRouter.get('/auth/users', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  const users = await db.prepare(`
    SELECT 
      u.id, 
      u.nome, 
      u.email, 
      u.ativo, 
      u.criado_em, 
      u.atualizado_em,
      COALESCE(ur.role_id, 'equipe') as role,
      COALESCE(r.nome_exibicao, 'Equipe Social') as role_nome
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.role
    ORDER BY u.criado_em DESC
  `).all();
  return res.json(users);
});

// Criação de Novo Usuário no Sistema (Somente Administrador - Papel salvo em tabela separada)
apiRouter.post('/auth/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { nome, email, password, role } = req.body;

  if (!nome || !email || !password || !role) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios (nome, e-mail, senha e papel).' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Formato de e-mail inválido.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'A senha provisória deve conter pelo menos 8 caracteres.' });
  }

  const validRoles = ['admin', 'equipe', 'coordenador', 'voluntario'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Papel de acesso inválido. Escolha: admin, equipe, coordenador ou voluntario.' });
  }

  const existing = await db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (existing) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
  }

  const id = `usr-${Date.now()}`;
  const now = new Date().toISOString();
  const hash = await hashPassword(password);

  // Inserir usuário na tabela users (sem coluna de papel)
  await db.prepare(`
    INSERT INTO users (id, nome, email, password_hash, ativo, criado_em, atualizado_em)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `).run(id, sanitizeString(nome, 100), email.trim().toLowerCase(), hash, now, now);

  // Inserir papel na tabela separada user_roles
  await assignUserRole(id, role);

  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'USER_CREATED',
    entity: 'USER',
    entityId: id,
    details: `Criado usuário ${email} com papel '${role}' na tabela separada user_roles`,
    ipAddress: req.ip,
  });

  return res.status(201).json({
    message: 'Usuário cadastrado com sucesso com perfil atribuído.',
    user: { id, nome, email, role, ativo: 1, criado_em: now },
  });
});

// Exclusão de Usuário (Somente Administrador)
apiRouter.delete('/auth/users/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (id === req.user?.id) {
    return res.status(400).json({ error: 'Você não pode excluir sua própria conta enquanto estiver logado.' });
  }

  const target = await db.prepare('SELECT email FROM users WHERE id = ?').get(id) as { email: string } | undefined;
  if (!target) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Deleta do users (as regras de CASCADE removem o user_roles automaticamente)
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  await db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(id);
  await db.prepare('DELETE FROM users WHERE id = ?').run(id);

  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'USER_DELETED',
    entity: 'USER',
    entityId: id,
    details: `Excluído usuário ${target.email}`,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Usuário excluído com sucesso.' });
});
