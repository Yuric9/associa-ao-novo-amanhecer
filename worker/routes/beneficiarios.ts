// Beneficiários: inscrição pública, LGPD e gestão.
import { defer } from '../http';
import type { Req as Request, Res as Response, AuthenticatedRequest } from '../http';
import { db, logAudit } from '../db';
import { authenticateToken, requireRole, requireAdmin, getOptionalUser } from '../auth';
import { validateCPF, validatePhone, validateEmail, sanitizeString, checkHoneypot, checkRateLimit } from '../validation';
import { notifyCoordinationNewBeneficiary, sendBeneficiaryConfirmation } from '../email';
import { apiRouter } from './router';

// =========================================================================
// 2. BENEFICIÁRIOS (RLS: APENAS ADMINS/COORDENAÇÃO LOGADOS, LGPD, VALIDAÇÃO)
// =========================================================================

/**
 * Regra de Acesso RLS: Dados de beneficiários só visíveis para administradores/equipe logados.
 * Qualquer requisição anônima recebe 401 Unauthorized.
 */
apiRouter.get('/beneficiaries', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const rows = await db.prepare(`
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
apiRouter.post('/beneficiaries', async (req: Request, res: Response) => {
  const clientIp = req.ip;

  // 1. Proteção Anti-Spam: Honeypot (campo armadilha invisível)
  if (!checkHoneypot(req.body.hp_security_check)) {
    return res.status(200).json({ message: 'Inscrição registrada com sucesso.' });
  }

  // 2. Proteção Anti-Spam: Limite de envios (Rate Limiting)
  if (!(await checkRateLimit(clientIp, 'cadastro_beneficiario', 6, 10))) {
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
  const existingBen = await db.prepare(`SELECT id, nome FROM beneficiaries WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?`)
    .get(cleanCpf) as { id: string; nome: string } | undefined;

  if (existingBen) {
    return res.status(400).json({
      error: `Já existe um cadastro ativo com este CPF em nome de ${existingBen.nome}. Procure a coordenação caso deseje atualizar.`,
    });
  }

  // Formulário público sempre entra como 'Pendente'. Só a equipe logada pode definir outro status
  // (antes qualquer visitante podia se cadastrar já como 'Aprovado').
  const staff = await getOptionalUser(req);
  const canSetStatus = !!staff && ['admin', 'coordenador', 'equipe'].includes(staff.role);
  const finalStatus = canSetStatus && status ? status : 'Pendente';

  const id = `ben-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString().split('T')[0];

  await db.prepare(`
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

  await logAudit({
    action: 'BENEFICIARY_REGISTERED',
    entity: 'BENEFICIARY',
    entityId: id,
    details: `Novo cadastro salvo no banco de dados: ${nome} (${projeto})`,
    ipAddress: clientIp,
  });

  // Notificação por E-mail automática para a coordenação e confirmação para o beneficiário
  defer(req, notifyCoordinationNewBeneficiary({
    nome: sanitizeString(nome, 120),
    cpf: sanitizeString(cpf, 20),
    telefone: sanitizeString(telefone, 30),
    projeto: sanitizeString(projeto || 'Aulas de Ballet Solidário', 100),
    endereco: sanitizeString(endereco || 'Trindade - GO', 200),
    email: sanitizeString(email || '', 100),
  }), 'Erro ao despachar e-mail para coordenacao');

  if (email && email.trim()) {
    defer(req, sendBeneficiaryConfirmation({
      nome: sanitizeString(nome, 120),
      email: sanitizeString(email, 100),
      projeto: sanitizeString(projeto || 'Aulas de Ballet Solidário', 100),
    }), 'Erro ao despachar confirmacao ao beneficiario');
  }

  return res.status(201).json({
    message: 'Inscrição gravada no banco de dados com sucesso! Nossa equipe analisará os dados.',
    id,
  });
});

// Atualização de Beneficiário (Equipe ou Admin)
apiRouter.patch('/beneficiaries/:id', authenticateToken, requireRole(['admin', 'equipe', 'coordenador']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { nome, cpf, nascimento, telefone, email, endereco, projeto, status, observacoes, motivo_status } = req.body;

  const current = await db.prepare('SELECT id, nome, status FROM beneficiaries WHERE id = ?').get(id) as { id: string; nome: string; status: string } | undefined;
  if (!current) {
    return res.status(404).json({ error: 'Beneficiário não encontrado no banco de dados.' });
  }

  if (cpf && !validateCPF(cpf)) {
    return res.status(400).json({ error: 'CPF inválido.' });
  }

  const now = new Date().toISOString().split('T')[0];

  await db.prepare(`
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

  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'BENEFICIARY_UPDATED',
    entity: 'BENEFICIARY',
    entityId: id,
    details: status && status !== current.status
      ? `Status alterado de "${current.status}" para "${status}"`
      : `Cadastro de ${current.nome} atualizado.`,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Dados do beneficiário atualizados no banco de dados.' });
});

// Exclusão de Beneficiário (Apenas Administrador)
apiRouter.delete('/beneficiaries/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const target = await db.prepare('SELECT nome FROM beneficiaries WHERE id = ?').get(id) as { nome: string } | undefined;

  if (!target) {
    return res.status(404).json({ error: 'Beneficiário não encontrado.' });
  }

  await db.prepare('DELETE FROM beneficiaries WHERE id = ?').run(id);

  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'BENEFICIARY_DELETED',
    entity: 'BENEFICIARY',
    entityId: id,
    details: `Beneficiário ${target.nome} excluído do banco.`,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Beneficiário excluído com sucesso.' });
});
