// Doações (PIX) e gestão administrativa.
import type { Req as Request, Res as Response, AuthenticatedRequest } from '../http';
import { db, logAudit } from '../db';
import { authenticateToken, requireRole, requireAdmin } from '../auth';
import { validateEmail, sanitizeString, checkHoneypot, checkRateLimit } from '../validation';
import { apiRouter } from './router';

// =========================================================================
// 7. DOAÇÕES (PIX, INTENÇÃO DE DOAÇÃO E GESTÃO ADMINISTRATIVA)
// =========================================================================

// Registrar intenção de doação / comprovante PIX (Público)
apiRouter.post('/donations', async (req: Request, res: Response) => {
  const clientIp = req.ip;

  if (!checkHoneypot(req.body.hp_security_check)) {
    return res.status(200).json({ message: 'Doação registrada com sucesso.' });
  }

  if (!(await checkRateLimit(clientIp, 'public_donation', 10, 10))) {
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

  await db.prepare(`
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

  await logAudit({
    action: 'DONATION_REGISTERED',
    entity: 'DONATION',
    entityId: id,
    details: `Doação de R$ ${numValor.toFixed(2)} registrada via ${metodo || 'PIX'} por ${nome}`,
    ipAddress: clientIp,
  });

  return res.status(201).json({
    message: 'Doação registrada! Assim que a equipe confirmar o recebimento, ela entra nos números de transparência. Obrigado pelo apoio!',
    id,
    valor: numValor,
  });
});

// Listar doações (Protegido por Autenticação)
apiRouter.get('/donations', authenticateToken, requireRole(['admin', 'coordenador', 'equipe']), async (req: AuthenticatedRequest, res: Response) => {
  const donations = await db.prepare('SELECT * FROM donations ORDER BY criado_em DESC').all();
  return res.json(donations);
});

// Atualizar status da doação (Confirmado, Pendente, Cancelado)
apiRouter.patch('/donations/:id', authenticateToken, requireRole(['admin', 'coordenador', 'equipe']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, mensagem } = req.body;

  const allowedStatus = ['Confirmado', 'Pendente', 'Cancelado'];
  if (status !== undefined && !allowedStatus.includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Use: Confirmado, Pendente ou Cancelado.' });
  }

  const current = await db.prepare('SELECT * FROM donations WHERE id = ?').get(id) as any;
  if (!current) {
    return res.status(404).json({ error: 'Doação não encontrada.' });
  }

  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE donations 
    SET status = COALESCE(?, status), 
        mensagem = COALESCE(?, mensagem),
        atualizado_em = ?
    WHERE id = ?
  `).run(status ?? null, typeof mensagem === 'string' ? sanitizeString(mensagem, 500) : null, now, id);

  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'DONATION_UPDATED',
    entity: 'DONATION',
    entityId: id,
    details: `Status da doação de ${current.nome} alterado para "${status}"`,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Doação atualizada com sucesso.' });
});

// Excluir doação (Exclusivo Administrador)
apiRouter.delete('/donations/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const current = await db.prepare('SELECT * FROM donations WHERE id = ?').get(id) as any;
  if (!current) {
    return res.status(404).json({ error: 'Doação não encontrada.' });
  }

  await db.prepare('DELETE FROM donations WHERE id = ?').run(id);

  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'DONATION_DELETED',
    entity: 'DONATION',
    entityId: id,
    details: `Registro de doação de ${current.nome} (R$ ${current.valor}) excluído.`,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Registro de doação excluído com sucesso.' });
});
