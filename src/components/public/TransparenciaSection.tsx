import React from 'react';
import { SiteContent } from '../../types';
import { PARCEIROS } from '../../data/parceiros';

interface TransparenciaSectionProps {
  content: SiteContent;
  onOpenParceiroModal?: () => void;
}

const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');

export const TransparenciaSection: React.FC<TransparenciaSectionProps> = ({ content, onOpenParceiroModal }) => {
  const whatsapp = onlyDigits(content.contato_whatsapp);
  const pedidoDocs = `https://wa.me/55${whatsapp}?text=${encodeURIComponent(
    'Olá! Gostaria de solicitar os documentos e a prestação de contas da Associação Novo Amanhecer.'
  )}`;
  const parceiros = PARCEIROS.filter((p) => p.autorizado);

  const dados = [
    { label: 'Razão social', valor: 'Associação Novo Amanhecer' },
    { label: 'CNPJ', valor: content.contato_cnpj },
    { label: 'Natureza', valor: 'Associação privada sem fins lucrativos' },
    { label: 'Sede', valor: content.contato_endereco },
  ];

  return (
    <section id="transparencia" className="bg-white">
      <div className="container-site grid grid-cols-1 items-start gap-10 py-12 sm:py-20 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-3.5 lg:col-span-6">
          <span className="kicker">Transparência</span>
          <h2 className="text-2xl font-extrabold leading-tight tracking-[-0.03em] text-brand-dark sm:text-[32px]">
            Cada doação é conferida no extrato antes de entrar nos números
          </h2>
          <p className="text-base leading-relaxed text-body">
            Estatuto, atas e prestação de contas ficam disponíveis a qualquer apoiador que pedir.
          </p>
          {whatsapp && (
            <a href={pedidoDocs} target="_blank" rel="noreferrer" className="link-arrow mt-2 self-start">
              Solicitar documentos →
            </a>
          )}
          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {dados.map((d) => (
              <div key={d.label} className="flex flex-col gap-1 border-t border-line pt-3.5">
                <dt className="text-[13px] text-muted">{d.label}</dt>
                <dd className="text-[15px] font-semibold leading-snug text-ink">{d.valor}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5 lg:col-start-8">
          <span className="text-sm font-extrabold uppercase text-muted">Quem apoia nossas ações</span>
          {parceiros.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {parceiros.map((p) => (
                <span key={p.nome} className="rounded-md border border-line px-4 py-3 text-[15px] font-bold text-ink">
                  {p.nome}
                </span>
              ))}
            </div>
          )}
          <span className="text-[13px] text-muted">Sua empresa pode aparecer aqui.</span>
          {onOpenParceiroModal && (
            <button onClick={onOpenParceiroModal} className="btn-secondary self-start">
              Quero ser parceiro
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
