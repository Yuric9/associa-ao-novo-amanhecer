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

  const linkCls = 'text-left text-brand-light hover:text-white';

  return (
    <footer id="contato" className="bg-footer text-[15px] text-brand-light">
      <div className="container-site grid grid-cols-1 gap-10 py-10 sm:grid-cols-2 sm:py-16 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-4">
          <NovoAmanhecerLogo size="md" inverted />
          <p className="max-w-sm leading-relaxed">{content.contato_endereco}</p>
        </div>

        <div className="hidden flex-col gap-2.5 lg:col-span-2 lg:col-start-6 lg:flex">
          <span className="text-[13px] font-extrabold uppercase text-sun">Projetos</span>
          <a href="#projetos" className={linkCls}>Ballet</a>
          <a href="#projetos" className={linkCls}>Escolinha River</a>
          <a href="#projetos" className={linkCls}>Book Solidário</a>
          <a href="#projetos" className={linkCls}>Ações sociais</a>
        </div>

        <div className="flex flex-col gap-2.5 lg:col-span-2 lg:col-start-8">
          <span className="text-[13px] font-extrabold uppercase text-sun">Institucional</span>
          <a href="#sobre" className={linkCls}>Quem somos</a>
          <a href="#transparencia" className={linkCls}>Transparência</a>
          <a href="#como-ajudar" className={linkCls}>Como ajudar</a>
          <button onClick={onOpenCadastro} className={linkCls}>
            Inscrever uma criança
          </button>
          {onOpenPrivacidade && (
            <button onClick={onOpenPrivacidade} className={linkCls}>
              Política de privacidade
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2.5 lg:col-span-3 lg:col-start-10">
          <span className="text-[13px] font-extrabold uppercase text-sun">Contato</span>
          {wa && (
            <a href={`https://wa.me/55${wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 font-bold text-white hover:opacity-80">
              <Icon d={CHAT} />
              {mesmoNumero ? 'Telefone e WhatsApp' : 'WhatsApp'} {content.contato_whatsapp}
            </a>
          )}
          {tel && !mesmoNumero && (
            <a href={`tel:+55${tel}`} className={`flex items-center gap-2.5 ${linkCls}`}>
              <Icon d={PHONE} />
              {content.contato_telefone}
            </a>
          )}
          {content.contato_email && (
            <a href={`mailto:${content.contato_email}`} className={`flex items-center gap-2.5 break-all ${linkCls}`}>
              <Icon d={MAIL} />
              {content.contato_email}
            </a>
          )}
          <a href={content.instagram_url} target="_blank" rel="noreferrer" className={linkCls}>
            Instagram @anovoamanhecer
          </a>
        </div>
      </div>

      <div className="container-site">
        <div className="flex flex-col gap-3 border-t border-brand-line py-6 text-[13px] text-brand-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Associação Novo Amanhecer · CNPJ {content.contato_cnpj}
          </span>
          <div className="flex items-center gap-5">
            <span>Desenvolvido por YC Soluções e Tecnologias</span>
            <button onClick={onOpenAdmin} className="min-h-11 hover:text-white">
              Área da equipe
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
