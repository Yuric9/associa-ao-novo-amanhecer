import React from 'react';
import { SiteContent } from '../../types';

interface SobreProps {
  content: SiteContent;
}

export const Sobre: React.FC<SobreProps> = ({ content }) => {
  const pilares = [
    { titulo: 'Missão', texto: content.sobre_missao },
    { titulo: 'Visão', texto: content.sobre_visao },
    { titulo: 'Valores', texto: content.sobre_valores },
  ];

  return (
    <section id="sobre" className="border-y border-line bg-white py-20 sm:py-24">
      <div className="container-site grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-3.5 lg:col-span-5">
          <span className="kicker">Quem somos</span>
          <h2 className="section-title">Uma associação feita pelos vizinhos, para os vizinhos</h2>
        </div>
        <div className="flex flex-col gap-8 lg:col-span-6 lg:col-start-7">
          <p className="text-lg leading-relaxed text-body">{content.sobre_historia}</p>
          <div className="grid grid-cols-1 gap-7 border-t border-line pt-7 sm:grid-cols-3">
            {pilares.map((p) => (
              <div key={p.titulo} className="flex flex-col gap-2">
                <h3 className="text-base font-bold text-ink">{p.titulo}</h3>
                <p className="text-[15px] leading-relaxed text-body">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
