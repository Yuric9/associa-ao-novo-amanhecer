// Barra de busca e filtros: atalhos por projeto, busca por nome/CPF, status e projeto.
import React from 'react';
import { CreditCard, FileSpreadsheet, Filter, RotateCcw, Search, SlidersHorizontal, User, X } from 'lucide-react';
import type { ProjectCard } from '../../../types';
import { ATALHOS_PROJETO, isProjectMatch, type contarPorProjeto, type Filtros, type TipoBusca } from './filtros';
import { presetSelecionado, type ProjetoPreset } from './presets';

interface BarraFiltrosProps {
  filtros: Filtros;
  presets: ProjetoPreset[];
  activePreset?: ProjetoPreset;
  projectCounts: ReturnType<typeof contarPorProjeto>;
  projects?: ProjectCard[];
  totalGeral: number;
  totalFiltrado: number;
  onFiltrar: (mudanca: Partial<Filtros>) => void;
  onLimparFiltros: () => void;
  onExportar: () => void;
}

const TIPOS_BUSCA: { id: TipoBusca; label: string; icone?: typeof User }[] = [
  { id: 'todos', label: 'Nome ou CPF' },
  { id: 'nome', label: 'Apenas Nome', icone: User },
  { id: 'cpf', label: 'Apenas CPF', icone: CreditCard },
];

export const BarraFiltros: React.FC<BarraFiltrosProps> = ({
  filtros,
  presets,
  activePreset,
  projectCounts,
  projects,
  totalGeral,
  totalFiltrado,
  onFiltrar,
  onLimparFiltros,
  onExportar,
}) => (
  <div className="bg-white p-5 rounded-[14px] border border-line shadow-2xs space-y-4">
    {/* FILTROS RÁPIDOS AVANÇADOS POR PROJETO SOCIAL */}
    <div className="space-y-2.5 pb-3 border-b border-line">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
          <span>Filtro Rápido por Projeto Social:</span>
        </span>
        <span className="text-[11px] text-muted">
          Selecione para isolar especificamente os alunos de uma turma ou oficina
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => {
          const isSelected = presetSelecionado(preset, filtros.projeto);
          const Icon = preset.icon;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onFiltrar({ projeto: isSelected && preset.id !== 'todos' ? 'todos' : preset.id })}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSelected ? preset.activeBtnClass : preset.inactiveBtnClass
              }`}
              title={`Visualizar apenas inscritos em: ${preset.label}`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{preset.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-sand text-body group-hover:bg-slate-200'
                }`}
              >
                {preset.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>

    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
      {/* Campo de Busca Avançada por Nome ou CPF */}
      <div className="flex-1 max-w-xl space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={
              filtros.tipoBusca === 'nome'
                ? 'Buscar por nome do beneficiário...'
                : filtros.tipoBusca === 'cpf'
                ? 'Buscar por CPF (ex: 123.456 ou apenas números)...'
                : 'Buscar beneficiário por Nome ou CPF...'
            }
            value={filtros.busca}
            onChange={(e) => onFiltrar({ busca: e.target.value })}
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white shadow-2xs transition-all"
          />
          {filtros.busca && (
            <button
              type="button"
              onClick={() => onFiltrar({ busca: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-body p-1 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
              title="Limpar busca"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Chips de Seleção de Tipo de Busca (Nome / CPF / Ambos) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-muted font-medium mr-1">Filtrar por:</span>
          {TIPOS_BUSCA.map(({ id, label, icone: Icone }) => (
            <button
              key={id}
              type="button"
              onClick={() => onFiltrar({ tipoBusca: id })}
              className={`${Icone ? 'inline-flex items-center gap-1 ' : ''}px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filtros.tipoBusca === id ? 'bg-amber-600 text-white shadow-xs' : 'bg-sand text-body hover:bg-slate-200'
              }`}
            >
              {Icone ? (
                <>
                  <Icone className="w-3 h-3" />
                  <span>{label}</span>
                </>
              ) : (
                label
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Botões de Ação: Exportar CSV */}
      <div className="flex items-center gap-2 self-end lg:self-center">
        <button
          onClick={onExportar}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-ink bg-sand hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-line"
          title="Baixar lista filtrada em arquivo CSV / Excel"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span>
            Exportar CSV ({totalFiltrado}
            {filtros.projeto !== 'todos' && activePreset ? ` em ${activePreset.shortLabel}` : ''})
          </span>
        </button>
      </div>
    </div>

    {/* Filtros por Status e Projeto */}
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted" />
          <span className="font-semibold text-body">Status:</span>
          <select
            value={filtros.status}
            onChange={(e) => onFiltrar({ status: e.target.value })}
            className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-ink focus:outline-none"
          >
            <option value="todos">Todos os Status ({totalGeral})</option>
            <option value="Pendente">Pendente</option>
            <option value="Em análise">Em análise</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Atendido/Entregue">Atendido/Entregue</option>
            <option value="Recusado">Recusado</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-body">Projeto:</span>
          <select
            value={filtros.projeto}
            onChange={(e) => onFiltrar({ projeto: e.target.value })}
            className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-ink focus:outline-none"
          >
            <option value="todos">Todos os Projetos ({totalGeral})</option>
            <option value="futebol">Apenas Futebol ({projectCounts.futebol})</option>
            <option value="ballet">Apenas Ballet ({projectCounts.ballet})</option>
            <option value="book">Apenas Book Gestante ({projectCounts.book})</option>
            <option value="festas">Apenas Festas & Ações ({projectCounts.festas})</option>
            {projects
              ?.filter((p) => !ATALHOS_PROJETO.some((atalho) => isProjectMatch(p.titulo, atalho)))
              .map((p) => (
                <option key={p.id} value={p.titulo}>
                  {p.titulo}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Feedback de Busca Ativa */}
      {(filtros.busca || filtros.status !== 'todos' || filtros.projeto !== 'todos') && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted font-medium">
            {totalFiltrado} de {totalGeral} encontrados
          </span>
          <button
            type="button"
            onClick={onLimparFiltros}
            className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md border border-amber-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar Filtros</span>
          </button>
        </div>
      )}
    </div>
  </div>
);
