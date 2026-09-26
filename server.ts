import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './server/db.js';
import { apiRouter } from './server/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Inicializar banco de dados SQLite persistente
  initDatabase();

  // Middlewares essenciais
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Rotas da API REST protegidas por RBAC
  app.use('/api', apiRouter);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Modo Desenvolvimento: Conectar middlewares do Vite ao Express
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Modo Produção: Servir arquivos estáticos do build
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor Full-Stack Associação Novo Amanhecer rodando na porta ${PORT}`);
    console.log(`🔐 Segurança, RBAC e Banco SQLite Inicializados com Sucesso.`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar servidor full-stack:', err);
  process.exit(1);
});
