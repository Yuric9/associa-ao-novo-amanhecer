# Publicação na Cloudflare (Workers + D1) — plano gratuito

O site roda como um único Cloudflare Worker:

- `worker/` — API (`/api/*`) com banco **D1** (`novo-amanhecer-db`, já criado na conta).
- `src/` — site React, compilado pelo Vite em `dist/` e servido pelo próprio Worker.
- `migrations/0001_init.sql` — estrutura do banco. O Worker também cria as tabelas sozinho
  na primeira requisição, então não é preciso rodar migração manualmente.

## 1. Conectar o GitHub (deploy automático a cada push na `main`)

1. Painel da Cloudflare → **Workers & Pages** → **Create** → **Import a repository**.
2. Escolha `Yuric9/associa-ao-novo-amanhecer`.
3. Configuração de build:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
4. Salve e faça o primeiro deploy.

## 2. Segredos (Settings → Variables and Secrets → tipo *Secret*)

| Nome | Valor |
|---|---|
| `JWT_SECRET` | texto aleatório com 48+ caracteres (`python -c "import secrets; print(secrets.token_hex(48))"`) |
| `ADMIN_INITIAL_PASSWORD` | senha do primeiro administrador (mínimo 12 caracteres) |
| `RESEND_API_KEY` | chave do Resend (para os e-mails saírem de verdade) |

As variáveis não secretas (`ADMIN_EMAIL`, `EMAIL_FROM`, `COORDINATION_EMAIL`, `SEED_DEMO_DATA`)
ficam em `wrangler.jsonc`. Altere lá e faça push.

> A conta administrativa é criada automaticamente na primeira visita, **somente** se o banco
> não tiver nenhum usuário e `ADMIN_INITIAL_PASSWORD` estiver definido. Depois do primeiro
> acesso, troque a senha pelo "Esqueci minha senha" e pode apagar esse secret.

## 3. Rodar no computador

```powershell
copy .dev.vars.example .dev.vars   # ajuste os valores se quiser
npm install
npm run dev                        # compila o site e abre em http://localhost:8787
```

O banco local fica em `.wrangler/` (separado do banco da Cloudflare) e já vem com dados de exemplo.
Login: `ADMIN_EMAIL` + `ADMIN_INITIAL_PASSWORD` do `.dev.vars`.

## 4. Backup automático do banco

- Todo dia às **03:00 (Brasília)** o Worker grava uma cópia completa do banco no R2
  (bucket `novo-amanhecer-fotos`, pasta `backups/`). Ficam os **últimos 30 dias**.
  O agendamento está em `wrangler.jsonc` → `triggers.crons`; o código, em `worker/backup.ts`.
- No painel (aba **Backup e dados**, só administrador): lista dos backups, botão
  **Fazer backup agora** e download de cada arquivo.
- **Restaurar**: baixe o arquivo e use **Restaurar de Arquivo** na mesma aba. Antes de trocar os dados,
  o sistema guarda uma cópia do estado atual (`backup-AAAA-MM-DD-antes-da-restauracao.json`).
  Contas de usuário não são restauradas (as atuais continuam) e senhas nunca vão para o backup.
- Para ver se o agendamento rodou: painel da Cloudflare → Worker → **Settings → Trigger Events**
  (ou a aba Auditoria do painel, ação `BACKUP_CREATED`).
- Para testar no computador: `npx wrangler dev --test-scheduled` e abra
  `http://localhost:8787/cdn-cgi/local/scheduled`.
- As prévias (branches) não rodam o agendamento; lá, use o botão **Fazer backup agora**.

## Limites do plano gratuito (valem para a conta toda)

- 100 mil requisições/dia nos Workers.
- 10 ms de CPU por requisição: por isso as senhas usam PBKDF2 nativo (~8 ms) em vez de bcrypt.
