import React from 'react';
import { SiteContent } from '../../types';

interface ImpactoNumerosProps {
  content: SiteContent;
}

export const ImpactoNumeros: React.FC<ImpactoNumerosProps> = ({ content }) => {
  const stats = [
    { value: content.impacto_criancas, label: 'crianças e jovens atendidos' },
    { value: content.impacto_voluntarios, label: 'voluntários ativos' },
    { value: content.impacto_eventos, label: 'eventos comunitários' },
    { value: content.impacto_projetos, label: 'projetos permanentes' },
  ];

  return (
    <section className="bg-band text-white" aria-label="Nossos números">
      <dl className="container-site grid grid-cols-2 gap-3 py-8 sm:gap-6 lg:grid-cols-4 lg:gap-8 lg:py-14">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-glass flex flex-col-reverse gap-1.5 p-4 lg:px-6 lg:py-[22px]">
            <dt className="text-sm text-brand-light lg:text-[15px]">{stat.label}</dt>
            <dd className="text-[34px] font-extrabold leading-none tracking-[-0.03em] lg:text-5xl">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
