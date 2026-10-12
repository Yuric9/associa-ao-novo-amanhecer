import { readFileSync } from 'node:fs';
import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig, type Plugin } from 'vitest/config';
import { TEST_ADMIN_PASSWORD, TEST_JWT_SECRET } from './test/worker/constants.ts';

// O Worker importa os arquivos .sql de migrations/ como texto (regra "Text" do wrangler.jsonc).
// Nos testes quem resolve os imports é o Vite, então fazemos a mesma coisa aqui.
const sqlAsText: Plugin = {
  name: 'sql-as-text',
  load(id) {
    if (id.endsWith('.sql')) {
      return `export default ${JSON.stringify(readFileSync(id, 'utf8'))};`;
    }
  },
};

export default defineConfig({
  test: {
    projects: [
      {
        // Funções puras do site (navegador): CPF, telefone, PIX...
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        // API rodando dentro do runtime da Cloudflare (workerd) com D1 local
        plugins: [
          sqlAsText,
          cloudflareTest({
            wrangler: { configPath: './wrangler.jsonc' },
            miniflare: {
              bindings: {
                JWT_SECRET: TEST_JWT_SECRET,
                ADMIN_INITIAL_PASSWORD: TEST_ADMIN_PASSWORD,
                SEED_DEMO_DATA: 'true',
                DEV_MODE: 'false',
              },
            },
          }),
        ],
        test: {
          name: 'worker',
          include: ['test/worker/**/*.test.ts'],
        },
      },
    ],
  },
});
