// Campo de foto dos formulários do painel: enviar do celular/computador ou colar um link.
import React, { useId, useRef, useState } from 'react';
import { Camera, Link2, Loader2, RefreshCw, X } from 'lucide-react';
import { api } from '../../../services/api';
import { reduzirFoto } from '../../../utils/reduzirFoto';

interface CampoFotoProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholderLink?: string;
}

export const CampoFoto: React.FC<CampoFotoProps> = ({ label, value, onChange, placeholderLink = 'https://...' }) => {
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<'parado' | 'reduzindo' | 'enviando'>('parado');
  const [erro, setErro] = useState('');
  const idTitulo = useId();

  const escolherArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    setErro('');
    try {
      setEstado('reduzindo');
      const foto = await reduzirFoto(arquivo);
      setEstado('enviando');
      const { url } = await api.uploadFoto(foto);
      onChange(url);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar a foto.');
    } finally {
      setEstado('parado');
    }
  };

  const ocupado = estado !== 'parado';

  return (
    <div role="group" aria-labelledby={idTitulo}>
      <p id={idTitulo} className="block text-xs font-bold text-body uppercase mb-1">{label}</p>

      <input ref={inputArquivo} type="file" accept="image/*" className="hidden" onChange={escolherArquivo} />

      {value ? (
        <div className="flex items-center gap-3 p-2 bg-paper border border-line rounded-xl">
          <img src={value} alt="Pré-visualização da foto" className="w-20 h-14 object-cover rounded-lg bg-sand" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={ocupado}
              onClick={() => inputArquivo.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-ink bg-white hover:bg-sand border border-line rounded-lg cursor-pointer disabled:opacity-60"
            >
              {ocupado ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {estado === 'reduzindo' ? 'Preparando...' : estado === 'enviando' ? 'Enviando...' : 'Trocar foto'}
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            disabled={ocupado}
            onClick={() => inputArquivo.current?.click()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-brand-dark hover:opacity-90 rounded-xl cursor-pointer disabled:opacity-60"
          >
            {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {estado === 'reduzindo'
              ? 'Preparando a foto...'
              : estado === 'enviando'
              ? 'Enviando...'
              : 'Enviar foto do celular ou computador'}
          </button>
          <div className="relative">
            <Link2 className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              aria-label="Link da foto"
              disabled={ocupado}
              placeholder={`ou cole o link de uma imagem (${placeholderLink})`}
              value={value}
              onChange={(e) => onChange(e.target.value.trim())}
              className="w-full pl-8 pr-3 py-2 text-xs bg-paper border border-line rounded-xl"
            />
          </div>
        </div>
      )}

      {erro && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{erro}</p>}
    </div>
  );
};
