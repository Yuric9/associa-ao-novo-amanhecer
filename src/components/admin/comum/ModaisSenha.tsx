// Janelas de senha que funcionam SEM e-mail:
// - TrocarMinhaSenha: qualquer pessoa logada troca a própria senha (pede a atual).
// - RedefinirSenhaDeUsuario: o administrador define uma senha provisória para alguém que esqueceu.
import React, { useState } from 'react';
import { KeyRound, Loader2, X } from 'lucide-react';
import { api } from '../../../services/api';
import { useJanelaModal } from '../../../utils/useJanelaModal';

const MINIMO = 8;

/** Confere a nova senha e a confirmação; devolve a mensagem de erro ou ''. */
function conferir(nova: string, confirmacao: string): string {
  if (nova.length < MINIMO) return `A nova senha deve ter pelo menos ${MINIMO} caracteres.`;
  if (nova !== confirmacao) return 'A confirmação não é igual à nova senha.';
  return '';
}

const campo = 'w-full px-3 py-2.5 text-sm bg-white border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand';
const rotulo = 'block text-xs font-bold text-body uppercase mb-1';

interface JanelaProps {
  titulo: string;
  idTitulo: string;
  subtitulo: React.ReactNode;
  aoFechar: () => void;
  children: React.ReactNode;
}

const Janela: React.FC<JanelaProps> = ({ titulo, idTitulo, subtitulo, aoFechar, children }) => {
  const janela = useJanelaModal(true, aoFechar);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={janela}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="outline-none relative w-full max-w-md bg-white rounded-[14px] shadow-2xl border border-line p-6 sm:p-8"
      >
        <button aria-label="Fechar" onClick={aoFechar} className="absolute top-4 right-4 p-2 text-muted hover:text-body rounded-full">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-1">
          <span className="w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
            <KeyRound className="w-5 h-5" aria-hidden="true" />
          </span>
          <h2 id={idTitulo} className="text-lg font-bold text-ink">
            {titulo}
          </h2>
        </div>
        <p className="text-xs text-body mb-5">{subtitulo}</p>
        {children}
      </div>
    </div>
  );
};

const Rodape: React.FC<{ erro: string; salvando: boolean; textoBotao: string; aoCancelar: () => void }> = ({
  erro,
  salvando,
  textoBotao,
  aoCancelar,
}) => (
  <>
    {erro && (
      <p role="alert" className="text-xs font-semibold text-red-700">
        {erro}
      </p>
    )}
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={aoCancelar} className="px-4 py-2.5 text-sm font-semibold text-body hover:bg-sand rounded-lg">
        Cancelar
      </button>
      <button
        type="submit"
        disabled={salvando}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-brand hover:bg-brand-dark rounded-lg disabled:opacity-60"
      >
        {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
        {textoBotao}
      </button>
    </div>
  </>
);

export const TrocarMinhaSenha: React.FC<{ aoFechar: () => void; aoConcluir: (msg: string) => void }> = ({ aoFechar, aoConcluir }) => {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = conferir(nova, confirmacao);
    if (problema) return setErro(problema);
    setSalvando(true);
    try {
      await api.trocarMinhaSenha(atual, nova);
      aoConcluir('Senha alterada. Em outros aparelhos será preciso entrar de novo.');
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  };

  return (
    <Janela
      titulo="Trocar minha senha"
      idTitulo="trocar-senha-titulo"
      subtitulo="Depois de trocar, os outros aparelhos onde você estava conectado(a) serão desconectados."
      aoFechar={aoFechar}
    >
      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label htmlFor="senha-atual" className={rotulo}>Senha atual</label>
          <input id="senha-atual" type="password" required autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor="senha-nova" className={rotulo}>Nova senha (mínimo {MINIMO} caracteres)</label>
          <input id="senha-nova" type="password" required autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor="senha-confirmacao" className={rotulo}>Repita a nova senha</label>
          <input id="senha-confirmacao" type="password" required autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className={campo} />
        </div>
        <Rodape erro={erro} salvando={salvando} textoBotao="Trocar senha" aoCancelar={aoFechar} />
      </form>
    </Janela>
  );
};

export const RedefinirSenhaDeUsuario: React.FC<{
  usuario: { id: string; nome: string; email: string };
  aoFechar: () => void;
  aoConcluir: (msg: string) => void;
}> = ({ usuario, aoFechar, aoConcluir }) => {
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = conferir(nova, confirmacao);
    if (problema) return setErro(problema);
    setSalvando(true);
    try {
      const { message } = await api.redefinirSenhaDeUsuario(usuario.id, nova);
      aoConcluir(`${message} Passe a senha para a pessoa e peça que ela troque em "Trocar minha senha".`);
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  };

  return (
    <Janela
      titulo="Redefinir senha"
      idTitulo="redefinir-senha-titulo"
      subtitulo={
        <>
          Crie uma senha provisória para <strong>{usuario.nome}</strong> ({usuario.email}). A pessoa será desconectada e
          entrará com essa senha.
        </>
      }
      aoFechar={aoFechar}
    >
      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label htmlFor="senha-provisoria" className={rotulo}>Senha provisória (mínimo {MINIMO} caracteres)</label>
          <input id="senha-provisoria" type="text" required autoComplete="off" value={nova} onChange={(e) => setNova(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor="senha-provisoria-confirmacao" className={rotulo}>Repita a senha provisória</label>
          <input id="senha-provisoria-confirmacao" type="text" required autoComplete="off" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className={campo} />
        </div>
        <Rodape erro={erro} salvando={salvando} textoBotao="Definir senha" aoCancelar={aoFechar} />
      </form>
    </Janela>
  );
};
