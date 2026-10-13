// Lista da equipe: busca, exportação e cards com WhatsApp, editar e pausar.
import React from 'react';
import { Clock, Download, MessageCircle, Phone, Plus, Search, Users, X } from 'lucide-react';
import type { Volunteer } from '../../../types';
import { AREA_COLORS, linkWhatsapp } from './dados';

interface ListaEquipeProps {
  filteredVolunteers: Volunteer[];
  searchTerm: string;
  setSearchTerm: (termo: string) => void;
  selectedFilter: string | null;
  setSelectedFilter: (filtro: string | null) => void;
  podeEditar: boolean;
  onNovo: () => void;
  onEditar: (vol: Volunteer) => void;
  onAlternarAtivo: (id: string) => void;
  onExportar: () => void;
}

export const ListaEquipe: React.FC<ListaEquipeProps> = ({
  filteredVolunteers,
  searchTerm,
  setSearchTerm,
  selectedFilter,
  setSelectedFilter,
  podeEditar,
  onNovo,
  onEditar,
  onAlternarAtivo,
  onExportar,
}) => (
  <div className="bg-white p-6 sm:p-8 rounded-[14px] border border-line shadow-2xs space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
      <div>
        <h3 className="text-base sm:text-lg font-black text-ink flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-600" />
          <span>Escala e Contato com a Equipe ({filteredVolunteers.length})</span>
        </h3>
        <p className="text-xs text-body mt-0.5">
          Acione voluntários via WhatsApp para plantões, aulas de dança, treinos de futebol ou preparo de lanches.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onExportar}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-ink bg-sand hover:bg-slate-200 border border-line rounded-xl transition-colors cursor-pointer"
          title="Exportar escala completa em planilha CSV"
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span>Exportar Escala (.csv)</span>
        </button>

        {podeEditar && (
          <button
            type="button"
            onClick={onNovo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Voluntário</span>
          </button>
        )}
      </div>
    </div>

    {/* Barra de Busca de Voluntários */}
    <div className="relative max-w-md">
      <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        placeholder="Buscar por nome, habilidade, área ou horário..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => setSearchTerm('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-body p-1 rounded-full cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>

    {/* Lista de Cards dos Voluntários */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredVolunteers.length === 0 ? (
        <div className="col-span-full p-12 text-center text-muted space-y-2">
          <Users className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-ink">Nenhum voluntário encontrado</p>
          <p className="text-xs text-muted">
            Tente alterar os termos de busca ou remover o filtro selecionado.
          </p>
          {(searchTerm || selectedFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedFilter(null);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              Limpar Filtros e Ver Todos
            </button>
          )}
        </div>
      ) : (
        filteredVolunteers.map((vol) => {
          const areaColor = AREA_COLORS[vol.area] || '#64748b';
          const whatsappUrl = linkWhatsapp(vol);

          return (
            <div
              key={vol.id}
              className="p-5 rounded-[14px] bg-white border border-line hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-ink text-sm leading-snug">
                      {vol.nome}
                    </h4>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md mt-1"
                      style={{
                        backgroundColor: `${areaColor}15`,
                        color: areaColor,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: areaColor }}
                      />
                      {vol.area}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      vol.ativo
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-sand text-muted'
                    }`}
                  >
                    {vol.ativo ? 'Ativo' : 'Pausado'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-body">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="font-medium text-body">{vol.disponibilidade}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>{vol.telefone}</span>
                  </div>

                  {vol.habilidades && (
                    <p className="text-[11px] text-muted pt-1 line-clamp-2">
                      <strong>Habilidades:</strong> {vol.habilidades}
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                  title="Conversar no WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chamar no Zap</span>
                </a>

                {podeEditar && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditar(vol)}
                      className="p-1.5 text-xs font-medium text-body hover:text-ink hover:bg-sand rounded-lg transition-colors cursor-pointer"
                      title="Editar voluntário"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onAlternarAtivo(vol.id)}
                      className="p-1.5 text-xs font-medium text-muted hover:text-body hover:bg-sand rounded-lg transition-colors cursor-pointer"
                      title={vol.ativo ? 'Pausar participação' : 'Reativar voluntário'}
                    >
                      {vol.ativo ? 'Pausar' : 'Ativar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);
