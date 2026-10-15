// Senhas sem depender de e-mail: trocar a própria e o administrador redefinir a de outra pessoa.
import { describe, expect, it } from 'vitest';
import { api, beneficiaryForm, login } from './helpers';

async function novoUsuario(papel = 'equipe') {
  const { cookie: admin } = await login();
  const email = `${papel}-${crypto.randomUUID()}@exemplo.com`;
  const res = await api('/auth/users', {
    method: 'POST',
    cookie: admin,
    body: { nome: `Teste ${papel}`, email, password: 'senha-inicial-1', role: papel },
  });
  const { user } = await res.json<{ user: { id: string } }>();
  return { id: user.id, email, admin };
}

describe('trocar a própria senha (PUT /api/auth/password)', () => {
  it('troca a senha, mantém esta sessão e derruba as outras', async () => {
    const { email } = await novoUsuario();
    const aqui = (await login(email, 'senha-inicial-1')).cookie;
    const outroAparelho = (await login(email, 'senha-inicial-1')).cookie;

    const res = await api('/auth/password', {
      method: 'PUT',
      cookie: aqui,
      body: { currentPassword: 'senha-inicial-1', newPassword: 'senha-nova-123' },
    });
    expect(res.status).toBe(200);

    expect((await api('/auth/me', { cookie: aqui })).status).toBe(200);
    expect((await api('/auth/me', { cookie: outroAparelho })).status).toBe(401);
    expect((await login(email, 'senha-inicial-1')).res.status).toBe(401);
    expect((await login(email, 'senha-nova-123')).res.status).toBe(200);
  });

  it('recusa senha atual errada e senha nova curta', async () => {
    const { email } = await novoUsuario();
    const { cookie } = await login(email, 'senha-inicial-1');
    const trocar = (body: object) => api('/auth/password', { method: 'PUT', cookie, body });

    expect((await trocar({ currentPassword: 'errada-errada', newPassword: 'senha-nova-123' })).status).toBe(400);
    expect((await trocar({ currentPassword: 'senha-inicial-1', newPassword: 'curta' })).status).toBe(400);
    expect((await login(email, 'senha-inicial-1')).res.status).toBe(200); // nada mudou
  });

  it('exige login', async () => {
    expect((await api('/auth/password', { method: 'PUT', body: { currentPassword: 'x', newPassword: 'senha-nova-123' } })).status).toBe(401);
  });
});

describe('administrador redefine a senha de alguém (PUT /api/auth/users/:id/password)', () => {
  it('define a senha provisória e desconecta a pessoa', async () => {
    const { id, email, admin } = await novoUsuario('voluntario');
    const sessaoDaPessoa = (await login(email, 'senha-inicial-1')).cookie;

    const res = await api(`/auth/users/${id}/password`, { method: 'PUT', cookie: admin, body: { newPassword: 'provisoria-123' } });
    expect(res.status).toBe(200);

    expect((await api('/auth/me', { cookie: sessaoDaPessoa })).status).toBe(401);
    expect((await login(email, 'senha-inicial-1')).res.status).toBe(401);
    expect((await login(email, 'provisoria-123')).res.status).toBe(200);

    const logs = await (await api('/audit-logs', { cookie: admin })).json<{ action: string; details: string }[]>();
    expect(logs.some((l) => l.action === 'PASSWORD_RESET_BY_ADMIN' && l.details.includes(email))).toBe(true);
  });

  it.each(['coordenador', 'equipe', 'voluntario'])('%s não pode redefinir senha de ninguém', async (papel) => {
    const alvo = await novoUsuario();
    const quem = await novoUsuario(papel);
    const { cookie } = await login(quem.email, 'senha-inicial-1');
    expect((await api(`/auth/users/${alvo.id}/password`, { method: 'PUT', cookie, body: { newPassword: 'provisoria-123' } })).status).toBe(403);
  });

  it('recusa a própria conta, usuário inexistente e senha curta', async () => {
    const { cookie: admin } = await login();
    const me = await (await api('/auth/me', { cookie: admin })).json<{ user: { id: string } }>();
    const redefinir = (id: string, newPassword: string) =>
      api(`/auth/users/${id}/password`, { method: 'PUT', cookie: admin, body: { newPassword } });

    expect((await redefinir(me.user.id, 'provisoria-123')).status).toBe(400);
    expect((await redefinir('usr-nao-existe', 'provisoria-123')).status).toBe(404);
    const { id } = await novoUsuario();
    expect((await redefinir(id, 'curta')).status).toBe(400);
  });
});

describe('e-mail só para recuperar senha', () => {
  it('inscrição com e-mail não gera nenhum envio de e-mail', async () => {
    const { cookie } = await login();
    const contar = async () => (await (await api('/emails/logs', { cookie })).json<unknown[]>()).length;
    const antes = await contar();
    const res = await api('/beneficiaries', { method: 'POST', body: beneficiaryForm({ email: 'familia@exemplo.com' }) });
    expect(res.status).toBe(201);
    expect(await contar()).toBe(antes);
  });

  it('"Esqueci minha senha" continua registrando o envio do código', async () => {
    const { email } = await novoUsuario();
    const { cookie } = await login();
    const res = await api('/auth/request-password-reset', { method: 'POST', body: { email } });
    expect(res.status).toBe(200);
    const logs = await (await api('/emails/logs', { cookie })).json<{ tipo: string; destinatario: string; corpo: string }[]>();
    const envio = logs.find((l) => l.destinatario === email);
    expect(envio?.tipo).toBe('RECUPERACAO_SENHA');
    expect(envio?.corpo).not.toMatch(/[a-f0-9]{24,}/); // o código nunca fica gravado
  });
});
