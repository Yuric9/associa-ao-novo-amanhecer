// Backup automático do banco D1, guardado no R2 (mesmo bucket das fotos, pasta "backups/").
// Roda todo dia pelo agendamento ("triggers.crons" no wrangler.jsonc) e também sob demanda pelo painel.
//
// O arquivo usa o MESMO formato do "Baixar backup (JSON)" do painel, então pode ser restaurado
// pelo botão "Restaurar de Arquivo" da aba Backup. Voluntários, doações e usuários vão junto
// para uma recuperação completa (feita por quem cuida do sistema).
//
// Pasta "backups/" não é acessível pela rota pública de fotos: ela só entrega nomes no formato
// <uuid>.jpg|png|webp.
import { db, logAudit } from './db';
import { fotosBucket } from './env';

export const PASTA = 'backups/';
/** Quantos backups diários ficam guardados (os mais antigos são apagados). */
export const MANTER = 30;

const NOME_VALIDO = /^backup-\d{4}-\d{2}-\d{2}(-antes-da-restauracao)?\.json$/;

type Origem = 'agendado' | 'manual' | 'antes-da-restauracao';

export function nomeDoBackup(data: Date, origem: Origem = 'agendado'): string {
  const sufixo = origem === 'antes-da-restauracao' ? '-antes-da-restauracao' : '';
  return `backup-${data.toISOString().slice(0, 10)}${sufixo}.json`;
}

export function nomeValido(nome: string): boolean {
  return NOME_VALIDO.test(nome);
}

export async function montarBackup(agora: Date) {
  const tudo = (sql: string) => db.prepare(sql).all();
  const [beneficiarios, projetos, galeria, conteudo, voluntarios, doacoes, usuarios] = await Promise.all([
    tudo('SELECT * FROM beneficiaries ORDER BY criado_em'),
    tudo('SELECT * FROM projects ORDER BY ordem'),
    tudo('SELECT * FROM gallery ORDER BY ordem'),
    db.prepare("SELECT content_json FROM site_content WHERE id = 'main'").get<{ content_json: string }>(),
    tudo('SELECT * FROM volunteers ORDER BY criado_em'),
    tudo('SELECT * FROM donations ORDER BY criado_em'),
    // Sem o hash da senha: depois de uma restauração, cada pessoa redefine a própria senha.
    tudo(`SELECT u.id, u.nome, u.email, u.ativo, u.criado_em, GROUP_CONCAT(r.role_id) AS papeis
          FROM users u LEFT JOIN user_roles r ON r.user_id = u.id GROUP BY u.id ORDER BY u.criado_em`),
  ]);

  return {
    versao: '2.0.0',
    data_backup: agora.toISOString(),
    associacao: 'Associação Novo Amanhecer - Trindade/GO',
    origem: 'automatico',
    beneficiarios,
    projetos,
    galeria,
    conteudo_site: conteudo ? JSON.parse(conteudo.content_json) : null,
    voluntarios,
    doacoes,
    usuarios,
  };
}

/** Grava o backup do dia (substitui o do mesmo dia, se houver) e apaga os antigos. */
export async function fazerBackup(agora = new Date(), origem: Origem = 'agendado') {
  const bucket = fotosBucket();
  const dados = await montarBackup(agora);
  const nome = nomeDoBackup(agora, origem);
  const corpo = JSON.stringify(dados);
  await bucket.put(PASTA + nome, corpo, { httpMetadata: { contentType: 'application/json; charset=utf-8' } });

  const apagados = await apagarAntigos(bucket);

  await logAudit({
    action: 'BACKUP_CREATED',
    entity: 'BACKUP',
    entityId: nome,
    details: `Backup (${origem}) gerado: ${dados.beneficiarios.length} beneficiários, ${dados.voluntarios.length} voluntários, ${dados.doacoes.length} doações (${Math.round(corpo.length / 1024)} KB).${apagados ? ` ${apagados} backup(s) antigo(s) apagado(s).` : ''}`,
  });

  return { nome, tamanho: corpo.length };
}

export async function listarBackups(bucket = fotosBucket()) {
  const lista = await bucket.list({ prefix: PASTA, limit: 1000 });
  return lista.objects
    .map((o) => ({ nome: o.key.slice(PASTA.length), tamanho: o.size, criado_em: o.uploaded.toISOString() }))
    .filter((b) => nomeValido(b.nome))
    // mais recente primeiro (pela hora em que foi gravado; empate: pelo nome)
    .sort((a, b) => b.criado_em.localeCompare(a.criado_em) || b.nome.localeCompare(a.nome));
}

async function apagarAntigos(bucket: R2Bucket): Promise<number> {
  const antigos = (await listarBackups(bucket)).slice(MANTER);
  if (antigos.length) await bucket.delete(antigos.map((b) => PASTA + b.nome));
  return antigos.length;
}

// =========================================================================
// RESTAURAÇÃO
// =========================================================================

/** Chave no arquivo de backup → tabela do banco. Usuários não são restaurados (as contas atuais continuam). */
const RESTAURAVEIS = {
  beneficiarios: 'beneficiaries',
  projetos: 'projects',
  galeria: 'gallery',
  voluntarios: 'volunteers',
  doacoes: 'donations',
} as const;

export class BackupInvalido extends Error {}

/**
 * Substitui os dados atuais pelos do arquivo de backup.
 * - Antes, guarda uma cópia do estado atual ("backup-AAAA-MM-DD-antes-da-restauracao.json").
 * - Tudo numa transação só (db.batch): se algo falhar, nada muda.
 * - Cada tabela vira 2 comandos (apagar + inserir tudo via json_each), então o número de
 *   consultas não cresce com a quantidade de registros (o plano gratuito limita consultas por requisição).
 * - Aceita também os backups antigos baixados pelo painel (sem voluntários/doações: essas tabelas ficam como estão).
 */
export async function restaurarBackup(dados: any, agora = new Date()) {
  if (!dados || typeof dados !== 'object' || !Array.isArray(dados.beneficiarios) || !Array.isArray(dados.projetos)) {
    throw new BackupInvalido('Arquivo de backup inválido: faltam os beneficiários ou os projetos.');
  }

  const copia = await fazerBackup(agora, 'antes-da-restauracao');

  const comandos: D1PreparedStatement[] = [];
  const restaurados: Record<string, number> = {};
  for (const [chave, tabela] of Object.entries(RESTAURAVEIS)) {
    const linhas = dados[chave];
    if (!Array.isArray(linhas)) continue;
    if (linhas.some((l) => !l || typeof l !== 'object' || Array.isArray(l))) {
      throw new BackupInvalido(`Arquivo de backup inválido: registros malformados em "${chave}".`);
    }
    // Só as colunas que existem na tabela E aparecem no arquivo (nomes vêm do próprio banco, não do arquivo)
    const colunas = (await db.prepare(`PRAGMA table_info(${tabela})`).all<{ name: string }>()).map((c) => c.name);
    const usadas = colunas.filter((c) => linhas.some((l) => c in l));

    comandos.push(db.prepare(`DELETE FROM ${tabela}`).bind());
    if (linhas.length && usadas.length) {
      const valores = usadas.map((c) => `json_extract(value, '$.${c}')`).join(', ');
      comandos.push(
        db.prepare(`INSERT INTO ${tabela} (${usadas.join(', ')}) SELECT ${valores} FROM json_each(?)`).bind(JSON.stringify(linhas))
      );
    }
    restaurados[chave] = linhas.length;
  }

  if (dados.conteudo_site && typeof dados.conteudo_site === 'object') {
    comandos.push(
      db.prepare(`
        INSERT INTO site_content (id, content_json, atualizado_em) VALUES ('main', ?, ?)
        ON CONFLICT(id) DO UPDATE SET content_json = excluded.content_json, atualizado_em = excluded.atualizado_em
      `).bind(JSON.stringify(dados.conteudo_site), agora.toISOString())
    );
  }

  try {
    await db.batch(comandos);
  } catch (err) {
    console.error('[BACKUP] Falha ao restaurar:', err);
    throw new BackupInvalido('O arquivo não é compatível com o banco atual. Nada foi alterado.');
  }

  return { copia_de_seguranca: copia.nome, restaurados };
}
