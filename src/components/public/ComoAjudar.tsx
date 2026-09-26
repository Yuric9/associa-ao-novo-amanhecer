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

  return (
    <section id="como-ajudar" className="container-site flex flex-col gap-12 py-20 sm:py-28">
      <div className="flex max-w-2xl flex-col gap-3.5">
        <span className="kicker">Como ajudar</span>
        <h2 className="section-title">Três formas de apoiar o trabalho</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Doar via PIX */}
        <div className="card flex flex-col gap-4 p-7 sm:p-8">
          <h3 className="text-xl font-bold text-ink">Doar via PIX</h3>
          <p className="text-[15px] leading-relaxed text-body">
            Qualquer valor ajuda a comprar uniformes, sapatilhas, materiais e lanches.
          </p>
          <div className="flex flex-col gap-1 rounded-md bg-sand px-4 py-3.5">
            <span className="text-[13px] text-muted">Chave PIX ({content.contato_pix_tipo || 'CNPJ'})</span>
            <span className="select-all text-lg font-bold tracking-wide text-ink">{content.contato_pix_chave}</span>
            <span className="text-[13px] text-muted">Associação Novo Amanhecer</span>
          </div>
          <div className="mt-auto flex flex-col gap-3 pt-2">
            <button onClick={handleCopyPix} className="btn-primary w-full" aria-live="polite">
              {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedKey ? 'Chave copiada' : 'Copiar chave PIX'}
            </button>
            <div className="flex items-center justify-between gap-3 text-[15px]">
              <button onClick={() => setShowQrCode(!showQrCode)} className="font-medium text-muted hover:text-ink">
                {showQrCode ? 'Ocultar QR Code' : 'Mostrar QR Code'}
              </button>
              <button onClick={() => setIsDoacaoModalOpen(true)} className="font-medium text-muted hover:text-ink">
                Avisar sobre minha doação
              </button>
            </div>
            {showQrCode && (
              <div className="flex flex-col items-center gap-2 pt-2">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code PIX da Associação Novo Amanhecer" className="h-40 w-40 rounded-md border border-line p-2" />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-md border border-line text-sm text-muted">
                    Gerando…
                  </div>
                )}
                <span className="text-[13px] text-muted">Escaneie no app do seu banco</span>
              </div>
            )}
          </div>
        </div>

        {/* Voluntário */}
        <div className="card flex flex-col gap-4 p-7 sm:p-8">
          <h3 className="text-xl font-bold text-ink">Ser voluntário</h3>
          <p className="text-[15px] leading-relaxed text-body">
            Professores de dança, treinadores, fotógrafos, maquiadores e ajudantes para os eventos. Você escolhe a área e
            a disponibilidade.
          </p>
          <button onClick={onOpenVoluntarioModal} className="btn-secondary mt-auto w-full">
            Quero ser voluntário
          </button>
        </div>

        {/* Parceiro */}
        <div className="card flex flex-col gap-4 p-7 sm:p-8">
          <h3 className="text-xl font-bold text-ink">Ser parceiro</h3>
          <p className="text-[15px] leading-relaxed text-body">
            Empresas e comerciantes de Trindade podem apoiar com uniformes, material esportivo, lanches, brinquedos para
            as festas ou patrocínio contínuo.
          </p>
          <button onClick={onOpenParceiroModal} className="btn-secondary mt-auto w-full">
            Quero ser parceiro
          </button>
        </div>
      </div>

      <DoacaoModal isOpen={isDoacaoModalOpen} onClose={() => setIsDoacaoModalOpen(false)} content={content} />
    </section>
  );
};
