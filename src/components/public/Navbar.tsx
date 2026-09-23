import React, { useState } from 'react';
import { Menu, X, Shield, UserPlus, Heart, Copy, Check, Instagram, MapPin, Download } from 'lucide-react';
import { SiteContent } from '../../types';
import { NovoAmanhecerLogo } from '../brand/NovoAmanhecerLogo';
import { usePwa } from '../../pwa/usePwa';

interface NavbarProps {
  content: SiteContent;
  onOpenCadastro: (projetoPredefinido?: string) => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  content,
  onOpenCadastro,
  onOpenAdmin,
  isAdminLoggedIn,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePwa();

  const links = [
    { label: 'Início', href: '#inicio' },
    { label: 'Sobre Nós', href: '#sobre' },
    { label: 'Projetos', href: '#projetos' },
    { label: 'Momentos & Fotos', href: '#galeria' },
    { label: 'Instagram', href: '#instagram' },
    { label: 'Como Ajudar', href: '#como-ajudar' },
    { label: 'Transparência', href: '#transparencia' },
    { label: 'Contato', href: '#contato' },
  ];

  const handleCopyPix = () => {
    navigator.clipboard.writeText(content.contato_pix_chave);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-2xs">
      {/* Barra de utilidades institucional (estilo Time da Inclusão) */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-amber-50 text-[11px] sm:text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-amber-200">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Ponta Kayana · Trindade - GO</span>
            </span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-300 font-mono">
              CNPJ: {content.contato_cnpj}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleCopyPix}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white transition-colors cursor-pointer"
              title="Copiar chave PIX (CNPJ)"
            >
              {copiedPix ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">PIX Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-amber-300" />
                  <span>Chave PIX: <strong className="font-mono text-white">{content.contato_cnpj}</strong></span>
                </>
              )}
            </button>

            {!isInstalled && (isInstallable || isIOS) && (
              <button
                onClick={promptInstall}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded transition-colors cursor-pointer"
                title="Instalar aplicativo PWA no dispositivo"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>Instalar App</span>
              </button>
            )}

            <a
              href={content.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1 text-slate-300 hover:text-amber-200 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              <span>@anovoamanhecer</span>
            </a>
          </div>
        </div>
      </div>

      {/* Menu Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Oficial com o Medalhão Dourado e Faixa */}
          <a href="#inicio" className="flex items-center group focus:outline-none py-1">
            <NovoAmanhecerLogo size="md" showText={true} />
          </a>

          {/* Navegação Desktop */}
          <nav className="hidden xl:flex items-center gap-6">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] font-bold text-slate-700 hover:text-amber-800 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-amber-600 hover:after:w-full after:transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Botões de Ação */}
          <div className="hidden sm:flex items-center gap-2.5">
            <a
              href="#como-ajudar"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs"
            >
              <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>Doar via PIX</span>
            </a>

            <button
              onClick={() => onOpenCadastro()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-md shadow-orange-600/20 hover:shadow-orange-600/30 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Cadastre-se</span>
            </button>

            <button
              onClick={onOpenAdmin}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isAdminLoggedIn
                  ? 'bg-amber-100/90 border-amber-300 text-amber-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
              }`}
              title="Acesso Administrativo"
            >
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>{isAdminLoggedIn ? 'Painel (Ativo)' : 'Admin'}</span>
            </button>
          </div>

          {/* Menu Mobile Trigger */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={() => onOpenCadastro()}
              className="px-3 py-1.5 text-xs font-extrabold text-white bg-amber-600 rounded-lg shadow-xs"
            >
              Cadastrar
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Mobile */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-amber-100 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-700 hover:text-amber-800 hover:bg-amber-50 px-3 py-2 rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {!isInstalled && (isInstallable || isIOS) && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    promptInstall();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 border border-amber-300/80 rounded-xl"
                >
                  <Download className="w-4 h-4 text-amber-800" />
                  <span>Instalar Aplicativo no Celular</span>
                </button>
              )}
              <a
                href="#como-ajudar"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl"
              >
                <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>Doar via PIX (CNPJ)</span>
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCadastro();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Quero me Cadastrar</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                <Shield className="w-4 h-4 text-amber-700" />
                <span>{isAdminLoggedIn ? 'Painel Administrativo' : 'Acesso Admin'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
