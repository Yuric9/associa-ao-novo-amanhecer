import React, { useCallback, useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GalleryPhoto } from '../../types';

interface GaleriaLightboxProps {
  photos: GalleryPhoto[];
  instagramUrl: string;
}

const categories = [
  { id: 'todas', label: 'Todas' },
  { id: 'futebol', label: 'Futebol' },
  { id: 'ballet', label: 'Ballet' },
  { id: 'book', label: 'Book Solidário' },
  { id: 'festas', label: 'Ações sociais' },
];

export const GaleriaLightbox: React.FC<GaleriaLightboxProps> = ({ photos, instagramUrl }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('todas');

  const sorted = [...photos].sort((a, b) => a.ordem - b.ordem);
  const filtered = activeCategory === 'todas' ? sorted : sorted.filter((p) => p.categoria === activeCategory);
  const visibleCategories = categories.filter((c) => c.id === 'todas' || sorted.some((p) => p.categoria === c.id));
  const current = selectedIndex !== null ? filtered[selectedIndex] : null;

  const go = useCallback(
    (step: number) =>
      setSelectedIndex((i) => (i === null ? i : (i + step + filtered.length) % filtered.length)),
    [filtered.length]
  );

  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, go]);

  return (
    <section id="galeria" className="container-site flex flex-col gap-8 pb-20 sm:pb-28">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-3.5">
          <span className="kicker">Galeria</span>
          <h2 className="section-title">Momentos recentes</h2>
        </div>
        <a href={instagramUrl} target="_blank" rel="noreferrer" className="link-underline self-start sm:self-auto">
          Mais fotos no Instagram
        </a>
      </div>

      {visibleCategories.length > 2 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Filtrar fotos">
          {visibleCategories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedIndex(null);
                }}
                className={`min-h-11 shrink-0 rounded-md border px-4 text-sm font-semibold transition-colors ${
                  active ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink hover:border-ink'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {filtered.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIndex(idx)}
            className="group overflow-hidden rounded-lg bg-sand text-left"
            aria-label={`Ampliar foto: ${photo.legenda}`}
          >
            <img
              src={photo.foto_url}
              alt={photo.legenda}
              loading="lazy"
              className="aspect-square w-full object-cover transition-opacity group-hover:opacity-90"
            />
          </button>
        ))}
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
          onClick={() => setSelectedIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4"
        >
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          {filtered.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <figure onClick={(e) => e.stopPropagation()} className="flex max-w-5xl flex-col items-center gap-4">
            <img src={current.foto_url} alt={current.legenda} className="max-h-[78vh] w-auto rounded-md object-contain" />
            <figcaption className="max-w-2xl text-center text-sm leading-relaxed text-stone-300">
              {current.legenda}
              <span className="mt-1 block text-stone-500">
                {(selectedIndex ?? 0) + 1} de {filtered.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
};
