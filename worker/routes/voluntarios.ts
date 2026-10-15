// Voluntários: inscrição pública, listagem e edição pela equipe.
import type { Req as Request, Res as Response, AuthenticatedRequest } from '../http';
import { db, logAudit } from '../db';
import { authenticateToken, requireRole, getOptionalUser } from '../auth';
import { validatePhone, validateEmail, sanitizeString, checkHoneypot, checkRateLimit } from '../validation';
import { apiRouter } from './router';

// =========================================================================
// 3. VOLUNTÁRIOS (GRAVANDO NO BANCO, VALIDAÇÃO EM PORTUGUÊS)
// =========================================================================

apiRouter.get('/volunteers', authenticateToken, requireRole(['admin', 'equipe', 'coordenador']), async (_req: Request, res: Response) => {
  const list = await db.prepare('SELECT * FROM volunteers ORDER BY criado_em DESC').all();
  return res.json(list);
});

apiRouter.post('/volunteers', async (req: Request, res: Response) => {
  const clientIp = req.ip;

  if (!checkHoneypot(req.body.hp_security_check)) {
    return res.status(200).json({ message: 'Inscrição recebida com sucesso.' });
  }

  // Cadastro feito pela equipe logada no painel: sem limite por IP e com e-mail opcional
  const staff = await getOptionalUser(req);
  const isStaff = !!staff && ['admin', 'coordenador', 'equipe'].includes(staff.role);

  if (!isStaff && !(await checkRateLimit(clientIp, 'inscricao_voluntario', 5, 10))) {
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

  if (isStaff ? email && !validateEmail(email) : !email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Por favor, informe um e-mail válido para contato.' });
  }

  if (!area) {
    return res.status(400).json({ error: 'Por favor, selecione a área de atuação voluntária.' });
  }

  const id = `vol-${Date.now()}`;
  const now = new Date().toISOString().split('T')[0];

  await db.prepare(`
    INSERT INTO volunteers (id, nome, telefone, email, area, disponibilidade, ativo, data_inicio, habilidades, observacoes, consentimento_lgpd, ip_origem, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 1, ?, ?)
  `).run(
    id,
    sanitizeString(nome, 100),
    sanitizeString(telefone, 30),
    sanitizeString(email || '', 100),
    sanitizeString(area, 60),
    sanitizeString(disponibilidade || 'Finais de Semana', 60),
    now,
    sanitizeString(habilidades || '', 255),
    sanitizeString(observacoes || '', 500),
    clientIp,
    now
  );

  await logAudit({
    action: 'VOLUNTEER_REGISTERED',
    entity: 'VOLUNTEER',
    entityId: id,
    details: `Novo voluntário cadastrado no banco: ${nome} (${area})`,
    ipAddress: clientIp,
  });

  return res.status(201).json({ message: 'Inscrição de voluntário gravada no banco com sucesso! Entraremos em contato via WhatsApp.', id });
});

// Edição de voluntário pela equipe (dados, área, disponibilidade e ativo/pausado).
// Campo ausente no pedido = mantém o valor atual; campo vazio = apaga (só nos opcionais).
apiRouter.patch('/volunteers/:id', authenticateToken, requireRole(['admin', 'equipe', 'coordenador']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body ?? {};

  const current = await db.prepare('SELECT id, nome, ativo FROM volunteers WHERE id = ?').get(id) as { id: string; nome: string; ativo: number } | undefined;
  if (!current) {
    return res.status(404).json({ error: 'Voluntário não encontrado no banco de dados.' });
  }

  const CAMPOS: Record<string, { max: number; obrigatorio: boolean }> = {
    nome: { max: 100, obrigatorio: true },
    telefone: { max: 30, obrigatorio: true },
    area: { max: 60, obrigatorio: true },
    disponibilidade: { max: 60, obrigatorio: true },
    email: { max: 100, obrigatorio: false },
    habilidades: { max: 255, obrigatorio: false },
    observacoes: { max: 500, obrigatorio: false },
  };

  const valores: Record<string, string | null> = {};
  for (const [campo, regra] of Object.entries(CAMPOS)) {
    if (body[campo] === undefined || body[campo] === null) {
      valores[campo] = null; // não enviado: COALESCE mantém o valor do banco
      continue;
    }
    const valor = sanitizeString(body[campo], regra.max);
    if (regra.obrigatorio && !valor) {
      return res.status(400).json({ error: `O campo "${campo}" é obrigatório e não pode ficar em branco.` });
    }
    valores[campo] = valor;
  }

  if (valores.telefone && !validatePhone(valores.telefone)) {
    return res.status(400).json({ error: 'Telefone inválido. Informe DDD e número.' });
  }
  if (valores.email && !validateEmail(valores.email)) {
    return res.status(400).json({ error: 'O formato do e-mail informado é inválido.' });
  }

  const ativo = typeof body.ativo === 'boolean' ? (body.ativo ? 1 : 0) : null;

  await db.prepare(`
    UPDATE volunteers SET
      nome = COALESCE(?, nome),
      telefone = COALESCE(?, telefone),
      email = COALESCE(?, email),
      area = COALESCE(?, area),
      disponibilidade = COALESCE(?, disponibilidade),
      habilidades = COALESCE(?, habilidades),
      observacoes = COALESCE(?, observacoes),
      ativo = COALESCE(?, ativo)
    WHERE id = ?
  `).run(
    valores.nome,
    valores.telefone,
    valores.email,
    valores.area,
    valores.disponibilidade,
    valores.habilidades,
    valores.observacoes,
    ativo,
    id
  );

  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'VOLUNTEER_UPDATED',
    entity: 'VOLUNTEER',
    entityId: id,
    details: ativo !== null && ativo !== current.ativo
      ? `Voluntário ${current.nome} ${ativo ? 'reativado' : 'pausado'}.`
      : `Cadastro do voluntário ${current.nome} atualizado.`,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Dados do voluntário atualizados no banco de dados.' });
});
