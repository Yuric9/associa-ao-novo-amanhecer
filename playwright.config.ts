// Testes de navegador (ponta a ponta): npm run test:e2e
// Sobem o site num banco separado (e2e/servidor.mjs) e usam o Chromium, no tamanho de
// computador e de celular. Na primeira vez no seu computador: npx playwright install chromium
import { defineConfig, devices } from '@playwright/test';

const PORTA = 8788;

export default defineConfig({
  testDir: './e2e',
  // Um teste por vez: todos usam o mesmo banco de teste
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'computador', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node e2e/servidor.mjs',
    url: `http://localhost:${PORTA}/api/projects`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
