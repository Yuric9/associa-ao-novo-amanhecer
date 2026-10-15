// Site público, como um visitante usaria: no computador e no celular.
import { expect, test, type Page } from '@playwright/test';
import { cpfAleatorio, nomeUnico } from './ajuda';

test.beforeEach(async ({ page }) => {
  // Qualquer erro de JavaScript na página faz o teste falhar
  page.on('pageerror', (erro) => {
    throw erro;
  });
});

test('a página inicial abre com as seções principais e sem rolagem para o lado', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Associação Novo Amanhecer/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  for (const secao of ['#projetos', '#galeria', '#como-ajudar', '#cadastro', '#contato']) {
    await expect(page.locator(secao)).toBeAttached();
  }
  const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(sobra).toBeLessThanOrEqual(0);
});

/** Preenche o formulário de inscrição como uma família faria e envia. */
async function inscrever(page: Page, nome: string, cpf: string) {
  await page.goto('/#cadastro');
  await page.getByLabel(/Nome Completo/).first().fill(nome);
  await page.getByLabel(/CPF/).fill(cpf);
  await page.getByLabel(/Data de Nascimento/).fill('2016-05-10');
  await page.getByLabel(/Telefone \/ WhatsApp/).fill('62988887777');
  // Endereço digitado à mão (a busca por CEP depende de um serviço externo)
  await page.getByRole('button', { name: 'Digitar em campo único' }).click();
  await page.getByLabel(/Endereço Completo Manual/).fill('Rua das Flores, 10, Setor Ponta Kayana, Trindade - GO');
  await page.getByRole('checkbox', { name: /Autorizo e concordo/ }).check();
  await page.getByRole('button', { name: 'Confirmar Inscrição Gratuita' }).click();
}

test('uma família inscreve uma criança pelo formulário', async ({ page }) => {
  const nome = nomeUnico('Criança Teste');
  await inscrever(page, nome, cpfAleatorio());
  await expect(page.getByText('Cadastro Enviado com Sucesso!')).toBeVisible();
  await expect(page.getByText(nome, { exact: true })).toBeVisible();
});

test('o formulário recusa um CPF inválido e não envia', async ({ page }) => {
  await inscrever(page, nomeUnico('CPF Errado'), '111.111.111-11');
  await expect(page.getByText(/^CPF inválido/)).toBeVisible();
  await expect(page.getByText('Cadastro Enviado com Sucesso!')).toBeHidden();
});

test('uma pessoa se oferece como voluntária', async ({ page }) => {
  await page.goto('/#como-ajudar');
  await page.getByRole('button', { name: 'Quero ser voluntário' }).click();
  const janela = page.getByRole('dialog', { name: /Seja Voluntário/ });
  await expect(janela).toBeVisible();

  await janela.getByLabel(/Seu Nome Completo/).fill(nomeUnico('Voluntária Teste'));
  await janela.getByLabel(/Telefone \/ WhatsApp/).fill('62977776666');
  await janela.getByRole('checkbox', { name: /Autorizo o contato/ }).check();
  await janela.getByRole('button', { name: 'Enviar Inscrição' }).click();

  await expect(janela.getByText('Muito obrigado pelo carinho!')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(janela).toBeHidden();
});

test('quem quer doar vê o QR Code do PIX', async ({ page }) => {
  await page.goto('/#como-ajudar');
  await page.getByRole('button', { name: 'Mostrar QR Code' }).click();
  const qr = page.getByRole('img', { name: 'QR Code PIX da Associação Novo Amanhecer' });
  await expect(qr).toBeVisible();
  // a imagem foi gerada de verdade (não está quebrada)
  expect(await qr.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});

test('no celular, o menu abre e leva até a seção escolhida', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'menu sanduíche só existe no celular');
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('link', { name: 'Projetos' }).locator('visible=true').first().click();
  await expect(page.locator('#projetos')).toBeInViewport();
});
