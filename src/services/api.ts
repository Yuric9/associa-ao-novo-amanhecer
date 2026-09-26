import {
  Beneficiary,
  ProjectCard,
  GalleryPhoto,
  SiteContent,
  Volunteer,
  AuthUser,
  UserRole,
  Donation,
  SystemStats,
} from '../types';

const TOKEN_STORAGE_KEY = 'ana_jwt_token';
const USER_STORAGE_KEY = 'ana_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

// Chaves antigas que guardavam dados pessoais (CPF, endereço, telefone) no navegador.
export const LEGACY_PII_KEYS = ['ana_trindade_beneficiarios', 'ana_trindade_voluntarios', 'ana_trindade_admins'];

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  LEGACY_PII_KEYS.forEach((k) => localStorage.removeItem(k));
}

export function getStoredUser(): AuthUser | null {
  const data = localStorage.getItem(USER_STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

// Fetch com headers e injeção automática de token JWT
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Se a sessão expirou, podemos limpar credenciais locais
      if (endpoint === '/auth/me') {
        clearStoredToken();
      }
    }
    throw new Error(data.error || 'Ocorreu um erro ao processar a requisição no servidor.');
  }

  return data as T;
}

export const api = {
  // === AUTENTICAÇÃO ===
  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const res = await request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async getMe(): Promise<AuthUser | null> {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const res = await request<{ user: AuthUser }>('/auth/me');
      setStoredUser(res.user);
      return res.user;
    } catch {
      clearStoredToken();
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      clearStoredToken();
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return request('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  // === USUÁRIOS ADMIN / COORDENAÇÃO (RBAC) ===
  async getUsers(): Promise<any[]> {
    return request('/auth/users');
  },

  async createUser(data: { nome: string; email: string; password: string; role: UserRole }): Promise<any> {
    return request('/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return request(`/auth/users/${id}`, {
      method: 'DELETE',
    });
  },

  // === BENEFICIÁRIOS (LGPD, FILTROS, CRUD) ===
  async getBeneficiaries(): Promise<Beneficiary[]> {
    return request<Beneficiary[]>('/beneficiaries');
  },

  async createBeneficiary(data: Partial<Beneficiary> & { consentimento_lgpd: boolean; hp_security_check?: string }): Promise<{ message: string; id: string }> {
    return request('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBeneficiary(id: string, data: Partial<Beneficiary>): Promise<{ message: string }> {
    return request(`/beneficiaries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteBeneficiary(id: string): Promise<{ message: string }> {
    return request(`/beneficiaries/${id}`, {
      method: 'DELETE',
    });
  },

  // === VOLUNTÁRIOS ===
  async getVolunteers(): Promise<Volunteer[]> {
    return request<Volunteer[]>('/volunteers');
  },

  async createVolunteer(data: Partial<Volunteer> & { consentimento_lgpd: boolean; hp_security_check?: string }): Promise<{ message: string }> {
    return request('/volunteers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // === PROJETOS SOCIAIS ===
  async getProjects(): Promise<ProjectCard[]> {
    return request<ProjectCard[]>('/projects');
  },

  async updateProjects(projects: ProjectCard[]): Promise<{ message: string }> {
    return request('/projects', {
      method: 'PUT',
      body: JSON.stringify(projects),
    });
  },

  // === GALERIA DE FOTOS ===
  async getGallery(): Promise<GalleryPhoto[]> {
    return request<GalleryPhoto[]>('/gallery');
  },

  async updateGallery(photos: GalleryPhoto[]): Promise<{ message: string }> {
    return request('/gallery', {
      method: 'PUT',
      body: JSON.stringify(photos),
    });
  },

  // === CMS CONTEÚDO DO SITE ===
  async getSiteContent(): Promise<SiteContent> {
    return request<SiteContent>('/content');
  },

  async updateSiteContent(content: SiteContent): Promise<{ message: string }> {
    return request('/content', {
      method: 'PUT',
      body: JSON.stringify(content),
    });
  },

  // === AUDITORIA E MÉTRICAS ===
  async getAuditLogs(): Promise<any[]> {
    return request('/audit-logs');
  },

  async getStats(): Promise<SystemStats> {
    return request<SystemStats>('/stats');
  },

  // === DOAÇÕES (PIX, INTENÇÃO E GESTÃO) ===
  async getDonations(): Promise<Donation[]> {
    return request<Donation[]>('/donations');
  },

  async createDonation(data: Partial<Donation> & { hp_security_check?: string }): Promise<{ message: string; id: string; valor: number }> {
    return request('/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDonation(id: string, data: Partial<Donation>): Promise<{ message: string }> {
    return request(`/donations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteDonation(id: string): Promise<{ message: string }> {
    return request(`/donations/${id}`, {
      method: 'DELETE',
    });
  },

  // === NOTIFICAÇÕES & E-MAIL DA COORDENAÇÃO ===
  async getCoordinationEmail(): Promise<{ email: string; isCustomized: boolean }> {
    return request('/coordination-email');
  },

  async updateCoordinationEmail(email: string): Promise<{ message: string; email: string }> {
    return request('/coordination-email', {
      method: 'PUT',
      body: JSON.stringify({ email }),
    });
  },

  async getEmailLogs(): Promise<any[]> {
    return request('/emails/logs');
  },

  // === SINCRONIZAÇÃO E MIGRAÇÃO DE DADOS LOCAIS ===
  async migrateFromLocalStorage(data: {
    beneficiaries?: any[];
    volunteers?: any[];
  }): Promise<{ message: string; migratedBeneficiaries: number; migratedVolunteers: number }> {
    return request('/sync/migrate-from-local', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
