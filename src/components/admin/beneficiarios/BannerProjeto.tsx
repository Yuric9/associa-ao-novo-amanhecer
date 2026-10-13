// Banner que aparece quando um projeto está filtrado: dados da turma e filtro de status nela.
import React from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import type { Beneficiary, BeneficiaryStatus, ProjectCard } from '../../../types';
import { isProjectMatch, type Filtros } from './filtros';
import type { ProjetoPreset } from './presets';

const COR_DO_ATALHO: Record<string, string> = {
  futebol: 'bg-emerald-600',
  ballet: 'bg-rose-600',
  book: 'bg-purple-600',
};

const STATUS_DA_TURMA: (BeneficiaryStatus | 'todos')[] = [
  'todos',
  'Aprovado',
  'Em análise',
  'Pendente',
  'Atendido/Entregue',
  'Recusado',
];

interface BannerProjetoProps {
  preset: ProjetoPreset;
  projetoCard?: ProjectCard;
  filtros: Filtros;
  beneficiaries: Beneficiary[];
  totalFiltrado: number;
  onFiltrar: (mudanca: Partial<Filtros>) => void;
  onExportar: () => void;
}

export const BannerProjeto: React.FC<BannerProjetoProps> = ({
  preset,
  projetoCard,
  filtros,
  beneficiaries,
  totalFiltrado,
  onFiltrar,
  onExportar,
}) => (
  <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-purple-500/10 p-5 rounded-[14px] border border-amber-200 shadow-2xs space-y-3">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-white shadow-2xs ${
            COR_DO_ATALHO[preset.id] ?? 'bg-amber-600'
          }`}
        >
          <preset.icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
              Visualização Específica Ativa
            </span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-body font-medium">
              {totalFiltrado} {totalFiltrado === 1 ? 'inscrito encontrado' : 'inscritos encontrados'}
            </span>
          </div>
          <h4 className="text-base font-black text-ink mt-0.5">{preset.projectName || preset.label}</h4>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        <button
          type="button"
          onClick={onExportar}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-ink bg-white hover:bg-paper border border-line rounded-xl transition-colors cursor-pointer shadow-2xs"
          title="Exportar apenas os alunos desta turma em planilha CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
          <span>Exportar Lista da Turma (.csv)</span>
        </button>
        <button
          type="button"
          onClick={() => onFiltrar({ projeto: 'todos' })}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-body hover:text-ink bg-white hover:bg-sand border border-line rounded-xl transition-colors cursor-pointer shadow-2xs"
          title="Remover filtro e voltar a ver todos os projetos"
        >
          <X className="w-3.5 h-3.5" />
          <span>Ver Todos</span>
        </button>
      </div>
    </div>

    {/* Dados Adicionais da Turma: Horário, Coordenador, Faixa Etária */}
    {projetoCard && (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-body pt-2 border-t border-amber-200/60">
        {projetoCard.coordenador && (
          <div>
            <strong className="text-ink">Coordenação:</strong> {projetoCard.coordenador}
          </div>
        )}
        {projetoCard.horario && (
          <div>
            <strong className="text-ink">Horários:</strong> {projetoCard.horario}
          </div>
        )}
        {projetoCard.idade_publico && (
          <div>
            <strong className="text-ink">Público-alvo:</strong> {projetoCard.idade_publico}
          </div>
        )}
      </div>
    )}

    {/* Sub-chips de Status Rápidos dentro deste projeto */}
    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
      <span className="text-[11px] text-muted font-semibold mr-1">Filtrar status nesta turma:</span>
      {STATUS_DA_TURMA.map((st) => {
        const countInProject = beneficiaries.filter(
          (b) => isProjectMatch(b.projeto, filtros.projeto) && (st === 'todos' || b.status === st)
        ).length;

        return (
          <button
            key={st}
            type="button"
            onClick={() => onFiltrar({ status: st })}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filtros.status === st
                ? 'bg-brand-dark text-white shadow-xs'
                : 'bg-white/80 text-body hover:bg-white border border-line'
            }`}
          >
            {st === 'todos' ? 'Todos os Status' : st} ({countInProject})
          </button>
        );
      })}
    </div>
  </div>
);
