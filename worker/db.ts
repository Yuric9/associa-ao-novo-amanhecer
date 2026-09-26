import { db } from './d1';
import { cfg } from './env';
import { hashPassword } from './crypto';
import schemaSql from '../migrations/0001_init.sql';
import {
  INITIAL_SITE_CONTENT,
  INITIAL_PROJECTS,
  INITIAL_GALLERY,
  INITIAL_BENEFICIARIES,
  INITIAL_VOLUNTEERS,
} from '../src/data/initialData';

export { db };

let initialized: Promise<void> | null = null;

/**
 * Garante tabelas, papéis, conteúdo inicial e a conta administrativa.
 * Roda uma vez por instância do Worker (os comandos são idempotentes).
 */
export function ensureInitialized(): Promise<void> {
  if (!initialized) {
    initialized = initDatabase().catch((err) => {
      initialized = null; // tenta de novo na próxima requisição
      throw err;
    });
  }
  return initialized;
}

async function count(sql: string): Promise<number> {
  const row = await db.prepare(sql).get<{ count: number }>();
  return row?.count ?? 0;
}

async function initDatabase() {
  // 1. Estrutura (migrations/0001_init.sql)
  const statements = schemaSql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  await db.batch(statements.map((sql) => db.prepare(sql).bind()));

  const now = new Date().toISOString();

  // 2. Conta administrativa inicial — só quando não existe nenhum usuário.
  if ((await count('SELECT COUNT(*) as count FROM users')) === 0) {
    const adminEmail = (cfg('ADMIN_EMAIL') || 'coordenacao@novoamanhecer.org.br').toLowerCase();
    const initialPassword = cfg('ADMIN_INITIAL_PASSWORD');
    if (initialPassword.length >= 12) {
      const adminId = 'usr-coordenacao-admin';
      await db.batch([
        db.prepare(`
          INSERT INTO users (id, nome, email, password_hash, ativo, criado_em, atualizado_em)
          VALUES (?, ?, ?, ?, 1, ?, ?)
        `).bind(adminId, 'Coordenação Geral', adminEmail, await hashPassword(initialPassword), now, now),
        db.prepare('INSERT OR REPLACE INTO user_roles (user_id, role_id, atribuido_em) VALUES (?, ?, ?)')
          .bind(adminId, 'admin', now),
      ]);
      console.log(`[SEED] Conta administrativa inicial criada para ${adminEmail}.`);
    } else {
      console.warn('[SEED] Nenhum usuário no banco e ADMIN_INITIAL_PASSWORD ausente (mínimo 12 caracteres): conta administrativa NÃO criada.');
    }
  }

  // 3. Conteúdo público inicial (textos, projetos e galeria)
  if ((await count('SELECT COUNT(*) as count FROM site_content')) === 0) {
    await db.prepare('INSERT INTO site_content (id, content_json, atualizado_em) VALUES (?, ?, ?)')
      .run('main', JSON.stringify(INITIAL_SITE_CONTENT), now);
  }

  if ((await count('SELECT COUNT(*) as count FROM projects')) === 0) {
    const stmt = db.prepare(`
      INSERT INTO projects (id, titulo, descricao, foto_url, ativo, ordem, detalhes, idade_publico, horario, coordenador)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    await db.batch(INITIAL_PROJECTS.map((p) => stmt.bind(
      p.id, p.titulo, p.descricao, p.foto_url, p.ativo ? 1 : 0, p.ordem,
      p.detalhes || '', p.idade_publico || '', p.horario || '', p.coordenador || ''
    )));
  }

  if ((await count('SELECT COUNT(*) as count FROM gallery')) === 0) {
    const stmt = db.prepare('INSERT INTO gallery (id, foto_url, legenda, ordem, categoria, data) VALUES (?, ?, ?, ?, ?, ?)');
    await db.batch(INITIAL_GALLERY.map((g) => stmt.bind(g.id, g.foto_url, g.legenda, g.ordem, g.categoria || 'geral', g.data || '')));
  }

  // 4. Dados fictícios de demonstração — somente se SEED_DEMO_DATA = "true".
  if (cfg('SEED_DEMO_DATA') !== 'true') return;

  if ((await count('SELECT COUNT(*) as count FROM beneficiaries')) === 0) {
    const stmt = db.prepare(`
      INSERT INTO beneficiaries (id, nome, cpf, nascimento, telefone, email, endereco, projeto, status, observacoes, consentimento_lgpd, criado_em, atualizado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
    await db.batch(INITIAL_BENEFICIARIES.map((b) => stmt.bind(
      b.id, b.nome, b.cpf, b.nascimento, b.telefone, b.email || '', b.endereco, b.projeto,
      b.status, b.observacoes || '', b.criado_em, b.atualizado_em || b.criado_em
    )));
  }

  if ((await count('SELECT COUNT(*) as count FROM volunteers')) === 0) {
    const stmt = db.prepare(`
      INSERT INTO volunteers (id, nome, telefone, email, area, disponibilidade, ativo, data_inicio, habilidades, observacoes, consentimento_lgpd, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    await db.batch(INITIAL_VOLUNTEERS.map((v) => stmt.bind(
      v.id, v.nome, v.telefone, v.email, v.area, v.disponibilidade, v.ativo ? 1 : 0,
      v.data_inicio, v.habilidades || '', v.observacoes || '', v.data_inicio
    )));
  }

  if ((await count('SELECT COUNT(*) as count FROM donations')) === 0) {
    const day = 1000 * 60 * 60 * 24;
    const demo = [
      ['don-01', 'Maria Aparecida Santos', 'maria.santos@gmail.com', '(62) 99812-4411', 100, 'Com muito carinho para ajudar no figurino do ballet infantil.', 3],
      ['don-02', 'João Pereira Trindade', 'joao.pereira@hotmail.com', '(62) 98733-1029', 50, 'Para compra de bolas e redes da escolinha de futebol comunitário.', 7],
      ['don-03', 'Drogaria & Manipulação Trindade', 'contato@drogariatrindade.com.br', '(62) 99422-5500', 250, 'Doação institucional para a Páscoa Solidária das crianças.', 12],
      ['don-04', 'Ana Carolina Bastos', 'anacarol.bastos@gmail.com', '(62) 99105-3388', 40, 'Apoio aos kits de enxoval para as gestantes acolhidas.', 18],
      ['don-05', 'Carlos Eduardo Rezende', 'carlos.rezende@outlook.com', '(62) 98411-9922', 150, 'Contribuição mensal voluntária para a sede comunitária.', 25],
    ] as const;
    const stmt = db.prepare(`
      INSERT INTO donations (id, nome, email, telefone, valor, mensagem, metodo, status, ip_origem, criado_em, atualizado_em)
      VALUES (?, ?, ?, ?, ?, ?, 'PIX', 'Confirmado', '127.0.0.1', ?, ?)
    `);
    await db.batch(demo.map(([id, nome, email, telefone, valor, mensagem, daysAgo]) => {
      const criado = new Date(Date.now() - daysAgo * day).toISOString();
      return stmt.bind(id, nome, email, telefone, valor, mensagem, criado, criado);
    }));
  }
}

// =========================================================================
// PAPÉIS (tabela separada user_roles) E AUDITORIA
// =========================================================================

export async function isUserAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const row = await db.prepare("SELECT 1 as ok FROM user_roles WHERE user_id = ? AND role_id = 'admin'").get(userId);
    return !!row;
  } catch (err) {
    console.error('Erro na função isUserAdmin:', err);
    return false;
  }
}

export async function getUserRoles(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const rows = await db.prepare('SELECT role_id FROM user_roles WHERE user_id = ?').all<{ role_id: string }>(userId);
    return rows.map((r) => r.role_id);
  } catch (err) {
    console.error('Erro ao consultar getUserRoles:', err);
    return [];
  }
}

/** Define ou substitui o papel de um usuário (numa única transação). */
export async function assignUserRole(userId: string, roleId: string): Promise<void> {
  const now = new Date().toISOString();
  await db.batch([
    db.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(userId),
    db.prepare('INSERT INTO user_roles (user_id, role_id, atribuido_em) VALUES (?, ?, ?)').bind(userId, roleId, now),
  ]);
}

export async function logAudit(entry: {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_email, user_role, action, entity, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      entry.userId || null,
      entry.userEmail || null,
      entry.userRole || null,
      entry.action,
      entry.entity,
      entry.entityId || null,
      entry.details || null,
      entry.ipAddress || '0.0.0.0',
      new Date().toISOString()
    );
  } catch (err) {
    console.error('Falha ao registrar auditoria:', err);
  }
}
