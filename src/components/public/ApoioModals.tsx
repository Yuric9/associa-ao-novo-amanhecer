import React, { useState } from 'react';
import { X, HandHeart, Briefcase, CheckCircle2, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { formatPhone } from '../../utils/validation';

interface VoluntarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacidade?: () => void;
}

export const VoluntarioModal: React.FC<VoluntarioModalProps> = ({ isOpen, onClose, onOpenPrivacidade }) => {
  const [submitted, setSubmitted] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('Oficina de Ballet');
  const [disponibilidade, setDisponibilidade] = useState('Sábados (Manhã)');
  const [consentimentoLgpd, setConsentimentoLgpd] = useState(true);
  const [hpSecurityCheck, setHpSecurityCheck] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!consentimentoLgpd) {
      setError('É necessário concordar com o tratamento de dados (LGPD).');
      return;
    }

    setIsLoading(true);
    try {
      await api.createVolunteer({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || 'contato@voluntario.com.br',
        area: area as any,
        disponibilidade: disponibilidade as any,
        consentimento_lgpd: true,
        hp_security_check: hpSecurityCheck,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar voluntário.');
    } finally {
      setIsLoading(false);
    }
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
                Telefone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="(62) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Seu E-mail (Opcional)
              </label>
              <input
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  <option value="Oficina de Ballet">Oficina de Ballet</option>
                  <option value="Treinos de Futebol">Treinos de Futebol</option>
                  <option value="Fotografia & Produção (Book)">Fotografia & Produção (Book)</option>
                  <option value="Cozinha Comunitária & Alimentação">Cozinha Comunitária & Alimentação</option>
                  <option value="Apoio Pedagógico & Escolar">Apoio Pedagógico & Escolar</option>
                  <option value="Logística, Triagem & Eventos">Logística, Triagem & Eventos</option>
                  <option value="Saúde Comunitária (Acolhimento)">Saúde Comunitária (Acolhimento)</option>
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
                  <option value="Sábados (Manhã)">Sábados (Manhã)</option>
                  <option value="Finais de Semana (Geral)">Finais de Semana (Geral)</option>
                  <option value="Dias de Semana (Tarde)">Dias de Semana (Tarde)</option>
                  <option value="Dias de Semana (Manhã)">Dias de Semana (Manhã)</option>
                  <option value="Eventos & Datas Comemorativas">Eventos & Datas Comemorativas</option>
                  <option value="Escala Flexível">Escala Flexível</option>
                </select>
              </div>
            </div>

            {/* Proteção Anti-Spam Honeypot */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={hpSecurityCheck}
                onChange={(e) => setHpSecurityCheck(e.target.value)}
              />
            </div>

            {/* Checkbox de consentimento LGPD */}
            <div className="p-3 bg-orange-50/70 border border-orange-200/80 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  required
                  checked={consentimentoLgpd}
                  onChange={(e) => setConsentimentoLgpd(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                />
                <span className="leading-snug">
                  Autorizo o contato da Associação para atividades de voluntariado, em conformidade com a <strong>LGPD (Lei 13.709/18)</strong>.
                  {onOpenPrivacidade && (
                    <button
                      type="button"
                      onClick={onOpenPrivacidade}
                      className="text-orange-700 underline font-bold ml-1 hover:text-orange-900 cursor-pointer"
                    >
                      Ler Política
                    </button>
                  )}
                </span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-60 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar Inscrição</span>
                )}
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
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
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
