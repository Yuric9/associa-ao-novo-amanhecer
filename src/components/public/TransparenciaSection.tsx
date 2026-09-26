import React from 'react';
import { SiteContent } from '../../types';

interface TransparenciaSectionProps {
  content: SiteContent;
}

const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');

export const TransparenciaSection: React.FC<TransparenciaSectionProps> = ({ content }) => {
  const whatsapp = onlyDigits(content.contato_whatsapp);
  const pedidoDocs = `https://wa.me/55${whatsapp}?text=${encodeURIComponent(
    'Olá! Gostaria de solicitar os documentos e a prestação de contas da Associação Novo Amanhecer.'
  )}`;

  const dados = [
    { label: 'Razão social', valor: 'Associação Novo Amanhecer' },
    { label: 'CNPJ', valor: content.contato_cnpj },
    { label: 'Natureza', valor: 'Associação privada sem fins lucrativos' },
    { label: 'Sede', valor: content.contato_endereco },
  ];

  return (
    <section id="transparencia" className="container-site pb-20 sm:pb-28">
      <div className="grid grid-cols-1 gap-10 rounded-lg bg-ink px-6 py-10 text-stone-100 sm:px-10 sm:py-12 lg:grid-cols-12 lg:gap-8 lg:px-14">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <h2 className="text-3xl font-bold tracking-tight text-white">Transparência</h2>
          <p className="text-base leading-relaxed text-stone-300">
            As doações só entram nos números do site depois de confirmadas no extrato da associação. Estatuto, atas e
            prestação de contas ficam disponíveis a qualquer apoiador que pedir.
          </p>
          {whatsapp && (
            <a
              href={pedidoDocs}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-12 items-center justify-center self-start rounded-md border border-stone-500 px-5 text-[15px] font-semibold text-white hover:border-white"
            >
              Solicitar documentos
            </a>
          )}
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
          {dados.map((d) => (
            <div key={d.label} className="flex flex-col gap-1 border-t border-stone-700 pt-4">
              <dt className="text-[13px] text-stone-400">{d.label}</dt>
              <dd className="text-[15px] font-medium leading-snug text-white">{d.valor}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
