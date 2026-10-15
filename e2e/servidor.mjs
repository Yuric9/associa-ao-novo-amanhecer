// Sobe o site para os testes de navegador (npm run test:e2e), num banco SEPARADO e zerado
// a cada execução (.wrangler/e2e). Não usa o .dev.vars: os valores de teste vêm daqui.
// Funciona no Windows e no Linux (por isso é um script Node e não um comando de shell).
import { rmSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

export const PORTA = 8788;
export const SENHA_ADMIN = 'Senha-E2E-123';

rmSync('.wrangler/e2e', { recursive: true, force: true });

const build = spawnSync('npx', ['vite', 'build'], { stdio: 'inherit', shell: true });
if (build.status !== 0) process.exit(build.status ?? 1);

const vars = {
  JWT_SECRET: 'segredo-so-para-os-testes-de-navegador-0123456789',
  ADMIN_INITIAL_PASSWORD: SENHA_ADMIN,
  SEED_DEMO_DATA: 'true',
  DEV_MODE: 'true',
};
spawn(
  'npx',
  [
    'wrangler', 'dev', '--port', String(PORTA), '--persist-to', '.wrangler/e2e',
    ...Object.entries(vars).flatMap(([k, v]) => ['--var', `${k}:${v}`]),
  ],
  { stdio: 'inherit', shell: true }
);
