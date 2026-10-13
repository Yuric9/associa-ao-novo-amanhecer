// Voluntários: inscrição pública e listagem.
import { defer } from '../http';
import type { Req as Request, Res as Response } from '../http';
import { db, logAudit } from '../db';
import { authenticateToken, requireRole } from '../auth';
import { validatePhone, validateEmail, sanitizeString, checkHoneypot, checkRateLimit } from '../validation';
import { notifyCoordinationNewVolunteer, sendVolunteerConfirmation } from '../email';
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

  if (!(await checkRateLimit(clientIp, 'inscricao_voluntario', 5, 10))) {
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

  await db.prepare(`
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

  await logAudit({
    action: 'VOLUNTEER_REGISTERED',
    entity: 'VOLUNTEER',
    entityId: id,
    details: `Novo voluntário cadastrado no banco: ${nome} (${area})`,
    ipAddress: clientIp,
  });

  // Notificação por E-mail automática para a coordenação e confirmação para o voluntário
  defer(req, notifyCoordinationNewVolunteer({
    nome: sanitizeString(nome, 100),
    telefone: sanitizeString(telefone, 30),
    email: sanitizeString(email, 100),
    area: sanitizeString(area, 60),
    disponibilidade: sanitizeString(disponibilidade || 'Finais de Semana', 60),
  }), 'Erro ao despachar e-mail de voluntario para coordenacao');

  defer(req, sendVolunteerConfirmation({
    nome: sanitizeString(nome, 100),
    email: sanitizeString(email, 100),
    area: sanitizeString(area, 60),
  }), 'Erro ao despachar confirmacao ao voluntario');

  return res.status(201).json({ message: 'Inscrição de voluntário gravada no banco com sucesso! Entraremos em contato via WhatsApp.' });
});
