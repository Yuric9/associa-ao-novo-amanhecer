import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import {
  INITIAL_SITE_CONTENT,
  INITIAL_PROJECTS,
  INITIAL_GALLERY,
  INITIAL_BENEFICIARIES,
  INITIAL_VOLUNTEERS,
} from '../src/data/initialData.js';

// Garantir que a pasta de dados persista
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'novo_amanhecer.db');
export const db = new DatabaseSync(DB_PATH);

// Inicializar tabelas relacionais com chaves estrangeiras e índices
export function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    -- Tabela separada de Papéis de Acesso (RBAC)
    CREATE TABLE IF NOT EXISTS roles (
      role TEXT PRIMARY KEY,
      nome_exibicao TEXT NOT NULL,
      descricao TEXT NOT NULL,
      permissoes TEXT NOT NULL -- JSON com permissões
    );

    -- Tabela de Usuários (sem coluna de papel - papel nunca é salvo no perfil)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL
    );

    -- Tabela Associativa de Perfis/Papéis (Separada do perfil do usuário)
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      atribuido_em TEXT NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(role) ON DELETE CASCADE
    );

    -- Tokens de Recuperação de Senha Seguros
    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      usado INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Tabela de Beneficiários (Dados Protegidos / RLS e LGPD)
    CREATE TABLE IF NOT EXISTS beneficiaries (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT NOT NULL,
      nascimento TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT,
      endereco TEXT NOT NULL,
      projeto TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pendente',
      observacoes TEXT,
      motivo_status TEXT,
      consentimento_lgpd INTEGER NOT NULL DEFAULT 1,
      ip_origem TEXT,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL
    );

    -- Tabela de Voluntários
    CREATE TABLE IF NOT EXISTS volunteers (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT NOT NULL,
      area TEXT NOT NULL,
      disponibilidade TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      data_inicio TEXT NOT NULL,
      habilidades TEXT,
      observacoes TEXT,
      consentimento_lgpd INTEGER NOT NULL DEFAULT 1,
      ip_origem TEXT,
      criado_em TEXT NOT NULL
    );

    -- Tabela de Projetos Sociais
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      foto_url TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      ordem INTEGER NOT NULL DEFAULT 1,
      detalhes TEXT,
      idade_publico TEXT,
      horario TEXT,
      coordenador TEXT
    );

    -- Tabela da Galeria de Fotos
    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      foto_url TEXT NOT NULL,
      legenda TEXT NOT NULL,
      ordem INTEGER NOT NULL DEFAULT 1,
      categoria TEXT NOT NULL DEFAULT 'geral',
      data TEXT
    );

    -- Tabela do CMS de Conteúdo do Site
    CREATE TABLE IF NOT EXISTS site_content (
      id TEXT PRIMARY KEY,
      content_json TEXT NOT NULL,
      atualizado_em TEXT NOT NULL
    );

    -- Tabela de Histórico de Auditoria
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    -- Tabela de Doações e Intenções de Doação (PIX / Cartão)
    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT,
      telefone TEXT,
      valor REAL NOT NULL,
      mensagem TEXT,
      metodo TEXT NOT NULL DEFAULT 'PIX',
      status TEXT NOT NULL DEFAULT 'Confirmado',
      ip_origem TEXT,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL
    );

    -- Tabela de Histórico de E-mails Enviados
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      destinatario TEXT NOT NULL,
      assunto TEXT NOT NULL,
      corpo TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ENVIADO',
      enviado_em TEXT NOT NULL
    );

    -- Tabela de Controle de Rate Limit (Anti-Spam)
    CREATE TABLE IF NOT EXISTS rate_limits (
      ip TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  // Popular papéis oficiais (admin, equipe, coordenador, voluntario)
  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO roles (role, nome_exibicao, descricao, permissoes)
    VALUES (?, ?, ?, ?)
  `);

  insertRole.run(
    'admin',
    'Administrador Geral',
    'Acesso total ao sistema, gestão de usuários, exclusão e auditoria.',
    JSON.stringify(['*'])
  );
  insertRole.run(
    'equipe',
    'Equipe Social / Apoio',
    'Gestão de atendimentos, projetos, turmas e acompanhamento comunitário.',
    JSON.stringify([
      'beneficiarios:read',
      'beneficiarios:write',
      'voluntarios:read',
      'voluntarios:write',
      'projetos:write',
      'galeria:write',
    ])
  );
  insertRole.run(
    'coordenador',
    'Coordenador de Projetos',
    'Gestão operacional de beneficiários, voluntários, projetos e galeria.',
    JSON.stringify([
      'beneficiarios:read',
      'beneficiarios:write',
      'voluntarios:read',
      'voluntarios:write',
      'projetos:write',
      'galeria:write',
    ])
  );
  insertRole.run(
    'voluntario',
    'Voluntário Operacional',
    'Acesso operacional com dados sensíveis mascarados em conformidade com a LGPD.',
    JSON.stringify(['beneficiarios:read_masked', 'projetos:read'])
  );

  const now = new Date().toISOString();

  // Conta administrativa inicial — criada SOMENTE quando não existe nenhum usuário.
  // Antes, três contas com senhas fixas (publicadas no GitHub) eram recriadas a cada
  // inicialização, permitindo que qualquer pessoa entrasse como administrador.
  const countUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (countUsers.count === 0) {
    const adminEmail = (process.env.ADMIN_EMAIL || 'coordenacao@novoamanhecer.org.br').trim().toLowerCase();
    const envPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim();
    const initialPassword = envPassword && envPassword.length >= 12
      ? envPassword
      : crypto.randomBytes(12).toString('base64url');
    const adminId = 'usr-coordenacao-admin';

    db.prepare(`
      INSERT INTO users (id, nome, email, password_hash, ativo, criado_em, atualizado_em)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `).run(
      adminId,
      'Coordenação Geral',
      adminEmail,
      bcrypt.hashSync(initialPassword, 10),
      now,
      now
    );

    db.prepare(`
      INSERT OR REPLACE INTO user_roles (user_id, role_id, atribuido_em)
      VALUES (?, ?, ?)
    `).run(adminId, 'admin', now);

    if (!envPassword) {
      console.log('\n==================================================================');
      console.log(' Conta administrativa inicial criada:');
      console.log(`   E-mail: ${adminEmail}`);
      console.log(`   Senha:  ${initialPassword}`);
      console.log(' Anote e troque esta senha após o primeiro acesso.');
      console.log('==================================================================\n');
    } else {
      console.log(`[SEED] Conta administrativa inicial criada para ${adminEmail} (senha de ADMIN_INITIAL_PASSWORD).`);
    }
  }

  // Invalidar senhas legadas que foram publicadas anteriormente no GitHub.
  const legacyPasswords = [
    { email: 'admin@novoamanhecer.org.br', password: 'Admin@2026!NovoAmanhecer' },
    { email: 'coordenacao@novoamanhecer.org.br', password: 'Coord@2026!NovoAmanhecer' },
    { email: 'equipe@novoamanhecer.org.br', password: 'Equipe@2026!' },
  ];

  for (const legacy of legacyPasswords) {
    const user = db.prepare('SELECT id, password_hash FROM users WHERE LOWER(email) = LOWER(?)')
      .get(legacy.email) as { id: string; password_hash: string } | undefined;

    if (user && bcrypt.compareSync(legacy.password, user.password_hash)) {
      const randomPasswordHash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);
      db.prepare('UPDATE users SET password_hash = ?, atualizado_em = ? WHERE id = ?')
        .run(randomPasswordHash, now, user.id);
      console.warn(`[SECURITY] A conta ${legacy.email} teve a senha antiga invalidada. Use "Esqueci minha senha" para definir uma nova senha.`);
    }
  }

  // Dados de demonstração (beneficiários, voluntários e doações fictícios) não devem
  // aparecer em produção, para não misturar com cadastros reais nem inflar a transparência.
  const seedDemoData = process.env.NODE_ENV !== 'production' || process.env.SEED_DEMO_DATA === 'true';

  // Popular Conteúdo do Site se vazio
  const countContent = db.prepare('SELECT COUNT(*) as count FROM site_content').get() as { count: number };
  if (countContent.count === 0) {
    db.prepare('INSERT INTO site_content (id, content_json, atualizado_em) VALUES (?, ?, ?)')
      .run('main', JSON.stringify(INITIAL_SITE_CONTENT), now);
  }

  // Popular Projetos se vazio
  const countProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (countProjects.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO projects (id, titulo, descricao, foto_url, ativo, ordem, detalhes, idade_publico, horario, coordenador)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of INITIAL_PROJECTS) {
      stmt.run(
        p.id,
        p.titulo,
        p.descricao,
        p.foto_url,
        p.ativo ? 1 : 0,
        p.ordem,
        p.detalhes || '',
        p.idade_publico || '',
        p.horario || '',
        p.coordenador || ''
      );
    }
  }

  // Popular Galeria se vazio
  const countGallery = db.prepare('SELECT COUNT(*) as count FROM gallery').get() as { count: number };
  if (countGallery.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO gallery (id, foto_url, legenda, ordem, categoria, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const g of INITIAL_GALLERY) {
      stmt.run(g.id, g.foto_url, g.legenda, g.ordem, g.categoria || 'geral', g.data || '');
    }
  }

  // Popular Beneficiários se vazio
  const countBeneficiaries = db.prepare('SELECT COUNT(*) as count FROM beneficiaries').get() as { count: number };
  if (seedDemoData && countBeneficiaries.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO beneficiaries (id, nome, cpf, nascimento, telefone, email, endereco, projeto, status, observacoes, consentimento_lgpd, criado_em, atualizado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
    for (const b of INITIAL_BENEFICIARIES) {
      stmt.run(
        b.id,
        b.nome,
        b.cpf,
        b.nascimento,
        b.telefone,
        b.email || '',
        b.endereco,
        b.projeto,
        b.status,
        b.observacoes || '',
        b.criado_em,
        b.atualizado_em || b.criado_em
      );
    }
  }

  // Popular Voluntários se vazio
  const countVolunteers = db.prepare('SELECT COUNT(*) as count FROM volunteers').get() as { count: number };
  if (seedDemoData && countVolunteers.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO volunteers (id, nome, telefone, email, area, disponibilidade, ativo, data_inicio, habilidades, observacoes, consentimento_lgpd, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const v of INITIAL_VOLUNTEERS) {
      stmt.run(
        v.id,
        v.nome,
        v.telefone,
        v.email,
        v.area,
        v.disponibilidade,
        v.ativo ? 1 : 0,
        v.data_inicio,
        v.habilidades || '',
        v.observacoes || '',
        v.data_inicio
      );
    }
  }

  // Popular Doações Iniciais se vazio para alimentar os indicadores reais
  const countDonations = db.prepare('SELECT COUNT(*) as count FROM donations').get() as { count: number };
  if (seedDemoData && countDonations.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO donations (id, nome, email, telefone, valor, mensagem, metodo, status, ip_origem, criado_em, atualizado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const initialDonations = [
      {
        id: 'don-01',
        nome: 'Maria Aparecida Santos',
        email: 'maria.santos@gmail.com',
        telefone: '(62) 99812-4411',
        valor: 100.0,
        mensagem: 'Com muito carinho para ajudar no figurino do ballet infantil.',
        metodo: 'PIX',
        status: 'Confirmado',
        criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      },
      {
        id: 'don-02',
        nome: 'João Pereira Trindade',
        email: 'joao.pereira@hotmail.com',
        telefone: '(62) 98733-1029',
        valor: 50.0,
        mensagem: 'Para compra de bolas e redes da escolinha de futebol comunitário.',
        metodo: 'PIX',
        status: 'Confirmado',
        criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      },
      {
        id: 'don-03',
        nome: 'Drogaria & Manipulação Trindade',
        email: 'contato@drogariatrindade.com.br',
        telefone: '(62) 99422-5500',
        valor: 250.0,
        mensagem: 'Doação institucional para a Páscoa Solidária das crianças.',
        metodo: 'PIX',
        status: 'Confirmado',
        criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      },
      {
        id: 'don-04',
        nome: 'Ana Carolina Bastos',
        email: 'anacarol.bastos@gmail.com',
        telefone: '(62) 99105-3388',
        valor: 40.0,
        mensagem: 'Apoio aos kits de enxoval para as gestantes acolhidas.',
        metodo: 'PIX',
        status: 'Confirmado',
        criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
      },
      {
        id: 'don-05',
        nome: 'Carlos Eduardo Rezende',
        email: 'carlos.rezende@outlook.com',
        telefone: '(62) 98411-9922',
        valor: 150.0,
        mensagem: 'Contribuição mensal voluntária para a sede comunitária.',
        metodo: 'PIX',
        status: 'Confirmado',
        criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
      },
    ];

    for (const d of initialDonations) {
      stmt.run(
        d.id,
        d.nome,
        d.email,
        d.telefone,
        d.valor,
        d.mensagem,
        d.metodo,
        d.status,
        '127.0.0.1',
        d.criado_em,
        d.criado_em
      );
    }
  }
}

// =========================================================================
// FUNÇÕES SEGURAS DE VERIFICAÇÃO DE PAPÉIS NO BANCO DE DADOS
// =========================================================================

/**
 * Função segura no banco para verificar se um usuário possui o papel 'admin'
 * Consulta a tabela separada user_roles, nunca salvando ou lendo o papel no perfil.
 */
export function isUserAdmin(userId: string): boolean {
  if (!userId) return false;
  try {
    const row = db.prepare(`
      SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = 'admin'
    `).get(userId);
    return !!row;
  } catch (err) {
    console.error('Erro na função isUserAdmin:', err);
    return false;
  }
}

/**
 * Retorna todos os papéis atribuídos a um determinado usuário
 */
export function getUserRoles(userId: string): string[] {
  if (!userId) return [];
  try {
    const rows = db.prepare(`
      SELECT role_id FROM user_roles WHERE user_id = ?
    `).all(userId) as { role_id: string }[];
    return rows.map((r) => r.role_id);
  } catch (err) {
    console.error('Erro ao consultar getUserRoles:', err);
    return [];
  }
}

/**
 * Define ou substitui o papel de um usuário na tabela separada user_roles
 */
export function assignUserRole(userId: string, roleId: string): void {
  const now = new Date().toISOString();
  db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
  db.prepare(`
    INSERT INTO user_roles (user_id, role_id, atribuido_em)
    VALUES (?, ?, ?)
  `).run(userId, roleId, now);
}

// Helper para Registrar Auditoria no Servidor
export function logAudit(entry: {
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
    const now = new Date().toISOString();
    db.prepare(`
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
      entry.ipAddress || '127.0.0.1',
      now
    );
  } catch (err) {
    console.error('Falha ao registrar auditoria:', err);
  }
}
