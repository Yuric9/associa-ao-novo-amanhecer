import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const NovoAmanhecerLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Medalhão Oficial Associação Novo Amanhecer */}
      <div className={`relative shrink-0 ${sizeMap[size]}`}>
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradientes Dourados do Medalhão */}
            <radialGradient id="goldRim" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#FFF3B0" />
              <stop offset="45%" stopColor="#E5A93C" />
              <stop offset="85%" stopColor="#B37416" />
              <stop offset="100%" stopColor="#784803" />
            </radialGradient>

            <linearGradient id="goldBevel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF7CC" />
              <stop offset="30%" stopColor="#E5A93C" />
              <stop offset="70%" stopColor="#995E0D" />
              <stop offset="100%" stopColor="#FFF2A3" />
            </linearGradient>

            {/* Anel Azul Céu / Turquesa */}
            <linearGradient id="skyRing" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Fundo do Sol Amarelo Suave */}
            <radialGradient id="sunBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFEE" />
              <stop offset="70%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#FDE047" />
            </radialGradient>

            {/* Sol Central Radiante */}
            <radialGradient id="sunCenter" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="35%" stopColor="#FDE047" />
              <stop offset="80%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>

            {/* Fita / Faixa Branca com Relevo */}
            <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            <linearGradient id="ribbonBorder" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>

            {/* Sombra suave */}
            <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Anel Externo Dourado Esculpido */}
          <circle cx="100" cy="100" r="94" fill="url(#goldRim)" filter="url(#shadowFilter)" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="url(#goldBevel)" strokeWidth="3" />

          {/* Anel Azul Celeste Interno */}
          <circle cx="100" cy="100" r="84" fill="none" stroke="url(#skyRing)" strokeWidth="4.5" />
          <circle cx="100" cy="100" r="81" fill="none" stroke="#FBBF24" strokeWidth="1.5" />

          {/* Fundo do Sol Radiante */}
          <circle cx="100" cy="100" r="80" fill="url(#sunBg)" />

          {/* Raios do Sol (Triângulos Dourados Radiantes) */}
          <g transform="translate(100, 100)">
            {/* Raios Maiores */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
              <polygon
                key={`ray-lg-${i}`}
                points="0,-76 -10,-32 10,-32"
                fill="url(#goldBevel)"
                stroke="#B45309"
                strokeWidth="0.7"
                transform={`rotate(${deg})`}
              />
            ))}

            {/* Raios Intermediários */}
            {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg, i) => (
              <polygon
                key={`ray-sm-${i}`}
                points="0,-68 -6,-30 6,-30"
                fill="#FBBF24"
                transform={`rotate(${deg})`}
              />
            ))}
          </g>

          {/* Círculo do Sol Central com Alto Brilho */}
          <circle cx="100" cy="100" r="38" fill="url(#sunCenter)" stroke="#B45309" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="36" fill="none" stroke="#FEF08A" strokeWidth="1.2" opacity="0.8" />
          {/* Brilho esférico superior */}
          <ellipse cx="94" cy="85" rx="16" ry="10" fill="#FFFFFF" opacity="0.45" />

          {/* Faixa / Faixa Ondulada com o Nome "Associação Novo Amanhecer" */}
          {/* Dobras laterais da fita (efeito 3D) */}
          <path d="M 6 112 Q 10 98 25 102 L 25 124 Q 8 126 6 112 Z" fill="#64748B" />
          <path d="M 194 112 Q 190 98 175 102 L 175 124 Q 192 126 194 112 Z" fill="#64748B" />

          {/* Fita Frontal Curva */}
          <path
            d="M 12 110 C 50 118 150 118 188 110 L 192 128 C 150 138 50 138 8 128 Z"
            fill="url(#ribbonGrad)"
            stroke="url(#ribbonBorder)"
            strokeWidth="1.5"
            filter="url(#shadowFilter)"
          />

          {/* Friso dourado na borda da fita */}
          <path
            d="M 14 112 C 50 119 150 119 186 112"
            fill="none"
            stroke="#D97706"
            strokeWidth="0.8"
          />
          <path
            d="M 11 126 C 50 135 150 135 189 126"
            fill="none"
            stroke="#D97706"
            strokeWidth="0.8"
          />

          {/* Texto Escrito na Fita: Associação Novo Amanhecer */}
          <path id="ribbonPath" d="M 16 126 Q 100 135 184 126" fill="none" />
          <text fontSize="12.5" fontWeight="900" fill="#1C1917" fontFamily="Georgia, serif">
            <textPath href="#ribbonPath" startOffset="50%" textAnchor="middle">
              Associação Novo Amanhecer
            </textPath>
          </text>
        </svg>
      </div>

      {/* Tipografia da Marca ao Lado */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
            Associação Novo Amanhecer
          </span>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
            <span>Trindade · Goiás</span>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">Desde 2019</span>
          </span>
        </div>
      )}
    </div>
  );
};
