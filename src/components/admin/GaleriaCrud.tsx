import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, X, Image as ImageIcon } from 'lucide-react';
import { GalleryPhoto, ProjectCard } from '../../types';
import { CATEGORIA_GERAL, categoriasDaGaleria } from '../../utils/categoriasGaleria';
import { CampoFoto } from './comum/CampoFoto';
import { useJanelaModal } from '../../utils/useJanelaModal';

interface GaleriaCrudProps {
  photos: GalleryPhoto[];
  /** Projetos da associação: cada um vira uma categoria de foto */
  projects?: ProjectCard[];
  onUpdatePhotos: (photos: GalleryPhoto[]) => void;
}

export const GaleriaCrud: React.FC<GaleriaCrudProps> = ({ photos, projects, onUpdatePhotos }) => {
  const categorias = [...categoriasDaGaleria(projects), CATEGORIA_GERAL];
  const rotuloDaCategoria = (id?: string) => categorias.find((c) => c.id === id)?.rotulo ?? 'Geral';
  const [showAddModal, setShowAddModal] = useState(false);
  const janela = useJanelaModal(showAddModal, () => setShowAddModal(false));
  const [newUrl, setNewUrl] = useState('');
  const [newLegenda, setNewLegenda] = useState('');
  const [newCategoria, setNewCategoria] = useState<string>('geral');
  const [newData, setNewData] = useState('Novo Registro');

  const sortedPhotos = [...photos].sort((a, b) => a.ordem - b.ordem);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newLegenda) return;

    const newPhoto: GalleryPhoto = {
      id: `gal-${Date.now()}`,
      foto_url: newUrl,
      legenda: newLegenda,
      categoria: newCategoria,
      data: newData,
      ordem: photos.length + 1,
    };

    onUpdatePhotos([...photos, newPhoto]);
    setShowAddModal(false);
    setNewUrl('');
    setNewLegenda('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta foto da galeria?')) {
      onUpdatePhotos(photos.filter((p) => p.id !== id));
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sortedPhotos.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...sortedPhotos];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Atualiza campo ordem
    const updated = reordered.map((p, idx) => ({ ...p, ordem: idx + 1 }));
    onUpdatePhotos(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Gerenciador da Galeria de Fotos</h2>
          <p className="text-xs text-muted">
            Adicione registros das aulas de ballet, futebol, ensaios de gestantes e festas comunitárias.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex shrink-0 self-start items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-700 sm:self-auto hover:bg-amber-800 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Foto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="bg-white rounded-[14px] border border-line overflow-hidden shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 bg-sand">
                <img
                  src={photo.foto_url}
                  alt={photo.legenda}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 text-[10px] font-bold bg-slate-950/70 text-white px-2 py-0.5 rounded-md uppercase">
                  #{photo.ordem} · {rotuloDaCategoria(photo.categoria)}
                </span>
              </div>

              <div className="p-4">
                <p className="text-xs font-medium text-ink line-clamp-2">
                  {photo.legenda}
                </p>
                <span className="text-[10px] text-muted block mt-1">
                  {photo.data || 'Trindade - GO'}
                </span>
              </div>
            </div>

            <div className="p-3 border-t border-line bg-paper flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="p-1 text-body hover:bg-slate-200 rounded-md disabled:opacity-30"
                  title="Subir ordem"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={index === sortedPhotos.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="p-1 text-body hover:bg-slate-200 rounded-md disabled:opacity-30"
                  title="Descer ordem"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => handleDelete(photo.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded-md"
                title="Remover foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Adicionar Foto */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div ref={janela} role="dialog" aria-modal="true" aria-labelledby="galeria-modal-titulo" tabIndex={-1} className="outline-none relative w-full max-w-lg bg-white rounded-[14px] shadow-2xl border border-line overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              aria-label="Fechar"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 text-muted hover:text-body rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 id="galeria-modal-titulo" className="text-lg font-bold text-ink mb-4">Adicionar Nova Foto na Galeria</h2>

            <form onSubmit={handleAdd} className="space-y-4">
              <CampoFoto
                label="Foto"
                value={newUrl}
                onChange={setNewUrl}
                placeholderLink="https://images.unsplash.com/..."
              />

              <div>
                <label htmlFor="galeria-legenda-descritiva" className="block text-xs font-bold text-body uppercase mb-1">
                  Legenda Descritiva
                </label>
                <textarea
                  id="galeria-legenda-descritiva"
                  rows={2}
                  required
                  placeholder="Ex: Alunas de ballet ensaiando com as sapatilhas novas na sede de Trindade."
                  value={newLegenda}
                  onChange={(e) => setNewLegenda(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="galeria-categoria" className="block text-xs font-bold text-body uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    id="galeria-categoria"
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.rotulo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="galeria-data-evento" className="block text-xs font-bold text-body uppercase mb-1">
                    Data / Evento
                  </label>
                  <input
                    id="galeria-data-evento"
                    type="text"
                    value={newData}
                    onChange={(e) => setNewData(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl"
                    placeholder="Ex: Turma de Sábado"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-body hover:bg-sand rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-dark rounded-xl"
                >
                  Adicionar Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
