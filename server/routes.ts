import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { db, logAudit, getUserRoles, assignUserRole } from './db.js';
import { authenticateToken, requireRole, requireAdmin, JWT_SECRET, AuthenticatedRequest, resolvePrimaryRole, getOptionalUser } from './auth.js';
import {
  validateCPF,
  validatePhone,
  validateEmail,
  sanitizeString,
  checkHoneypot,
  checkRateLimit,
} from './validation.js';
import {
  notifyCoordinationNewBeneficiary,
  sendBeneficiaryConfirmation,
  notifyCoordinationNewVolunteer,
  sendVolunteerConfirmation,
  notifyCoordinationNewDonation,
  sendDonationConfirmation,
  getCoordinationEmail,
  sendSystemEmail,
} from './email.js';

export const apiRouter = Router();

// =========================================================================
// 1. AUTENTICAÇÃO REAL E GESTÃO DE USUÁRIOS (RBAC COM TABELA SEPARADA)
// =========================================================================

// Login Real com Verificação de Senha Segura (bcrypt) e Papel em Tabela Separada
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Por favor, informe e-mail e senha.' });
  }

  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

  // Proteção contra força bruta: máx 10 tentativas de login por IP a cada 15 minutos
  if (!checkRateLimit(clientIp, 'auth_login', 10, 15)) {
    return res.status(429).json({
      error: 'Muitas tentativas de login incorretas. Por segurança, aguarde alguns minutos antes de tentar novamente.',
    });
  }

  const user = db.prepare(`
    SELECT id, nome, email, password_hash, ativo FROM users WHERE LOWER(email) = LOWER(?)
  `).get(email.trim()) as { id: string; nome: string; email: string; password_hash: string; ativo: number } | undefined;

  if (!user || user.ativo !== 1) {
    logAudit({
      action: 'LOGIN_FAILED',
      entity: 'USER',
      details: `Tentativa de login falha para o e-mail: ${email}`,
      ipAddress: clientIp,
    });
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    logAudit({
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
  const roles = getUserRoles(user.id);
  const primaryRole = resolvePrimaryRole(user.id, roles);
  if (!primaryRole) {
    return res.status(403).json({ error: 'Sua conta não possui nenhum perfil de acesso atribuído. Contate a coordenação.' });
  }

  // Gerar token JWT seguro com validade de 24 horas
  const token = jwt.sign(
    { id: user.id, email: user.email, role: primaryRole, roles },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Definir cookie HTTP-Only para maior segurança
  res.cookie('ana_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  });

  logAudit({
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
    token,
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
apiRouter.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    user: req.user,
  });
});

// Logout Seguro (Invalida Cookie e Notifica Sessão)
apiRouter.post('/auth/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.clearCookie('ana_token');
  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'LOGOUT',
    entity: 'USER',
    details: 'Usuário encerrou a sessão no painel.',
    ipAddress: req.ip || '127.0.0.1',
  });
  return res.json({ message: 'Sessão encerrada com sucesso.' });
});

// Solicitação de Recuperação de Senha Segura
apiRouter.post('/auth/request-password-reset', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Por favor, informe um endereço de e-mail válido.' });
  }

  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp, 'password_reset', 5, 15)) {
    return res.status(429).json({ error: 'Muitas solicitações. Aguarde alguns minutos e tente novamente.' });
  }

  const user = db.prepare('SELECT id, nome, email FROM users WHERE LOWER(email) = LOWER(?)')
    .get(email.trim()) as { id: string; nome: string; email: string } | undefined;

  if (user) {
    // Código imprevisível (antes usava Math.random, que é adivinhável)
    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = Date.now() + 60 * 60 * 1000;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO password_resets (token, user_id, expires_at, usado, criado_em)
      VALUES (?, ?, ?, 0, ?)
    `).run(token, user.id, expiresAt, now);

    logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'PASSWORD_RESET_REQUESTED',
      entity: 'SECURITY',
      details: 'Token de recuperação de senha gerado.',
      ipAddress: req.ip || '127.0.0.1',
    });

    // O código vai SOMENTE para o e-mail do usuário. Antes ele era devolvido na resposta,
    // o que permitia a qualquer pessoa trocar a senha de qualquer conta (inclusive do admin).
    // O corpo gravado no histórico não contém o código.
    sendSystemEmail({
      tipo: 'AVISO_SISTEMA',
      destinatario: user.email,
      assunto: 'Código para redefinir sua senha - Associação Novo Amanhecer',
      corpo: `Olá, ${user.nome}. Foi solicitada a redefinição da sua senha. Seu código de redefinição é: ${token}. Ele expira em 1 hora. Se você não pediu, ignore este e-mail.`,
      corpoLog: 'Código de redefinição enviado (oculto no histórico).',
    }).catch(() => undefined);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Código de redefinição para ${user.email}: ${token}`);
    }
  }

  return res.json({
    message: 'Se o e-mail estiver cadastrado, você receberá um código de redefinição válido por 1 hora.',
  });
});

// Redefinição de Senha
apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  const resetIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(resetIp, 'password_reset_confirm', 10, 15)) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  if (typeof token !== 'string' || typeof newPassword !== 'string' || !token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      error: 'A nova senha deve possuir pelo menos 8 caracteres para garantir a segurança.',
    });
  }

  const resetRecord = db.prepare(`
    SELECT token, user_id, expires_at, usado FROM password_resets WHERE token = ?
  `).get(token) as { token: string; user_id: string; expires_at: number; usado: number } | undefined;

  if (!resetRecord || resetRecord.usado === 1 || resetRecord.expires_at < Date.now()) {
    return res.status(400).json({
      error: 'O token de recuperação é inválido ou expirou. Solicite um novo.',
    });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  const now = new Date().toISOString();

  db.prepare('UPDATE users SET password_hash = ?, atualizado_em = ? WHERE id = ?')
    .run(newHash, now, resetRecord.user_id);

  // Invalida este e quaisquer outros códigos pendentes do mesmo usuário
  db.prepare('UPDATE password_resets SET usado = 1 WHERE user_id = ?')
    .run(resetRecord.user_id);

  logAudit({
    userId: resetRecord.user_id,
    action: 'PASSWORD_RESET_COMPLETED',
    entity: 'SECURITY',
    details: 'Senha do usuário alterada com sucesso.',
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Senha redefinida com sucesso! Você já pode entrar com a nova senha.' });
});

// Listagem de Usuários e Níveis (Somente Administrador - consulta tabela separada user_roles)
apiRouter.get('/auth/users', authenticateToken, requireAdmin, (_req: Request, res: Response) => {
  const users = db.prepare(`
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
apiRouter.post('/auth/users', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
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

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (existing) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
  }

  const id = `usr-${Date.now()}`;
  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(password, 10);

  // Inserir usuário na tabela users (sem coluna de papel)
  db.prepare(`
    INSERT INTO users (id, nome, email, password_hash, ativo, criado_em, atualizado_em)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `).run(id, sanitizeString(nome, 100), email.trim().toLowerCase(), hash, now, now);

  // Inserir papel na tabela separada user_roles
  assignUserRole(id, role);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'USER_CREATED',
    entity: 'USER',
    entityId: id,
    details: `Criado usuário ${email} com papel '${role}' na tabela separada user_roles`,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.status(201).json({
    message: 'Usuário cadastrado com sucesso com perfil atribuído.',
    user: { id, nome, email, role, ativo: 1, criado_em: now },
  });
});

// Exclusão de Usuário (Somente Administrador)
apiRouter.delete('/auth/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (id === req.user?.id) {
    return res.status(400).json({ error: 'Você não pode excluir sua própria conta enquanto estiver logado.' });
  }

  const target = db.prepare('SELECT email FROM users WHERE id = ?').get(id) as { email: string } | undefined;
  if (!target) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Deleta do users (as regras de CASCADE removem o user_roles automaticamente)
  db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'USER_DELETED',
    entity: 'USER',
    entityId: id,
    details: `Excluído usuário ${target.email}`,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Usuário excluído com sucesso.' });
});

// =========================================================================
// 2. BENEFICIÁRIOS (RLS: APENAS ADMINS/COORDENAÇÃO LOGADOS, LGPD, VALIDAÇÃO)
// =========================================================================

/**
 * Regra de Acesso RLS: Dados de beneficiários só visíveis para administradores/equipe logados.
 * Qualquer requisição anônima recebe 401 Unauthorized.
 */
apiRouter.get('/beneficiaries', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const rows = db.prepare(`
    SELECT id, nome, cpf, nascimento, telefone, email, endereco, projeto, status, observacoes, motivo_status, consentimento_lgpd, criado_em, atualizado_em
    FROM beneficiaries
    ORDER BY criado_em DESC
  `).all() as any[];

  // Regra de Sigilo LGPD:
  // Voluntários operacionais recebem CPF e Endereço mascarados
  if (req.user?.role === 'voluntario') {
    const masked = rows.map((b) => ({
      ...b,
      cpf: b.cpf ? `***.***.${b.cpf.replace(/\D/g, '').slice(6, 9) || '000'}-**` : 'Protegido (LGPD)',
      endereco: 'Sigilo de Residência (Visível apenas para Coordenação/Admin)',
      telefone: b.telefone ? b.telefone.slice(0, 5) + '****-****' : '',
    }));
    return res.json(masked);
  }

  // Administrador Geral e Equipe/Coordenação recebem os dados cadastrais completos
  return res.json(rows);
});

// Cadastro de Beneficiário (Público ou pelo Painel - Gravando no Banco de Dados)
apiRouter.post('/beneficiaries', (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

  // 1. Proteção Anti-Spam: Honeypot (campo armadilha invisível)
  if (!checkHoneypot(req.body.hp_security_check)) {
    return res.status(200).json({ message: 'Inscrição registrada com sucesso.' });
  }

  // 2. Proteção Anti-Spam: Limite de envios (Rate Limiting)
  if (!checkRateLimit(clientIp, 'cadastro_beneficiario', 6, 10)) {
    return res.status(429).json({
      error: 'Limite de cadastros por conexão atingido. Por favor, aguarde alguns minutos antes de enviar novo formulário.',
    });
  }

  const {
    nome,
    cpf,
    nascimento,
    telefone,
    email,
    endereco,
    projeto,
    status,
    observacoes,
    consentimento_lgpd,
  } = req.body;

  // 3. Validação de Consentimento LGPD Obrigatório
  if (!consentimento_lgpd) {
    return res.status(400).json({
      error: 'É obrigatório aceitar o termo de consentimento da LGPD para registrar a inscrição na associação.',
    });
  }

  // 4. Validação Rigorosa de Campos Obrigatórios com Mensagens em Português
  if (!nome || !nome.trim() || nome.trim().length < 3) {
    return res.status(400).json({ error: 'O nome completo do beneficiário é obrigatório (mínimo 3 caracteres).' });
  }

  if (!cpf || !validateCPF(cpf)) {
    return res.status(400).json({
      error: 'O CPF informado é inválido. Por favor, verifique os 11 dígitos e tente novamente.',
    });
  }

  if (!telefone || !validatePhone(telefone)) {
    return res.status(400).json({
      error: 'Por favor, informe um telefone ou WhatsApp válido com DDD brasileiro (ex: (62) 99999-0000).',
    });
  }

  if (email && email.trim() && email.trim() !== 'Não informado' && !validateEmail(email)) {
    return res.status(400).json({ error: 'O formato do e-mail informado é inválido.' });
  }

  // 5. Verificar duplicidade de CPF no banco de dados
  const cleanCpf = cpf.replace(/\D/g, '');
  const existingBen = db.prepare('SELECT id, nome FROM beneficiaries WHERE REPLACE(REPLACE(REPLACE(cpf, ".", ""), "-", ""), " ", "") = ?')
    .get(cleanCpf) as { id: string; nome: string } | undefined;

  if (existingBen) {
    return res.status(400).json({
      error: `Já existe um cadastro ativo com este CPF em nome de ${existingBen.nome}. Procure a coordenação caso deseje atualizar.`,
    });
  }

  // Formulário público sempre entra como 'Pendente'. Só a equipe logada pode definir outro status
  // (antes qualquer visitante podia se cadastrar já como 'Aprovado').
  const staff = getOptionalUser(req);
  const canSetStatus = !!staff && ['admin', 'coordenador', 'equipe'].includes(staff.role);
  const finalStatus = canSetStatus && status ? status : 'Pendente';

  const id = `ben-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO beneficiaries (
      id, nome, cpf, nascimento, telefone, email, endereco, projeto, status, observacoes, consentimento_lgpd, ip_origem, criado_em, atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).run(
    id,
    sanitizeString(nome, 120),
    sanitizeString(cpf, 20),
    sanitizeString(nascimento || '2010-01-01', 20),
    sanitizeString(telefone, 30),
    sanitizeString(email || '', 100),
    sanitizeString(endereco || 'Trindade - GO', 200),
    sanitizeString(projeto || 'Aulas de Ballet Solidário', 100),
    sanitizeString(finalStatus, 30),
    sanitizeString(observacoes || '', 500),
    clientIp,
    now,
    now
  );

  logAudit({
    action: 'BENEFICIARY_REGISTERED',
    entity: 'BENEFICIARY',
    entityId: id,
    details: `Novo cadastro salvo no banco de dados: ${nome} (${projeto})`,
    ipAddress: clientIp,
  });

  // Notificação por E-mail automática para a coordenação e confirmação para o beneficiário
  notifyCoordinationNewBeneficiary({
    nome: sanitizeString(nome, 120),
    cpf: sanitizeString(cpf, 20),
    telefone: sanitizeString(telefone, 30),
    projeto: sanitizeString(projeto || 'Aulas de Ballet Solidário', 100),
    endereco: sanitizeString(endereco || 'Trindade - GO', 200),
    email: sanitizeString(email || '', 100),
  }).catch((e) => console.error('Erro ao despachar e-mail para coordenacao:', e));

  if (email && email.trim()) {
    sendBeneficiaryConfirmation({
      nome: sanitizeString(nome, 120),
      email: sanitizeString(email, 100),
      projeto: sanitizeString(projeto || 'Aulas de Ballet Solidário', 100),
    }).catch((e) => console.error('Erro ao despachar confirmacao ao beneficiario:', e));
  }

  return res.status(201).json({
    message: 'Inscrição gravada no banco de dados com sucesso! Nossa equipe analisará os dados.',
    id,
  });
});

// Atualização de Beneficiário (Equipe ou Admin)
apiRouter.patch('/beneficiaries/:id', authenticateToken, requireRole(['admin', 'equipe', 'coordenador']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { nome, cpf, nascimento, telefone, email, endereco, projeto, status, observacoes, motivo_status } = req.body;

  const current = db.prepare('SELECT id, nome, status FROM beneficiaries WHERE id = ?').get(id) as { id: string; nome: string; status: string } | undefined;
  if (!current) {
    return res.status(404).json({ error: 'Beneficiário não encontrado no banco de dados.' });
  }

  if (cpf && !validateCPF(cpf)) {
    return res.status(400).json({ error: 'CPF inválido.' });
  }

  const now = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE beneficiaries SET
      nome = COALESCE(?, nome),
      cpf = COALESCE(?, cpf),
      nascimento = COALESCE(?, nascimento),
      telefone = COALESCE(?, telefone),
      email = COALESCE(?, email),
      endereco = COALESCE(?, endereco),
      projeto = COALESCE(?, projeto),
      status = COALESCE(?, status),
      observacoes = COALESCE(?, observacoes),
      motivo_status = COALESCE(?, motivo_status),
      atualizado_em = ?
    WHERE id = ?
  `).run(
    nome ? sanitizeString(nome, 120) : null,
    cpf ? sanitizeString(cpf, 20) : null,
    nascimento ? sanitizeString(nascimento, 20) : null,
    telefone ? sanitizeString(telefone, 30) : null,
    email ? sanitizeString(email, 100) : null,
    endereco ? sanitizeString(endereco, 200) : null,
    projeto ? sanitizeString(projeto, 100) : null,
    status ? sanitizeString(status, 30) : null,
    observacoes ? sanitizeString(observacoes, 500) : null,
    motivo_status ? sanitizeString(motivo_status, 300) : null,
    now,
    id
  );

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'BENEFICIARY_UPDATED',
    entity: 'BENEFICIARY',
    entityId: id,
    details: status && status !== current.status
      ? `Status alterado de "${current.status}" para "${status}"`
      : `Cadastro de ${current.nome} atualizado.`,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Dados do beneficiário atualizados no banco de dados.' });
});

// Exclusão de Beneficiário (Apenas Administrador)
apiRouter.delete('/beneficiaries/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const target = db.prepare('SELECT nome FROM beneficiaries WHERE id = ?').get(id) as { nome: string } | undefined;

  if (!target) {
    return res.status(404).json({ error: 'Beneficiário não encontrado.' });
  }

  db.prepare('DELETE FROM beneficiaries WHERE id = ?').run(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'BENEFICIARY_DELETED',
    entity: 'BENEFICIARY',
    entityId: id,
    details: `Beneficiário ${target.nome} excluído do banco.`,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Beneficiário excluído com sucesso.' });
});

// =========================================================================
// 3. VOLUNTÁRIOS (GRAVANDO NO BANCO, VALIDAÇÃO EM PORTUGUÊS)
// =========================================================================

apiRouter.get('/volunteers', authenticateToken, requireRole(['admin', 'equipe', 'coordenador']), (_req: Request, res: Response) => {
  const list = db.prepare('SELECT * FROM volunteers ORDER BY criado_em DESC').all();
  return res.json(list);
});

apiRouter.post('/volunteers', (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!checkHoneypot(req.body.hp_security_check)) {
    return res.status(200).json({ message: 'Inscrição recebida com sucesso.' });
  }

  if (!checkRateLimit(clientIp, 'inscricao_voluntario', 5, 10)) {
    return res.status(429).json({ error: 'Muitas tentativas recentes. Aguarde alguns minutos.' });
  }

  const { nome, telefone, email, area, disponibilidade, habilidades, observacoes, consentimento_lgpd } = req.body;

  if (!consentimento_lgpd) {
    return res.status(400).json({ error: 'É necessário concordar com os termos da LGPD.' });
  }

  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'O nome completo do voluntário é obrigatório.' });
  }

  if (!telefone || !validatePhone(telefone)) {
    return res.status(400).json({ error: 'Por favor, informe um telefone ou WhatsApp válido com DDD.' });
  }

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Por favor, informe um e-mail válido para contato.' });
  }

  if (!area) {
    return res.status(400).json({ error: 'Por favor, selecione a área de atuação voluntária.' });
  }

  const id = `vol-${Date.now()}`;
  const now = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO volunteers (id, nome, telefone, email, area, disponibilidade, ativo, data_inicio, habilidades, observacoes, consentimento_lgpd, ip_origem, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 1, ?, ?)
  `).run(
    id,
    sanitizeString(nome, 100),
    sanitizeString(telefone, 30),
    sanitizeString(email, 100),
    sanitizeString(area, 60),
    sanitizeString(disponibilidade || 'Finais de Semana', 60),
    now,
    sanitizeString(habilidades || '', 255),
    sanitizeString(observacoes || '', 500),
    clientIp,
    now
  );

  logAudit({
    action: 'VOLUNTEER_REGISTERED',
    entity: 'VOLUNTEER',
    entityId: id,
    details: `Novo voluntário cadastrado no banco: ${nome} (${area})`,
    ipAddress: clientIp,
  });

  // Notificação por E-mail automática para a coordenação e confirmação para o voluntário
  notifyCoordinationNewVolunteer({
    nome: sanitizeString(nome, 100),
    telefone: sanitizeString(telefone, 30),
    email: sanitizeString(email, 100),
    area: sanitizeString(area, 60),
    disponibilidade: sanitizeString(disponibilidade || 'Finais de Semana', 60),
  }).catch((e) => console.error('Erro ao despachar e-mail de voluntario para coordenacao:', e));

  sendVolunteerConfirmation({
    nome: sanitizeString(nome, 100),
    email: sanitizeString(email, 100),
    area: sanitizeString(area, 60),
  }).catch((e) => console.error('Erro ao despachar confirmacao ao voluntario:', e));

  return res.status(201).json({ message: 'Inscrição de voluntário gravada no banco com sucesso! Entraremos em contato via WhatsApp.' });
});

// =========================================================================
// 4. MIGRAÇÃO AUTOMÁTICA SEGURA DO LOCALSTORAGE PARA O BANCO DE DADOS
// =========================================================================

// Restrito ao Administrador: antes era aberto a qualquer visitante, sem limite, permitindo
// inserir cadastros em massa e 'ressuscitar' registros excluídos a partir do cache do navegador.
apiRouter.post('/sync/migrate-from-local', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { beneficiaries, volunteers } = req.body;
  let migratedBeneficiaries = 0;
  let migratedVolunteers = 0;
  const now = new Date().toISOString().split('T')[0];

  // 1. Migrar beneficiários sem duplicar CPF
  if (Array.isArray(beneficiaries) && beneficiaries.length > 0) {
    const insertBen = db.prepare(`
      INSERT INTO beneficiaries (
        id, nome, cpf, nascimento, telefone, email, endereco, projeto, status, observacoes, consentimento_lgpd, criado_em, atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    for (const b of beneficiaries) {
      if (!b.cpf) continue;
      const cleanCpf = b.cpf.replace(/\D/g, '');
      const existing = db.prepare('SELECT id FROM beneficiaries WHERE REPLACE(REPLACE(REPLACE(cpf, ".", ""), "-", ""), " ", "") = ?')
        .get(cleanCpf);

      if (!existing) {
        insertBen.run(
          b.id || `ben-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sanitizeString(b.nome, 120),
          sanitizeString(b.cpf, 20),
          sanitizeString(b.nascimento || '2010-01-01', 20),
          sanitizeString(b.telefone || '(62) 99999-0000', 30),
          sanitizeString(b.email || '', 100),
          sanitizeString(b.endereco || 'Trindade - GO', 200),
          sanitizeString(b.projeto || 'Aulas de Ballet Solidário', 100),
          sanitizeString(b.status || 'Pendente', 30),
          sanitizeString(b.observacoes || '', 500),
          b.criado_em || now,
          b.atualizado_em || now
        );
        migratedBeneficiaries++;
      }
    }
  }

  // 2. Migrar voluntários sem duplicar email
  if (Array.isArray(volunteers) && volunteers.length > 0) {
    const insertVol = db.prepare(`
      INSERT INTO volunteers (id, nome, telefone, email, area, disponibilidade, ativo, data_inicio, habilidades, observacoes, consentimento_lgpd, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 1, ?)
    `);

    for (const v of volunteers) {
      if (!v.email) continue;
      const existing = db.prepare('SELECT id FROM volunteers WHERE LOWER(email) = LOWER(?)').get(v.email);
      if (!existing) {
        insertVol.run(
          v.id || `vol-${Date.now()}`,
          sanitizeString(v.nome, 100),
          sanitizeString(v.telefone || '(62) 99999-0000', 30),
          sanitizeString(v.email, 100),
          sanitizeString(v.area || 'Oficina de Ballet', 60),
          sanitizeString(v.disponibilidade || 'Sábados (Manhã)', 60),
          v.data_inicio || now,
          sanitizeString(v.habilidades || '', 255),
          sanitizeString(v.observacoes || '', 500),
          v.criado_em || now
        );
        migratedVolunteers++;
      }
    }
  }

  return res.json({
    message: 'Migração de dados executada com sucesso.',
    migratedBeneficiaries,
    migratedVolunteers,
  });
});

// =========================================================================
// 5. PROJETOS, GALERIA E CMS
// =========================================================================

apiRouter.get('/projects', (_req: Request, res: Response) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY ordem ASC').all();
  return res.json(projects);
});

apiRouter.put('/projects', authenticateToken, requireRole(['admin', 'equipe', 'coordenador']), (req: AuthenticatedRequest, res: Response) => {
  const projects = req.body;
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'Formato inválido de projetos.' });
  }

  db.exec('BEGIN');
  try {
  db.exec('DELETE FROM projects');
  const stmt = db.prepare(`
    INSERT INTO projects (id, titulo, descricao, foto_url, ativo, ordem, detalhes, idade_publico, horario, coordenador)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of projects) {
    stmt.run(
      p.id,
      p.titulo,
      p.descricao,
      p.foto_url,
      p.ativo ? 1 : 0,
      p.ordem || 1,
      p.detalhes || '',
      p.idade_publico || '',
      p.horario || '',
      p.coordenador || ''
    );
  }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Erro ao salvar projetos:', err);
    return res.status(400).json({ error: 'Não foi possível salvar os projetos. Nenhuma alteração foi aplicada.' });
  }

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'PROJECTS_UPDATED',
    entity: 'PROJECTS',
    details: 'Lista de projetos sociais atualizada.',
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Projetos salvos com sucesso no banco de dados.' });
});

apiRouter.get('/gallery', (_req: Request, res: Response) => {
  const items = db.prepare('SELECT * FROM gallery ORDER BY ordem ASC').all();
  return res.json(items);
});

apiRouter.put('/gallery', authenticateToken, requireRole(['admin', 'equipe', 'coordenador']), (req: AuthenticatedRequest, res: Response) => {
  const photos = req.body;
  if (!Array.isArray(photos)) {
    return res.status(400).json({ error: 'Formato inválido de fotos.' });
  }

  db.exec('BEGIN');
  try {
  db.exec('DELETE FROM gallery');
  const stmt = db.prepare(`
    INSERT INTO gallery (id, foto_url, legenda, ordem, categoria, data)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const g of photos) {
    stmt.run(g.id, g.foto_url, g.legenda, g.ordem || 1, g.categoria || 'geral', g.data || '');
  }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Erro ao salvar galeria:', err);
    return res.status(400).json({ error: 'Não foi possível salvar a galeria. Nenhuma alteração foi aplicada.' });
  }

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'GALLERY_UPDATED',
    entity: 'GALLERY',
    details: 'Galeria de fotos atualizada.',
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Galeria salva com sucesso no banco de dados.' });
});

apiRouter.get('/content', (_req: Request, res: Response) => {
  const row = db.prepare('SELECT content_json FROM site_content WHERE id = ?').get('main') as { content_json: string } | undefined;
  if (!row) {
    return res.status(404).json({ error: 'Conteúdo não encontrado.' });
  }
  return res.json(JSON.parse(row.content_json));
});

apiRouter.put('/content', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const content = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO site_content (id, content_json, atualizado_em)
    VALUES ('main', ?, ?)
    ON CONFLICT(id) DO UPDATE SET content_json = excluded.content_json, atualizado_em = excluded.atualizado_em
  `).run(JSON.stringify(content), now);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'CONTENT_UPDATED',
    entity: 'SITE_CONTENT',
    details: 'Textos institucionais e dados de contato do site alterados via CMS.',
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Conteúdo institucional atualizado com sucesso.' });
});

// =========================================================================
// 6. AUDITORIA E MÉTRICAS REAIS
// =========================================================================

apiRouter.get('/audit-logs', authenticateToken, requireAdmin, (_req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
  return res.json(logs);
});

apiRouter.get('/stats', authenticateToken, (_req: Request, res: Response) => {
  const totalBeneficiarios = (db.prepare('SELECT COUNT(*) as count FROM beneficiaries').get() as { count: number }).count;
  const totalVoluntarios = (db.prepare('SELECT COUNT(*) as count FROM volunteers').get() as { count: number }).count;
  const totalProjetos = (db.prepare('SELECT COUNT(*) as count FROM projects WHERE ativo = 1').get() as { count: number }).count;

  // Famílias atendidas: beneficiários com status Atendido/Entregue ou Aprovado
  const familiasAtendidas = (db.prepare(`
    SELECT COUNT(*) as count FROM beneficiaries WHERE status IN ('Atendido/Entregue', 'Aprovado')
  `).get() as { count: number }).count;

  // Doações do Mês (Soma e Contagem)
  const donationStats = db.prepare(`
    SELECT 
      COALESCE(SUM(valor), 0) as totalValor,
      COUNT(*) as count
    FROM donations 
    WHERE status = 'Confirmado'
  `).get() as { totalValor: number; count: number };

  const statusRows = db.prepare(`
    SELECT status, COUNT(*) as count FROM beneficiaries GROUP BY status
  `).all() as { status: string; count: number }[];

  const statusMap: Record<string, number> = {};
  statusRows.forEach((r) => {
    statusMap[r.status] = r.count;
  });

  return res.json({
    totalBeneficiarios,
    familiasAtendidas,
    totalVoluntarios,
    totalProjetos,
    totalDoacoesMes: donationStats.totalValor,
    countDoacoesMes: donationStats.count,
    statusMap,
  });
});

// =========================================================================
// 7. DOAÇÕES (PIX, INTENÇÃO DE DOAÇÃO E GESTÃO ADMINISTRATIVA)
// =========================================================================

// Registrar intenção de doação / comprovante PIX (Público)
apiRouter.post('/donations', (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!checkHoneypot(req.body.hp_security_check)) {
    return res.status(200).json({ message: 'Doação registrada com sucesso.' });
  }

  if (!checkRateLimit(clientIp, 'public_donation', 10, 10)) {
    return res.status(429).json({ error: 'Muitas tentativas de doação recentes. Por favor, aguarde alguns minutos.' });
  }

  const { nome, email, telefone, valor, mensagem, metodo } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'Por favor, informe seu nome ou identificação para o recibo da doação.' });
  }

  const numValor = parseFloat(valor);
  if (!Number.isFinite(numValor) || numValor < 1 || numValor > 1_000_000) {
    return res.status(400).json({ error: 'O valor da doação deve ser de no mínimo R$ 1,00.' });
  }

  if (email && email.trim() && !validateEmail(email)) {
    return res.status(400).json({ error: 'O e-mail informado é inválido.' });
  }

  const id = `don-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO donations (id, nome, email, telefone, valor, mensagem, metodo, status, ip_origem, criado_em, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendente', ?, ?, ?)
  `).run(
    id,
    sanitizeString(nome, 100),
    sanitizeString(email || '', 100),
    sanitizeString(telefone || '', 30),
    numValor,
    sanitizeString(mensagem || '', 500),
    sanitizeString(metodo || 'PIX', 30),
    clientIp,
    now,
    now
  );

  logAudit({
    action: 'DONATION_REGISTERED',
    entity: 'DONATION',
    entityId: id,
    details: `Doação de R$ ${numValor.toFixed(2)} registrada via ${metodo || 'PIX'} por ${nome}`,
    ipAddress: clientIp,
  });

  // Notificação por E-mail para Coordenação e Doador
  notifyCoordinationNewDonation({
    nome: sanitizeString(nome, 100),
    valor: numValor,
    metodo: sanitizeString(metodo || 'PIX', 30),
    mensagem: sanitizeString(mensagem || '', 500),
    email: sanitizeString(email || '', 100),
    telefone: sanitizeString(telefone || '', 30),
  }).catch((e) => console.error('Erro ao notificar doação à coordenação:', e));

  if (email && email.trim()) {
    sendDonationConfirmation({
      nome: sanitizeString(nome, 100),
      email: sanitizeString(email, 100),
      valor: numValor,
      metodo: sanitizeString(metodo || 'PIX', 30),
    }).catch((e) => console.error('Erro ao enviar confirmação de doação ao doador:', e));
  }

  return res.status(201).json({
    message: 'Doação registrada! Assim que a equipe confirmar o recebimento, ela entra nos números de transparência. Obrigado pelo apoio!',
    id,
    valor: numValor,
  });
});

// Listar doações (Protegido por Autenticação)
apiRouter.get('/donations', authenticateToken, requireRole(['admin', 'coordenador', 'equipe']), (req: AuthenticatedRequest, res: Response) => {
  const donations = db.prepare('SELECT * FROM donations ORDER BY criado_em DESC').all();
  return res.json(donations);
});

// Atualizar status da doação (Confirmado, Pendente, Cancelado)
apiRouter.patch('/donations/:id', authenticateToken, requireRole(['admin', 'coordenador', 'equipe']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, mensagem } = req.body;

  const allowedStatus = ['Confirmado', 'Pendente', 'Cancelado'];
  if (status !== undefined && !allowedStatus.includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Use: Confirmado, Pendente ou Cancelado.' });
  }

  const current = db.prepare('SELECT * FROM donations WHERE id = ?').get(id) as any;
  if (!current) {
    return res.status(404).json({ error: 'Doação não encontrada.' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE donations 
    SET status = COALESCE(?, status), 
        mensagem = COALESCE(?, mensagem),
        atualizado_em = ?
    WHERE id = ?
  `).run(status ?? null, typeof mensagem === 'string' ? sanitizeString(mensagem, 500) : null, now, id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'DONATION_UPDATED',
    entity: 'DONATION',
    entityId: id,
    details: `Status da doação de ${current.nome} alterado para "${status}"`,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Doação atualizada com sucesso.' });
});

// Excluir doação (Exclusivo Administrador)
apiRouter.delete('/donations/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const current = db.prepare('SELECT * FROM donations WHERE id = ?').get(id) as any;
  if (!current) {
    return res.status(404).json({ error: 'Doação não encontrada.' });
  }

  db.prepare('DELETE FROM donations WHERE id = ?').run(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'DONATION_DELETED',
    entity: 'DONATION',
    entityId: id,
    details: `Registro de doação de ${current.nome} (R$ ${current.valor}) excluído.`,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Registro de doação excluído com sucesso.' });
});

// =========================================================================
// 8. CONFIGURAÇÕES DE NOTIFICAÇÃO & HISTÓRICO DE E-MAILS
// =========================================================================

// Consultar e-mail configurado para a coordenação
apiRouter.get('/coordination-email', authenticateToken, (_req: Request, res: Response) => {
  const email = getCoordinationEmail();
  return res.json({
    email,
    isCustomized: Boolean(process.env.COORDINATION_EMAIL) || email !== 'coordenacao@novoamanhecer.org.br',
  });
});

// Atualizar e-mail oficial da coordenação (Armazenado no CMS)
apiRouter.put('/coordination-email', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Por favor, informe um endereço de e-mail válido para a coordenação.' });
  }

  try {
    const row = db.prepare('SELECT content_json FROM site_content WHERE id = ?').get('main') as { content_json: string } | undefined;
    if (row && row.content_json) {
      const parsed = JSON.parse(row.content_json);
      parsed.contato_email = email.trim().toLowerCase();
      const now = new Date().toISOString();
      db.prepare('UPDATE site_content SET content_json = ?, atualizado_em = ? WHERE id = ?')
        .run(JSON.stringify(parsed), now, 'main');
    }

    logAudit({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'COORDINATION_EMAIL_UPDATED',
      entity: 'CONFIG',
      details: `E-mail de notificações da coordenação alterado para "${email}"`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      message: `E-mail da coordenação atualizado para ${email} com sucesso!`,
      email: email.trim().toLowerCase(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao salvar e-mail da coordenação no banco.' });
  }
});

// Histórico de E-mails Enviados pelo Sistema
// Os e-mails contêm CPF/telefone completos: voluntários não podem ler este histórico.
apiRouter.get('/emails/logs', authenticateToken, requireRole(['admin', 'coordenador', 'equipe']), (_req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM email_logs ORDER BY enviado_em DESC LIMIT 100').all();
  return res.json(logs);
});
