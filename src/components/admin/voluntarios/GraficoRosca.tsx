// Card com o gráfico de rosca (por área ou disponibilidade) e a legenda clicável.
import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Briefcase, Clock, HandHeart, Plus, Sparkles, X } from 'lucide-react';
import type { FatiaGrafico, ModoGrafico } from './dados';

interface GraficoRoscaProps {
  viewMode: ModoGrafico;
  /** Troca o modo e limpa o filtro clicado */
  setViewMode: (modo: ModoGrafico) => void;
  activeChartData: FatiaGrafico[];
  activeIndex: number | null;
  setActiveIndex: (i: number | null) => void;
  selectedFilter: string | null;
  setSelectedFilter: (filtro: string | null) => void;
  totalVoluntarios: number;
  podeEditar: boolean;
  onNovo: () => void;
}

export const GraficoRosca: React.FC<GraficoRoscaProps> = ({
  viewMode,
  setViewMode,
  activeChartData,
  activeIndex,
  setActiveIndex,
  selectedFilter,
  setSelectedFilter,
  totalVoluntarios,
  podeEditar,
  onNovo,
}) => (
  <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-line shadow-2xs space-y-6">
    {/* Cabeçalho do Gráfico com Alternador de Visão */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md">
            Gestão da Equipe Voluntária
          </span>
          <span className="text-xs text-muted">·</span>
          <span className="text-xs text-muted">Gráfico de Rosca Interativo</span>
        </div>
        <h3 className="text-base sm:text-lg font-black text-ink mt-1 flex items-center gap-2">
          <HandHeart className="w-5 h-5 text-rose-600" />
          <span>Distribuição de Voluntários</span>
        </h3>
        <p className="text-xs text-body mt-0.5">
          Alterne entre áreas de atuação e disponibilidade para planejar escalas de oficinas, ensaios e cozinha.
        </p>
      </div>

      {/* Switch de Modo: Por Área vs Por Disponibilidade */}
      <div className="flex items-center gap-2 self-start md:self-center">
        <div className="inline-flex items-center p-1 bg-sand rounded-xl border border-line text-xs">
          <button
            type="button"
            onClick={() => setViewMode('area')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'area'
                ? 'bg-white text-ink shadow-xs'
                : 'text-body hover:text-ink'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
            <span>Por Área de Atuação</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('disponibilidade')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'disponibilidade'
                ? 'bg-white text-ink shadow-xs'
                : 'text-body hover:text-ink'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Por Disponibilidade</span>
          </button>
        </div>

        {podeEditar && (
          <button
            type="button"
            onClick={onNovo}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Voluntário</span>
          </button>
        )}
      </div>
    </div>

    {/* Layout Dividido: Gráfico de Rosca à Esquerda + Legenda Detalhada à Direita */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* LADO ESQUERDO: GRÁFICO DE ROSCA COM TEXTO CENTRAL (5 Colunas) */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center">
        <div className="w-full h-72 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activeChartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={108}
                paddingAngle={4}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(data: any) => {
                  if (data?.name && selectedFilter === data.name) {
                    setSelectedFilter(null);
                  } else if (data?.name) {
                    setSelectedFilter(String(data.name));
                  }
                }}
              >
                {activeChartData.map((entry, index) => (
                  <Cell
                    key={`cell-vol-${index}`}
                    fill={entry.color}
                    stroke="#ffffff"
                    strokeWidth={activeIndex === index || selectedFilter === entry.name ? 3 : 2}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      filter:
                        activeIndex === index || selectedFilter === entry.name
                          ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))'
                          : 'none',
                      transform:
                        activeIndex === index || selectedFilter === entry.name
                          ? 'scale(1.03)'
                          : 'scale(1)',
                      transformOrigin: 'center center',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-brand-dark text-white p-3 rounded-[14px] text-xs shadow-2xl border border-slate-700 min-w-[170px] space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300 font-bold border-b border-slate-800 pb-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: data.color }}
                          />
                          <span className="truncate">{data.name}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 text-[11px]">
                          <span className="text-muted">Total de voluntários:</span>
                          <span className="font-black text-rose-300 text-sm">
                            {data.value}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted">Proporção da equipe:</span>
                          <span className="font-bold text-white">{data.percentage}%</span>
                        </div>
                        <div className="text-[10px] text-amber-400 pt-1 text-center">
                          Clique para filtrar a equipe
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Rótulo Central no Miolo da Rosca */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-ink tracking-tight">
              {totalVoluntarios}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 mt-0.5">
              Voluntários
            </span>
            <span className="text-[9px] text-muted font-medium">
              {viewMode === 'area' ? 'em 7 áreas' : 'escalonados'}
            </span>
          </div>
        </div>

        {selectedFilter && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-900 rounded-full border border-rose-200 text-xs font-bold animate-in fade-in">
            <span>Filtrando por: <strong>{selectedFilter}</strong></span>
            <button
              type="button"
              onClick={() => setSelectedFilter(null)}
              className="hover:text-rose-700 p-0.5 rounded-full hover:bg-rose-100 cursor-pointer"
              title="Limpar filtro"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* LADO DIREITO: LEGENDA INTERATIVA COM BARRAS DE PROPORÇÃO (7 Colunas) */}
      <div className="lg:col-span-7 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-muted font-bold px-1">
          <span>{viewMode === 'area' ? 'Área de Atuação' : 'Disponibilidade'}</span>
          <span>Voluntários (%)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeChartData.map((item, idx) => {
            const isSelected = selectedFilter === item.name;
            const isHovered = activeIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedFilter(isSelected ? null : item.name);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`p-3 rounded-[14px] border transition-all cursor-pointer text-xs space-y-1.5 ${
                  isSelected
                    ? 'bg-rose-50/80 border-rose-400 shadow-xs ring-2 ring-rose-200'
                    : isHovered
                    ? 'bg-paper border-slate-300 shadow-2xs'
                    : 'bg-white border-line hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-ink truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <span className="font-black text-ink shrink-0">
                    {item.value} <span className="text-[10px] text-muted font-normal">({item.percentage}%)</span>
                  </span>
                </div>

                <div className="h-1.5 w-full bg-sand rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-[11px] text-muted flex items-center justify-between px-1">
          <span className="flex items-center gap-1 text-body">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Dica: Clique em qualquer setor ou card para filtrar a escala da equipe abaixo.</span>
          </span>
          {selectedFilter && (
            <button
              type="button"
              onClick={() => setSelectedFilter(null)}
              className="font-bold text-rose-700 hover:underline cursor-pointer"
            >
              Ver todos ({totalVoluntarios})
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);
