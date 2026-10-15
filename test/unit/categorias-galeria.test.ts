import { describe, expect, it } from 'vitest';
import type { ProjectCard } from '../../src/types';
import { categoriasDaGaleria } from '../../src/utils/categoriasGaleria';

const projeto = (id: string, titulo: string, ordem: number) => ({ id, titulo, ordem }) as ProjectCard;

describe('categorias da galeria', () => {
  it('as 4 antigas sempre aparecem, com os códigos já gravados nas fotos', () => {
    expect(categoriasDaGaleria([]).map((c) => c.id)).toEqual(['futebol', 'ballet', 'book', 'festas']);
  });

  it('projeto novo vira categoria (pelo id), na ordem do site', () => {
    const cats = categoriasDaGaleria([
      projeto('proj-ballet', 'Ballet — Na Pontinha do Pé', 1),
      projeto('proj-2', 'Capoeira', 6),
      projeto('proj-1', 'Aulas de Dança', 5),
    ]);
    expect(cats.map((c) => c.id)).toEqual(['futebol', 'ballet', 'book', 'festas', 'proj-1', 'proj-2']);
    expect(cats.find((c) => c.id === 'proj-1')?.rotulo).toBe('Aulas de Dança');
  });
});
