import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { api, beneficiaryForm, login, newIp } from './helpers';

async function criar(overrides: Record<string, unknown> = {}) {
  const res = await api('/beneficiaries', { method: 'POST', body: beneficiaryForm(overrides) });
  expect(res.status).toBe(201);
  return (await res.json<{ id: string }>()).id;
}

const doBanco = (id: string) =>
  env.DB.prepare('SELECT nome, email, endereco, observacoes, status FROM beneficiaries WHERE id = ?')
    .bind(id)
    .first<Record<string, string>>();

describe('cadastro manual pela equipe', () => {
  it('a equipe logada não cai no limite de 6 inscrições por IP do formulário público', async () => {
    const { cookie } = await login();
    const ip = newIp();
    for (let i = 0; i < 10; i++) {
      const res = await api('/beneficiaries', { method: 'POST', ip, cookie, body: beneficiaryForm() });
      expect(res.status, `cadastro ${i + 1}`).toBe(201);
    }
  });

  it('visitante sem login continua limitado a 6', async () => {
    const ip = newIp();
    for (let i = 0; i < 6; i++) {
      expect((await api('/beneficiaries', { method: 'POST', ip, body: beneficiaryForm() })).status).toBe(201);
    }
    expect((await api('/beneficiaries', { method: 'POST', ip, body: beneficiaryForm() })).status).toBe(429);
  });
});

describe('edição (PATCH /beneficiaries/:id)', () => {
  it('apagar um campo opcional (deixar vazio) é gravado', async () => {
    const id = await criar({ observacoes: 'Precisa de uniforme', email: 'familia@exemplo.com' });
    const { cookie } = await login();

    const res = await api(`/beneficiaries/${id}`, { method: 'PATCH', cookie, body: { observacoes: '', email: '' } });
    expect(res.status).toBe(200);

    const row = await doBanco(id);
    expect(row?.observacoes).toBe('');
    expect(row?.email).toBe('');
  });

  it('campos que não foram enviados continuam como estavam', async () => {
    const id = await criar({ observacoes: 'Manter isto', nome: 'Nome Original' });
    const { cookie } = await login();

    await api(`/beneficiaries/${id}`, { method: 'PATCH', cookie, body: { status: 'Aprovado' } });

    expect(await doBanco(id)).toMatchObject({ nome: 'Nome Original', observacoes: 'Manter isto', status: 'Aprovado' });
  });

  it.each(['nome', 'cpf', 'telefone', 'projeto', 'status', 'nascimento'])(
    'recusa apagar o campo obrigatório "%s"',
    async (campo) => {
      const id = await criar();
      const { cookie } = await login();
      const antes = await doBanco(id);

      const res = await api(`/beneficiaries/${id}`, { method: 'PATCH', cookie, body: { [campo]: '   ' } });
      expect(res.status).toBe(400);
      expect(await doBanco(id)).toEqual(antes);
    }
  );
});
