import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, X, Image as ImageIcon } from 'lucide-react';
import { GalleryPhoto } from '../../types';

interface GaleriaCrudProps {
  photos: GalleryPhoto[];
  onUpdatePhotos: (photos: GalleryPhoto[]) => void;
}

export const GaleriaCrud: React.FC<GaleriaCrudProps> = ({ photos, onUpdatePhotos }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newLegenda, setNewLegenda] = useState('');
  const [newCategoria, setNewCategoria] = useState<'ballet' | 'futebol' | 'book' | 'festas' | 'geral'>('geral');
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gerenciador da Galeria de Fotos</h3>
          <p className="text-xs text-slate-500">
            Adicione registros das aulas de ballet, futebol, ensaios de gestantes e festas comunitárias.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Foto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 bg-slate-100">
                <img
                  src={photo.foto_url}
                  alt={photo.legenda}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 text-[10px] font-bold bg-slate-950/70 text-white px-2 py-0.5 rounded-md uppercase">
                  #{photo.ordem} · {photo.categoria || 'Geral'}
                </span>
              </div>

              <div className="p-4">
                <p className="text-xs font-medium text-slate-800 line-clamp-2">
                  {photo.legenda}
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {photo.data || 'Trindade - GO'}
                </span>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded-md disabled:opacity-30"
                  title="Subir ordem"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={index === sortedPhotos.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded-md disabled:opacity-30"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">Adicionar Nova Foto na Galeria</h3>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  URL da Imagem / Foto
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Legenda Descritiva
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Alunas de ballet ensaiando com as sapatilhas novas na sede de Trindade."
                  value={newLegenda}
                  onChange={(e) => setNewLegenda(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="ballet">Ballet Solidário</option>
                    <option value="futebol">Escolinha de Futebol</option>
                    <option value="book">Book de Gestantes</option>
                    <option value="festas">Festas Comunitárias</option>
                    <option value="geral">Geral / Sede</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Data / Evento
                  </label>
                  <input
                    type="text"
                    value={newData}
                    onChange={(e) => setNewData(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="Ex: Turma de Sábado"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl"
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
