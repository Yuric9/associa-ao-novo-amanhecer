// Versões otimizadas (WebP) das fotos fixas do site, geradas por "npm run fotos".
// Só vale para /fotos/<nome>.jpg (pasta public/fotos). Fotos enviadas pelo painel
// (/api/fotos/...) já são reduzidas e convertidas para WebP no envio.
const FOTO_FIXA = /^\/fotos\/([\w-]+)\.jpg$/;

/** srcset WebP (400, 800 e 1600 px) para uma foto fixa, ou null se a foto não tiver versões. */
export function srcSetWebp(src: string): string | null {
  const m = FOTO_FIXA.exec(src);
  if (!m) return null;
  const base = `/fotos/${m[1]}`;
  return `${base}-400.webp 400w, ${base}-800.webp 800w, ${base}.webp 1600w`;
}
