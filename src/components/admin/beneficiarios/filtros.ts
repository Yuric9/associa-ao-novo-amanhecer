// Regras de busca, filtro e contagem da tela de beneficiários.
// Funções puras (sem React): recebem dados e devolvem resultado, por isso têm testes em test/unit/.
import type { Beneficiary, BeneficiaryStatus, ProjectCard } from '../../../types';
import { cleanDigits } from '../../../utils/validation';

export type TipoBusca = 'todos' | 'nome' | 'cpf';

export interface Filtros {
  busca: string;
  tipoBusca: TipoBusca;
  /** 'todos' ou um BeneficiaryStatus */
  status: string;
  /** 'todos', um dos atalhos (futebol, ballet, book, festas) ou o título de um projeto */
  projeto: string;
}

export const FILTROS_VAZIOS: Filtros = { busca: '', tipoBusca: 'todos', status: 'todos', projeto: 'todos' };

/** Atalhos de projeto que aparecem como botões de filtro rápido. */
export const ATALHOS_PROJETO = ['futebol', 'ballet', 'book', 'festas'] as const;
export type AtalhoProjeto = (typeof ATALHOS_PROJETO)[number];

export const STATUS_BENEFICIARIO: BeneficiaryStatus[] = [
  'Pendente',
  'Em análise',
  'Aprovado',
  'Atendido/Entregue',
  'Recusado',
];

/** Minúsculas, sem acentos e sem espaços nas pontas (busca insensível a acentos). */
export const normalize = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** O projeto do beneficiário corresponde ao filtro? Aceita atalhos ('futebol') e nomes parciais. */
export function isProjectMatch(beneficiaryProject: string, filterVal: string): boolean {
  if (!filterVal || filterVal === 'todos') return true;
  if (beneficiaryProject === filterVal) return true;

  const bLower = normalize(beneficiaryProject);
  const fLower = normalize(filterVal);

  if (fLower === 'futebol' || fLower === 'apenas futebol') {
    return bLower.includes('futebol') || bLower.includes('futsal');
  }
  if (fLower === 'ballet' || fLower === 'apenas ballet') {
    // Só "ballet": outras danças (ex.: "Aulas de Dança") são projetos próprios
    return bLower.includes('ballet');
  }
  if (fLower === 'book' || fLower === 'apenas book' || fLower === 'gestante' || fLower === 'apenas book gestante') {
    return bLower.includes('book') || bLower.includes('gestante');
  }
  if (fLower === 'festas' || fLower === 'apenas festas' || fLower === 'datas comemorativas') {
    return bLower.includes('festa') || bLower.includes('data');
  }

  return bLower.includes(fLower);
}

/** Atalho correspondente a um projeto (para o clique no nome do projeto); senão, o próprio nome. */
export function filtroDoProjeto(projeto: string): string {
  return ATALHOS_PROJETO.find((atalho) => isProjectMatch(projeto, atalho)) ?? projeto;
}

/** Quantos beneficiários há em cada atalho de projeto (e no total). */
export function contarPorProjeto(beneficiaries: Beneficiary[]) {
  const counts = { todos: beneficiaries.length, futebol: 0, ballet: 0, book: 0, festas: 0 };
  beneficiaries.forEach((b) => {
    for (const atalho of ATALHOS_PROJETO) {
      if (isProjectMatch(b.projeto, atalho)) counts[atalho]++;
    }
  });
  return counts;
}

/** O CPF do beneficiário contém o texto buscado (com ou sem pontuação)? */
export function cpfCorresponde(cpf: string, busca: string): boolean {
  const trimmed = busca.trim();
  const buscaDigitos = cleanDigits(trimmed);
  return (buscaDigitos.length > 0 && cleanDigits(cpf).includes(buscaDigitos)) || cpf.includes(trimmed);
}

/** Aplica busca (nome, CPF ou telefone), status e projeto. */
export function filtrarBeneficiarios(beneficiaries: Beneficiary[], filtros: Filtros): Beneficiary[] {
  return beneficiaries.filter((b) => {
    const trimmed = filtros.busca.trim();
    let matchesSearch = true;

    if (trimmed) {
      const nameMatch = normalize(b.nome).includes(normalize(trimmed));
      const cpfMatch = cpfCorresponde(b.cpf, trimmed);

      if (filtros.tipoBusca === 'nome') {
        matchesSearch = nameMatch;
      } else if (filtros.tipoBusca === 'cpf') {
        matchesSearch = cpfMatch;
      } else {
        const digitos = cleanDigits(trimmed);
        const phoneMatch = digitos.length >= 3 && cleanDigits(b.telefone).includes(digitos);
        matchesSearch = nameMatch || cpfMatch || phoneMatch;
      }
    }

    const matchesStatus = filtros.status === 'todos' || b.status === filtros.status;
    const matchesProject = isProjectMatch(b.projeto, filtros.projeto);

    return matchesSearch && matchesStatus && matchesProject;
  });
}

export function temFiltrosAtivos(filtros: Filtros): boolean {
  return Boolean(filtros.busca.trim()) || filtros.status !== 'todos' || filtros.projeto !== 'todos';
}

/** Contagem por status da seleção atual e quanto ela representa do total. */
export function contarPorStatus(filtrados: Beneficiary[], totalGeral: number) {
  let aprovados = 0;
  let pendentes = 0;
  let emAnalise = 0;
  let atendidos = 0;
  let recusados = 0;

  filtrados.forEach((b) => {
    if (b.status === 'Aprovado') aprovados++;
    else if (b.status === 'Pendente') pendentes++;
    else if (b.status === 'Em análise') emAnalise++;
    else if (b.status === 'Atendido/Entregue') atendidos++;
    else if (b.status === 'Recusado') recusados++;
  });

  const percentOfTotal = totalGeral > 0 ? Math.round((filtrados.length / totalGeral) * 100) : 0;
  return { aprovados, pendentes, emAnalise, atendidos, recusados, percentOfTotal };
}

/** Nome do arquivo CSV conforme o projeto filtrado (undefined = nome padrão do exportador). */
export function nomeArquivoCsv(projeto: string, data: string): string | undefined {
  const p = projeto.toLowerCase();
  if (projeto === 'futebol' || p.includes('futebol')) return `inscritos_apenas_futebol_${data}.csv`;
  if (projeto === 'ballet' || p.includes('ballet')) return `inscritos_apenas_ballet_${data}.csv`;
  if (projeto === 'book' || p.includes('book') || p.includes('gestante')) {
    return `inscritos_apenas_book_gestante_${data}.csv`;
  }
  if (projeto === 'festas' || p.includes('festa')) return `inscritos_apenas_festas_${data}.csv`;
  if (projeto !== 'todos') return `inscritos_${projeto.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${data}.csv`;
  return undefined;
}

/** Data de hoje no formato AAAA-MM-DD. */
export const hoje = () => new Date().toISOString().split('T')[0];

/** Nomes de projeto usados nas inscrições antigas (antes dos projetos virem do banco). */
export const PROJETOS_LEGADOS = [
  'Escolinha de Futebol Comunitário',
  'Aulas de Ballet Solidário',
  'Projeto Book Solidário para Gestantes',
  'Festas em Datas Comemorativas',
];

/**
 * Opções do campo "Projeto" ao cadastrar ou editar um beneficiário no painel:
 * os 4 nomes antigos + todo projeto do banco que não seja um deles (ex.: "Aulas de Dança")
 * + o projeto atual da pessoa, se não estiver na lista (assim salvar nunca troca o projeto sem querer).
 */
export function opcoesDeProjeto(projects: ProjectCard[] = [], atual?: string): string[] {
  const novos = projects
    .map((p) => p.titulo)
    .filter((titulo) => !ATALHOS_PROJETO.some((atalho) => isProjectMatch(titulo, atalho)));
  const opcoes = [...PROJETOS_LEGADOS, ...novos];
  if (atual && !opcoes.includes(atual)) opcoes.push(atual);
  return [...new Set(opcoes)];
}
