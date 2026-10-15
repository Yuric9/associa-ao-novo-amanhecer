import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { login, newIp } from './helpers';

// Bytes iniciais ("assinatura") de cada formato aceito
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 1, 2, 3, 4, 5]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 9, 9, 9, 9]);
const WEBP = new Uint8Array([...new TextEncoder().encode('RIFF'), 1, 0, 0, 0, ...new TextEncoder().encode('WEBPVP8 '), 7, 7]);

function enviar(corpo: BodyInit, tipo: string, cookie?: string) {
  const headers = new Headers({ 'content-type': tipo, 'cf-connecting-ip': newIp() });
  if (cookie) headers.set('cookie', cookie);
  return exports.default.fetch(new Request('https://novoamanhecer.test/api/uploads', { method: 'POST', headers, body: corpo }));
}

const baixar = (url: string) => exports.default.fetch(new Request(`https://novoamanhecer.test${url}`));

describe('envio de fotos (POST /api/uploads)', () => {
  it.each([
    ['JPEG', JPEG, 'image/jpeg'],
    ['PNG', PNG, 'image/png'],
    ['WebP', WEBP, 'image/webp'],
  ])('a equipe envia %s e a foto fica disponível no site', async (_nome, bytes, tipo) => {
    const { cookie } = await login();
    const res = await enviar(bytes, tipo, cookie);
    expect(res.status).toBe(201);
    const { url } = await res.json<{ url: string }>();
    expect(url).toMatch(/^\/api\/fotos\/[\w-]+\.(jpg|png|webp)$/);

    const foto = await baixar(url);
    expect(foto.status).toBe(200);
    expect(foto.headers.get('content-type')).toBe(tipo);
    expect(foto.headers.get('cache-control')).toContain('immutable');
    expect(foto.headers.get('x-content-type-options')).toBe('nosniff');
    expect(new Uint8Array(await foto.arrayBuffer())).toEqual(bytes);
  });

  it('cada envio gera um endereço diferente', async () => {
    const { cookie } = await login();
    const a = await (await enviar(JPEG, 'image/jpeg', cookie)).json<{ url: string }>();
    const b = await (await enviar(JPEG, 'image/jpeg', cookie)).json<{ url: string }>();
    expect(a.url).not.toBe(b.url);
  });

  it('exige login', async () => {
    expect((await enviar(JPEG, 'image/jpeg')).status).toBe(401);
  });

  it.each([
    ['HTML disfarçado de JPEG', new TextEncoder().encode('<html><script>alert(1)</script></html>'), 'image/jpeg'],
    ['SVG (pode conter código)', new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'), 'image/svg+xml'],
    ['PNG enviado como JPEG', PNG, 'image/jpeg'],
    ['arquivo vazio', new Uint8Array(), 'image/jpeg'],
  ])('recusa %s', async (_caso, bytes, tipo) => {
    const { cookie } = await login();
    expect((await enviar(bytes, tipo, cookie)).status).toBe(415);
  });

  it('recusa arquivo maior que 5 MB', async () => {
    const { cookie } = await login();
    const grande = new Uint8Array(5 * 1024 * 1024 + 1);
    grande.set(JPEG);
    expect((await enviar(grande, 'image/jpeg', cookie)).status).toBe(413);
  });
});

describe('leitura de fotos (GET /api/fotos/:nome)', () => {
  it('404 para foto inexistente', async () => {
    expect((await baixar('/api/fotos/nao-existe.jpg')).status).toBe(404);
  });

  it.each(['..%2Fsegredo.jpg', 'foto.html', 'semextensao'])('recusa nome inválido: %s', async (nome) => {
    expect((await baixar(`/api/fotos/${nome}`)).status).toBe(404);
  });
});
