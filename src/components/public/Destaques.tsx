import React from 'react';
import { DESTAQUES, Destaque } from '../../data/destaques';

interface DestaquesProps {
  instagramUrl: string;
}

const chipCor: Record<Destaque['cor'], string> = {
  destaque: 'bg-sun text-ink font-extrabold',
  sol: 'bg-sun-soft text-sun-ink font-extrabold',
  marca: 'bg-brand-soft text-brand-ink font-extrabold',
};

export const Destaques: React.FC<DestaquesProps> = ({ instagramUrl }) => {
  if (DESTAQUES.length === 0) return null;
  const [principal, ...outros] = DESTAQUES;

  return (
    <section id="destaques" className="container-site flex flex-col gap-5 py-12 sm:gap-11 sm:py-24">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2 sm:gap-3">
          <span className="kicker">Destaques</span>
          <h2 className="section-title">Acontece na associação</h2>
        </div>
        <a href={instagramUrl} target="_blank" rel="noreferrer" className="link-arrow hidden sm:inline">
          Acompanhe no Instagram →
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article className="relative h-[380px] overflow-hidden rounded-[14px] bg-brand-dark text-white lg:col-span-7 lg:h-[460px]">
          <img
            src={principal.foto_url}
            alt={principal.alt}
            loading="lazy"
            style={{ objectPosition: principal.posicao }}
            className="h-full w-full object-cover"
          />
          <div className="bg-news-scrim absolute inset-x-0 bottom-0 flex flex-col gap-2.5 px-5 pb-[22px] pt-[110px] lg:px-8 lg:pb-[30px] lg:pt-[120px]">
            <div className="flex items-center gap-3 text-[13px]">
              <span className={`chip text-xs ${chipCor[principal.cor]}`}>{principal.categoria}</span>
              {principal.data && <span className="text-brand-light">{principal.data}</span>}
            </div>
            <h3 className="text-xl font-extrabold leading-tight lg:text-[26px]">{principal.titulo}</h3>
          </div>
        </article>

        {outros.length > 0 && (
          <div className="hidden flex-col gap-6 lg:col-span-5 lg:flex">
            {outros.map((d) => (
              <article key={d.id} className="flex h-[218px] gap-5 overflow-hidden rounded-[10px] border border-line bg-white">
                <img
                  src={d.foto_url}
                  alt={d.alt}
                  loading="lazy"
                  style={{ objectPosition: d.posicao }}
                  className="h-full w-[200px] shrink-0 object-cover"
                />
                <div className="flex flex-col gap-2.5 py-6 pl-1 pr-6">
                  <div className="flex items-center gap-2.5 text-[13px]">
                    <span className={`chip ${chipCor[d.cor]}`}>{d.categoria}</span>
                    {d.data && <span className="text-muted">{d.data}</span>}
                  </div>
                  <h3 className="text-[19px] font-extrabold leading-snug text-brand-dark">{d.titulo}</h3>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <a href={instagramUrl} target="_blank" rel="noreferrer" className="btn-secondary min-h-12 w-full sm:hidden">
        Ver mais no Instagram
      </a>
    </section>
  );
};
