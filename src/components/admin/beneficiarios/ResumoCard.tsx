// Card do topo: contador em tempo real, cartões por status e filtros ativos.
import React from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Search,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { contarPorStatus, Filtros } from './filtros';
import type { ProjetoPreset } from './presets';

type Stats = ReturnType<typeof contarPorStatus>;

interface CartaoStatusConfig {
  status: string;
  titulo: string;
  icone: LucideIcon;
  stat: keyof Stats;
  dica: string;
  // Classes completas (o Tailwind só gera classes escritas por extenso no código)
  ativo: string;
  inativo: string;
  corTitulo: string;
  corIcone: string;
  corNumero: string;
  corPercentual: string;
}

const CARTOES_STATUS: CartaoStatusConfig[] = [
  {
    status: 'Aprovado',
    titulo: 'Aprovados',
    icone: CheckCircle2,
    stat: 'aprovados',
    dica: 'Clique para filtrar apenas Aprovados',
    ativo: 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-xs',
    inativo: 'bg-paper/70 border-line/80 hover:bg-emerald-50/50 hover:border-emerald-200',
    corTitulo: 'text-emerald-800',
    corIcone: 'text-emerald-600',
    corNumero: 'text-emerald-950',
    corPercentual: 'text-emerald-700',
  },
  {
    status: 'Pendente',
    titulo: 'Pendentes',
    icone: Clock,
    stat: 'pendentes',
    dica: 'Clique para filtrar apenas Pendentes',
    ativo: 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-xs',
    inativo: 'bg-paper/70 border-line/80 hover:bg-amber-50/50 hover:border-amber-200',
    corTitulo: 'text-amber-800',
    corIcone: 'text-amber-600',
    corNumero: 'text-amber-950',
    corPercentual: 'text-amber-700',
  },
  {
    status: 'Em análise',
    titulo: 'Em Análise',
    icone: AlertCircle,
    stat: 'emAnalise',
    dica: 'Clique para filtrar apenas Em análise',
    ativo: 'bg-orange-50 border-orange-400 ring-2 ring-orange-300 shadow-xs',
    inativo: 'bg-paper/70 border-line/80 hover:bg-orange-50/50 hover:border-orange-200',
    corTitulo: 'text-orange-800',
    corIcone: 'text-orange-600',
    corNumero: 'text-orange-950',
    corPercentual: 'text-orange-700',
  },
  {
    status: 'Atendido/Entregue',
    titulo: 'Atendidos',
    icone: Check,
    stat: 'atendidos',
    dica: 'Clique para filtrar apenas Atendidos / Entregues',
    ativo: 'bg-blue-50 border-blue-400 ring-2 ring-blue-300 shadow-xs',
    inativo: 'bg-paper/70 border-line/80 hover:bg-blue-50/50 hover:border-blue-200',
    corTitulo: 'text-blue-800',
    corIcone: 'text-blue-600',
    corNumero: 'text-blue-950',
    corPercentual: 'text-blue-700',
  },
];

interface ResumoCardProps {
  filtros: Filtros;
  hasActiveFilters: boolean;
  totalGeral: number;
  totalFiltrado: number;
  stats: Stats;
  activePreset?: ProjetoPreset;
  onNovoBeneficiario: () => void;
  onExportar: () => void;
  onFiltrar: (mudanca: Partial<Filtros>) => void;
  onLimparFiltros: () => void;
}

export const ResumoCard: React.FC<ResumoCardProps> = ({
  filtros,
  hasActiveFilters,
  totalGeral,
  totalFiltrado,
  stats,
  activePreset,
  onNovoBeneficiario,
  onExportar,
  onFiltrar,
  onLimparFiltros,
}) => (
  <div className="bg-white rounded-[14px] border border-line/90 shadow-sm p-6 sm:p-7 relative overflow-hidden transition-all duration-300">
    {/* Glows sutis decorativos de fundo */}
    <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

    <div className="relative z-10 space-y-6">
      {/* Cabeçalho do Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-100/90 text-amber-900 border border-amber-300/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Contador em Tempo Real
            </span>
            {hasActiveFilters ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-brand-dark text-white shadow-2xs">
                <Filter className="w-3 h-3 text-amber-400" />
                Filtros da Tabela Ativos
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Base Completa Visível
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-ink tracking-tight">Resumo Geral de Beneficiários</h3>
          <p className="text-xs sm:text-sm text-muted">
            Monitoramento instantâneo do cadastro institucional com atualização dinâmica a cada filtro aplicado.
          </p>
        </div>

        {/* Ações Rápidas no Topo do Card */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNovoBeneficiario}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-dark hover:bg-brand-dark text-white text-xs font-bold rounded-[14px] shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Novo Beneficiário</span>
          </button>

          <button
            type="button"
            onClick={onExportar}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sand hover:bg-slate-200 text-ink text-xs font-bold rounded-[14px] border border-line transition-all cursor-pointer"
            title="Exportar registros filtrados em tempo real"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV ({totalFiltrado})</span>
          </button>
        </div>
      </div>

      {/* Destaque Principal: Contador Gigante e Submétricas em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Bloco 1: Contador Principal em Tempo Real (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-[14px] p-6 sm:p-7 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-bold">
                <Users className="w-4 h-4 text-amber-400" />
                {hasActiveFilters ? 'Beneficiários Filtrados' : 'Total Cadastrado na Base'}
              </span>
              <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-[11px] text-amber-300 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Tempo Real
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">{totalFiltrado}</span>
              <div className="text-xs sm:text-sm font-medium text-muted">
                <div>
                  de <strong className="text-amber-300 font-bold">{totalGeral}</strong> no total
                </div>
                <div className="text-[11px] text-muted">{hasActiveFilters ? 'filtrados na tabela' : 'cadastros ativos'}</div>
              </div>
            </div>

            {/* Barra de Progresso / Proporção do Filtro */}
            <div className="mt-5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">Proporção visível</span>
                <span className="font-bold text-amber-300 font-mono">{stats.percentOfTotal}% do banco total</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(2, stats.percentOfTotal)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Status do Filtro / Botão de Reset Rápido */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-[11px] text-muted">
              {hasActiveFilters ? 'Exibindo subconjunto dinâmico' : 'Mostrando 100% dos cadastros'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onLimparFiltros}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Ver Todos ({totalGeral})</span>
              </button>
            )}
          </div>
        </div>

        {/* Bloco 2: Sub-Cards Dinâmicos por Status da Seleção Atual (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CARTOES_STATUS.map((c) => {
            const Icone = c.icone;
            const valor = stats[c.stat];
            return (
              <button
                key={c.status}
                type="button"
                onClick={() => onFiltrar({ status: filtros.status === c.status ? 'todos' : c.status })}
                className={`p-4 rounded-[14px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  filtros.status === c.status ? c.ativo : c.inativo
                }`}
                title={c.dica}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${c.corTitulo} uppercase tracking-wide`}>{c.titulo}</span>
                  <Icone className={`w-4 h-4 ${c.corIcone}`} />
                </div>
                <div className="mt-3">
                  <div className={`text-2xl sm:text-3xl font-black ${c.corNumero} font-mono`}>{valor}</div>
                  <div className={`text-[10px] ${c.corPercentual} font-semibold mt-1`}>
                    {totalFiltrado > 0 ? `${Math.round((valor / totalFiltrado) * 100)}% da seleção` : '0%'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chips Indicadores dos Filtros Ativos no Momento */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-line flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted font-semibold text-[11px]">Filtros ativos recalculando o contador:</span>

          {filtros.projeto !== 'todos' && activePreset && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-bold">
              <activePreset.icon className="w-3.5 h-3.5 text-amber-600" />
              <span>Projeto: {activePreset.label}</span>
              <button
                type="button"
                onClick={() => onFiltrar({ projeto: 'todos' })}
                className="hover:text-red-600 p-0.5 rounded-full hover:bg-amber-100 cursor-pointer"
                title="Remover filtro de projeto"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filtros.status !== 'todos' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sand text-ink border border-line font-bold">
              <span>Status: {filtros.status}</span>
              <button
                type="button"
                onClick={() => onFiltrar({ status: 'todos' })}
                className="hover:text-red-600 p-0.5 rounded-full hover:bg-slate-200 cursor-pointer"
                title="Remover filtro de status"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filtros.busca.trim() && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sand text-ink border border-line font-bold">
              <Search className="w-3 h-3 text-muted" />
              <span>
                Busca: "{filtros.busca}" (
                {filtros.tipoBusca === 'nome' ? 'por Nome' : filtros.tipoBusca === 'cpf' ? 'por CPF' : 'Nome/CPF'})
              </span>
              <button
                type="button"
                onClick={() => onFiltrar({ busca: '' })}
                className="hover:text-red-600 p-0.5 rounded-full hover:bg-slate-200 cursor-pointer"
                title="Limpar texto de busca"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onLimparFiltros}
            className="text-[11px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer ml-auto"
          >
            Limpar todos os filtros ({totalGeral} cadastrados)
          </button>
        </div>
      )}
    </div>
  </div>
);
