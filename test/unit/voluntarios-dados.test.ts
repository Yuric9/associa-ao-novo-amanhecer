import { describe, expect, it } from 'vitest';
import type { Volunteer } from '../../src/types';
import {
  AREAS,
  DISPONIBILIDADES,
  FALLBACK_COLORS,
  FORM_VAZIO,
  agruparVoluntarios,
  filtrarVoluntarios,
  formDoVoluntario,
  formLimpo,
  linhasCsvVoluntarios,
  linkWhatsapp,
} from '../../src/components/admin/voluntarios/dados';

function vol(over: Partial<Volunteer>): Volunteer {
  return {
    id: over.id ?? crypto.randomUUID(),
    nome: 'Fulano',
    telefone: '(62) 90000-0000',
    email: '',
    area: 'Oficina de Ballet',
    disponibilidade: 'Sábados (Manhã)',
    ativo: true,
    data_inicio: '2026-01-01',
    ...over,
  } as Volunteer;
}

const EQUIPE = [
  vol({ id: '1', nome: 'Bruno', area: 'Treinos de Futebol', disponibilidade: 'Finais de Semana (Geral)', habilidades: 'Futsal infantil' }),
  vol({ id: '2', nome: 'Larissa', area: 'Fotografia & Produção (Book)', disponibilidade: 'Finais de Semana (Geral)' }),
  vol({ id: '3', nome: 'Cleusa', area: 'Cozinha Comunitária & Alimentação', disponibilidade: 'Sábados (Manhã)', telefone: '(62) 99233-8877' }),
  vol({ id: '4', nome: 'Rodrigo', area: 'Treinos de Futebol', disponibilidade: 'Escala Flexível', ativo: false }),
];

describe('agruparVoluntarios', () => {
  it('agrupa por área, do maior grupo para o menor, com porcentagem e cor', () => {
    expect(agruparVoluntarios(EQUIPE, 'area')).toEqual([
      { name: 'Treinos de Futebol', value: 2, percentage: 50, color: '#059669' },
      { name: 'Fotografia & Produção (Book)', value: 1, percentage: 25, color: '#8b5cf6' },
      { name: 'Cozinha Comunitária & Alimentação', value: 1, percentage: 25, color: '#f97316' },
    ]);
  });

  it('agrupa por disponibilidade', () => {
    expect(agruparVoluntarios(EQUIPE, 'disponibilidade').map((f) => [f.name, f.value])).toEqual([
      ['Finais de Semana (Geral)', 2],
      ['Sábados (Manhã)', 1],
      ['Escala Flexível', 1],
    ]);
  });

  it('área desconhecida recebe uma cor reserva; lista vazia não quebra', () => {
    const [fatia] = agruparVoluntarios([vol({ area: 'Horta' as never })], 'area');
    expect(fatia.color).toBe(FALLBACK_COLORS[0]);
    expect(agruparVoluntarios([], 'area')).toEqual([]);
  });
});

describe('filtrarVoluntarios', () => {
  const ids = (busca: string, filtro: string | null = null, modo: 'area' | 'disponibilidade' = 'area') =>
    filtrarVoluntarios(EQUIPE, busca, filtro, modo).map((v) => v.id);

  it('busca por nome, área, horário, telefone ou habilidade, sem diferenciar maiúsculas', () => {
    expect(ids('BRUNO')).toEqual(['1']);
    expect(ids('futebol')).toEqual(['1', '4']);
    expect(ids('sábados')).toEqual(['3']);
    expect(ids('99233')).toEqual(['3']);
    expect(ids('futsal')).toEqual(['1']);
  });

  it('filtro clicado no gráfico depende do modo', () => {
    expect(ids('', 'Treinos de Futebol', 'area')).toEqual(['1', '4']);
    expect(ids('', 'Finais de Semana (Geral)', 'disponibilidade')).toEqual(['1', '2']);
    expect(ids('bruno', 'Finais de Semana (Geral)', 'disponibilidade')).toEqual(['1']);
  });
});

describe('WhatsApp e CSV', () => {
  it('monta o link do WhatsApp com DDI 55, só dígitos e mensagem codificada', () => {
    const link = linkWhatsapp({ nome: 'Ana', telefone: '(62) 99124-5533', area: 'Oficina de Ballet' });
    expect(link.startsWith('https://wa.me/5562991245533?text=')).toBe(true);
    expect(decodeURIComponent(link.split('text=')[1])).toBe(
      'Olá Ana! Aqui é da coordenação da Associação Novo Amanhecer (Trindade). Gostaria de falar sobre a nossa escala do Oficina de Ballet.'
    );
  });

  it('linhas do CSV trazem a situação em texto e campos opcionais vazios', () => {
    const [ativo, pausado] = linhasCsvVoluntarios([EQUIPE[1], EQUIPE[3]]);
    expect(ativo.Situação).toBe('Ativo');
    expect(pausado.Situação).toBe('Inativo / Pausado');
    expect(ativo.Habilidades).toBe('');
    expect(Object.keys(ativo)).toHaveLength(9);
  });
});

describe('formulário', () => {
  it('as opções dos selects seguem a ordem original', () => {
    expect(AREAS[0]).toBe('Oficina de Ballet');
    expect(AREAS).toHaveLength(7);
    expect(DISPONIBILIDADES[0]).toBe('Sábados (Manhã)');
    expect(DISPONIBILIDADES).toHaveLength(6);
  });

  it('carrega o voluntário no formulário e limpa espaços ao salvar', () => {
    expect(formDoVoluntario(EQUIPE[0]).habilidades).toBe('Futsal infantil');
    expect(formDoVoluntario(EQUIPE[1]).habilidades).toBe('');
    expect(formLimpo({ ...FORM_VAZIO, nome: '  Ana  ', observacoes: ' x ' })).toMatchObject({ nome: 'Ana', observacoes: 'x' });
  });
});
