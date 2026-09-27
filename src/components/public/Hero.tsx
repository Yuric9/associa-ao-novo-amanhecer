import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SiteContent } from '../../types';

interface HeroProps {
  content: SiteContent;
  onOpenCadastro: () => void;
}

interface Slide {
  img: string;
  alt: string;
  pos: string;
  kicker: string;
  title: string;
  text: string;
  cta: string;
  credit?: string;
  action: 'cadastro' | 'ajudar';
}

const INTERVALO_MS = 7000;

export const Hero: React.FC<HeroProps> = ({ content, onOpenCadastro }) => {
  const slides: Slide[] = [
    {
      img: '/fotos/hero-futebol-comemoracao.jpg',
      alt: 'Escolinha de Futebol River Trindade comemorando o título no campo',
      pos: 'center 40%',
      kicker: 'Escolinha de Futebol River',
      title: content.hero_title,
      text: content.hero_subtitle,
      cta: 'Inscrever uma criança',
      credit: 'Foto: Kennedy Martins',
      action: 'cadastro',
    },
    {
      img: '/fotos/projeto-book.jpg',
      alt: 'Gestante com girassóis no ensaio do Book Solidário',
      pos: 'center 30%',
      kicker: 'Book Solidário',
      title: 'Um dia de cuidado para quem espera um bebê.',
      text: 'Ensaio fotográfico, maquiagem e kit de enxoval para gestantes da comunidade, sem nenhum custo.',
      cta: 'Quero participar',
      action: 'cadastro',
    },
    {
      img: '/fotos/galeria-acoes-homem-aranha.jpg',
      alt: 'Homem-Aranha com crianças na ação social da associação',
      pos: 'center 25%',
      kicker: 'Ações Sociais',
      title: 'Festa, lanche e alegria para as crianças do bairro.',
      text: 'Personagens, pintura facial, lanche e bolo em datas especiais, feitos com a ajuda de voluntários e parceiros.',
      cta: 'Apoiar a próxima ação',
      action: 'ajudar',
    },
  ];

  const [idx, setIdx] = useState(0);
  const [pausado, setPausado] = useState(false);
  const total = slides.length;
  const go = (step: number) => setIdx((i) => (i + step + total) % total);

  useEffect(() => {
    const reduz = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (pausado || reduz) return;
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % total), INTERVALO_MS);
    return () => window.clearTimeout(t);
  }, [idx, pausado, total]);

  const slide = slides[idx];

  const Cta = () =>
    slide.action === 'cadastro' ? (
      <button onClick={onOpenCadastro} className="btn-sun min-h-[50px] w-full px-6 text-base sm:w-auto lg:min-h-[52px]">
        {slide.cta}
      </button>
    ) : (
      <a href="#como-ajudar" className="btn-sun min-h-[50px] w-full px-6 text-base sm:w-auto lg:min-h-[52px]">
        {slide.cta}
      </a>
    );

  return (
    <section
      id="inicio"
      aria-roledescription="carrossel"
      aria-label="Destaques da associação"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className="relative overflow-hidden bg-brand-dark"
    >
      {slides.map((s, i) => (
        <img
          key={s.img}
          src={s.img}
          alt={i === idx ? s.alt : ''}
          aria-hidden={i !== idx}
          style={{ objectPosition: s.pos }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
          fetchPriority={i === 0 ? 'high' : undefined}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}
      <div className="bg-hero-scrim absolute inset-0" />

      <div className="container-site relative flex min-h-[600px] flex-col justify-end pb-8 pt-[270px] lg:min-h-[620px] lg:justify-center lg:py-24">
        <div className="flex max-w-[600px] flex-col gap-3.5 text-white lg:gap-5" aria-live="polite">
          <span className="self-start rounded bg-sun px-2.5 py-1 text-xs font-extrabold text-ink lg:px-3 lg:py-1.5 lg:text-[13px]">
            {slide.kicker}
          </span>
          <h1 className="text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-4xl lg:text-[46px] lg:leading-[1.08] lg:tracking-[-0.035em]">
            {slide.title}
          </h1>
          <p className="hidden text-lg leading-relaxed text-brand-light sm:block">{slide.text}</p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row lg:gap-3.5 lg:pt-1.5">
            <Cta />
            <a href="#como-ajudar" className="btn-outline-light hidden min-h-[52px] px-6 text-base sm:inline-flex">
              Como ajudar
            </a>
          </div>
        </div>

        {/* Pontos (celular) */}
        <div className="flex items-center justify-center gap-2.5 pt-5 lg:hidden">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Ir para o banner ${i + 1}`}
              aria-current={i === idx}
              className={`h-2.5 rounded-full transition-all ${i === idx ? 'w-7 bg-sun' : 'w-2.5 bg-white'}`}
            />
          ))}
        </div>
      </div>

      {/* Crédito da foto, setas e pontos (computador) */}
      <div className="container-site absolute inset-x-0 bottom-7 hidden items-end justify-between lg:flex">
        <span className="text-xs text-white/85">{slide.credit}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Banner anterior"
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-brand-dark hover:bg-sun-soft"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Ir para o banner ${i + 1}`}
              aria-current={i === idx}
              className={`h-2.5 rounded-full transition-all ${i === idx ? 'w-7 bg-sun' : 'w-2.5 bg-white'}`}
            />
          ))}
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próximo banner"
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-brand-dark hover:bg-sun-soft"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
