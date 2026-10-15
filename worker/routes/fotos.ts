// Fotos enviadas pelo painel (galeria e projetos), guardadas no Cloudflare R2.
import type { Req as Request, Res as Response, AuthenticatedRequest } from '../http';
import { logAudit } from '../db';
import { authenticateToken, requireRole } from '../auth';
import { fotosBucket } from '../env';
import { apiRouter } from './router';

const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB (o painel já reduz a foto antes de enviar)

// O tipo informado pelo navegador não basta: conferimos os primeiros bytes do arquivo.
// Só JPEG, PNG e WebP; SVG e HTML ficam de fora porque podem conter código.
const FORMATOS: Record<string, { extensao: string; assinatura: (b: Uint8Array) => boolean }> = {
  'image/jpeg': { extensao: 'jpg', assinatura: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': {
    extensao: 'png',
    assinatura: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v),
  },
  'image/webp': {
    extensao: 'webp',
    assinatura: (b) =>
      String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP',
  },
};

const TIPO_DA_EXTENSAO: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

// Envio: só a equipe logada. Devolve o endereço público da foto.
apiRouter.post('/uploads', authenticateToken, requireRole(['admin', 'equipe', 'coordenador']), async (req: AuthenticatedRequest, res: Response) => {
  const tipo = (req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const declarado = Number(req.headers.get('content-length') || 0);
  if (declarado > TAMANHO_MAXIMO) {
    return res.status(413).json({ error: 'A foto é grande demais (máximo de 5 MB).' });
  }

  const bytes = new Uint8Array(await req.raw.arrayBuffer());
  if (bytes.length > TAMANHO_MAXIMO) {
    return res.status(413).json({ error: 'A foto é grande demais (máximo de 5 MB).' });
  }

  const formato = FORMATOS[tipo];
  if (!formato || bytes.length < 12 || !formato.assinatura(bytes)) {
    return res.status(415).json({ error: 'Envie uma foto em JPG, PNG ou WebP.' });
  }

  const nome = `${crypto.randomUUID()}.${formato.extensao}`;
  await fotosBucket().put(nome, bytes, { httpMetadata: { contentType: tipo } });

  await logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    action: 'PHOTO_UPLOADED',
    entity: 'PHOTO',
    entityId: nome,
    details: `Foto enviada (${Math.round(bytes.length / 1024)} KB).`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ url: `/api/fotos/${nome}` });
});

// Leitura pública. O nome tem um id aleatório, então o conteúdo nunca muda: cache de 1 ano.
apiRouter.get('/fotos/:nome', async (req: Request, res: Response) => {
  const match = /^[0-9a-f-]{36}\.(jpg|png|webp)$/.exec(req.params.nome);
  if (!match) return res.status(404).json({ error: 'Foto não encontrada.' });

  const objeto = await fotosBucket().get(req.params.nome);
  if (!objeto) return res.status(404).json({ error: 'Foto não encontrada.' });

  return res.file(objeto.body, TIPO_DA_EXTENSAO[match[1]], 'public, max-age=31536000, immutable');
});
