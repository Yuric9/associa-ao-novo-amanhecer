import { db, isUserAdmin, getUserRoles } from './db';
import { cfg } from './env';
import { verifyJwt } from './crypto';
import type { Req, Res, Next, AuthRequestUser } from './http';

export type AppRole = AuthRequestUser['role'];
export type { AuthRequestUser, AuthenticatedRequest } from './http';

/** Segredo das sessões. Obrigatório (Secret JWT_SECRET no painel da Cloudflare, mínimo 32 caracteres). */
export function getJwtSecret(): string {
  const secret = cfg('JWT_SECRET');
  if (secret.length < 32) {
    throw new Error('JWT_SECRET não definido (ou com menos de 32 caracteres). Cadastre-o em Settings → Variables and Secrets.');
  }
  return secret;
}

/**
 * Papel principal do usuário. Usuário sem nenhum papel NÃO recebe privilégios.
 */
export async function resolvePrimaryRole(userId: string, roles: string[]): Promise<AppRole | null> {
  if (await isUserAdmin(userId)) return 'admin';
  const valid: AppRole[] = ['coordenador', 'equipe', 'voluntario'];
  return valid.find((r) => roles.includes(r)) ?? null;
}

function readToken(req: Req): string | undefined {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return req.cookies.ana_token;
}

type LoadResult =
  | { ok: true; user: AuthRequestUser }
  | { ok: false; status: number; error: string };

async function loadUser(token: string): Promise<LoadResult> {
  const decoded = await verifyJwt<{ id: string }>(token, getJwtSecret());
  if (!decoded?.id) {
    return { ok: false, status: 403, error: 'Sua sessão expirou ou o token é inválido. Por favor, entre novamente.' };
  }

  // Conferir no banco se o usuário ainda existe e está ativo (verificação 100% no servidor)
  const user = await db.prepare('SELECT id, nome, email, ativo FROM users WHERE id = ?')
    .get<{ id: string; nome: string; email: string; ativo: number }>(decoded.id);
  if (!user || user.ativo !== 1) {
    return { ok: false, status: 403, error: 'Conta inativa ou não localizada. Contate a coordenação da associação.' };
  }

  const roles = await getUserRoles(user.id);
  const role = await resolvePrimaryRole(user.id, roles);
  if (!role) {
    return { ok: false, status: 403, error: 'Sua conta não possui nenhum perfil de acesso atribuído. Contate a coordenação.' };
  }

  return { ok: true, user: { id: user.id, nome: user.nome, email: user.email, role, roles } };
}

/** Lê o token (header Bearer ou cookie) sem exigir login. Retorna o usuário ativo ou null. */
export async function getOptionalUser(req: Req): Promise<AuthRequestUser | null> {
  const token = readToken(req);
  if (!token) return null;
  const result = await loadUser(token);
  return result.ok ? result.user : null;
}

// Middleware de autenticação obrigatória via Token JWT
export async function authenticateToken(req: Req, res: Res, next: Next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({
      error: 'Sessão não autenticada. Por favor, faça login para acessar este recurso.',
    });
  }

  const result = await loadUser(token);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  req.user = result.user;
  await next();
}

// Middleware de verificação segura de Administrador
export async function requireAdmin(req: Req, res: Res, next: Next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  if (!(await isUserAdmin(req.user.id))) {
    return res.status(403).json({
      error: 'Acesso restrito. Esta operação exige privilégios de Administrador Geral.',
    });
  }

  await next();
}

// Middleware de verificação estrita de papéis (RBAC verificado no servidor via tabela separada)
export function requireRole(allowedRoles: AppRole[]) {
  return async (req: Req, res: Res, next: Next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const hasPermission =
      (await isUserAdmin(req.user.id)) ||
      req.user.roles.some((r) => allowedRoles.includes(r as AppRole));

    if (!hasPermission) {
      return res.status(403).json({
        error: `Acesso negado. Seu perfil não tem permissão para realizar esta ação. Perfis autorizados: ${allowedRoles.join(' ou ')}.`,
      });
    }

    await next();
  };
}
