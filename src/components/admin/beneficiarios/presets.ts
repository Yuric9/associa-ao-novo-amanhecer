// Botões de filtro rápido por projeto (ícone, nome e cores de cada atalho).
import { Camera, Gift, Layers, Sparkles, Trophy, type LucideIcon } from 'lucide-react';
import { isProjectMatch, type contarPorProjeto } from './filtros';

export interface ProjetoPreset {
  id: 'todos' | 'futebol' | 'ballet' | 'book' | 'festas';
  label: string;
  shortLabel: string;
  /** Nome completo do projeto (usado como padrão ao cadastrar e no banner) */
  projectName?: string;
  icon: LucideIcon;
  activeBtnClass: string;
  inactiveBtnClass: string;
  count: number;
}

export function montarPresets(counts: ReturnType<typeof contarPorProjeto>): ProjetoPreset[] {
  return [
    {
      id: 'todos',
      label: 'Todos os Projetos',
      shortLabel: 'Todos',
      icon: Layers,
      activeBtnClass: 'bg-brand-dark text-white border-slate-900 shadow-xs ring-2 ring-slate-400/30',
      inactiveBtnClass: 'bg-white text-body hover:bg-sand border-line',
      count: counts.todos,
    },
    {
      id: 'futebol',
      label: 'Apenas Futebol',
      shortLabel: 'Futebol',
      projectName: 'Escolinha de Futebol Comunitário',
      icon: Trophy,
      activeBtnClass: 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300 font-bold',
      inactiveBtnClass: 'bg-white text-emerald-800 hover:bg-emerald-50 border-emerald-200',
      count: counts.futebol,
    },
    {
      id: 'ballet',
      label: 'Apenas Ballet',
      shortLabel: 'Ballet',
      projectName: 'Aulas de Ballet Solidário',
      icon: Sparkles,
      activeBtnClass: 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-300 font-bold',
      inactiveBtnClass: 'bg-white text-rose-800 hover:bg-rose-50 border-rose-200',
      count: counts.ballet,
    },
    {
      id: 'book',
      label: 'Apenas Book Gestante',
      shortLabel: 'Book Gestante',
      projectName: 'Projeto Book Solidário para Gestantes',
      icon: Camera,
      activeBtnClass: 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-300 font-bold',
      inactiveBtnClass: 'bg-white text-purple-800 hover:bg-purple-50 border-purple-200',
      count: counts.book,
    },
    {
      id: 'festas',
      label: 'Apenas Festas & Ações',
      shortLabel: 'Festas',
      projectName: 'Festas em Datas Comemorativas',
      icon: Gift,
      activeBtnClass: 'bg-amber-700 text-white border-amber-700 shadow-xs ring-2 ring-amber-300 font-bold',
      inactiveBtnClass: 'bg-white text-amber-800 hover:bg-amber-50 border-amber-200',
      count: counts.festas,
    },
  ];
}

/** O atalho está selecionado no filtro de projeto atual? */
export function presetSelecionado(preset: ProjetoPreset, projetoFiltrado: string): boolean {
  return (
    projetoFiltrado === preset.id || Boolean(preset.projectName && isProjectMatch(preset.projectName, projetoFiltrado))
  );
}

