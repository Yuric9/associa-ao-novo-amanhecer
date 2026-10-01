# Associação Novo Amanhecer

Portal institucional e painel administrativo da **Associação Novo Amanhecer** (Trindade/GO):
acolhimento, projetos sociais, doações via PIX, voluntariado e transparência.

## Funcionalidades

**Site público**
- Apresentação da associação, projetos (futebol, ballet, book, ações sociais) e galeria de fotos
- Números de impacto e seção de transparência
- Doação via PIX com QR Code
- Cadastro de beneficiários e de voluntários (com consentimento LGPD e proteção anti-spam)
- Instalável no celular como aplicativo (PWA)

**Painel administrativo** (`/admin`)
- Login com perfis de acesso: administrador, coordenador, equipe e voluntário
- Gestão de beneficiários, voluntários, doações, projetos, galeria e textos do site
- Gráficos, exportação CSV e backup
- Histórico de e-mails e registro de auditoria
- Dados sensíveis (CPF, endereço, telefone) mascarados para o perfil voluntário

## Tecnologias

| Parte | Tecnologia |
|---|---|
| Frontend (`src/`) | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Motion |
| Backend (`worker/`) | Cloudflare Workers (API em `/api/*`) |
| Banco de dados | Cloudflare D1 (SQLite) — estrutura em `migrations/0001_init.sql` |
| E-mail | Resend |

O mesmo Worker responde a API e entrega o site compilado (pasta `dist/`).

## Estrutura

```
src/
  components/public/   seções do site público
  components/admin/    painel administrativo (carregado sob demanda)
  services/api.ts      cliente da API usado pelo frontend
  data/                conteúdo inicial do site
  utils/               PIX, validações, exportação CSV
worker/
  index.ts             ponto de entrada do Worker
  routes.ts            rotas da API
  auth.ts, crypto.ts   login, JWT e senhas (PBKDF2)
  db.ts, d1.ts         acesso ao banco D1
migrations/            estrutura do banco
public/                imagens, ícones e manifesto PWA
```

## Como rodar no computador

Pré-requisito: Node.js 20 ou mais recente.

```bash
cp .dev.vars.example .dev.vars   # no Windows: copy .dev.vars.example .dev.vars
npm install
npm run dev                      # compila o site e abre em http://localhost:8787
```

O banco local fica em `.wrangler/` e já vem com dados de exemplo.
Login do painel: `ADMIN_EMAIL` (em `wrangler.jsonc`) + `ADMIN_INITIAL_PASSWORD` (em `.dev.vars`).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Compila o site e roda Worker + banco localmente |
| `npm run dev:front` | Só o frontend com recarga automática (sem API) |
| `npm run build` | Gera o site em `dist/` |
| `npm run lint` | Checagem de tipos do frontend e do Worker |
| `npm run deploy` | Compila e publica na Cloudflare |
| `npm run db:migrate` | Aplica as migrações no banco D1 remoto |

## Publicação

O deploy é automático a cada push na `main`. Configuração da Cloudflare, segredos
(`JWT_SECRET`, `ADMIN_INITIAL_PASSWORD`, `RESEND_API_KEY`) e limites do plano gratuito
estão em [DEPLOY-CLOUDFLARE.md](DEPLOY-CLOUDFLARE.md).
