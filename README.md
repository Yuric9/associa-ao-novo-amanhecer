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
- Backup automático diário do banco (últimos 30 dias, no R2), com download e restauração pelo painel
- Registro de atividades (auditoria): quem fez o quê e quando, só para o administrador
- Dados sensíveis (CPF, endereço, telefone) mascarados para o perfil voluntário

## Tecnologias

| Parte | Tecnologia |
|---|---|
| Frontend (`src/`) | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Motion |
| Backend (`worker/`) | Cloudflare Workers (API em `/api/*`) |
| Banco de dados | Cloudflare D1 (SQLite) — estrutura em `migrations/` |
| Fotos | Cloudflare R2 (bucket `novo-amanhecer-fotos`), servidas em `/api/fotos/...` |
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
  routes/              rotas da API, um arquivo por assunto
                       (auth, beneficiarios, voluntarios, doacoes, conteudo...)
  auth.ts, crypto.ts   login, JWT e senhas (PBKDF2)
  db.ts, d1.ts         acesso ao banco D1
  routes/fotos.ts      envio e leitura de fotos (Cloudflare R2)
  backup.ts            backup diário do banco no R2 e restauração
migrations/            estrutura do banco
test/                  testes automáticos (npm test)
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
| `npm run lint` | Checagem de tipos do frontend, do Worker e dos testes |
| `npm test` | Roda todos os testes automáticos |
| `npm run test:watch` | Roda os testes de novo a cada arquivo salvo |
| `npm run test:e2e` | Testes no navegador: abre o site e usa como uma pessoa (computador e celular) |
| `npm run deploy` | Compila e publica na Cloudflare |
| `npm run db:migrate` | Aplica as migrações no banco D1 remoto |
| `npm run fotos` | Gera as versões WebP (400/800/1600 px) das fotos de `public/fotos` — rode ao adicionar uma foto lá |

## Testes

```bash
npm test
```

Os testes ficam em `test/` e rodam sem internet e sem tocar em nenhum banco real:

- `test/worker/` — a API roda dentro do mesmo ambiente da Cloudflare (workerd), com um banco D1
  temporário. Cobre login, sessões (logout e troca de senha derrubam o token), limite de
  tentativas, formulário público (CPF, LGPD, anti-spam) e o que cada perfil pode ver.
- `test/unit/` — funções do site: validação e máscaras de CPF/telefone e o código PIX copia e cola.

### Testes no navegador (ponta a ponta)

```bash
npx playwright install chromium   # só na primeira vez
npm run test:e2e
```

Ficam em `e2e/` e usam o [Playwright](https://playwright.dev): o site sobe num banco de teste
separado (`.wrangler/e2e`, zerado a cada execução) e um navegador faz o que uma pessoa faria,
no tamanho de computador e de celular:

- inscrever uma criança pelo formulário (e ver o CPF inválido ser recusado);
- se oferecer como voluntária e ver o QR Code do PIX;
- abrir o menu no celular;
- entrar no painel, aprovar uma inscrição e conferir, depois de recarregar, que ficou gravada;
- gerar um backup pela aba Backup.

Se um teste falhar, a pasta `test-results/` guarda o print da tela e um "trace" para ver o passo a passo:
`npx playwright show-trace test-results/<pasta-do-teste>/trace.zip`.

### Testes automáticos no GitHub

A cada PR (e a cada push na `main`), o GitHub Actions roda a checagem de tipos, `npm test` e
`npm run test:e2e` (`.github/workflows/testes.yml`). O resultado aparece no PR antes do merge.

## Publicação

O deploy é automático a cada push na `main`. Configuração da Cloudflare, segredos
(`JWT_SECRET`, `ADMIN_INITIAL_PASSWORD`, `RESEND_API_KEY`) e limites do plano gratuito
estão em [DEPLOY-CLOUDFLARE.md](DEPLOY-CLOUDFLARE.md).
