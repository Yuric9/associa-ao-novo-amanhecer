/**
 * Destaques da página inicial ("Acontece na associação").
 * O primeiro item aparece grande; os dois seguintes, em cards menores.
 * `data` é opcional: só aparece no site quando estiver preenchida (confirme as datas antes de publicar).
 * `cor`: 'sol' (dourado), 'marca' (azul) ou 'destaque' (dourado forte, para o item principal).
 */
export interface Destaque {
  id: string;
  categoria: string;
  titulo: string;
  foto_url: string;
  alt: string;
  posicao?: string;
  data?: string;
  cor: 'sol' | 'marca' | 'destaque';
  link?: string;
}

export const DESTAQUES: Destaque[] = [
  {
    id: 'river-titulo',
    categoria: 'Futebol',
    titulo: 'Escolinha River Trindade conquista o título da temporada',
    foto_url: '/fotos/galeria-futebol-taca.jpg',
    alt: 'Atletas da Escolinha River levantando a taça',
    posicao: 'center 40%',
    cor: 'destaque',
  },
  {
    id: 'book-dia-gestante',
    categoria: 'Book Solidário',
    titulo: 'Ensaios do Dia da Gestante com figurino, maquiagem e kit de enxoval',
    foto_url: '/fotos/galeria-book-ponte.jpg',
    alt: 'Gestante no ensaio do Book Solidário',
    posicao: 'center 25%',
    data: '15 de agosto',
    cor: 'sol',
  },
  {
    id: 'festa-criancas',
    categoria: 'Ação social',
    titulo: 'Festa das crianças reúne personagens, lanche e bolo no Ponta Kayana',
    foto_url: '/fotos/galeria-acoes-homem-aranha.jpg',
    alt: 'Homem-Aranha com crianças na ação social',
    posicao: 'center 30%',
    cor: 'marca',
  },
];
