// Mini-roteador no estilo Express para o Workers, para manter as rotas quase iguais às antigas.

export interface AuthRequestUser {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'equipe' | 'coordenador' | 'voluntario';
  roles: string[];
}

export interface Req {
  method: string;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: any;
  headers: Headers;
  cookies: Record<string, string>;
  ip: string;
  secure: boolean;
  ctx: ExecutionContext;
  user?: AuthRequestUser;
}

export type AuthenticatedRequest = Req;

interface CookieOptions {
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  maxAge?: number; // em milissegundos, como no Express
  path?: string;
}

export class Res {
  statusCode = 200;
  private readonly headers = new Headers();
  private body: string | null = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(data: unknown) {
    this.body = JSON.stringify(data);
    this.headers.set('Content-Type', 'application/json; charset=utf-8');
    return this;
  }

  cookie(name: string, value: string, options: CookieOptions = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${options.path ?? '/'}`];
    if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.secure) parts.push('Secure');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite[0].toUpperCase()}${options.sameSite.slice(1)}`);
    this.headers.append('Set-Cookie', parts.join('; '));
    return this;
  }

  clearCookie(name: string) {
    this.headers.append('Set-Cookie', `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
    return this;
  }

  get sent() {
    return this.body !== null;
  }

  toResponse(): Response {
    this.headers.set('Cache-Control', 'no-store');
    this.headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(this.body ?? '', { status: this.statusCode, headers: this.headers });
  }
}

export type Next = () => Promise<void>;
export type Handler = (req: Req, res: Res, next: Next) => unknown | Promise<unknown>;

interface Route {
  method: string;
  regex: RegExp;
  keys: string[];
  handlers: Handler[];
}

export class Router {
  private readonly routes: Route[] = [];

  private add(method: string, pattern: string, handlers: Handler[]) {
    const keys: string[] = [];
    const source = pattern
      .split('/')
      .map((segment) => {
        if (segment.startsWith(':')) {
          keys.push(segment.slice(1));
          return '([^/]+)';
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');
    this.routes.push({ method, regex: new RegExp(`^${source}/?$`), keys, handlers });
  }

  get(pattern: string, ...handlers: Handler[]) { this.add('GET', pattern, handlers); }
  post(pattern: string, ...handlers: Handler[]) { this.add('POST', pattern, handlers); }
  put(pattern: string, ...handlers: Handler[]) { this.add('PUT', pattern, handlers); }
  patch(pattern: string, ...handlers: Handler[]) { this.add('PATCH', pattern, handlers); }
  delete(pattern: string, ...handlers: Handler[]) { this.add('DELETE', pattern, handlers); }

  /** Executa a rota correspondente. Retorna false se nenhuma rota casou. */
  async handle(req: Req, res: Res): Promise<boolean> {
    for (const route of this.routes) {
      if (route.method !== req.method) continue;
      const match = route.regex.exec(req.path);
      if (!match) continue;
      req.params = {};
      route.keys.forEach((key, i) => {
        req.params[key] = decodeURIComponent(match[i + 1]);
      });
      const run = async (index: number): Promise<void> => {
        const handler = route.handlers[index];
        if (!handler) return;
        await handler(req, res, () => run(index + 1));
      };
      await run(0);
      return true;
    }
    return false;
  }
}

export function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
}

/** Executa uma tarefa em segundo plano (ex.: envio de e-mail) sem atrasar a resposta. */
export function defer(req: Req, task: Promise<unknown>, label: string) {
  req.ctx.waitUntil(task.catch((err) => console.error(`${label}:`, err)));
}
