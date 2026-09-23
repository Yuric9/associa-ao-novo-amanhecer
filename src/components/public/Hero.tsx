import React from 'react';
import { ArrowRight, UserPlus, Heart, Sparkles, MapPin, Instagram, CheckCircle } from 'lucide-react';
import { SiteContent } from '../../types';
import { NovoAmanhecerLogo } from '../brand/NovoAmanhecerLogo';

interface HeroProps {
  content: SiteContent;
  onOpenCadastro: () => void;
}

export const Hero: React.FC<HeroProps> = ({ content, onOpenCadastro }) => {
  return (
    <section id="inicio" className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 bg-gradient-to-b from-amber-50/70 via-orange-50/30 to-white">
      {/* Luz ambiente acolhedora */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-10 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Coluna de Texto & Ações */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Tagline / Kicker com o novo endereço do Setor Ponta Kayana */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 mb-4 bg-amber-100/70 px-3 py-1 rounded-xl">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                Setor Ponta Kayana · Trindade - GO
              </span>
              <span aria-hidden="true" className="text-amber-400">·</span>
              <span>CNPJ {content.contato_cnpj}</span>
              <span aria-hidden="true" className="text-amber-400">·</span>
              <span className="text-emerald-800 font-extrabold">100% Gratuito</span>
            </div>

            {/* Frase Curta e Acolhedora (Padrão Time da Inclusão) */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-5">
              Uma comunidade que acolhe, cuida e{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-orange-600 to-amber-900">
                faz o amor florescer.
              </span>
            </h1>

            {/* Subtítulo Humanizado */}
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-8 max-w-2xl font-normal">
              {content.hero_subtitle}
            </p>

            {/* Botões de Ação Direta */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
              <button
                onClick={onOpenCadastro}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-extrabold text-white bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 rounded-2xl shadow-lg shadow-orange-600/25 hover:shadow-orange-600/35 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <UserPlus className="w-5 h-5" />
                <span>Quero me Cadastrar</span>
              </button>

              <a
                href="#projetos"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-bold text-slate-800 bg-white hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 rounded-2xl shadow-xs transition-all hover:-translate-y-0.5"
              >
                <span>Conheça os Projetos</span>
                <ArrowRight className="w-4 h-4 text-amber-700" />
              </a>

              <a
                href="#como-ajudar"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl transition-all"
              >
                <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>Doar via PIX</span>
              </a>
            </div>

            {/* Destaque do Instagram Oficial */}
            <a
              href={content.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-amber-900 bg-white border border-slate-200 hover:border-amber-300 px-4 py-2 rounded-xl transition-all shadow-2xs"
            >
              <Instagram className="w-4 h-4 text-pink-600" />
              <span>Acompanhe as ações diárias no Instagram: <strong>@anovoamanhecer</strong></span>
            </a>
          </div>

          {/* Coluna Visual: Mosaico de Fotos Reais da Associação */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Card Principal: Futebol e Celebrações da Comunidade */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] sm:aspect-[16/11]">
                <img
                  src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1000&q=80"
                  alt="Escolinha de Futebol Comunitário da Associação Novo Amanhecer em Trindade"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-amber-300 uppercase mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Setor Ponta Kayana · Trindade/GO</span>
                  </div>
                  <p className="text-sm font-semibold leading-snug">
                    Futebol masculino e feminino, ballet, book para gestantes e grandes festas comunitárias.
                  </p>
                </div>
              </div>

              {/* Card Flutuante 1: O Medalhão Oficial da Associação */}
              <div className="absolute -bottom-6 -left-3 sm:-left-6 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 max-w-[270px] flex items-center gap-3">
                <NovoAmanhecerLogo size="sm" showText={false} />
                <div>
                  <div className="text-xs font-extrabold text-slate-900 leading-tight">
                    Comunidade que Acolhe
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Portas abertas para todas as famílias de Trindade.
                  </div>
                </div>
              </div>

              {/* Card Flutuante 2: 100% Gratuito e Transparente */}
              <div className="absolute -top-4 -right-2 sm:-right-4 bg-white/95 backdrop-blur-xs px-4 py-2 rounded-2xl shadow-lg border border-amber-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-900">Ações 100% Gratuitas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
