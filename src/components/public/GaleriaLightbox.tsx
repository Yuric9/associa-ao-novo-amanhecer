import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Instagram } from 'lucide-react';
import { GalleryPhoto } from '../../types';

interface GaleriaLightboxProps {
  photos: GalleryPhoto[];
  instagramUrl: string;
}

export const GaleriaLightbox: React.FC<GaleriaLightboxProps> = ({ photos, instagramUrl }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('todas');

  const sortedPhotos = [...photos].sort((a, b) => a.ordem - b.ordem);

  const filteredPhotos = activeCategory === 'todas'
    ? sortedPhotos
    : sortedPhotos.filter((p) => p.categoria === activeCategory);

  const categories = [
    { id: 'todas', label: 'Todas as Fotos' },
    { id: 'ballet', label: 'Ballet Solidário' },
    { id: 'futebol', label: 'Escolinha de Futebol' },
    { id: 'book', label: 'Book Gestantes' },
    { id: 'festas', label: 'Festas Comunitárias' },
  ];

  const handleOpenLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleCloseLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) =>
      prev! > 0 ? prev! - 1 : filteredPhotos.length - 1
    );
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) =>
      prev! < filteredPhotos.length - 1 ? prev! + 1 : 0
    );
  };

  const currentPhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

  return (
    <section id="galeria" className="py-16 sm:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
              <span>Nossa Comunidade em Imagens</span>
              <span aria-hidden="true">·</span>
              <span>Galeria Viva</span>
              <span aria-hidden="true">·</span>
              <span>Trindade/GO</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Alegria, arte e acolhimento registrados em cada detalhe.
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Trabalhamos com muitas fotos para dar visibilidade ao trabalho social e valorizar cada criança, jovem e gestante atendida. Clique nas fotos para ampliar.
            </p>
          </div>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 rounded-xl transition-colors shrink-0"
          >
            <Instagram className="w-4 h-4 text-amber-800" />
            <span>Ver mais no Instagram @anovoamanhecer</span>
          </a>
        </div>

        {/* Filtros da Galeria */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl overflow-x-auto no-scrollbar mb-8 max-w-full">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedPhotoIndex(null);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Grade de Fotos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => handleOpenLightbox(idx)}
              className="group relative h-60 rounded-3xl overflow-hidden cursor-pointer bg-slate-100 border border-slate-200/80 shadow-2xs hover:shadow-xl transition-all duration-300"
            >
              <img
                src={photo.foto_url}
                alt={photo.legenda}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                  {photo.data || 'Associação Novo Amanhecer'}
                </span>
                <p className="text-xs font-semibold line-clamp-2 mt-0.5 leading-snug">
                  {photo.legenda}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-amber-200 mt-2 font-medium">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Ampliar foto</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox em Tela Cheia */}
      {currentPhoto && (
        <div
          onClick={handleCloseLightbox}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* Botão Fechar */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-5 right-5 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10 cursor-pointer"
            aria-label="Fechar galeria"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Botão Anterior */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10 cursor-pointer"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Botão Próximo */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10 cursor-pointer"
            aria-label="Próxima foto"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Imagem Ampliada e Legenda */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full flex flex-col items-center"
          >
            <div className="max-h-[75vh] overflow-hidden rounded-2xl shadow-2xl border border-white/10">
              <img
                src={currentPhoto.foto_url}
                alt={currentPhoto.legenda}
                className="max-h-[75vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="mt-4 text-center max-w-2xl px-4 text-white">
              <div className="text-xs uppercase tracking-wider font-bold text-amber-400 mb-1">
                {currentPhoto.data || 'Trindade - GO'} · Foto {(selectedPhotoIndex ?? 0) + 1} de {filteredPhotos.length}
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-200">
                {currentPhoto.legenda}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
