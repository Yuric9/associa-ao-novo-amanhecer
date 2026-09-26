import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, isUserAdmin, getUserRoles } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'ana_trindade_jwt_secret_key_2026_super_secure_hash';

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
    const primaryRole = isUserAdmin(user.id)
      ? 'admin'
      : (roles[0] as 'admin' | 'equipe' | 'coordenador' | 'voluntario') || 'equipe';

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
      req.user.roles.some((r) => allowedRoles.includes(r as any)) ||
      allowedRoles.includes(req.user.role);

    if (!hasPermission) {
      return res.status(403).json({
        error: `Acesso negado. Seu perfil não tem permissão para realizar esta ação. Perfis autorizados: ${allowedRoles.join(' ou ')}.`,
      });
    }

    next();
  };
}
