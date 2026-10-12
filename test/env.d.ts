// Tipos de `env` e `exports` (de "cloudflare:workers") dentro dos testes do Worker.
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
  }
  interface GlobalProps {
    mainModule: typeof import('../worker/index');
  }
}
