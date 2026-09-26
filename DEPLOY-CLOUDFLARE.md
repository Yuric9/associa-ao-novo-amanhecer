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

## Limites do plano gratuito (valem para a conta toda)

- 100 mil requisições/dia nos Workers.
- 10 ms de CPU por requisição: por isso as senhas usam PBKDF2 nativo (~8 ms) em vez de bcrypt.
