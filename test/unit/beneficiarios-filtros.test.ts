import { describe, expect, it } from 'vitest';
import type { Beneficiary } from '../../src/types';
import {
  FILTROS_VAZIOS,
  contarPorProjeto,
  contarPorStatus,
  filtrarBeneficiarios,
  filtroDoProjeto,
  isProjectMatch,
  mensagemMudancaStatus,
  nomeArquivoCsv,
  normalize,
  temFiltrosAtivos,
  type Filtros,
} from '../../src/components/admin/beneficiarios/filtros';

function ben(over: Partial<Beneficiary>): Beneficiary {
  return {
    id: over.id ?? crypto.randomUUID(),
    nome: 'Fulano',
    cpf: '000.000.000-00',
    nascimento: '2015-01-01',
    telefone: '(62) 90000-0000',
    email: '',
    endereco: 'Trindade - GO',
    projeto: 'Escolinha de Futebol Comunitário',
    status: 'Pendente',
    observacoes: '',
    criado_em: '2026-01-01',
    atualizado_em: '2026-01-01',
    ...over,
  } as Beneficiary;
}

const BASE = [
  ben({ id: '1', nome: 'Ana Clara Peixoto', cpf: '012.345.678-90', telefone: '(62) 99124-5533', projeto: 'Aulas de Ballet Solidário', status: 'Aprovado' }),
  ben({ id: '2', nome: 'João Pedro', cpf: '529.982.247-25', telefone: '(62) 98888-1111', projeto: 'Escolinha de Futebol Comunitário', status: 'Pendente' }),
  ben({ id: '3', nome: 'Mariana Gestante', cpf: '111.444.777-35', projeto: 'Projeto Book Solidário para Gestantes', status: 'Em análise' }),
  ben({ id: '4', nome: 'Família Souza', projeto: 'Festas em Datas Comemorativas', status: 'Atendido/Entregue' }),
  ben({ id: '5', nome: 'Luana Dança', projeto: 'Oficina de Dança Livre', status: 'Recusado' }),
];

const filtrar = (f: Partial<Filtros>) => filtrarBeneficiarios(BASE, { ...FILTROS_VAZIOS, ...f }).map((b) => b.id);

describe('normalize e isProjectMatch', () => {
  it('ignora acentos, maiúsculas e espaços nas pontas', () => {
    expect(normalize('  JOÃO Dança ')).toBe('joao danca');
  });

  it.each([
    ['Escolinha de Futebol Comunitário', 'futebol', true],
    ['Futsal de Sábado', 'futebol', true],
    ['Aulas de Ballet Solidário', 'ballet', true],
    ['Oficina de Dança Livre', 'ballet', true], // "dança" conta como ballet
    ['Projeto Book Solidário para Gestantes', 'book', true],
    ['Festas em Datas Comemorativas', 'festas', true],
    ['Aulas de Ballet Solidário', 'futebol', false],
    ['Qualquer projeto', 'todos', true],
    ['Aulas de Ballet Solidário', 'Aulas de Ballet Solidário', true],
    ['Aulas de Ballet Solidário', 'ballet solid', true], // trecho do nome
  ])('isProjectMatch(%s, %s) = %s', (projeto, filtro, esperado) => {
    expect(isProjectMatch(projeto, filtro)).toBe(esperado);
  });

  it('filtroDoProjeto troca o nome pelo atalho quando existe um', () => {
    expect(filtroDoProjeto('Escolinha de Futebol Comunitário')).toBe('futebol');
    expect(filtroDoProjeto('Projeto Book Solidário para Gestantes')).toBe('book');
    expect(filtroDoProjeto('Horta Comunitária')).toBe('Horta Comunitária');
  });
});

describe('filtrarBeneficiarios', () => {
  it('sem filtros devolve todos', () => {
    expect(filtrar({})).toEqual(['1', '2', '3', '4', '5']);
  });

  it('busca por nome sem acento e sem diferenciar maiúsculas', () => {
    expect(filtrar({ busca: 'JOAO' })).toEqual(['2']);
    expect(filtrar({ busca: 'ana', tipoBusca: 'nome' })).toEqual(['1', '3', '5']); // Ana, Mariana e Luana
  });

  it('busca por CPF com ou sem pontuação', () => {
    expect(filtrar({ busca: '52998224725', tipoBusca: 'cpf' })).toEqual(['2']);
    expect(filtrar({ busca: '529.982', tipoBusca: 'cpf' })).toEqual(['2']);
  });

  it('no modo "Nome ou CPF" também encontra pelo telefone (3+ dígitos)', () => {
    expect(filtrar({ busca: '99124' })).toEqual(['1']);
    expect(filtrar({ busca: '99124', tipoBusca: 'nome' })).toEqual([]);
  });

  it('modo "Apenas Nome" não encontra por CPF', () => {
    expect(filtrar({ busca: '529', tipoBusca: 'nome' })).toEqual([]);
  });

  it('combina status e projeto', () => {
    expect(filtrar({ projeto: 'ballet' })).toEqual(['1', '5']);
    expect(filtrar({ projeto: 'ballet', status: 'Aprovado' })).toEqual(['1']);
    expect(filtrar({ status: 'Pendente', busca: 'ana' })).toEqual([]);
  });

  it('temFiltrosAtivos ignora busca só com espaços', () => {
    expect(temFiltrosAtivos(FILTROS_VAZIOS)).toBe(false);
    expect(temFiltrosAtivos({ ...FILTROS_VAZIOS, busca: '   ' })).toBe(false);
    expect(temFiltrosAtivos({ ...FILTROS_VAZIOS, status: 'Aprovado' })).toBe(true);
  });
});

describe('contagens', () => {
  it('conta por projeto (um beneficiário de "Dança" entra em ballet)', () => {
    expect(contarPorProjeto(BASE)).toEqual({ todos: 5, futebol: 1, ballet: 2, book: 1, festas: 1 });
  });

  it('conta por status e calcula a porcentagem do total', () => {
    expect(contarPorStatus(BASE, 5)).toEqual({
      aprovados: 1,
      pendentes: 1,
      emAnalise: 1,
      atendidos: 1,
      recusados: 1,
      percentOfTotal: 100,
    });
    expect(contarPorStatus(BASE.slice(0, 1), 3).percentOfTotal).toBe(33);
    expect(contarPorStatus([], 0).percentOfTotal).toBe(0);
  });
});

describe('nomeArquivoCsv', () => {
  it.each([
    ['todos', undefined],
    ['futebol', 'inscritos_apenas_futebol_2026-10-13.csv'],
    ['Aulas de Ballet Solidário', 'inscritos_apenas_ballet_2026-10-13.csv'],
    ['book', 'inscritos_apenas_book_gestante_2026-10-13.csv'],
    ['festas', 'inscritos_apenas_festas_2026-10-13.csv'],
    ['Horta Comunitária', 'inscritos_horta_comunit_ria_2026-10-13.csv'],
  ])('projeto "%s" → %s', (projeto, esperado) => {
    expect(nomeArquivoCsv(projeto, '2026-10-13')).toBe(esperado);
  });
});

describe('mensagemMudancaStatus', () => {
  it('parabeniza quando aprova e agradece quando atende', () => {
    expect(mensagemMudancaStatus('Ana', 'Ballet', 'Aprovado')).toMatch(/APROVADO\. Parabéns!/);
    expect(mensagemMudancaStatus('Ana', 'Ballet', 'Atendido/Entregue')).toMatch(/alegria/);
    expect(mensagemMudancaStatus('Ana', 'Ballet', 'Pendente')).toMatch(/PENDENTE\.$/);
  });
});
