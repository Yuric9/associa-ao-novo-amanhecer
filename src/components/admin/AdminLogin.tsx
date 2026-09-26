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
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setResetStep('confirm');
      }
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Botão Voltar ao Site */}
      <button
        onClick={onBackToSite}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Portal da Associação</span>
      </button>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow de ambientação */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <NovoAmanhecerLogo size="lg" showText={false} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isResetMode ? 'Recuperação de Acesso' : 'Painel de Gestão e Coordenação'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Associação Novo Amanhecer · Trindade/GO
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resetMessage && (
          <div className="mb-5 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{resetMessage}</span>
          </div>
        )}

        {!isResetMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  placeholder="ex: admin@novoamanhecer.org.br"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setError('');
                  }}
                  className="text-[11px] text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-60 rounded-xl shadow-lg shadow-orange-600/20 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciais...</span>
                </>
              ) : (
                <span>Entrar no Painel Seguro</span>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {resetStep === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Informe o e-mail cadastrado da sua conta. Você receberá um código seguro para gerar uma nova senha.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Seu E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="admin@novoamanhecer.org.br"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Gerar Token de Redefinição</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Token de Segurança
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nova Senha (Mínimo 8 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white"
                    placeholder="Nova senha segura"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Salvar Nova Senha</span>
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setError('');
                setResetMessage('');
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white pt-2 cursor-pointer"
            >
              Voltar para o Login
            </button>
          </div>
        )}

        {/* Níveis de Acesso RBAC */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-2">
            <Shield className="w-3.5 h-3.5 text-orange-400" />
            <span>Controle de Acesso RBAC Verificado no Servidor:</span>
          </div>
          <div className="flex justify-center gap-2 text-[10px] text-slate-400 flex-wrap">
            <span className="px-2 py-0.5 bg-slate-800/80 rounded-md border border-slate-700/60">
              Admin Geral
            </span>
            <span className="px-2 py-0.5 bg-slate-800/80 rounded-md border border-slate-700/60">
              Coordenador de Projetos
            </span>
            <span className="px-2 py-0.5 bg-slate-800/80 rounded-md border border-slate-700/60">
              Voluntário Operacional
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
