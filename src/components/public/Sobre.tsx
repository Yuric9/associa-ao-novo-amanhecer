import React from 'react';
import { Heart, Compass, ShieldCheck, Users, Sun } from 'lucide-react';
import { SiteContent } from '../../types';

interface SobreProps {
  content: SiteContent;
}

export const Sobre: React.FC<SobreProps> = ({ content }) => {
  return (
    <section id="sobre" className="py-16 sm:py-24 bg-white border-t border-amber-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Coluna de História e Significado */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <span>Sobre a Associação</span>
              <span aria-hidden="true">·</span>
              <span>Nossa História</span>
              <span aria-hidden="true">·</span>
              <span>Trindade/GO</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Não somos uma instituição distante. Somos uma grande família de portas abertas.
            </h2>

            <p className="text-base text-slate-700 leading-relaxed font-normal">
              {content.sobre_historia}
            </p>

            <p className="text-sm text-slate-600 leading-relaxed">
              Aqui em Trindade, cada mãe que chega para o Book Solidário, cada menina que calça as sapatilhas de ballet, cada menino que corre atrás da bola e cada família que participa das nossas festas comunitárias é recebida pelo nome, com escuta atenta e respeito.
            </p>

            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/70 flex items-center gap-3">
              <Sun className="w-6 h-6 text-amber-600 shrink-0" />
              <div className="text-xs text-amber-950 font-medium">
                <strong>Nosso propósito em Trindade:</strong> Fortalecer os laços comunitários através da arte, do esporte e da solidariedade ativa.
              </div>
            </div>
          </div>

          {/* Coluna Missão, Visão e Valores em Cards Acolhedores */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Missão */}
            <div className="bg-amber-50/40 p-6 rounded-3xl border border-amber-100/90 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <Heart className="w-5 h-5 fill-amber-700 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Nossa Missão</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {content.sobre_missao}
              </p>
            </div>

            {/* Visão */}
            <div className="bg-orange-50/40 p-6 rounded-3xl border border-orange-100/90 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center mb-3">
                <Compass className="w-5 h-5 text-orange-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Nossa Visão</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {content.sobre_visao}
              </p>
            </div>

            {/* Valores */}
            <div className="bg-amber-50/40 p-6 rounded-3xl border border-amber-100/90 shadow-2xs sm:col-span-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-200/80 text-amber-900 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5 text-amber-800" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Nossos Valores</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {content.sobre_valores}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
