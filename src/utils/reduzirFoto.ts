// Reduz a foto no próprio navegador antes de enviar: uma foto de celular de ~5 MB vira ~300 KB,
// o que deixa o envio rápido mesmo no 4G e economiza espaço no armazenamento.

const LADO_MAXIMO = 1600; // pixels no lado maior: suficiente para tela cheia no site

function canvasParaBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, qualidade));
}

export async function reduzirFoto(arquivo: File): Promise<Blob> {
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem (foto).');
  }

  let imagem: ImageBitmap;
  try {
    // 'from-image' respeita a rotação gravada pela câmera do celular (EXIF)
    imagem = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('Não foi possível abrir esta foto. Tente uma foto em JPG ou PNG.');
  }

  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não conseguiu processar a foto.');
  ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  imagem.close();

  // WebP é menor; navegadores que não sabem gerar WebP devolvem outro formato, aí usamos JPEG.
  const webp = await canvasParaBlob(canvas, 'image/webp', 0.82);
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await canvasParaBlob(canvas, 'image/jpeg', 0.85);
  if (jpeg) return jpeg;
  throw new Error('Seu navegador não conseguiu processar a foto.');
}
