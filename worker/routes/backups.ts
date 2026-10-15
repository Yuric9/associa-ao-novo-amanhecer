// Backups automáticos guardados no R2: listar, baixar e gerar um agora. Só o administrador.
import type { Req as Request, Res as Response, AuthenticatedRequest } from '../http';
import { authenticateToken, requireAdmin } from '../auth';
import { fotosBucket } from '../env';
import { logAudit } from '../db';
import { BackupInvalido, PASTA, fazerBackup, listarBackups, nomeValido, restaurarBackup } from '../backup';
import { apiRouter } from './router';

apiRouter.get('/backups', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  return res.json(await listarBackups());
});

apiRouter.post('/backups', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  const feito = await fazerBackup(new Date(), 'manual');
  return res.status(201).json(feito);
});

// Restaurar: o corpo é o próprio arquivo de backup (JSON). Substitui os dados atuais.
apiRouter.post('/backups/restaurar', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resultado = await restaurarBackup(req.body);
    await logAudit({
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action: 'BACKUP_RESTORED',
      entity: 'BACKUP',
      details: `Dados restaurados de um backup de ${String(req.body?.data_backup || 'data desconhecida').slice(0, 10)}. Cópia do estado anterior: ${resultado.copia_de_seguranca}.`,
      ipAddress: req.ip,
    });
    return res.json(resultado);
  } catch (err) {
    if (err instanceof BackupInvalido) return res.status(400).json({ error: err.message });
    throw err;
  }
});

apiRouter.get('/backups/:nome', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  if (!nomeValido(req.params.nome)) return res.status(404).json({ error: 'Backup não encontrado.' });
  const objeto = await fotosBucket().get(PASTA + req.params.nome);
  if (!objeto) return res.status(404).json({ error: 'Backup não encontrado.' });
  return res
    .header('Content-Disposition', `attachment; filename="${req.params.nome}"`)
    .file(objeto.body, 'application/json; charset=utf-8', 'no-store');
});
