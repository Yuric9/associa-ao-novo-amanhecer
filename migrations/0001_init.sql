-- Estrutura do banco D1 da Associação Novo Amanhecer.
-- O Worker também cria estas tabelas sozinho na primeira requisição (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS roles (
  role TEXT PRIMARY KEY,
  nome_exibicao TEXT NOT NULL,
  descricao TEXT NOT NULL,
  permissoes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  atribuido_em TEXT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(role) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  usado INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  foto_url TEXT NOT NULL,
  legenda TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 1,
  categoria TEXT NOT NULL DEFAULT 'geral',
  data TEXT
);

CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  content_json TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  valor REAL NOT NULL,
  mensagem TEXT,
  metodo TEXT NOT NULL DEFAULT 'PIX',
  status TEXT NOT NULL DEFAULT 'Pendente',
  ip_origem TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  destinatario TEXT NOT NULL,
  assunto TEXT NOT NULL,
  corpo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ENVIADO',
  enviado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits (ip, endpoint, timestamp);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent ON email_logs (enviado_em);

INSERT OR IGNORE INTO roles (role, nome_exibicao, descricao, permissoes) VALUES ('admin', 'Administrador Geral', 'Acesso total ao sistema, gestão de usuários, exclusão e auditoria.', '["*"]');

INSERT OR IGNORE INTO roles (role, nome_exibicao, descricao, permissoes) VALUES ('equipe', 'Equipe Social / Apoio', 'Gestão de atendimentos, projetos, turmas e acompanhamento comunitário.', '["beneficiarios:read","beneficiarios:write","voluntarios:read","voluntarios:write","projetos:write","galeria:write"]');

INSERT OR IGNORE INTO roles (role, nome_exibicao, descricao, permissoes) VALUES ('coordenador', 'Coordenador de Projetos', 'Gestão operacional de beneficiários, voluntários, projetos e galeria.', '["beneficiarios:read","beneficiarios:write","voluntarios:read","voluntarios:write","projetos:write","galeria:write"]');

INSERT OR IGNORE INTO roles (role, nome_exibicao, descricao, permissoes) VALUES ('voluntario', 'Voluntário Operacional', 'Acesso operacional com dados sensíveis mascarados em conformidade com a LGPD.', '["beneficiarios:read_masked","projetos:read"]');
