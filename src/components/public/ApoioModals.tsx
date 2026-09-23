import React, { useState } from 'react';
import { X, HandHeart, Briefcase, CheckCircle2, MessageCircle } from 'lucide-react';

interface VoluntarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoluntarioModal: React.FC<VoluntarioModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [area, setArea] = useState('Aulas de Ballet');
  const [disponibilidade, setDisponibilidade] = useState('Sábados');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center">
            <HandHeart className="w-5 h-5 text-orange-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Seja Voluntário(a)</h3>
            <span className="text-xs text-slate-500">Associação Novo Amanhecer · Trindade/GO</span>
          </div>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Muito obrigado pelo carinho!</h4>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
              Recebemos sua manifestação de voluntariado. Nossa coordenação entrará em contato via WhatsApp para marcar um café e te apresentar a sede em Trindade.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Seu Nome Completo
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Maria das Graças"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                required
                placeholder="(62) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Área de Interesse
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Aulas de Ballet">Aulas de Ballet</option>
                  <option value="Escolinha de Futebol">Escolinha de Futebol</option>
                  <option value="Fotografia Book Gestante">Fotografia / Book Gestante</option>
                  <option value="Festas Comunitárias">Festas Comunitárias</option>
                  <option value="Apoio Geral / Cozinha">Apoio Geral & Lanches</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Disponibilidade
                </label>
                <select
                  value={disponibilidade}
                  onChange={(e) => setDisponibilidade(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Sábados de Manhã">Sábados de Manhã</option>
                  <option value="Finais de Semana">Finais de Semana</option>
                  <option value="Dias de Semana à Tarde">Dias de Semana (Tarde)</option>
                  <option value="Em Eventos Especiais">Eventos Especiais</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-xs"
              >
                Enviar Inscrição
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

interface ParceiroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParceiroModal: React.FC<ParceiroModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [empresa, setEmpresa] = useState('');
  const [contato, setContato] = useState('');
  const [telefone, setTelefone] = useState('');
  const [proposta, setProposta] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Seja um Parceiro Comunitário</h3>
            <span className="text-xs text-slate-500">Empresas e Amigos de Trindade/GO</span>
          </div>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Proposta Recebida!</h4>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
              Agradecemos a disposição em apoiar nossa associação. A diretoria entrará em contato para alinhar como sua parceria impactará diretamente nossas crianças e gestantes.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nome da Empresa ou Apoiador
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Comercial Goiás / Farmácia do Bairro"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pessoa de Contato
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(62) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Como Gostaria de Contribuir?
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Doação de kits de fraldas para o Book de Gestantes, lanches para os treinos de futebol, patrocínio de figurino de ballet ou brinquedos para o Dia das Crianças."
                value={proposta}
                onChange={(e) => setProposta(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl shadow-xs"
              >
                Enviar Proposta de Parceria
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
