import React, { useState } from 'react';
import { Heart, HandHeart, Briefcase, Copy, Check, QrCode, Sparkles, MessageCircle } from 'lucide-react';
import { SiteContent } from '../../types';

interface ComoAjudarProps {
  content: SiteContent;
  onOpenVoluntarioModal: () => void;
  onOpenParceiroModal: () => void;
}

export const ComoAjudar: React.FC<ComoAjudarProps> = ({
  content,
  onOpenVoluntarioModal,
  onOpenParceiroModal,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(content.contato_pix_chave);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  return (
    <section id="como-ajudar" className="py-16 sm:py-24 bg-amber-50/40 border-t border-amber-100/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
            <span>Rede de Solidariedade</span>
            <span aria-hidden="true">·</span>
            <span>Trindade/GO</span>
            <span aria-hidden="true">·</span>
            <span>Afeto em Ação</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Como você pode caminhar conosco?
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Nossa estrutura enxuta vive da união de corações generosos. Escolha a forma de apoiar que melhor cabe na sua rotina.
          </p>
        </div>

        {/* As 3 Opções Solicitadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Opção 1: Doar via PIX */}
          <div className="bg-white rounded-3xl p-7 border border-amber-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-5">
                <Heart className="w-6 h-6 fill-amber-700 text-amber-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">1. Doar via PIX</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                Qualquer quantia ajuda a comprar sapatilhas de ballet, bolas de futebol, kits de enxoval para gestantes e lanches para a criançada.
              </p>

              {/* Chave PIX Box */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-left mb-4">
                <span className="text-[10px] font-bold uppercase text-amber-900 block">
                  Chave PIX Oficial (CNPJ):
                </span>
                <span className="font-mono text-sm font-extrabold text-slate-900 select-all block mt-0.5">
                  {content.contato_pix_chave}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Associação Novo Amanhecer · Trindade/GO
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyPix}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-extrabold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Chave CNPJ Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Chave PIX</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowQrCode(!showQrCode)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-700" />
                <span>{showQrCode ? 'Ocultar QR Code' : 'Visualizar QR Code'}</span>
              </button>

              {showQrCode && (
                <div className="pt-3 flex flex-col items-center animate-in fade-in duration-200">
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none">
                      <rect width="100" height="100" fill="white" />
                      <rect x="10" y="10" width="24" height="24" rx="2" fill="#0f172a" />
                      <rect x="14" y="14" width="16" height="16" fill="white" />
                      <rect x="18" y="18" width="8" height="8" fill="#d97706" />
                      <rect x="66" y="10" width="24" height="24" rx="2" fill="#0f172a" />
                      <rect x="70" y="14" width="16" height="16" fill="white" />
                      <rect x="74" y="18" width="8" height="8" fill="#d97706" />
                      <rect x="10" y="66" width="24" height="24" rx="2" fill="#0f172a" />
                      <rect x="14" y="70" width="16" height="16" fill="white" />
                      <rect x="18" y="74" width="8" height="8" fill="#d97706" />
                      <rect x="42" y="18" width="8" height="8" fill="#0f172a" />
                      <rect x="42" y="34" width="16" height="16" fill="#ea580c" />
                      <rect x="66" y="42" width="10" height="10" fill="#0f172a" />
                      <rect x="22" y="44" width="12" height="12" fill="#0f172a" />
                      <rect x="40" y="68" width="14" height="14" fill="#0f172a" />
                      <rect x="68" y="68" width="12" height="12" fill="#ea580c" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">
                    Escaneie no app do seu banco
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Opção 2: Ser Voluntário */}
          <div className="bg-white rounded-3xl p-7 border border-orange-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center mb-5">
                <HandHeart className="w-6 h-6 text-orange-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">2. Ser Voluntário</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                Doe seu tempo e seu carinho. Precisamos de instrutores de dança, treinadores de futebol, fotógrafas para o Book Solidário e voluntários para a organização das festas comunitárias.
              </p>

              <div className="space-y-2 text-xs text-slate-700 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span>Aulas de Ballet e Dança (Sábados)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span>Treinos de Futebol e Recreação</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span>Fotografia & Maquiagem para Gestantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span>Apoio logístico em Festas e Eventos</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenVoluntarioModal}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-slate-900 bg-orange-100 hover:bg-orange-200 rounded-xl transition-colors cursor-pointer"
            >
              <HandHeart className="w-4 h-4 text-orange-800" />
              <span>Quero Ser Voluntário(a)</span>
            </button>
          </div>

          {/* Opção 3: Ser Parceiro */}
          <div className="bg-white rounded-3xl p-7 border border-amber-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-5">
                <Briefcase className="w-6 h-6 text-amber-800" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">3. Ser Parceiro</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                Comerciantes de Trindade, empresários de Goiás e pessoas físicas: seja parceiro doando bolas, coletes, tecidos, lanches, brinquedos para as festas ou patrocínio contínuo.
              </p>

              <div className="space-y-2 text-xs text-slate-700 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  <span>Doação de chuteiras, sapatilhas e figurinos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  <span>Kits de higiene e roupinhas para recém-nascidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  <span>Pula-pula, pipoca e brinquedos para as festas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  <span>Parceria institucional com selo social</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenParceiroModal}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              <span>Quero Ser Parceiro</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
