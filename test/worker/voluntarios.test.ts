import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { api, login, newIp } from './helpers';

const formVoluntario = (over: Record<string, unknown> = {}) => ({
  nome: 'Voluntária de Teste',
  telefone: '(62) 98888-7777',
  email: 'voluntaria@exemplo.com',
  area: 'Oficina de Ballet',
  disponibilidade: 'Sábados (Manhã)',
  habilidades: 'Dança',
  observacoes: '',
  consentimento_lgpd: true,
  hp_security_check: '',
  ...over,
});

const doBanco = (id: string) =>
  env.DB.prepare('SELECT nome, telefone, email, area, disponibilidade, habilidades, observacoes, ativo FROM volunteers WHERE id = ?')
    .bind(id)
    .first<Record<string, string | number>>();

async function criar(over: Record<string, unknown> = {}, cookie?: string) {
  const res = await api('/volunteers', { method: 'POST', cookie, body: formVoluntario(over) });
  expect(res.status).toBe(201);
  const { id } = await res.json<{ id: string }>();
  expect(id).toBeTruthy();
  return id;
}

async function loginComo(role: 'voluntario' | 'equipe') {
  const admin = await login();
  const email = `${role}-${crypto.randomUUID()}@exemplo.com`;
  await api('/auth/users', { method: 'POST', cookie: admin.cookie, body: { nome: role, email, password: 'senha-de-teste-1', role } });
  return (await login(email, 'senha-de-teste-1')).cookie;
}

describe('cadastro de voluntário', () => {
  it('devolve o id do voluntário criado', async () => {
    const id = await criar();
    expect(await doBanco(id)).toMatchObject({ nome: 'Voluntária de Teste', ativo: 1 });
  });

  it('formulário público exige e-mail válido', async () => {
    const res = await api('/volunteers', { method: 'POST', body: formVoluntario({ email: '' }) });
    expect(res.status).toBe(400);
  });

  it('equipe logada pode cadastrar sem e-mail e não cai no limite por IP', async () => {
    const { cookie } = await login();
    const ip = newIp();
    for (let i = 0; i < 8; i++) {
      const res = await api('/volunteers', { method: 'POST', ip, cookie, body: formVoluntario({ email: '' }) });
      expect(res.status, `cadastro ${i + 1}`).toBe(201);
    }
  });
});

describe('edição de voluntário (PATCH /volunteers/:id)', () => {
  it('altera os campos enviados e mantém os outros', async () => {
    const id = await criar({ habilidades: 'Manter' });
    const { cookie } = await login();

    const res = await api(`/volunteers/${id}`, {
      method: 'PATCH',
      cookie,
      body: { nome: 'Nome Novo', area: 'Treinos de Futebol', disponibilidade: 'Escala Flexível' },
    });
    expect(res.status).toBe(200);
    expect(await doBanco(id)).toMatchObject({
      nome: 'Nome Novo',
      area: 'Treinos de Futebol',
      disponibilidade: 'Escala Flexível',
      habilidades: 'Manter',
      telefone: '(62) 98888-7777',
    });
  });

  it('pausa e reativa', async () => {
    const id = await criar();
    const { cookie } = await login();
    await api(`/volunteers/${id}`, { method: 'PATCH', cookie, body: { ativo: false } });
    expect((await doBanco(id))?.ativo).toBe(0);
    await api(`/volunteers/${id}`, { method: 'PATCH', cookie, body: { ativo: true } });
    expect((await doBanco(id))?.ativo).toBe(1);
  });

  it('apaga campos opcionais enviados vazios', async () => {
    const id = await criar({ habilidades: 'Algo', observacoes: 'Nota' });
    const { cookie } = await login();
    await api(`/volunteers/${id}`, { method: 'PATCH', cookie, body: { habilidades: '', observacoes: '', email: '' } });
    expect(await doBanco(id)).toMatchObject({ habilidades: '', observacoes: '', email: '' });
  });

  it.each([
    ['nome em branco', { nome: '  ' }],
    ['telefone em branco', { telefone: '' }],
    ['telefone inválido', { telefone: '123' }],
    ['e-mail inválido', { email: 'maria@' }],
    ['área em branco', { area: '' }],
  ])('recusa %s', async (_caso, body) => {
    const id = await criar();
    const { cookie } = await login();
    const antes = await doBanco(id);
    expect((await api(`/volunteers/${id}`, { method: 'PATCH', cookie, body })).status).toBe(400);
    expect(await doBanco(id)).toEqual(antes);
  });

  it('exige login com perfil de gestão', async () => {
    const id = await criar();
    expect((await api(`/volunteers/${id}`, { method: 'PATCH', body: { ativo: false } })).status).toBe(401);
    const voluntario = await loginComo('voluntario');
    expect((await api(`/volunteers/${id}`, { method: 'PATCH', cookie: voluntario, body: { ativo: false } })).status).toBe(403);
    const equipe = await loginComo('equipe');
    expect((await api(`/volunteers/${id}`, { method: 'PATCH', cookie: equipe, body: { ativo: false } })).status).toBe(200);
  });

  it('404 para voluntário inexistente', async () => {
    const { cookie } = await login();
    expect((await api('/volunteers/nao-existe', { method: 'PATCH', cookie, body: { ativo: false } })).status).toBe(404);
  });

  it('registra a alteração na auditoria', async () => {
    const id = await criar();
    const { cookie } = await login();
    await api(`/volunteers/${id}`, { method: 'PATCH', cookie, body: { ativo: false } });
    const log = await env.DB.prepare("SELECT action FROM audit_logs WHERE entity_id = ? AND action = 'VOLUNTEER_UPDATED'")
      .bind(id)
      .first();
    expect(log).toBeTruthy();
  });
});
