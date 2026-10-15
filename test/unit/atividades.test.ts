import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ATIVIDADES, infoDaAtividade } from '../../src/utils/atividades';

/** Todas as ações que o Worker grava na auditoria: logAudit({ action: 'X' }) */
function acoesDoWorker(pasta = 'worker'): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(pasta, item.name);
    if (item.isDirectory()) return acoesDoWorker(caminho);
    if (!item.name.endsWith('.ts')) return [];
    return [...readFileSync(caminho, 'utf8').matchAll(/action:\s*'([A-Z_]+)'/g)].map((m) => m[1]);
  });
}

describe('registro de atividades', () => {
  it('toda ação gravada pelo Worker tem tradução para a tela', () => {
    const acoes = [...new Set(acoesDoWorker())];
    expect(acoes.length).toBeGreaterThan(10); // a busca encontrou as ações de verdade
    expect(acoes.filter((a) => !(a in ATIVIDADES))).toEqual([]);
  });

  it('ação desconhecida aparece com o código, sem quebrar a tela', () => {
    expect(infoDaAtividade('ALGO_NOVO')).toEqual({ rotulo: 'ALGO_NOVO', grupo: 'sistema' });
    expect(infoDaAtividade('LOGIN_FAILED')).toMatchObject({ rotulo: 'Tentativa de login recusada', alerta: true });
  });
});
