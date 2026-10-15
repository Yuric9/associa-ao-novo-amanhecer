// Entra no painel uma vez e guarda a sessão (cookie + dados do navegador) para os testes do painel.
// Assim os testes não esbarram no limite de 10 logins a cada 15 minutos por IP.
import { expect, test as setup } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_SENHA, SESSAO } from './ajuda';

setup('entrar no painel', async ({ page }) => {
  await page.goto('/admin');
  await page.getByLabel('E-mail', { exact: true }).fill(ADMIN_EMAIL);
  await page.getByLabel('Senha', { exact: true }).fill(ADMIN_SENHA);
  await page.getByRole('button', { name: /^Entrar/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeVisible();
  await page.context().storageState({ path: SESSAO });
});
