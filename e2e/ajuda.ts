import { expect, type Page } from '@playwright/test';

export const ADMIN_EMAIL = 'coordenacao@novoamanhecer.org.br';
export const ADMIN_SENHA = 'Senha-E2E-123'; // a mesma de e2e/servidor.mjs

/** CPF válido e diferente a cada chamada (o cadastro recusa CPF repetido). */
export function cpfAleatorio(): string {
  const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  if (d.every((x) => x === d[0])) d[0] = (d[0] + 1) % 10;
  for (const len of [9, 10]) {
    const soma = d.slice(0, len).reduce((acc, n, i) => acc + n * (len + 1 - i), 0);
    const resto = (soma * 10) % 11;
    d.push(resto === 10 ? 0 : resto);
  }
  const s = d.join('');
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`;
}

/** Nome único para achar o registro depois, sem confundir com os de outros testes. */
export const nomeUnico = (prefixo: string) => `${prefixo} ${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export async function entrarNoPainel(page: Page) {
  await page.goto('/admin');
  await page.getByLabel('E-mail', { exact: true }).fill(ADMIN_EMAIL);
  await page.getByLabel('Senha', { exact: true }).fill(ADMIN_SENHA);
  await page.getByRole('button', { name: /^Entrar/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeVisible();
}

/** Abre uma aba do painel (no celular as abas ficam numa faixa que rola para o lado). */
export async function abrirAba(page: Page, nome: RegExp) {
  await page.getByRole('button', { name: nome }).locator('visible=true').first().click();
}
