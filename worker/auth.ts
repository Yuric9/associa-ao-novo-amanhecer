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

/** Nome do cookie HttpOnly da sessão (o JavaScript do navegador não consegue lê-lo). */
export const SESSION_COOKIE = 'ana_token';

/** Duração da sessão: 24 horas. */
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

// O token fica SOMENTE no cookie HttpOnly. Antes ele também ia para o localStorage,
// onde qualquer script injetado na página conseguiria roubá-lo.
function readToken(req: Req): string | undefined {
  return req.cookies[SESSION_COOKIE];
}

type LoadResult =
  | { ok: true; user: AuthRequestUser; sessionId: string }
  | { ok: false; status: number; error: string };

const SESSION_EXPIRED = 'Sua sessão expirou ou o token é inválido. Por favor, entre novamente.';

async function loadUser(token: string): Promise<LoadResult> {
  const decoded = await verifyJwt<{ id: string; sid: string }>(token, getJwtSecret());
  if (!decoded?.id || !decoded.sid) {
    return { ok: false, status: 401, error: SESSION_EXPIRED };
  }

  // A sessão precisa existir no banco: sair da conta ou trocar a senha a apaga,
  // e o token deixa de valer na hora (mesmo que ainda não tenha expirado).
  const session = await db.prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ? AND expires_at > ?')
    .get<{ id: string }>(decoded.sid, decoded.id, Date.now());
  if (!session) {
    return { ok: false, status: 401, error: SESSION_EXPIRED };
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

  return { ok: true, user: { id: user.id, nome: user.nome, email: user.email, role, roles }, sessionId: session.id };
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
  req.sessionId = result.sessionId;
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
