// Migração dos dados antigos do navegador para o banco.
import type { Res as Response, AuthenticatedRequest } from '../http';
import { db } from '../db';
import { authenticateToken, requireAdmin } from '../auth';
import { sanitizeString } from '../validation';
import { apiRouter } from './router';

// =========================================================================
// 4. MIGRAÇÃO AUTOMÁTICA SEGURA DO LOCALSTORAGE PARA O BANCO DE DADOS
// =========================================================================

// Restrito ao Administrador: antes era aberto a qualquer visitante, sem limite, permitindo
// inserir cadastros em massa e 'ressuscitar' registros excluídos a partir do cache do navegador.
apiRouter.post('/sync/migrate-from-local', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
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
      const existing = await db.prepare(`SELECT id FROM beneficiaries WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?`)
        .get(cleanCpf);

      if (!existing) {
        await insertBen.run(
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
      const existing = await db.prepare('SELECT id FROM volunteers WHERE LOWER(email) = LOWER(?)').get(v.email);
      if (!existing) {
        await insertVol.run(
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
