import React from 'react';
import { Users, Heart, Calendar, Sparkles } from 'lucide-react';
import { SiteContent } from '../../types';

interface ImpactoNumerosProps {
  content: SiteContent;
}

export const ImpactoNumeros: React.FC<ImpactoNumerosProps> = ({ content }) => {
  const stats = [
    {
      label: 'Crianças & Jovens Atendidos',
      value: `+${content.impacto_criancas}`,
      description: 'Nas turmas de ballet, escolinha de futebol e oficinas',
      icon: Users,
      color: 'text-amber-700 bg-amber-100/80',
    },
    {
      label: 'Voluntários Ativos',
      value: `+${content.impacto_voluntarios}`,
      description: 'Professores, fotógrafas, treinadores e mães voluntárias',
      icon: Heart,
      color: 'text-orange-700 bg-orange-100/80',
    },
    {
      label: 'Edições de Eventos Realizadas',
      value: `${content.impacto_eventos}`,
      description: 'Dias das Crianças, Natal Solidário e Páscoa Comunitária',
      icon: Calendar,
      color: 'text-emerald-700 bg-emerald-100/80',
    },
    {
      label: 'Projetos Sociais Ativos',
      value: `${content.impacto_projetos}`,
      description: 'Ballet, Futebol, Book Gestante e Festas Comunitárias',
      icon: Sparkles,
      color: 'text-purple-700 bg-purple-100/80',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-xs p-6 rounded-3xl border border-white/20 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
                    Trindade/GO
                  </span>
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm font-bold text-amber-50 leading-snug">
                    {stat.label}
                  </div>
                  <div className="text-xs text-amber-100/80 mt-1 leading-relaxed">
                    {stat.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
