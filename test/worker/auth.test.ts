import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './constants';
import { api, login, newIp } from './helpers';

describe('login', () => {
  it('entra com e-mail e senha corretos e devolve só o perfil, sem o token', async () => {
    const { res } = await login();
    expect(res.status).toBe(200);

    const body = await res.json<Record<string, any>>();
    expect(body.user).toMatchObject({ email: TEST_ADMIN_EMAIL, role: 'admin' });
    // O token não pode aparecer no corpo: o JavaScript da página não deve ter acesso a ele.
    expect(body).not.toHaveProperty('token');
    expect(JSON.stringify(body)).not.toMatch(/eyJ/); // início de qualquer JWT
  });

  it('guarda a sessão num cookie HttpOnly e SameSite=Lax', async () => {
    const { res } = await login();
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/^ana_token=/);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Secure'); // a requisição de teste é https
  });

  it('recusa senha errada sem dizer se o e-mail existe', async () => {
    const wrongPassword = await api('/auth/login', {
      method: 'POST',
      body: { email: TEST_ADMIN_EMAIL, password: 'senha-errada' },
    });
    const unknownEmail = await api('/auth/login', {
      method: 'POST',
      body: { email: 'ninguem@exemplo.com', password: 'senha-errada' },
    });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
  });

  it('bloqueia o IP depois de 10 tentativas em 15 minutos', async () => {
    const ip = newIp();
    const attempt = () =>
      api('/auth/login', { method: 'POST', ip, body: { email: TEST_ADMIN_EMAIL, password: 'senha-errada' } });

    for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);

    // Nem a senha certa passa enquanto o IP estiver bloqueado
    const correct = await api('/auth/login', {
      method: 'POST',
      ip,
      body: { email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD },
    });
    expect(correct.status).toBe(429);
  });
});

describe('sessão', () => {
  it('rotas protegidas exigem o cookie de sessão', async () => {
    expect((await api('/beneficiaries')).status).toBe(401);

    const { cookie } = await login();
    expect((await api('/beneficiaries', { cookie })).status).toBe(200);
  });

  it('não aceita o token pelo cabeçalho Authorization: Bearer', async () => {
    const { cookie } = await login();
    const token = cookie.replace('ana_token=', '');
    const res = await api('/auth/me', { headers: { authorization: `Bearer ${token}` } });
    expect(res.status).toBe(401);
  });

  it('recusa um cookie adulterado', async () => {
    const { cookie } = await login();
    const tampered = cookie.slice(0, -4) + (cookie.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    expect((await api('/auth/me', { cookie: tampered })).status).toBe(401);
  });

  it('sair da conta invalida o token na hora, mesmo copiado', async () => {
    const { cookie } = await login();
    const copied = cookie; // ex.: alguém copiou o cookie antes do logout

    const logout = await api('/auth/logout', { method: 'POST', cookie });
    expect(logout.status).toBe(200);
    expect(logout.headers.get('set-cookie')).toMatch(/ana_token=;.*Max-Age=0/);

    expect((await api('/auth/me', { cookie: copied })).status).toBe(401);
  });

  it('sair num navegador não derruba a sessão de outro', async () => {
    const pc = await login();
    const celular = await login();

    await api('/auth/logout', { method: 'POST', cookie: pc.cookie });

    expect((await api('/auth/me', { cookie: pc.cookie })).status).toBe(401);
    expect((await api('/auth/me', { cookie: celular.cookie })).status).toBe(200);
  });
});

describe('redefinição de senha', () => {
  it('troca a senha e encerra todas as sessões abertas', async () => {
    // Usuário próprio deste teste, para não mudar a senha do admin usado nos outros
    const admin = await login();
    const email = `reset-${crypto.randomUUID()}@exemplo.com`;
    const created = await api('/auth/users', {
      method: 'POST',
      cookie: admin.cookie,
      body: { nome: 'Teste Reset', email, password: 'senha-antiga-123', role: 'equipe' },
    });
    expect(created.status).toBe(201);

    const pc = await login(email, 'senha-antiga-123');
    const celular = await login(email, 'senha-antiga-123');

    const asked = await api('/auth/request-password-reset', { method: 'POST', body: { email } });
    expect(asked.status).toBe(200);
    // O código vai só por e-mail (nunca na resposta); no teste, lemos direto do banco
    expect(JSON.stringify(await asked.json())).not.toMatch(/token|código:/i);
    const row = await env.DB.prepare(
      'SELECT r.token FROM password_resets r JOIN users u ON u.id = r.user_id WHERE u.email = ?'
    )
      .bind(email)
      .first<{ token: string }>();
    expect(row?.token).toBeTruthy();

    const reset = await api('/auth/reset-password', {
      method: 'POST',
      body: { token: row!.token, newPassword: 'senha-nova-456' },
    });
    expect(reset.status).toBe(200);

    expect((await api('/auth/me', { cookie: pc.cookie })).status).toBe(401);
    expect((await api('/auth/me', { cookie: celular.cookie })).status).toBe(401);
    expect((await login(email, 'senha-antiga-123')).res.status).toBe(401);
    expect((await login(email, 'senha-nova-456')).res.status).toBe(200);

    // O mesmo código não pode ser usado duas vezes
    const again = await api('/auth/reset-password', {
      method: 'POST',
      body: { token: row!.token, newPassword: 'outra-senha-789' },
    });
    expect(again.status).toBe(400);
  });
});
