// Categorias das fotos da galeria = os projetos da associação (lidos do banco) + "Geral / Sede".
// As 4 primeiras categorias usam códigos curtos (futebol, ballet, book, festas), que já estão
// gravados nas fotos antigas; projetos novos usam o próprio id (ex.: "proj-1760541234").
import type { ProjectCard } from '../types';

export interface CategoriaGaleria {
  id: string;
  rotulo: string;
}

const LEGADAS: Record<string, CategoriaGaleria> = {
  'proj-futebol': { id: 'futebol', rotulo: 'Futebol' },
  'proj-ballet': { id: 'ballet', rotulo: 'Ballet' },
  'proj-book': { id: 'book', rotulo: 'Book Solidário' },
  'proj-festas': { id: 'festas', rotulo: 'Ações sociais' },
};

export const CATEGORIA_GERAL: CategoriaGaleria = { id: 'geral', rotulo: 'Geral / Sede' };

/** Uma categoria por projeto, na ordem do site. As 4 antigas aparecem sempre (há fotos antigas nelas). */
export function categoriasDaGaleria(projects: ProjectCard[] = []): CategoriaGaleria[] {
  const lista: CategoriaGaleria[] = Object.values(LEGADAS);
  const daOrdem = [...projects].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  for (const p of daOrdem) {
    if (!LEGADAS[p.id]) lista.push({ id: p.id, rotulo: p.titulo });
  }
  return lista;
}
