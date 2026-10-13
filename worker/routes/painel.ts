// Auditoria e números do painel.
import type { Req as Request, Res as Response } from '../http';
import { db } from '../db';
import { authenticateToken, requireAdmin } from '../auth';
import { apiRouter } from './router';

// =========================================================================
// 6. AUDITORIA E MÉTRICAS REAIS
// =========================================================================

apiRouter.get('/audit-logs', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  const logs = await db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
  return res.json(logs);
});

apiRouter.get('/stats', authenticateToken, async (_req: Request, res: Response) => {
  const totalBeneficiarios = (await db.prepare('SELECT COUNT(*) as count FROM beneficiaries').get() as { count: number }).count;
  const totalVoluntarios = (await db.prepare('SELECT COUNT(*) as count FROM volunteers').get() as { count: number }).count;
  const totalProjetos = (await db.prepare('SELECT COUNT(*) as count FROM projects WHERE ativo = 1').get() as { count: number }).count;

  // Famílias atendidas: beneficiários com status Atendido/Entregue ou Aprovado
  const familiasAtendidas = (await db.prepare(`
    SELECT COUNT(*) as count FROM beneficiaries WHERE status IN ('Atendido/Entregue', 'Aprovado')
  `).get() as { count: number }).count;

  // Doações do Mês (Soma e Contagem)
  const donationStats = await db.prepare(`
    SELECT 
      COALESCE(SUM(valor), 0) as totalValor,
      COUNT(*) as count
    FROM donations 
    WHERE status = 'Confirmado'
  `).get() as { totalValor: number; count: number };

  const statusRows = await db.prepare(`
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
