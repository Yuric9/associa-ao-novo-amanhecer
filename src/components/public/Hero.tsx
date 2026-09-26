import React from 'react';
import { SiteContent } from '../../types';

interface HeroProps {
  content: SiteContent;
  onOpenCadastro: () => void;
}

export const Hero: React.FC<HeroProps> = ({ content, onOpenCadastro }) => {
  return (
    <section id="inicio" className="container-site grid grid-cols-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-8 lg:py-24">
      <div className="flex flex-col items-start gap-6 lg:col-span-6">
        <span className="kicker">Setor Ponta Kayana, {content.contato_cidade} — GO</span>
        <h1 className="text-[40px] font-bold leading-[1.05] tracking-[-0.035em] text-ink sm:text-5xl lg:text-6xl">
          {content.hero_title}
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-body">{content.hero_subtitle}</p>
        <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row">
          <button onClick={onOpenCadastro} className="btn-primary min-h-13 px-7 text-base">
            Inscrever uma criança
          </button>
          <a href="#como-ajudar" className="btn-secondary min-h-13 px-6 text-base">
            Como ajudar
          </a>
        </div>
        <span className="text-sm text-muted">CNPJ {content.contato_cnpj}</span>
      </div>

      <figure className="flex flex-col gap-2.5 lg:col-span-5 lg:col-start-8">
        <img
          src="/fotos/hero-futebol-comemoracao.jpg"
          alt="Escolinha de Futebol River Trindade comemorando o título no campo"
          className="aspect-[4/3] w-full rounded-lg object-cover object-[center_40%] lg:aspect-auto lg:h-[520px]"
          fetchPriority="high"
        />
        <figcaption className="text-[13px] text-muted">
          Escolinha de Futebol River Trindade · Foto: Kennedy Martins
        </figcaption>
      </figure>
    </section>
  );
};
