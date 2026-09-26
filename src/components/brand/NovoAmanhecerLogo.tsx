import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  /** Versão clara do nome, para fundos escuros. */
  inverted?: boolean;
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
};

/**
 * Símbolo plano da Associação: o sol nascendo sobre o morro verde,
 * inspirado no logo das camisetas. Vetorial, nítido em qualquer tamanho.
 */
export const NovoAmanhecerMark: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    className={className}
    role="img"
    aria-label="Símbolo da Associação Novo Amanhecer"
  >
    <circle cx="20" cy="20" r="20" fill="#F3EFE8" />
    <path d="M20 9.5v3.2M11 13.6l2.2 2.2M29 13.6l-2.2 2.2M7 21h3M30 21h3" stroke="#E3A21A" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M11.5 26.5a8.5 8.5 0 0 1 17 0z" fill="#E3A21A" />
    <path d="M4.5 28.5c5-3.2 10.5-3.2 15.5 0s10.5 3.2 15.5 0V31a20 20 0 0 1-31 0z" fill="#2F6B3A" />
  </svg>
);

export const NovoAmanhecerLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  inverted = false,
}) => {
  const px = sizeMap[size];
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <NovoAmanhecerMark size={px} className="shrink-0" />
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`text-[15px] font-bold tracking-tight sm:text-base ${inverted ? 'text-white' : 'text-ink'}`}>
            Associação Novo Amanhecer
          </span>
          <span className={`text-[13px] ${inverted ? 'text-stone-400' : 'text-muted'}`}>Trindade · Goiás</span>
        </div>
      )}
    </div>
  );
};

export default NovoAmanhecerLogo;
