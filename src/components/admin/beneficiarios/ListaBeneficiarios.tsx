// Lista de beneficiários (ou o aviso de "nenhum encontrado") com as ações de cada um.
import React from 'react';
import { Edit2, Filter, MapPin, Phone, RotateCcw, Search, Trash2 } from 'lucide-react';
import type { Beneficiary, BeneficiaryStatus } from '../../../types';
import { cleanDigits } from '../../../utils/validation';
import { filtroDoProjeto, isProjectMatch, type Filtros } from './filtros';

const COR_DO_STATUS: Record<string, string> = {
  Aprovado: 'bg-emerald-100 text-emerald-800',
  'Em análise': 'bg-amber-100 text-amber-900',
  'Atendido/Entregue': 'bg-blue-100 text-blue-900',
  Recusado: 'bg-red-100 text-red-900',
};

const ACOES_STATUS: { status: BeneficiaryStatus; label: string; titulo: string; classe: string }[] = [
  {
    status: 'Aprovado',
    label: 'Aprovar',
    titulo: 'Aprovar e disparar notificação',
    classe: 'px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer',
  },
  {
    status: 'Em análise',
    label: 'Em Análise',
    titulo: 'Colocar em análise',
    classe: 'px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer',
  },
  {
    status: 'Atendido/Entregue',
    label: 'Atendido',
    titulo: 'Marcar como atendido/entregue',
    classe: 'px-2.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer',
  },
  {
    status: 'Recusado',
    label: 'Recusar',
    titulo: 'Recusar cadastro',
    classe: 'px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-red-200 sm:border-0',
  },
];

interface ListaBeneficiariosProps {
  filtrados: Beneficiary[];
  totalGeral: number;
  filtros: Filtros;
  onFiltrar: (mudanca: Partial<Filtros>) => void;
  onLimparFiltros: () => void;
  onMudarStatus: (id: string, status: BeneficiaryStatus) => void;
  onEditar: (b: Beneficiary) => void;
  onExcluir: (id: string, nome: string) => void;
}

export const ListaBeneficiarios: React.FC<ListaBeneficiariosProps> = ({
  filtrados,
  totalGeral,
  filtros,
  onFiltrar,
  onLimparFiltros,
  onMudarStatus,
  onEditar,
  onExcluir,
}) => {
  const { busca, tipoBusca, status, projeto } = filtros;

  return (
    <div className="bg-white rounded-[14px] border border-line shadow-2xs overflow-hidden">
      {filtrados.length === 0 ? (
        <div className="p-12 text-center text-muted space-y-3">
          <div className="w-12 h-12 rounded-full bg-sand flex items-center justify-center mx-auto text-muted">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink">Nenhum beneficiário encontrado</p>
            <p className="text-xs text-muted mt-1 max-w-md mx-auto">
              {busca
                ? `Não encontramos nenhum resultado para "${busca}" no filtro de ${
                    tipoBusca === 'nome' ? 'nome' : tipoBusca === 'cpf' ? 'CPF' : 'nome ou CPF'
                  }. Verifique a digitação ou tente buscar por outro termo.`
                : 'Nenhum cadastro coincide com os filtros de status e projeto selecionados.'}
            </p>
          </div>
          {(busca || status !== 'todos' || projeto !== 'todos') && (
            <button
              type="button"
              onClick={onLimparFiltros}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar busca e ver todos ({totalGeral})</span>
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtrados.map((b) => (
            <div
              key={b.id}
              className="p-5 hover:bg-paper/80 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
            >
              {/* Dados Principais do Beneficiário */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-ink">{b.nome}</span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${COR_DO_STATUS[b.status] ?? 'bg-sand text-body'}`}
                  >
                    {b.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => onFiltrar({ projeto: filtroDoProjeto(b.projeto) })}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                      isProjectMatch(b.projeto, projeto) && projeto !== 'todos'
                        ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-300/70 shadow-2xs'
                        : 'text-amber-800 bg-amber-50/90 hover:bg-amber-100/90 border-amber-200 hover:border-amber-300'
                    }`}
                    title={`Clique para filtrar apenas inscritos de: ${b.projeto}`}
                  >
                    <Filter className="w-2.5 h-2.5 text-amber-600" />
                    <span>{b.projeto}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md transition-colors ${
                      // Destaca o CPF durante a busca. Obs.: uma busca sem números (ex.: "ana") destaca todos,
                      // porque cleanDigits devolve '' e todo texto "contém" ''. Mantido como estava.
                      busca && (cleanDigits(b.cpf).includes(cleanDigits(busca)) || b.cpf.includes(busca.trim()))
                        ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                        : 'text-body'
                    }`}
                  >
                    <strong className="text-body">CPF:</strong> {b.cpf}
                  </span>
                  <span>·</span>
                  <span>
                    <strong className="text-body">Nasc:</strong> {b.nascimento}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-muted" />
                    {b.telefone}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted" />
                    {b.endereco}
                  </span>
                </div>

                {b.observacoes && (
                  <div className="text-xs text-body bg-amber-50/60 p-2 rounded-xl border border-amber-100/60 mt-1">
                    <strong>Obs:</strong> {b.observacoes}
                  </div>
                )}

                <div className="text-[10px] text-muted pt-0.5">
                  Cadastrado em: {b.criado_em} {b.atualizado_em && `· Atualizado em: ${b.atualizado_em}`}
                </div>
              </div>

              {/* Ações de Gestão de Status e Edição */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end border-t border-line lg:border-t-0 pt-3 lg:pt-0">
                {/* Botões Rápidos de Status (no celular, grade de botões grandes) */}
                <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:items-center sm:gap-1 sm:w-auto">
                  {ACOES_STATUS.filter((a) => a.status !== b.status).map((a) => (
                    <button
                      key={a.status}
                      onClick={() => onMudarStatus(b.id, a.status)}
                      className={`${a.classe} min-h-11 sm:min-h-0 text-center whitespace-nowrap`}
                      title={a.titulo}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>

                {/* Editar e Excluir */}
                <div className="flex items-center justify-end gap-1 w-full sm:w-auto sm:pl-2 sm:border-l sm:border-line">
                  <button
                    onClick={() => onEditar(b)}
                    className="p-2.5 sm:p-1.5 text-muted hover:text-ink hover:bg-sand rounded-lg"
                    title="Editar cadastro"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onExcluir(b.id, b.nome)}
                    className="p-2.5 sm:p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Excluir cadastro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
