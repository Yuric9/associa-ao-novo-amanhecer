import React, { useState } from 'react';
import { Menu, X, Download } from 'lucide-react';
import { SiteContent } from '../../types';
import { NovoAmanhecerLogo } from '../brand/NovoAmanhecerLogo';
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
  { label: 'Galeria', href: '#galeria' },
  { label: 'Transparência', href: '#transparencia' },
  { label: 'Contato', href: '#contato' },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenCadastro, onOpenAdmin, isAdminLoggedIn }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePwa();
  const canInstall = !isInstalled && (isInstallable || isIOS);
  const close = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-site flex h-[72px] items-center justify-between gap-6">
        <a href="#inicio" className="rounded-md" aria-label="Associação Novo Amanhecer — início">
          <NovoAmanhecerLogo size="md" />
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Menu principal">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-[15px] font-medium text-ink hover:text-brand">
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
          <a href="#como-ajudar" className="btn-primary">
            Doar
          </a>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-line-strong bg-white text-ink lg:hidden"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-line bg-white lg:hidden">
          <nav className="container-site flex flex-col py-3" aria-label="Menu principal">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={close}
                className="border-b border-line py-3 text-base font-medium text-ink last:border-b-0"
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
            <a href="#como-ajudar" onClick={close} className="btn-secondary w-full">
              Doar
            </a>
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
  );
};
