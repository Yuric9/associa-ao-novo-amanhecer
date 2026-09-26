import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { db, isUserAdmin, getUserRoles } from './db.js';

// O segredo JWT NUNCA pode ficar fixo no código (o repositório é público).
// Em produção é obrigatório definir JWT_SECRET; em desenvolvimento geramos um aleatório por execução.
function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET não definido (ou com menos de 32 caracteres). Defina-o nas variáveis de ambiente do servidor.');
  }
  console.warn('[AUTH] JWT_SECRET não definido: usando segredo aleatório temporário (as sessões caem ao reiniciar).');
  return crypto.randomBytes(48).toString('hex');
}

export const JWT_SECRET = resolveJwtSecret();

export type AppRole = 'admin' | 'equipe' | 'coordenador' | 'voluntario';

/**
 * Papel principal do usuário. Usuário sem nenhum papel NÃO recebe privilégios
 * (antes caía em 'equipe' e ganhava acesso a dados de beneficiários).
 */
export function resolvePrimaryRole(userId: string, roles: string[]): AppRole | null {
  if (isUserAdmin(userId)) return 'admin';
  const valid: AppRole[] = ['coordenador', 'equipe', 'voluntario'];
  return (valid.find((r) => roles.includes(r)) as AppRole | undefined) ?? null;
}

/** Lê o token (header Bearer ou cookie) sem exigir login. Retorna o usuário ativo ou null. */
export function getOptionalUser(req: Request): AuthRequestUser | null {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.split(' ')[1]
    : (req as any).cookies?.ana_token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.prepare('SELECT id, nome, email, ativo FROM users WHERE id = ?')
      .get(decoded.id) as { id: string; nome: string; email: string; ativo: number } | undefined;
    if (!user || user.ativo !== 1) return null;
    const roles = getUserRoles(user.id);
    const role = resolvePrimaryRole(user.id, roles);
    if (!role) return null;
    return { id: user.id, nome: user.nome, email: user.email, role, roles };
  } catch {
    return null;
  }
}

export interface AuthRequestUser {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'equipe' | 'coordenador' | 'voluntario';
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthRequestUser;
}

// Middleware de autenticação obrigatória via Token JWT
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.split(' ')[1]
    : req.cookies?.ana_token;

  if (!token) {
    return res.status(401).json({
      error: 'Sessão não autenticada. Por favor, faça login para acessar este recurso.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };

    // Conferir no banco se o usuário ainda existe e está ativo (verificação 100% no servidor)
    const user = db.prepare(`
      SELECT id, nome, email, ativo FROM users WHERE id = ?
    `).get(decoded.id) as { id: string; nome: string; email: string; ativo: number } | undefined;

    if (!user || user.ativo !== 1) {
      return res.status(403).json({
        error: 'Conta inativa ou não localizada. Contate a coordenação da associação.',
      });
    }

    // Obter papéis a partir da tabela separada user_roles (nunca salva no perfil do usuário)
    const roles = getUserRoles(user.id);
    const primaryRole = resolvePrimaryRole(user.id, roles);
    if (!primaryRole) {
      return res.status(403).json({
        error: 'Sua conta não possui nenhum perfil de acesso atribuído. Contate a coordenação.',
      });
    }

    req.user = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: primaryRole,
      roles,
    };

    next();
  } catch (err) {
    return res.status(403).json({
      error: 'Sua sessão expirou ou o token é inválido. Por favor, entre novamente.',
    });
  }
}

// Middleware de verificação segura de Administrador
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  if (!isUserAdmin(req.user.id)) {
    return res.status(403).json({
      error: 'Acesso restrito. Esta operação exige privilégios de Administrador Geral.',
    });
  }

  next();
}

// Middleware de verificação estrita de papéis (RBAC verificado no servidor via tabela separada)
export function requireRole(allowedRoles: ('admin' | 'equipe' | 'coordenador' | 'voluntario')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const hasPermission =
      isUserAdmin(req.user.id) ||
      req.user.roles.some((r) => allowedRoles.includes(r as any));

    if (!hasPermission) {
      return res.status(403).json({
        error: `Acesso negado. Seu perfil não tem permissão para realizar esta ação. Perfis autorizados: ${allowedRoles.join(' ou ')}.`,
      });
    }

    next();
  };
}
