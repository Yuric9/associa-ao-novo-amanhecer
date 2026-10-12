-- Sessões de login. Cada login cria uma linha; o token (cookie) só vale enquanto ela existir.
-- Sair da conta ou redefinir a senha apaga a sessão, invalidando o token na hora.
-- O Worker também cria esta tabela sozinho na primeira requisição (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  ip_origem TEXT,
  criado_em TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
