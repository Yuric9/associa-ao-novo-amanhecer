// Ponto de entrada do Cloudflare Worker.
// - /api/*  → API (este código), com banco D1
// - resto   → site React compilado (pasta dist/), servido pelo "assets" do wrangler.jsonc
import { setEnv, type Env } from './env';
import { db } from './d1';
import { ensureInitialized } from './db';
import { apiRouter } from './routes';
import { Res, parseCookies, type Req } from './http';

const MAX_BODY_BYTES = 1_000_000; // 1 MB

async function readJsonBody(request: Request): Promise<any> {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return {};
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return {};
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_BODY_BYTES) throw new PayloadTooLarge();
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new PayloadTooLarge();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new BadJson();
  }
}

class PayloadTooLarge extends Error {}
class BadJson extends Error {}

function jsonError(status: number, error: string): Response {
  const res = new Res();
  res.status(status).json({ error });
  return res.toResponse();
}

async function handleApi(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);

  let body: any;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    if (err instanceof PayloadTooLarge) return jsonError(413, 'Os dados enviados são grandes demais.');
    return jsonError(400, 'Formato de dados inválido.');
  }

  const req: Req = {
    method: request.method,
    path: url.pathname.replace(/^\/api/, '') || '/',
    params: {},
    query: url.searchParams,
    body,
    headers: request.headers,
    cookies: parseCookies(request.headers.get('cookie')),
    ip: request.headers.get('cf-connecting-ip') || '0.0.0.0',
    secure: url.protocol === 'https:',
    ctx,
  };
  const res = new Res();

  try {
    await ensureInitialized();
    const found = await apiRouter.handle(req, res);
    if (!found) res.status(404).json({ error: 'Rota da API não encontrada.' });
    if (!res.sent) res.status(500).json({ error: 'A requisição não gerou resposta.' });
  } catch (err) {
    console.error(`[API ERROR] ${req.method} ${url.pathname}:`, err);
    return jsonError(500, 'Erro interno no servidor. Tente novamente em instantes.');
  }

  return res.toResponse();
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    setEnv(env);
    db.attach(env.DB);

    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return handleApi(request, env, ctx);
    }

    // Qualquer outra rota: arquivos do site (o wrangler devolve index.html para rotas do React)
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
