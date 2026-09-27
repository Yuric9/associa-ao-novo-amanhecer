/**
 * Empresas que apoiam as ações da associação.
 * Só aparecem no site as marcadas com `autorizado: true` — marque depois que cada parceiro autorizar
 * o uso do nome.
 */
export interface Parceiro {
  nome: string;
  autorizado: boolean;
}

export const PARCEIROS: Parceiro[] = [
  { nome: 'Master Gelato', autorizado: false },
  { nome: 'Dilma Alves Bolos', autorizado: false },
  { nome: "Jhack's Burguer", autorizado: false },
  { nome: 'Kennedy Martins Fotografia', autorizado: false },
];
