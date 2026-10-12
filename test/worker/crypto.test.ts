import { describe, expect, it } from 'vitest';
import { hashPassword, randomToken, signJwt, verifyJwt, verifyPassword } from '../../worker/crypto';

const SECRET = 'segredo-de-teste-com-mais-de-32-caracteres';

describe('senhas (PBKDF2)', () => {
  it('confere a senha certa e recusa a errada', async () => {
    const hash = await hashPassword('Minha-Senha-1');
    expect(await verifyPassword('Minha-Senha-1', hash)).toBe(true);
    expect(await verifyPassword('minha-senha-1', hash)).toBe(false);
  });

  it('nunca guarda a senha em texto e usa sal diferente a cada vez', async () => {
    const a = await hashPassword('Minha-Senha-1');
    const b = await hashPassword('Minha-Senha-1');
    expect(a).not.toContain('Minha-Senha-1');
    expect(a).toMatch(/^pbkdf2\$\d+\$[\w-]+\$[\w-]+$/);
    expect(a).not.toBe(b);
  });

  it.each(['', 'texto-qualquer', 'pbkdf2$abc$sal$hash', 'pbkdf2$999999999$c2Fs$aGFzaA'])(
    'recusa hash malformado ou com iterações absurdas: %s',
    async (stored) => {
      expect(await verifyPassword('qualquer', stored)).toBe(false);
    }
  );
});

describe('JWT', () => {
  it('assina e lê de volta o conteúdo', async () => {
    const token = await signJwt({ id: 'u1', sid: 's1' }, SECRET, 60);
    expect(await verifyJwt(token, SECRET)).toMatchObject({ id: 'u1', sid: 's1' });
  });

  it('recusa token assinado com outro segredo', async () => {
    const token = await signJwt({ id: 'u1' }, 'outro-segredo-com-mais-de-32-caracteres!!', 60);
    expect(await verifyJwt(token, SECRET)).toBeNull();
  });

  it('recusa token com conteúdo alterado (ex.: trocar o papel para admin)', async () => {
    const token = await signJwt({ id: 'u1', role: 'voluntario' }, SECRET, 60);
    const [header, , signature] = token.split('.');
    const forged = btoa(JSON.stringify({ id: 'u1', role: 'admin', exp: 9999999999 }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(await verifyJwt(`${header}.${forged}.${signature}`, SECRET)).toBeNull();
  });

  it('recusa token com alg "none"', async () => {
    const enc = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    const token = `${enc({ alg: 'none', typ: 'JWT' })}.${enc({ id: 'u1', exp: 9999999999 })}.`;
    expect(await verifyJwt(token, SECRET)).toBeNull();
  });

  it('recusa token expirado', async () => {
    const token = await signJwt({ id: 'u1' }, SECRET, -1);
    expect(await verifyJwt(token, SECRET)).toBeNull();
  });

  it.each(['', 'a.b', 'a.b.c', 'nao-e-um-token'])('recusa lixo: "%s"', async (token) => {
    expect(await verifyJwt(token, SECRET)).toBeNull();
  });
});

describe('randomToken', () => {
  it('gera códigos diferentes e seguros para URL', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => randomToken(24)));
    expect(tokens.size).toBe(100);
    for (const t of tokens) expect(t).toMatch(/^[\w-]{32}$/);
  });
});
