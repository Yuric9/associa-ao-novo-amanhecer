// Conteúdo do site: projetos, galeria e textos (CMS).
import type { Req as Request, Res as Response, AuthenticatedRequest } from '../http';
import { db, logAudit } from '../db';
import { authenticateToken, requireRole, requireAdmin } from '../auth';
import { apiRouter } from './router';

// =========================================================================
// 5. PROJETOS, GALERIA E CMS
// =========================================================================

apiRouter.get('/projects', async (_req: Request, res: Response) => {
  const projects = await db.prepare('SELECT * FROM projects ORDER BY ordem ASC').all();
  return res.json(projects);
});

apiRouter.put('/projects', authenticateToken, requireRole(['admin', 'equipe', 'coordenador']), async (req: AuthenticatedRequest, res: Response) => {
  const projects = req.body;
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'Formato inválido de projetos.' });
  }

  // db.batch = transação: se qualquer comando falhar, nada é aplicado.
  try {
    const stmt = db.prepare(`
      INSERT INTO projects (id, titulo, descricao, foto_url, ativo, ordem, detalhes, idade_publico, horario, coordenador)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    await db.batch([
      db.prepare('DELETE FROM projects').bind(),
      ...projects.map((p: any) => stmt.bind(
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
      )),
    ]);
  } catch (err) {
    console.error('Erro ao salvar projetos:', err);
    return res.status(400).json({ error: 'Não foi possível salvar os projetos. Nenhuma alteração foi aplicada.' });
  }

  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'PROJECTS_UPDATED',
    entity: 'PROJECTS',
    details: 'Lista de projetos sociais atualizada.',
    ipAddress: req.ip,
  });

  return res.json({ message: 'Projetos salvos com sucesso no banco de dados.' });
});

apiRouter.get('/gallery', async (_req: Request, res: Response) => {
  const items = await db.prepare('SELECT * FROM gallery ORDER BY ordem ASC').all();
  return res.json(items);
});

apiRouter.put('/gallery', authenticateToken, requireRole(['admin', 'equipe', 'coordenador']), async (req: AuthenticatedRequest, res: Response) => {
  const photos = req.body;
  if (!Array.isArray(photos)) {
    return res.status(400).json({ error: 'Formato inválido de fotos.' });
  }

  // db.batch = transação: se qualquer comando falhar, nada é aplicado.
  try {
    const stmt = db.prepare('INSERT INTO gallery (id, foto_url, legenda, ordem, categoria, data) VALUES (?, ?, ?, ?, ?, ?)');
    await db.batch([
      db.prepare('DELETE FROM gallery').bind(),
      ...photos.map((g: any) => stmt.bind(g.id, g.foto_url, g.legenda, g.ordem || 1, g.categoria || 'geral', g.data || '')),
    ]);
  } catch (err) {
    console.error('Erro ao salvar galeria:', err);
    return res.status(400).json({ error: 'Não foi possível salvar a galeria. Nenhuma alteração foi aplicada.' });
  }

  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'GALLERY_UPDATED',
    entity: 'GALLERY',
    details: 'Galeria de fotos atualizada.',
    ipAddress: req.ip,
  });

  return res.json({ message: 'Galeria salva com sucesso no banco de dados.' });
});

apiRouter.get('/content', async (_req: Request, res: Response) => {
  const row = await db.prepare('SELECT content_json FROM site_content WHERE id = ?').get('main') as { content_json: string } | undefined;
  if (!row) {
    return res.status(404).json({ error: 'Conteúdo não encontrado.' });
  }
  return res.json(JSON.parse(row.content_json));
});

apiRouter.put('/content', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const content = req.body;
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO site_content (id, content_json, atualizado_em)
    VALUES ('main', ?, ?)
    ON CONFLICT(id) DO UPDATE SET content_json = excluded.content_json, atualizado_em = excluded.atualizado_em
  `).run(JSON.stringify(content), now);

  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'CONTENT_UPDATED',
    entity: 'SITE_CONTENT',
    details: 'Textos institucionais e dados de contato do site alterados via CMS.',
    ipAddress: req.ip,
  });

  return res.json({ message: 'Conteúdo institucional atualizado com sucesso.' });
});
