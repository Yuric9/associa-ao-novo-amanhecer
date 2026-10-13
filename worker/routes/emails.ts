// E-mail da coordenação e histórico de e-mails.
import type { Req as Request, Res as Response, AuthenticatedRequest } from '../http';
import { db, logAudit } from '../db';
import { authenticateToken, requireRole, requireAdmin } from '../auth';
import { cfg } from '../env';
import { validateEmail } from '../validation';
import { getCoordinationEmail } from '../email';
import { apiRouter } from './router';

// =========================================================================
// 8. CONFIGURAÇÕES DE NOTIFICAÇÃO & HISTÓRICO DE E-MAILS
// =========================================================================

// Consultar e-mail configurado para a coordenação
apiRouter.get('/coordination-email', authenticateToken, async (_req: Request, res: Response) => {
  const email = await getCoordinationEmail();
  return res.json({
    email,
    isCustomized: Boolean(cfg('COORDINATION_EMAIL')) || email !== 'coordenacao@novoamanhecer.org.br',
  });
});

// Atualizar e-mail oficial da coordenação (Armazenado no CMS)
apiRouter.put('/coordination-email', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Por favor, informe um endereço de e-mail válido para a coordenação.' });
  }

  try {
    const row = await db.prepare('SELECT content_json FROM site_content WHERE id = ?').get('main') as { content_json: string } | undefined;
    if (row && row.content_json) {
      const parsed = JSON.parse(row.content_json);
      parsed.contato_email = email.trim().toLowerCase();
      const now = new Date().toISOString();
      await db.prepare('UPDATE site_content SET content_json = ?, atualizado_em = ? WHERE id = ?')
        .run(JSON.stringify(parsed), now, 'main');
    }

    await logAudit({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'COORDINATION_EMAIL_UPDATED',
      entity: 'CONFIG',
      details: `E-mail de notificações da coordenação alterado para "${email}"`,
      ipAddress: req.ip,
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
apiRouter.get('/emails/logs', authenticateToken, requireRole(['admin', 'coordenador', 'equipe']), async (_req: Request, res: Response) => {
  const logs = await db.prepare('SELECT * FROM email_logs ORDER BY enviado_em DESC LIMIT 100').all();
  return res.json(logs);
});
