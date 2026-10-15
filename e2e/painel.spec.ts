// Painel da equipe: login, aprovação de uma inscrição e o que fica gravado no banco.
import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, SESSAO, abrirAba, abrirPainel, cpfAleatorio, nomeUnico } from './ajuda';

// Os testes do painel usam a sessão do login.setup.ts (um login só para todos)
test.use({ storageState: SESSAO });

test.describe('sem sessão', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('senha errada não entra no painel', async ({ page }) => {
    await page.goto('/admin');
    await page.getByLabel('E-mail', { exact: true }).fill(ADMIN_EMAIL);
    await page.getByLabel('Senha', { exact: true }).fill('senha-errada-123');
    await page.getByRole('button', { name: /^Entrar/ }).click();
    await expect(page.getByRole('alert').or(page.getByText(/inválid|incorret/i)).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeHidden();
  });
});

test('a coordenação aprova uma inscrição e a mudança fica gravada', async ({ page, request }) => {
  // Uma inscrição nova, feita pela mesma API que o formulário do site usa
  const nome = nomeUnico('Aprovar Teste');
  const res = await request.post('/api/beneficiaries', {
    data: {
      nome,
      cpf: cpfAleatorio(),
      nascimento: '2015-03-10',
      telefone: '(62) 99999-0000',
      email: '',
      endereco: 'Rua de Teste, 10 - Trindade - GO',
      projeto: 'Aulas de Ballet Solidário',
      consentimento_lgpd: true,
      hp_security_check: '',
    },
  });
  expect(res.ok()).toBe(true);

  await abrirPainel(page);
  await abrirAba(page, /^Beneficiários/);
  const linha = page.locator('.divide-y > div').filter({ hasText: nome });
  await expect(linha).toBeVisible();
  await expect(linha.getByText('Pendente', { exact: true })).toBeVisible();

  await linha.getByRole('button', { name: 'Aprovar', exact: true }).click();
  await expect(linha.getByText('Aprovado', { exact: true })).toBeVisible();
  // O sistema não manda e-mail: nenhuma janela de "notificação" aparece
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Recarrega a página: o status tem que vir do banco, não só da tela
  await page.reload();
  await abrirAba(page, /^Beneficiários/);
  await expect(page.locator('.divide-y > div').filter({ hasText: nome }).getByText('Aprovado', { exact: true })).toBeVisible();
});

test('a aba de backup gera e lista um backup', async ({ page }) => {
  await abrirPainel(page);
  await abrirAba(page, /^Backup/);
  await page.getByRole('button', { name: 'Fazer backup agora' }).click();
  const lista = page.locator('section[aria-labelledby=backups-automaticos-titulo] li');
  await expect(lista.first()).toContainText('mais recente');
  await expect(lista.first().getByRole('link', { name: /Baixar backup de/ })).toBeVisible();
});

test('o registro de atividades mostra o login e a tentativa com senha errada', async ({ page, request }) => {
  // Uma tentativa com senha errada, antes de entrar
  const errada = await request.post('/api/auth/login', { data: { email: ADMIN_EMAIL, password: 'senha-errada-456' } });
  expect(errada.status()).toBe(401);

  await abrirPainel(page);
  await abrirAba(page, /^Registro de atividades/);
  const lista = page.locator('section[aria-labelledby=atividades-titulo] li');
  await expect(lista.filter({ hasText: 'Entrou no painel' }).filter({ hasText: `por ${ADMIN_EMAIL}` }).first()).toBeVisible();
  const recusada = lista.filter({ hasText: 'Tentativa de login recusada' }).first();
  await expect(recusada).toBeVisible();
  await expect(recusada.getByLabel('Atenção')).toBeVisible();

  // Filtro: só "Site" não mostra logins
  await page.getByRole('button', { name: /^Site/ }).click();
  await expect(lista.filter({ hasText: 'Entrou no painel' })).toHaveCount(0);
});

test('o administrador redefine a senha de alguém, que entra e troca pela própria', async ({ page, request, browser }) => {
  // Uma pessoa da equipe, criada pelo administrador
  const email = `equipe-${Date.now()}@exemplo.com`;
  const criada = await request.post('/api/auth/users', {
    data: { nome: 'Equipe Esquecida', email, password: 'senha-que-esqueci', role: 'equipe' },
  });
  expect(criada.ok()).toBe(true);

  // O administrador define uma senha provisória pela aba Usuários
  await abrirPainel(page);
  await abrirAba(page, /^Usuários/);
  const linha = page.locator('div', { hasText: email }).filter({ has: page.getByRole('button', { name: 'Redefinir senha' }) }).last();
  await linha.getByRole('button', { name: 'Redefinir senha' }).click();
  const janela = page.getByRole('dialog', { name: 'Redefinir senha' });
  await janela.getByLabel(/^Senha provisória/).fill('provisoria-2026');
  await janela.getByLabel(/^Repita a senha provisória/).fill('provisoria-2026');
  await janela.getByRole('button', { name: 'Definir senha' }).click();
  await expect(janela).toBeHidden();
  await expect(page.getByText(`Senha provisória definida para ${email}.`)).toBeVisible();

  // A pessoa entra com a provisória (noutro navegador, sem a sessão do admin) e troca pela dela
  const contexto = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const pessoa = await contexto.newPage();
  await pessoa.goto('/admin');
  await pessoa.getByLabel('E-mail', { exact: true }).fill(email);
  await pessoa.getByLabel('Senha', { exact: true }).fill('provisoria-2026');
  await pessoa.getByRole('button', { name: /^Entrar/ }).click();
  await expect(pessoa.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeVisible();

  await pessoa.getByRole('button', { name: 'Trocar minha senha' }).locator('visible=true').first().click();
  const troca = pessoa.getByRole('dialog', { name: 'Trocar minha senha' });
  await troca.getByLabel('Senha atual').fill('provisoria-2026');
  await troca.getByLabel(/^Nova senha/).fill('minha-senha-nova');
  await troca.getByLabel('Repita a nova senha').fill('minha-senha-nova');
  await troca.getByRole('button', { name: 'Trocar senha' }).click();
  await expect(troca).toBeHidden();
  await expect(pessoa.getByText(/Senha alterada/)).toBeVisible();
  await contexto.close();
});
