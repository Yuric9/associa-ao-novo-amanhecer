import { describe, expect, it } from 'vitest';
import { srcSetWebp } from '../../src/utils/fotos';

describe('versões WebP das fotos fixas', () => {
  it('monta as três larguras para uma foto de /fotos', () => {
    expect(srcSetWebp('/fotos/projeto-ballet.jpg')).toBe(
      '/fotos/projeto-ballet-400.webp 400w, /fotos/projeto-ballet-800.webp 800w, /fotos/projeto-ballet.webp 1600w'
    );
  });

  it.each([
    '/api/fotos/0b3f1c2e-1111-4222-8333-944455556666.webp', // enviada pelo painel
    'https://exemplo.com/fotos/x.jpg', // link externo
    '/fotos/x.png',
    '/fotos/../segredo.jpg',
    '',
  ])('sem versões para %s', (src) => {
    expect(srcSetWebp(src)).toBeNull();
  });
});

describe('pasta public/fotos', () => {
  it('toda foto .jpg tem as versões WebP (rode "npm run fotos" ao adicionar uma foto)', async () => {
    const { readdirSync } = await import('node:fs');
    const arquivos = new Set(readdirSync('public/fotos'));
    const faltando = [...arquivos]
      .filter((a) => a.endsWith('.jpg'))
      .flatMap((jpg) => ['.webp', '-400.webp', '-800.webp'].map((s) => jpg.replace(/\.jpg$/, s)))
      .filter((webp) => !arquivos.has(webp));
    expect(faltando).toEqual([]);
  });
});
