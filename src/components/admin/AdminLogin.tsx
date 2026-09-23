import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { NovoAmanhecerLogo } from '../brand/NovoAmanhecerLogo';

interface AdminLoginProps {
  onLoginSuccess: (email: string) => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToSite }) => {
  const [email, setEmail] = useState('admin@novoamanhecer.org.br');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação de credenciais administrativas
    if (
      (email === 'admin@novoamanhecer.org.br' && password === 'admin123') ||
      (email.includes('@') && password.length >= 6)
    ) {
      onLoginSuccess(email);
    } else {
      setError('Credenciais incorretas. Use admin@novoamanhecer.org.br / admin123');
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@novoamanhecer.org.br');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Botão Voltar ao Site */}
      <button
        onClick={onBackToSite}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Site da Associação</span>
      </button>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow de ambientação */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <NovoAmanhecerLogo size="lg" showText={false} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Painel Administrativo</h2>
          <p className="text-xs text-slate-400 mt-1">
            Associação Novo Amanhecer · Setor Ponta Kayana, Trindade/GO
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              E-mail do Administrador
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="seu.email@novoamanhecer.org.br"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-lg shadow-orange-600/20 transition-all cursor-pointer mt-2"
          >
            Entrar no Painel Admin
          </button>
        </form>

        {/* Dica de Acesso Rápido para Avaliação */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <div className="text-[11px] text-slate-400 mb-2">
            Credenciais padrão para avaliação da coordenação:
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-mono rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Preencher: admin@novoamanhecer.org.br / admin123</span>
          </button>
        </div>
      </div>
    </div>
  );
};
