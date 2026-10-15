import React from 'react';
import { SiteContent } from '../../types';
import { cleanDigits } from '../../utils/validation';

interface FloatingWhatsAppButtonProps {
  content: SiteContent;
}

/** Botão fixo e discreto que abre a conversa no WhatsApp oficial da associação. */
export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({ content }) => {
  const rawDigits = cleanDigits(content.contato_whatsapp || '');
  if (!rawDigits) return null;

  const fullPhone = rawDigits.startsWith('55') ? rawDigits : `55${rawDigits}`;
  const message =
    content.contato_whatsapp_mensagem ||
    'Olá! Vim pelo site da Associação Novo Amanhecer e gostaria de mais informações.';
  const href = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

  return (
    <aside aria-label="Atalho para o WhatsApp">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar com a associação no WhatsApp"
        className="fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-[#1f7a4d] text-[15px] font-semibold text-white shadow-md hover:bg-[#186540] sm:bottom-5 sm:right-5 sm:h-12 sm:w-auto sm:justify-start sm:pl-4 sm:pr-5 print:hidden"
      >
        <svg width="24" height="24" className="sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12z" />
        </svg>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </aside>
  );
};
