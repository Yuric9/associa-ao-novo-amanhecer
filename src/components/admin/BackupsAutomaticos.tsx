// Lista dos backups automáticos (gravados todo dia no R2 pelo Worker) com download.
// Para restaurar: baixe o arquivo e use "Restaurar de Arquivo", mais abaixo nesta mesma aba.
import React, { useEffect, useState } from 'react';
import { CloudUpload, Download, Loader2, ShieldCheck } from 'lucide-react';
import { api, type BackupSalvo } from '../../services/api';

const dataDoNome = (nome: string) => {
  const [, a, m, d] = /(\d{4})-(\d{2})-(\d{2})/.exec(nome) ?? [];
  return a ? `${d}/${m}/${a}` : nome;
};

const tamanhoLegivel = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const BackupsAutomaticos: React.FC = () => {
  const [backups, setBackups] = useState<BackupSalvo[] | null>(null);
  const [erro, setErro] = useState('');
  const [gerando, setGerando] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const carregar = () =>
    api
      .getBackups()
      .then((lista) => {
        setBackups(lista);
        setErro('');
      })
      .catch((e: Error) => setErro(e.message));

  useEffect(() => {
    carregar();
  }, []);

  const gerarAgora = async () => {
    setGerando(true);
    try {
      await api.criarBackup();
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setGerando(false);
    }
  };

  const visiveis = mostrarTodos ? backups : backups?.slice(0, 5);

  return (
    <section aria-labelledby="backups-automaticos-titulo" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-brand bg-brand-soft px-2.5 py-0.5 rounded-md">
            Automático
          </span>
          <h2 id="backups-automaticos-titulo" className="text-lg font-black text-ink mt-1">
            Backups diários do banco de dados
          </h2>
          <p className="text-xs text-body">
            Todo dia, às 3h da manhã, o sistema guarda uma cópia completa dos dados. Ficam os últimos 30 dias. Para
            restaurar, baixe o arquivo e use “Restaurar de Arquivo” mais abaixo.
          </p>
        </div>
        <button
          type="button"
          onClick={gerarAgora}
          disabled={gerando}
          className="inline-flex shrink-0 self-start items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-brand hover:bg-brand-dark rounded-xl cursor-pointer disabled:opacity-60 sm:self-auto"
        >
          {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
          {gerando ? 'Gerando...' : 'Fazer backup agora'}
        </button>
      </div>

      <div className="bg-white rounded-[14px] border border-line shadow-2xs">
        {erro && (
          <p role="alert" className="p-4 text-xs font-semibold text-red-700">
            {erro}
          </p>
        )}
        {!erro && backups === null && (
          <p className="p-4 text-xs text-muted flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando backups...
          </p>
        )}
        {backups?.length === 0 && (
          <p className="p-4 text-xs text-muted">
            Nenhum backup ainda. O primeiro será feito esta noite, ou clique em “Fazer backup agora”.
          </p>
        )}
        {visiveis && visiveis.length > 0 && (
          <ul className="divide-y divide-line">
            {visiveis.map((b, i) => (
              <li key={b.nome} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ShieldCheck className={`w-5 h-5 shrink-0 ${i === 0 ? 'text-emerald-700' : 'text-muted'}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">
                      {dataDoNome(b.nome)}
                      {i === 0 && <span className="ml-2 text-[11px] font-bold text-emerald-800">mais recente</span>}
                      {b.nome.includes('antes-da-restauracao') && (
                        <span className="ml-2 text-[11px] font-bold text-amber-800">cópia antes da restauração</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(b.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {tamanhoLegivel(b.tamanho)}
                    </p>
                  </div>
                </div>
                <a
                  href={api.urlDoBackup(b.nome)}
                  download={b.nome}
                  aria-label={`Baixar backup de ${dataDoNome(b.nome)}`}
                  className="inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-bold text-brand border border-line hover:bg-sand rounded-lg"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Baixar</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        {backups && backups.length > 5 && (
          <button
            type="button"
            onClick={() => setMostrarTodos((v) => !v)}
            className="w-full border-t border-line px-4 py-3 text-xs font-bold text-brand hover:bg-sand rounded-b-[14px] cursor-pointer"
          >
            {mostrarTodos ? 'Mostrar só os 5 mais recentes' : `Ver todos os ${backups.length} backups`}
          </button>
        )}
      </div>
    </section>
  );
};
