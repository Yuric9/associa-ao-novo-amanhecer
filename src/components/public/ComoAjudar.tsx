import React, { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';
import { SiteContent } from '../../types';
import { generatePixPayload, generateQrCodeDataUrl } from '../../utils/pix';
import { DoacaoModal } from './DoacaoModal';

interface ComoAjudarProps {
  content: SiteContent;
  onOpenVoluntarioModal: () => void;
  onOpenParceiroModal: () => void;
  onOpenDoacaoModal?: () => void;
}

export const ComoAjudar: React.FC<ComoAjudarProps> = ({ content, onOpenVoluntarioModal, onOpenParceiroModal }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isDoacaoModalOpen, setIsDoacaoModalOpen] = useState(false);

  useEffect(() => {
    if (!content.contato_pix_chave) return;
    const payload = generatePixPayload({
      key: content.contato_pix_chave,
      name: 'ASSOC NOVO AMANHECER',
      city: 'TRINDADE',
    });
    generateQrCodeDataUrl(payload)
      .then(setQrCodeUrl)
      .catch(() => generateQrCodeDataUrl(content.contato_pix_chave).then(setQrCodeUrl));
  }, [content.contato_pix_chave]);

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(content.contato_pix_chave);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    } catch {
      // Navegador sem acesso à área de transferência: a chave continua visível para copiar à mão.
    }
  };

const HEART = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z';
const PEOPLE = 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M17 11a3 3 0 1 0 0-6M22 21v-1a5 5 0 0 0-4-4.9';
const BRIEFCASE = 'M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18';

const IconeBox: React.FC<{ d: string }> = ({ d }) => (
  <div className="hidden h-14 w-14 items-center justify-center rounded-xl bg-brand text-white sm:flex">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  </div>
);

  return (
    <section id="como-ajudar" className="relative overflow-hidden bg-brand-dark">
      <img
        src="/fotos/projeto-futebol.jpg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-[center_45%]"
      />
      <div className="bg-help absolute inset-0" />

      <div className="container-site relative flex flex-col gap-5 py-12 sm:gap-11 sm:py-24">
        <div className="flex max-w-[700px] flex-col gap-2 sm:gap-3">
          <span className="kicker text-sun">Como ajudar</span>
          <h2 className="section-title text-white">Três formas de fazer parte</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Doar via PIX */}
          <div id="doar" className="card-glass flex flex-col gap-4 p-[22px] sm:p-8">
            <IconeBox d={HEART} />
            <h3 className="text-[19px] font-extrabold text-brand-dark sm:text-[21px]">Doar via PIX</h3>
            <p className="text-[15px] leading-relaxed text-body">
              Qualquer valor ajuda a comprar uniformes, sapatilhas, materiais e lanches.
            </p>
            <div className="flex flex-col gap-1 rounded-md bg-paper/90 px-4 py-3.5">
              <span className="text-[13px] text-muted">Chave PIX ({content.contato_pix_tipo || 'CNPJ'})</span>
              <span className="select-all text-lg font-extrabold tracking-wide text-ink">{content.contato_pix_chave}</span>
              <span className="text-[13px] text-muted">Associação Novo Amanhecer</span>
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-1">
              <button onClick={handleCopyPix} className="btn-primary min-h-[50px] w-full" aria-live="polite">
                {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedKey ? 'Chave copiada' : 'Copiar chave PIX'}
              </button>
              <div className="flex flex-wrap items-center justify-between gap-3 text-[15px]">
                <button onClick={() => setShowQrCode(!showQrCode)} className="min-h-11 font-semibold text-brand hover:text-brand-dark">
                  {showQrCode ? 'Ocultar QR Code' : 'Mostrar QR Code'}
                </button>
                <button onClick={() => setIsDoacaoModalOpen(true)} className="min-h-11 font-semibold text-brand hover:text-brand-dark">
                  Avisar sobre minha doação
                </button>
              </div>
              {showQrCode && (
                <div className="flex flex-col items-center gap-2 pt-1">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code PIX da Associação Novo Amanhecer" className="h-40 w-40 rounded-md border border-line bg-white p-2" />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center rounded-md border border-line bg-white text-sm text-muted">
                      Gerando…
                    </div>
                  )}
                  <span className="text-[13px] text-muted">Escaneie no app do seu banco</span>
                </div>
              )}
            </div>
          </div>

          {/* Voluntário */}
          <div className="card-glass flex flex-col gap-4 p-[22px] sm:p-8">
            <IconeBox d={PEOPLE} />
            <h3 className="text-[19px] font-extrabold text-brand-dark sm:text-[21px]">Ser voluntário</h3>
            <p className="flex-1 text-[15px] leading-relaxed text-body">
              Professores de dança, treinadores, fotógrafos, maquiadores e ajudantes para os eventos. Você escolhe a área e
              a disponibilidade.
            </p>
            <button onClick={onOpenVoluntarioModal} className="btn-secondary min-h-[50px] w-full">
              Quero ser voluntário
            </button>
          </div>

          {/* Parceiro */}
          <div className="card-glass flex flex-col gap-4 p-[22px] sm:p-8">
            <IconeBox d={BRIEFCASE} />
            <h3 className="text-[19px] font-extrabold text-brand-dark sm:text-[21px]">Ser parceiro</h3>
            <p className="flex-1 text-[15px] leading-relaxed text-body">
              Empresas e comerciantes de Trindade podem apoiar com uniformes, material esportivo, lanches, brinquedos para
              as festas ou patrocínio contínuo.
            </p>
            <button onClick={onOpenParceiroModal} className="btn-secondary min-h-[50px] w-full">
              Quero ser parceiro
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
