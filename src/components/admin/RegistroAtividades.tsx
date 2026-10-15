// Registro de atividades (auditoria): quem fez o quê e quando. Só o administrador vê.
// Mostra as 100 ações mais recentes gravadas pelo Worker (tabela audit_logs).
import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { GRUPOS, infoDaAtividade, type GrupoAtividade } from '../../utils/atividades';

interface Registro {
  id: string;
  user_email: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

const COR_DO_GRUPO: Record<GrupoAtividade, string> = {
  acessos: 'bg-brand',
  cadastros: 'bg-emerald-700',
  site: 'bg-amber-700',
  sistema: 'bg-slate-500',
};

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const RegistroAtividades: React.FC = () => {
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [grupo, setGrupo] = useState<GrupoAtividade | 'todos'>('todos');

  const carregar = async () => {
    setCarregando(true);
    try {
      setRegistros(await api.getAuditLogs());
      setErro('');
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const visiveis = (registros ?? []).filter((r) => grupo === 'todos' || infoDaAtividade(r.action).grupo === grupo);
  const contar = (g: GrupoAtividade) => (registros ?? []).filter((r) => infoDaAtividade(r.action).grupo === g).length;

  return (
    <section aria-labelledby="atividades-titulo" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="atividades-titulo" className="text-lg font-black text-ink">
            Registro de atividades
          </h2>
          <p className="text-xs text-body">
            Quem fez o quê no sistema e quando: acessos ao painel, inscrições, alterações no site e backups. Mostra as 100
            ações mais recentes.
          </p>
        </div>
        <button
          type="button"
          onClick={carregar}
          disabled={carregando}
          className="inline-flex shrink-0 self-start items-center gap-2 px-4 py-2.5 text-xs font-bold text-brand border border-line bg-white hover:bg-sand rounded-xl cursor-pointer disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} aria-hidden="true" />
          Atualizar
        </button>
      </div>

      {/* Filtro por tipo */}
      <div role="group" aria-label="Filtrar por tipo de atividade" className="flex flex-wrap gap-2">
        {[{ id: 'todos' as const, rotulo: 'Todas', total: registros?.length ?? 0 }, ...GRUPOS.map((g) => ({ ...g, total: contar(g.id) }))].map(
          (g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={grupo === g.id}
              onClick={() => setGrupo(g.id)}
              className={`px-3 py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                grupo === g.id ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-body border-line hover:bg-sand'
              }`}
            >
              {g.rotulo} <span className="opacity-75">({g.total})</span>
            </button>
          )
        )}
      </div>

      <div className="bg-white rounded-[14px] border border-line shadow-2xs">
        {erro && (
          <p role="alert" className="p-4 text-xs font-semibold text-red-700">
            {erro}
          </p>
        )}
        {!erro && registros === null && (
          <p className="p-4 text-xs text-muted flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando atividades...
          </p>
        )}
        {registros && visiveis.length === 0 && <p className="p-4 text-xs text-muted">Nenhuma atividade deste tipo.</p>}
        {visiveis.length > 0 && (
          <ol className="divide-y divide-line">
            {visiveis.map((r) => {
              const info = infoDaAtividade(r.action);
              return (
                <li key={r.id} className="flex gap-3 px-4 py-3">
                  {info.alerta ? (
                    <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-amber-700" aria-label="Atenção" />
                  ) : (
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${COR_DO_GRUPO[info.grupo]}`} aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                      <p className="text-sm font-bold text-ink">{info.rotulo}</p>
                      <time dateTime={r.created_at} className="shrink-0 text-xs text-muted">
                        {dataHora(r.created_at)}
                      </time>
                    </div>
                    {r.details && <p className="mt-0.5 text-xs text-body break-words">{r.details}</p>}
                    <p className="mt-0.5 text-xs text-muted break-all">
                      {r.user_email ? `por ${r.user_email}` : 'pelo site ou pelo sistema'}
                      {info.alerta && r.ip_address && r.ip_address !== '0.0.0.0' ? ` · IP ${r.ip_address}` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
};
