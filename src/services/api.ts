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

// A sessão fica num cookie HttpOnly definido pelo servidor: o JavaScript da página
// não lê nem guarda o token. No navegador fica só o perfil (nome, e-mail, papel),
// usado para desenhar a tela enquanto o servidor confirma a sessão em /auth/me.
const USER_STORAGE_KEY = 'ana_auth_user';

// Chave antiga onde o token ficava salvo (versões anteriores). Removida ao carregar.
const LEGACY_TOKEN_KEY = 'ana_jwt_token';

// Chaves antigas que guardavam dados pessoais (CPF, endereço, telefone) no navegador.
export const LEGACY_PII_KEYS = ['ana_trindade_beneficiarios', 'ana_trindade_voluntarios', 'ana_trindade_admins'];

localStorage.removeItem(LEGACY_TOKEN_KEY);

export function clearStoredSession() {
  localStorage.removeItem(LEGACY_TOKEN_KEY);
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

// Fetch para a API. O cookie de sessão vai junto automaticamente (mesmo domínio).
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Se a sessão expirou, podemos limpar credenciais locais
      if (endpoint === '/auth/me') {
        clearStoredSession();
      }
    }
    throw new Error(data.error || 'Ocorreu um erro ao processar a requisição no servidor.');
  }

  return data as T;
}

export interface BackupSalvo {
  nome: string;
  tamanho: number;
  criado_em: string;
}

export const api = {
  // === AUTENTICAÇÃO ===
  async login(email: string, password: string): Promise<{ user: AuthUser }> {
    const res = await request<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredUser(res.user);
    return res;
  },

  async getMe(): Promise<AuthUser | null> {
    // Sem perfil salvo, ninguém entrou neste navegador: evita uma chamada inútil
    // a cada visita ao site público.
    if (!getStoredUser()) return null;
    try {
      const res = await request<{ user: AuthUser }>('/auth/me');
      setStoredUser(res.user);
      return res.user;
    } catch {
      clearStoredSession();
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      clearStoredSession();
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

  async createVolunteer(data: Partial<Volunteer> & { consentimento_lgpd: boolean; hp_security_check?: string }): Promise<{ message: string; id: string }> {
    return request('/volunteers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateVolunteer(id: string, data: Partial<Volunteer>): Promise<{ message: string }> {
    return request(`/volunteers/${id}`, {
      method: 'PATCH',
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

  /** Envia uma foto (já reduzida) e devolve o endereço dela no site. */
  async uploadFoto(foto: Blob): Promise<{ url: string }> {
    const response = await fetch('/api/uploads', {
      method: 'POST',
      headers: { 'Content-Type': foto.type },
      body: foto,
      credentials: 'same-origin',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível enviar a foto.');
    return data as { url: string };
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

  // === BACKUPS AUTOMÁTICOS (só administrador) ===
  async getBackups(): Promise<BackupSalvo[]> {
    return request<BackupSalvo[]>('/backups');
  },

  async criarBackup(): Promise<{ nome: string; tamanho: number }> {
    return request('/backups', { method: 'POST' });
  },

  /** Substitui os dados atuais pelos do arquivo (o servidor guarda antes uma cópia do estado atual). */
  async restaurarBackup(arquivo: unknown): Promise<{ copia_de_seguranca: string; restaurados: Record<string, number> }> {
    return request('/backups/restaurar', { method: 'POST', body: JSON.stringify(arquivo) });
  },

  /** Endereço para baixar um backup (o cookie de sessão vai junto no download). */
  urlDoBackup(nome: string): string {
    return `/api/backups/${encodeURIComponent(nome)}`;
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
