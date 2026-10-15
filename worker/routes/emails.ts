// Histórico de e-mails enviados (só recuperação de senha).
import type { Req as Request, Res as Response } from '../http';
import { db } from '../db';
import { authenticateToken, requireRole } from '../auth';
import { apiRouter } from './router';

// Histórico de E-mails Enviados pelo Sistema
// (O código de redefinição nunca é gravado aqui.)
apiRouter.get('/emails/logs', authenticateToken, requireRole(['admin', 'coordenador', 'equipe']), async (_req: Request, res: Response) => {
  const logs = await db.prepare('SELECT * FROM email_logs ORDER BY enviado_em DESC LIMIT 100').all();
  return res.json(logs);
});
