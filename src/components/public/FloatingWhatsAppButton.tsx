import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles, PhoneCall } from 'lucide-react';
import { SiteContent } from '../../types';
import { cleanDigits } from '../../utils/validation';
import { NovoAmanhecerLogo } from '../brand/NovoAmanhecerLogo';

interface FloatingWhatsAppButtonProps {
  content: SiteContent;
}

export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Normaliza o número de telefone para o padrão do WhatsApp (55 + DDD + Número)
  const rawDigits = cleanDigits(content.contato_whatsapp || '62993418820');
  const fullPhone = rawDigits.startsWith('55') ? rawDigits : `55${rawDigits}`;

  // Mensagem padrão definida no CMS do site
  const defaultMessage =
    content.contato_whatsapp_mensagem ||
    'Olá! Vim pelo site da Associação Novo Amanhecer e gostaria de mais informações sobre os projetos e como ajudar.';

  const buildWhatsAppUrl = (customText?: string) => {
    const textToSend = customText || defaultMessage;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(textToSend)}`;
  };

  const handleDirectChat = () => {
    window.open(buildWhatsAppUrl(), '_blank', 'noopener,noreferrer');
  };

  const quickTopics = [
    {
      title: 'Dúvidas Gerais',
      message: defaultMessage,
    },
    {
      title: '🩰 Inscrição no Ballet',
      message: 'Olá! Gostaria de saber mais sobre as vagas e horários das Aulas de Ballet Solidário para crianças.',
    },
    {
      title: '⚽ Escolinha de Futebol',
      message: 'Olá! Gostaria de informações sobre os treinos da Escolinha de Futebol Comunitário no Setor Ponta Kayana.',
    },
    {
      title: '🤰 Book Gestante Solidário',
      message: 'Olá! Gostaria de saber como participar do Projeto Book Solidário e do acolhimento com kit para gestantes.',
    },
    {
      title: '💚 Como Doar ou Apoiar',
      message: `Olá! Quero apoiar a Associação Novo Amanhecer com doações ou voluntariado. Como posso contribuir?`,
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end print:hidden">
      {/* Balão de Atendimento Interativo (Aparece ao clicar para ver tópicos) */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-200 text-slate-900">
          {/* Cabeçalho Verde WhatsApp com Logo Oficial */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 p-1 flex items-center justify-center shrink-0">
                <NovoAmanhecerLogo size="sm" showText={false} />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-wide text-white">
                  Associação Novo Amanhecer
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>Normalmente responde em instantes</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fechar janela do WhatsApp"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Corpo do Balão com Mensagem do Contexto do Site */}
          <div className="p-4 bg-emerald-50/40 space-y-3.5">
            {/* Mensagem Institucional */}
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-2xs border border-emerald-100/80 text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <span>Paz e bem! Como podemos te ajudar hoje?</span>
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed italic bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                "{defaultMessage}"
              </p>
            </div>

            {/* Tópicos Rápidos Opcionais */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-1">
                Ou selecione um assunto específico:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      window.open(buildWhatsAppUrl(topic.message), '_blank', 'noopener,noreferrer');
                      setIsOpen(false);
                    }}
                    className="text-[11px] font-semibold text-slate-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all text-left cursor-pointer"
                  >
                    {topic.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Botão de Envio Principal com o Contexto do Site */}
            <button
              onClick={() => {
                handleDirectChat();
                setIsOpen(false);
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-2xl font-black text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Iniciar Conversa com a Mensagem do Site</span>
            </button>

            <div className="text-[10px] text-center text-slate-400">
              Atendimento pelo número oficial: <strong>{content.contato_whatsapp}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Botão Flutuante Principal 'Fale Conosco' */}
      <div className="flex items-center gap-2 group">
        {/* Balãozinho de Dica no Desktop */}
        <div className="hidden md:flex items-center gap-1.5 bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-slate-200/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>WhatsApp Oficial: {content.contato_whatsapp}</span>
        </div>

        {/* Botão Principal com Efeito Glow e Animação */}
        <div className="relative flex items-center">
          {/* Anel Pulsante Suave */}
          <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping opacity-75 pointer-events-none"></span>

          <div className="relative flex items-center rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 text-white shadow-xl shadow-emerald-600/35 hover:shadow-2xl hover:shadow-emerald-600/50 hover:scale-105 transition-all p-1">
            {/* Clique principal: Abre o WhatsApp diretamente com a mensagem do site */}
            <button
              onClick={handleDirectChat}
              className="flex items-center gap-2.5 pl-3 pr-2.5 py-2 text-xs font-black tracking-wide text-white cursor-pointer focus:outline-none"
              title="Fale Conosco no WhatsApp da Associação"
              aria-label="Fale Conosco no WhatsApp"
            >
              <div className="relative">
                <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-emerald-600"></span>
              </div>
              <span className="font-bold sm:inline">Fale Conosco</span>
            </button>

            {/* Botão de Abrir Opções / Menu de Tópicos */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-full hover:bg-white/20 text-emerald-100 hover:text-white transition-colors cursor-pointer border-l border-white/20 ml-0.5"
              title={isOpen ? 'Fechar opções' : 'Ver opções de contato'}
              aria-label="Abrir opções de mensagens"
            >
              {isOpen ? (
                <X className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
