import React from 'react';
import { Heart, MapPin, Phone, Mail, Instagram, Shield, MessageCircle, ExternalLink } from 'lucide-react';
import { SiteContent } from '../../types';
import { NovoAmanhecerLogo } from '../brand/NovoAmanhecerLogo';

interface FooterProps {
  content: SiteContent;
  onOpenAdmin: () => void;
  onOpenCadastro: () => void;
}

export const Footer: React.FC<FooterProps> = ({ content, onOpenAdmin, onOpenCadastro }) => {
  return (
    <footer id="contato" className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Apresentação da Associação & Logo Oficial */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 inline-block">
              <div className="[&_span.text-slate-900]:text-white [&_span.text-amber-700]:text-amber-400 [&_span.text-slate-500]:text-slate-400">
                <NovoAmanhecerLogo size="md" showText={true} />
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Associação comunitária sem fins lucrativos que acolhe crianças, famílias e gestantes com ballet, futebol, ensaios fotográficos de gestantes e grandes celebrações na comunidade de Trindade.
            </p>

            <div className="text-xs text-slate-300 space-y-1.5 font-mono">
              <div><strong className="text-slate-400 font-sans">CNPJ:</strong> {content.contato_cnpj}</div>
              <div><strong className="text-slate-400 font-sans">Chave PIX:</strong> {content.contato_pix_chave}</div>
            </div>

            <div className="pt-2">
              <a
                href={content.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-amber-400 border border-slate-800 transition-colors"
              >
                <Instagram className="w-4 h-4 text-pink-400" />
                <span>@anovoamanhecer no Instagram</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </div>
          </div>

          {/* Navegação Rápida */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Navegação
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#inicio" className="hover:text-amber-400 transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="#sobre" className="hover:text-amber-400 transition-colors">
                  Nossa História
                </a>
              </li>
              <li>
                <a href="#projetos" className="hover:text-amber-400 transition-colors">
                  Projetos Sociais
                </a>
              </li>
              <li>
                <a href="#galeria" className="hover:text-amber-400 transition-colors">
                  Galeria de Fotos
                </a>
              </li>
              <li>
                <a href="#como-ajudar" className="hover:text-amber-400 transition-colors">
                  Como Ajudar (PIX)
                </a>
              </li>
              <li>
                <a href="#transparencia" className="hover:text-amber-400 transition-colors">
                  Transparência & Estatuto
                </a>
              </li>
            </ul>
          </div>

          {/* Projetos Sociais */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Nossos Pilares
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Aulas de Ballet Solidário</li>
              <li>Escolinha de Futebol Comunitário</li>
              <li>Projeto Book Solidário de Gestantes</li>
              <li>Festas em Datas Comemorativas</li>
              <li className="pt-3">
                <button
                  onClick={onOpenCadastro}
                  className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer text-left"
                >
                  Fazer Inscrição no Cadastro →
                </button>
              </li>
            </ul>
          </div>

          {/* Contato & Localização Oficial Informada */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Sede Comunitária Oficial
            </div>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="leading-snug">{content.contato_endereco}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{content.contato_telefone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <a
                  href={`https://wa.me/55${content.contato_whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: {content.contato_whatsapp}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">{content.contato_email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Associação Novo Amanhecer · Setor Ponta Kayana, Trindade/GO. CNPJ {content.contato_cnpj}.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Acesso ao Painel Administrativo</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
