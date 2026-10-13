// Regras da tela de voluntários: cores, agrupamento do gráfico, busca, WhatsApp e CSV.
// Funções puras (sem React), testadas em test/unit/voluntarios-dados.test.ts.
import type { Volunteer, VolunteerArea, VolunteerAvailability } from '../../../types';

export type ModoGrafico = 'area' | 'disponibilidade';

// Cores temáticas para as Áreas de Atuação dos voluntários
export const AREA_COLORS: Record<string, string> = {
  'Oficina de Ballet': '#ec4899', // Rosa
  'Treinos de Futebol': '#059669', // Verde Esmeralda
  'Fotografia & Produção (Book)': '#8b5cf6', // Violeta
  'Cozinha Comunitária & Alimentação': '#f97316', // Laranja quente
  'Apoio Pedagógico & Escolar': '#3b82f6', // Azul real
  'Logística, Triagem & Eventos': '#eab308', // Amarelo Ouro
  'Saúde Comunitária (Acolhimento)': '#06b6d4', // Ciano
};

// Cores temáticas para a Disponibilidade da equipe
export const AVAILABILITY_COLORS: Record<string, string> = {
  'Sábados (Manhã)': '#d97706', // Âmbar
  'Finais de Semana (Geral)': '#10b981', // Verde
  'Dias de Semana (Tarde)': '#6366f1', // Índigo
  'Dias de Semana (Manhã)': '#0284c7', // Azul Céu
  'Eventos & Datas Comemorativas': '#f43f5e', // Rosa forte
  'Escala Flexível': '#8b5cf6', // Roxo
};

export const FALLBACK_COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#0284c7', '#14b8a6'];

/** Opções dos selects do formulário, na ordem em que aparecem. */
export const AREAS = Object.keys(AREA_COLORS) as VolunteerArea[];
export const DISPONIBILIDADES = Object.keys(AVAILABILITY_COLORS) as VolunteerAvailability[];

export interface FatiaGrafico {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

/** Agrupa os voluntários por área ou disponibilidade, do maior grupo para o menor. */
export function agruparVoluntarios(volunteers: Volunteer[], modo: ModoGrafico): FatiaGrafico[] {
  const campo = modo === 'area' ? 'area' : 'disponibilidade';
  const cores = modo === 'area' ? AREA_COLORS : AVAILABILITY_COLORS;

  const counts: Record<string, number> = {};
  volunteers.forEach((v) => {
    counts[v[campo]] = (counts[v[campo]] || 0) + 1;
  });

  const total = volunteers.length;
  return Object.entries(counts)
    .map(([name, value], index) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      color: cores[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}

/** Busca (nome, telefone, área, horário ou habilidade) + filtro clicado no gráfico. */
export function filtrarVoluntarios(
  volunteers: Volunteer[],
  busca: string,
  filtroGrafico: string | null,
  modo: ModoGrafico
): Volunteer[] {
  const termo = busca.toLowerCase();
  return volunteers.filter((v) => {
    const matchesSearch =
      v.nome.toLowerCase().includes(termo) ||
      v.telefone.includes(busca) ||
      v.area.toLowerCase().includes(termo) ||
      v.disponibilidade.toLowerCase().includes(termo) ||
      (v.habilidades && v.habilidades.toLowerCase().includes(termo));

    if (!matchesSearch) return false;
    if (filtroGrafico) {
      return modo === 'area' ? v.area === filtroGrafico : v.disponibilidade === filtroGrafico;
    }
    return true;
  });
}

/** Link do WhatsApp com mensagem pronta para o voluntário. */
export function linkWhatsapp(vol: Pick<Volunteer, 'nome' | 'telefone' | 'area'>): string {
  const cleanPhone = vol.telefone.replace(/\D/g, '');
  return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
    `Olá ${vol.nome}! Aqui é da coordenação da Associação Novo Amanhecer (Trindade). Gostaria de falar sobre a nossa escala do ${vol.area}.`
  )}`;
}

/** Linhas da planilha "escala de voluntários" (uma por voluntário). */
export function linhasCsvVoluntarios(volunteers: Volunteer[]) {
  return volunteers.map((v) => ({
    Nome: v.nome,
    'Telefone / WhatsApp': v.telefone,
    'E-mail': v.email,
    'Área de Atuação': v.area,
    Disponibilidade: v.disponibilidade,
    Situação: v.ativo ? 'Ativo' : 'Inativo / Pausado',
    'Início do Voluntariado': v.data_inicio,
    Habilidades: v.habilidades || '',
    Observações: v.observacoes || '',
  }));
}

/** Campos do formulário de cadastro/edição. */
export interface FormVoluntario {
  nome: string;
  telefone: string;
  email: string;
  area: VolunteerArea;
  disponibilidade: VolunteerAvailability;
  habilidades: string;
  observacoes: string;
}

export const FORM_VAZIO: FormVoluntario = {
  nome: '',
  telefone: '',
  email: '',
  area: 'Oficina de Ballet',
  disponibilidade: 'Sábados (Manhã)',
  habilidades: '',
  observacoes: '',
};

export function formDoVoluntario(v: Volunteer): FormVoluntario {
  return {
    nome: v.nome,
    telefone: v.telefone,
    email: v.email,
    area: v.area,
    disponibilidade: v.disponibilidade,
    habilidades: v.habilidades || '',
    observacoes: v.observacoes || '',
  };
}

/** Campos do formulário já sem espaços nas pontas, prontos para gravar. */
export function formLimpo(f: FormVoluntario) {
  return {
    nome: f.nome.trim(),
    telefone: f.telefone.trim(),
    email: f.email.trim(),
    area: f.area,
    disponibilidade: f.disponibilidade,
    habilidades: f.habilidades.trim(),
    observacoes: f.observacoes.trim(),
  };
}
