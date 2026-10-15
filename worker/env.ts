// Variáveis e bindings do Worker (definidos no wrangler.jsonc e em "Secrets" no painel da Cloudflare).
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Fotos enviadas pelo painel (Cloudflare R2) */
  FOTOS: R2Bucket;

  // Secrets (painel da Cloudflare → Worker → Settings → Variables and Secrets)
  JWT_SECRET?: string;
  ADMIN_INITIAL_PASSWORD?: string;
  RESEND_API_KEY?: string;

  // Variáveis comuns
  ADMIN_EMAIL?: string;
  EMAIL_FROM?: string;
  COORDINATION_EMAIL?: string;
  SEED_DEMO_DATA?: string;
  DEV_MODE?: string;
}

let currentEnv: Env | null = null;

export function setEnv(env: Env) {
  currentEnv = env;
}

/** Lê uma variável de ambiente como texto (vazio se não definida). */
export function cfg(name: Exclude<keyof Env, 'DB' | 'ASSETS' | 'FOTOS'>): string {
  const value = currentEnv?.[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function isDevMode(): boolean {
  return cfg('DEV_MODE') === 'true';
}

/** Armazenamento das fotos (binding "FOTOS" do wrangler.jsonc). */
export function fotosBucket(): R2Bucket {
  if (!currentEnv?.FOTOS) throw new Error('Armazenamento de fotos não conectado (binding "FOTOS" ausente no wrangler.jsonc).');
  return currentEnv.FOTOS;
}
