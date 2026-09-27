import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowLeft, KeyRound, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { NovoAmanhecerLogo } from '../brand/NovoAmanhecerLogo';
import { api } from '../../services/api';
import { AuthUser } from '../../types';

interface AdminLoginProps {
  onLoginSuccess: (user: AuthUser) => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToSite }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal / Aba de Recuperação de Senha
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar. Verifique e-mail e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.requestPasswordReset(resetEmail.trim());
      setResetMessage(res.message);
      // O código chega por e-mail; o usuário cola no próximo passo.
      setResetToken('');
      setResetStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar redefinição.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.resetPassword(resetToken.trim(), newPassword);
      setResetMessage(res.message);
      setTimeout(() => {
        setIsResetMode(false);
        setResetStep('request');
        setResetMessage('');
        setEmail(resetEmail);
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="relative hidden w-[46%] max-w-[640px] overflow-hidden bg-brand-dark lg:block">
        <img src="/fotos/hero-futebol-comemoracao.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-[center_40%]" />
        <div className="bg-help absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <NovoAmanhecerLogo size="md" inverted />
          <div className="flex flex-col gap-4">
            <span className="self-start rounded bg-sun px-3 py-1.5 text-[13px] font-extrabold text-ink">Área da equipe</span>
            <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-[-0.03em]">Inscrições, projetos e conteúdo do site em um só lugar.</h1>
            <p className="max-w-md text-base leading-relaxed text-brand-light">Acesso restrito à coordenação e aos voluntários da Associação Novo Amanhecer.</p>
          </div>
          <span className="text-[13px] text-brand-muted">Setor Ponta Kayana · Trindade — GO</span>
        </div>
      </aside>

      <main className="flex flex-1 flex-col px-4 py-6 sm:px-8">
        <button onClick={onBackToSite} className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-brand hover:text-brand-dark">
          <ArrowLeft className="h-4 w-4" /> <span>Voltar ao site</span>
        </button>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="card w-full max-w-md p-7 sm:p-9">
            <div className="mb-7 flex flex-col gap-2">
              <div className="mb-2 lg:hidden"><NovoAmanhecerLogo size="md" /></div>
              <span className="kicker">{isResetMode ? 'Recuperar acesso' : 'Painel de gestão'}</span>
              <h2 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-brand-dark">
                {isResetMode ? 'Vamos criar uma nova senha' : 'Entrar no painel'}
              </h2>
            </div>

            {error && (
              <div role="alert" className="mb-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" /><span>{error}</span>
              </div>
            )}
            {resetMessage && (
              <div role="status" className="mb-5 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{resetMessage}</span>
              </div>
            )}

            {!isResetMode ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-bold text-ink">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-line-strong bg-white py-3 pl-10 pr-4 text-[15px] text-ink placeholder-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" placeholder="seu@email.com" />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="login-senha" className="block text-[13px] font-bold text-ink">Senha</label>
                    <button type="button" onClick={() => { setIsResetMode(true); setError(''); }} className="text-[13px] font-semibold text-brand hover:text-brand-dark">Esqueceu a senha?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input id="login-senha" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-line-strong bg-white py-3 pl-10 pr-4 text-[15px] text-ink placeholder-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary mt-2 min-h-12 w-full">
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Verificando…</span></> : <span>Entrar</span>}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                {resetStep === 'request' ? (
                  <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
                    <p className="text-[15px] leading-relaxed text-body">Informe o e-mail da sua conta. Você vai receber um código para criar uma nova senha.</p>
                    <div>
                      <label htmlFor="reset-email" className="mb-1.5 block text-[13px] font-bold text-ink">E-mail cadastrado</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input id="reset-email" type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full rounded-md border border-line-strong bg-white py-3 pl-10 pr-4 text-[15px] text-ink placeholder-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" placeholder="seu@email.com" />
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary min-h-12 w-full">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}<span>Enviar código</span></button>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmReset} className="flex flex-col gap-4">
                    <div>
                      <label htmlFor="reset-token" className="mb-1.5 block text-[13px] font-bold text-ink">Código recebido por e-mail</label>
                      <input id="reset-token" type="text" required value={resetToken} onChange={(e) => setResetToken(e.target.value)} className="w-full rounded-md border border-line-strong bg-white px-3.5 py-3 text-[15px] text-ink placeholder-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 font-mono" />
                    </div>
                    <div>
                      <label htmlFor="reset-senha" className="mb-1.5 block text-[13px] font-bold text-ink">Nova senha (mínimo 8 caracteres)</label>
                      <input id="reset-senha" type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-md border border-line-strong bg-white px-3.5 py-3 text-[15px] text-ink placeholder-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary min-h-12 w-full">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}<span>Salvar nova senha</span></button>
                  </form>
                )}
                <button type="button" onClick={() => { setIsResetMode(false); setError(''); setResetMessage(''); }} className="min-h-11 text-center text-sm font-semibold text-brand hover:text-brand-dark">Voltar para o login</button>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-2.5 border-t border-line pt-5">
              <div className="flex items-center gap-1.5 text-[13px] text-muted"><Shield className="h-3.5 w-3.5 text-brand" /><span>Cada pessoa vê só o que o seu papel permite:</span></div>
              <div className="flex flex-wrap gap-2">
                <span className="chip bg-sun-soft text-sun-ink">Admin geral</span>
                <span className="chip bg-brand-soft text-brand-ink">Coordenação</span>
                <span className="chip bg-sand text-body">Voluntário</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
