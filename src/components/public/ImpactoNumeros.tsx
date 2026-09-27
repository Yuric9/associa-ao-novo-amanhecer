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
    <section className="container-site" aria-label="Nossos números">
      <dl className="grid grid-cols-2 gap-8 border-y border-line py-10 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse gap-1.5">
            <dt className="text-[15px] text-muted">{stat.label}</dt>
            <dd className="text-4xl font-bold leading-none tracking-tight text-ink sm:text-5xl">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
