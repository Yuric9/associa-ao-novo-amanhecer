import React from 'react';
import { SiteContent } from '../../types';
import { NovoAmanhecerLogo } from '../brand/NovoAmanhecerLogo';

interface FooterProps {
  content: SiteContent;
  onOpenAdmin: () => void;
  onOpenCadastro: () => void;
  onOpenPrivacidade?: () => void;
}

const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');

const Icon: React.FC<{ d: string }> = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <path d={d} />
  </svg>
);

const PHONE = 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2';
const CHAT = 'M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12z';
const MAIL = 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm-1 2 9 6 9-6';

export const Footer: React.FC<FooterProps> = ({ content, onOpenAdmin, onOpenCadastro, onOpenPrivacidade }) => {
  const tel = onlyDigits(content.contato_telefone);
  const wa = onlyDigits(content.contato_whatsapp);
  const mesmoNumero = tel && tel === wa;

  return (
    <footer id="contato" className="border-t border-line bg-white">
      <div className="container-site grid grid-cols-1 gap-10 py-14 sm:py-16 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-4 lg:col-span-4">
          <NovoAmanhecerLogo size="md" />
          <p className="max-w-sm text-[15px] leading-relaxed text-muted">{content.contato_endereco}</p>
        </div>

        <div className="flex flex-col gap-3 text-[15px] lg:col-span-4 lg:col-start-6">
          <span className="text-[13px] font-semibold text-muted">Contato</span>
          {wa && (
            <a href={`https://wa.me/55${wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:text-brand">
              <Icon d={CHAT} />
              {mesmoNumero ? 'Telefone e WhatsApp' : 'WhatsApp'} {content.contato_whatsapp}
            </a>
          )}
          {tel && !mesmoNumero && (
            <a href={`tel:+55${tel}`} className="flex items-center gap-2.5 hover:text-brand">
              <Icon d={PHONE} />
              {content.contato_telefone}
            </a>
          )}
          {content.contato_email && (
            <a href={`mailto:${content.contato_email}`} className="flex items-center gap-2.5 break-all hover:text-brand">
              <Icon d={MAIL} />
              {content.contato_email}
            </a>
          )}
        </div>

        <div className="flex flex-col gap-3 text-[15px] lg:col-span-3 lg:col-start-10">
          <span className="text-[13px] font-semibold text-muted">Acompanhe</span>
          <a href={content.instagram_url} target="_blank" rel="noreferrer" className="hover:text-brand">
            Instagram @anovoamanhecer
          </a>
          <button onClick={onOpenCadastro} className="text-left hover:text-brand">
            Inscrever uma criança
          </button>
          <a href="#transparencia" className="hover:text-brand">
            Transparência
          </a>
          {onOpenPrivacidade && (
            <button onClick={onOpenPrivacidade} className="text-left hover:text-brand">
              Política de privacidade
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-site flex flex-col gap-3 py-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Associação Novo Amanhecer · CNPJ {content.contato_cnpj}
          </span>
          <div className="flex items-center gap-5">
            <span>Desenvolvido por YC Soluções e Tecnologias</span>
            <button onClick={onOpenAdmin} className="hover:text-ink">
              Área da equipe
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
