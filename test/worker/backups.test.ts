import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { api, beneficiaryForm, login } from './helpers';

// Dispara o handler scheduled() do Worker como o agendador da Cloudflare faria.
// (Se o backup falhar, a chamada lança o erro e o teste falha.)
type ComAgendamento = { scheduled(opcoes: { scheduledTime: Date; cron: string }): Promise<unknown> };
const agendar = (data: string) =>
  (exports.default as unknown as ComAgendamento).scheduled({ scheduledTime: new Date(data), cron: '0 6 * * *' });

async function loginComo(papel: 'coordenador' | 'equipe') {
  const { cookie: admin } = await login();
  const email = `${papel}-${crypto.randomUUID()}@exemplo.com`;
  await api('/auth/users', {
    method: 'POST',
    cookie: admin,
    body: { nome: `Teste ${papel}`, email, password: 'senha-de-teste-1', role: papel },
  });
  return (await login(email, 'senha-de-teste-1')).cookie;
}

describe('backup automático (agendamento diário)', () => {
  it('o agendamento grava o backup do dia, que o administrador lista e baixa', async () => {
    await agendar('2026-03-10T06:00:00Z');

    const { cookie } = await login();
    const lista = await (await api('/backups', { cookie })).json<{ nome: string; tamanho: number }[]>();
    expect(lista.map((b) => b.nome)).toContain('backup-2026-03-10.json');

    const arquivo = await api('/backups/backup-2026-03-10.json', { cookie });
    expect(arquivo.status).toBe(200);
    expect(arquivo.headers.get('content-disposition')).toContain('backup-2026-03-10.json');
    const dados = await arquivo.json<Record<string, any>>();
    // Mesmo formato do backup manual (o botão "Restaurar" do painel aceita)
    expect(Array.isArray(dados.beneficiarios)).toBe(true);
    expect(dados.beneficiarios.length).toBeGreaterThan(0);
    expect(Array.isArray(dados.projetos)).toBe(true);
    expect(Array.isArray(dados.galeria)).toBe(true);
    expect(dados.conteudo_site).toBeTypeOf('object');
    expect(Array.isArray(dados.voluntarios)).toBe(true);
    expect(Array.isArray(dados.doacoes)).toBe(true);
    // Senhas nunca vão para o backup
    expect(dados.usuarios.length).toBeGreaterThan(0);
    expect(JSON.stringify(dados)).not.toContain('password_hash');
    for (const u of dados.usuarios) expect(u).not.toHaveProperty('password_hash');
  });

  it('guarda só os 30 backups mais recentes', async () => {
    // 32 dias seguidos a partir de 01/01/2025
    const UM_DIA = 24 * 60 * 60 * 1000;
    for (let i = 0; i < 32; i++) {
      await agendar(new Date(Date.UTC(2025, 0, 1, 6) + i * UM_DIA).toISOString());
    }
    const { cookie } = await login();
    const nomes = (await (await api('/backups', { cookie })).json<{ nome: string }[]>()).map((b) => b.nome);
    expect(nomes).toHaveLength(30);
    expect(nomes).not.toContain('backup-2025-01-01.json');
    expect(nomes[0] >= nomes[nomes.length - 1]).toBe(true); // mais recente primeiro
  });
});

describe('rotas de backup (/api/backups)', () => {
  it('o administrador gera um backup na hora', async () => {
    const { cookie } = await login();
    const res = await api('/backups', { method: 'POST', cookie });
    expect(res.status).toBe(201);
    const { nome } = await res.json<{ nome: string }>();
    expect(nome).toMatch(/^backup-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('exige login', async () => {
    expect((await api('/backups')).status).toBe(401);
    expect((await api('/backups/backup-2026-03-10.json')).status).toBe(401);
  });

  it.each(['coordenador', 'equipe'] as const)('%s não acessa os backups (só o administrador)', async (papel) => {
    const cookie = await loginComo(papel);
    expect((await api('/backups', { cookie })).status).toBe(403);
    expect((await api('/backups', { method: 'POST', cookie })).status).toBe(403);
    expect((await api('/backups/backup-2026-03-10.json', { cookie })).status).toBe(403);
  });

  it.each(['..%2Fsegredo.json', 'backup-2026-03-10.txt', 'qualquer.json'])('recusa nome inválido: %s', async (nome) => {
    const { cookie } = await login();
    expect((await api(`/backups/${nome}`, { cookie })).status).toBe(404);
  });

  it('a pasta de backups não vaza pela rota pública de fotos', async () => {
    expect((await api('/fotos/backups%2Fbackup-2026-03-10.json')).status).toBe(404);
    expect((await api('/fotos/backup-2026-03-10.json')).status).toBe(404);
  });
});

describe('restaurar backup (POST /api/backups/restaurar)', () => {
  const nomes = async (cookie: string) =>
    (await (await api('/beneficiaries', { cookie })).json<{ nome: string }[]>()).map((b) => b.nome);

  it('volta os dados ao estado do backup e guarda uma cópia do estado anterior', async () => {
    const { cookie } = await login();
    const { nome } = await (await api('/backups', { method: 'POST', cookie })).json<{ nome: string }>();
    const backup = await (await api(`/backups/${nome}`, { cookie })).json<Record<string, any>>();

    // Depois do backup, alguém cadastra uma pessoa e muda um texto do site
    const extra = beneficiaryForm({ nome: `Depois do Backup ${crypto.randomUUID().slice(0, 6)}` });
    expect((await api('/beneficiaries', { method: 'POST', body: extra })).status).toBeLessThan(300);
    expect(await nomes(cookie)).toContain(extra.nome);

    const res = await api('/backups/restaurar', { method: 'POST', cookie, body: backup });
    expect(res.status).toBe(200);
    const resultado = await res.json<{ copia_de_seguranca: string; restaurados: Record<string, number> }>();
    expect(resultado.copia_de_seguranca).toMatch(/-antes-da-restauracao\.json$/);
    expect(resultado.restaurados.beneficiarios).toBe(backup.beneficiarios.length);

    // A pessoa cadastrada depois do backup sumiu; as do backup continuam
    const depois = await nomes(cookie);
    expect(depois).not.toContain(extra.nome);
    expect(depois).toHaveLength(backup.beneficiarios.length);

    // ...mas está guardada na cópia de segurança feita antes de restaurar
    const copia = await (await api(`/backups/${resultado.copia_de_seguranca}`, { cookie })).json<Record<string, any>>();
    expect(copia.beneficiarios.map((b: { nome: string }) => b.nome)).toContain(extra.nome);
  });

  it('aceita o backup antigo baixado pelo painel (só beneficiários, projetos, galeria e textos)', async () => {
    const { cookie } = await login();
    const atual = await (await api(`/backups/${(await (await api('/backups', { method: 'POST', cookie })).json<{ nome: string }>()).nome}`, { cookie })).json<Record<string, any>>();
    const voluntariosAntes = (await (await api('/volunteers', { cookie })).json<unknown[]>()).length;
    const manual = { versao: '2.0.0', beneficiarios: atual.beneficiarios, projetos: atual.projetos, galeria: atual.galeria, conteudo_site: atual.conteudo_site };
    expect((await api('/backups/restaurar', { method: 'POST', cookie, body: manual })).status).toBe(200);
    // Voluntários não estavam no arquivo: continuam como estavam
    expect((await (await api('/volunteers', { cookie })).json<unknown[]>()).length).toBe(voluntariosAntes);
  });

  it.each([
    ['arquivo vazio', {}],
    ['sem projetos', { beneficiarios: [] }],
    ['registros malformados', { beneficiarios: ['texto solto'], projetos: [] }],
  ])('recusa %s sem alterar nada', async (_caso, corpo) => {
    const { cookie } = await login();
    const antes = await nomes(cookie);
    expect((await api('/backups/restaurar', { method: 'POST', cookie, body: corpo })).status).toBe(400);
    expect(await nomes(cookie)).toEqual(antes);
  });

  it('arquivo incompatível com o banco: recusa e não altera nada (transação)', async () => {
    const { cookie } = await login();
    const antes = await nomes(cookie);
    // Beneficiário sem os campos obrigatórios (nome, cpf...) faz o INSERT falhar
    const corpo = { beneficiarios: [{ id: 'quebrado' }], projetos: [] };
    expect((await api('/backups/restaurar', { method: 'POST', cookie, body: corpo })).status).toBe(400);
    expect(await nomes(cookie)).toEqual(antes);
    expect((await (await api('/projects')).json<unknown[]>()).length).toBeGreaterThan(0);
  });

  it.each(['coordenador', 'equipe'] as const)('%s não pode restaurar', async (papel) => {
    const cookie = await loginComo(papel);
    expect((await api('/backups/restaurar', { method: 'POST', cookie, body: { beneficiarios: [], projetos: [] } })).status).toBe(403);
  });
});

describe('registro de atividades do backup', () => {
  it('o backup feito pelo painel fica registrado com quem pediu; o agendado, sem usuário', async () => {
    const { cookie } = await login();
    await api('/backups', { method: 'POST', cookie });
    await agendar('2026-04-01T06:00:00Z');
    const logs = await (await api('/audit-logs', { cookie })).json<{ action: string; user_email: string | null; details: string }[]>();
    const backups = logs.filter((l) => l.action === 'BACKUP_CREATED');
    expect(backups.find((l) => l.details.includes('(manual)'))?.user_email).toBe('coordenacao@novoamanhecer.org.br');
    expect(backups.find((l) => l.details.includes('(agendado)'))?.user_email).toBeNull();
  });
});
