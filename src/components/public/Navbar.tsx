import React, { useState } from 'react';
import { Menu, X, Download } from 'lucide-react';
import { SiteContent } from '../../types';
import { NovoAmanhecerLogo, NovoAmanhecerMark } from '../brand/NovoAmanhecerLogo';
import { usePwa } from '../../pwa/usePwa';

interface NavbarProps {
  content: SiteContent;
  onOpenCadastro: (projetoPredefinido?: string) => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

const links = [
  { label: 'Quem somos', href: '#sobre' },
  { label: 'Projetos', href: '#projetos' },
  { label: 'Destaques', href: '#destaques' },
  { label: 'Transparência', href: '#transparencia' },
  { label: 'Contato', href: '#contato' },
];

const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');

export const Navbar: React.FC<NavbarProps> = ({ content, onOpenCadastro, onOpenAdmin, isAdminLoggedIn }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePwa();
  const canInstall = !isInstalled && (isInstallable || isIOS);
  const close = () => setMobileMenuOpen(false);
  const wa = onlyDigits(content.contato_whatsapp);

  return (
    <>
      {/* Faixa superior (só no computador) */}
      <div className="hidden bg-brand-dark text-[13px] text-brand-light lg:block">
        <div className="container-site flex h-10 items-center justify-between">
          <span>
            CNPJ {content.contato_cnpj} · Setor Ponta Kayana, {content.contato_cidade} — GO
          </span>
          <div className="flex gap-6">
            {wa && (
              <a href={`https://wa.me/55${wa}`} target="_blank" rel="noreferrer" className="text-white hover:opacity-80">
                WhatsApp {content.contato_whatsapp}
              </a>
            )}
            <a href={content.instagram_url} target="_blank" rel="noreferrer" className="text-white hover:opacity-80">
              Instagram @anovoamanhecer
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="container-site flex h-16 items-center justify-between gap-6 lg:h-[84px]">
          <a href="#inicio" className="rounded-md" aria-label="Associação Novo Amanhecer — início">
            <span className="flex items-center gap-2.5 lg:hidden">
              <NovoAmanhecerMark size={36} className="shrink-0" />
              <span className="text-[15px] font-extrabold text-brand-dark">Novo Amanhecer</span>
            </span>
            <span className="hidden lg:block">
              <NovoAmanhecerLogo size="md" />
            </span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Menu principal">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-[15px] font-semibold text-ink hover:text-brand">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {isAdminLoggedIn && (
              <button onClick={onOpenAdmin} className="text-[15px] font-medium text-muted hover:text-ink">
                Painel
              </button>
            )}
            <button onClick={() => onOpenCadastro()} className="btn-secondary">
              Inscrever-se
            </button>
            <a href="#como-ajudar" className="btn-sun px-6">
              Doar
            </a>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <a href="#como-ajudar" onClick={close} className="btn-sun px-4 text-sm">
              Doar
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-line-strong bg-white text-brand-dark"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-line bg-white lg:hidden">
            <nav className="container-site flex flex-col py-3" aria-label="Menu principal">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="border-b border-line py-3 text-base font-semibold text-ink last:border-b-0"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="container-site flex flex-col gap-3 pb-5">
              <button
                onClick={() => {
                  close();
                  onOpenCadastro();
                }}
                className="btn-primary w-full"
              >
                Inscrever uma criança
              </button>
              {canInstall && (
                <button
                  onClick={() => {
                    close();
                    promptInstall();
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 text-[15px] font-medium text-muted"
                >
                  <Download className="h-4 w-4" />
                  Instalar o app no celular
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
