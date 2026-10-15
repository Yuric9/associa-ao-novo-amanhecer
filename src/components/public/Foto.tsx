// <img> que entrega a versão WebP do tamanho certo (celular, computador, miniatura)
// quando ela existe, e o .jpg original para navegadores antigos.
// "sizes" diz ao navegador a largura que a foto ocupa na tela, para ele escolher o arquivo.
import React from 'react';
import { srcSetWebp } from '../../utils/fotos';

type FotoProps = React.ImgHTMLAttributes<HTMLImageElement> & { src: string; sizes?: string };

export const Foto: React.FC<FotoProps> = ({ src, sizes = '100vw', ...img }) => {
  const webp = srcSetWebp(src);
  if (!webp) return <img src={src} {...img} />;
  return (
    // "contents": o <picture> não cria caixa própria, então o layout do <img> continua igual.
    // "hidden" no <source>: sem isso ele vira um item invisível em flex/grid (e ganha o "gap").
    <picture className="contents">
      <source type="image/webp" srcSet={webp} sizes={sizes} className="hidden" />
      <img src={src} {...img} />
    </picture>
  );
};
