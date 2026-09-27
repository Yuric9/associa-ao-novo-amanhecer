import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Layers,
  FileText,
  Image as ImageIcon,
  Shield,
  Download,
  LogOut,
  ExternalLink,
  Sun,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Heart,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  ChevronDown,
  BarChart3,
  HandHeart,
} from 'lucide-react';
import { Beneficiary, ProjectCard, GalleryPhoto, SiteContent, AdminUser, StatusEmailNotification, Volunteer, AuthUser } from '../../types';
import { NovoAmanhecerLogo } from '../brand/NovoAmanhecerLogo';
import { BeneficiariosCrud } from './BeneficiariosCrud';
import { ProjetosCrud } from './ProjetosCrud';
import { CmsConteudo } from './CmsConteudo';
import { GaleriaCrud } from './GaleriaCrud';
import { AdminUsers } from './AdminUsers';
import { BackupModal } from './BackupModal';
import { AnalyticsCharts } from './AnalyticsCharts';
import { VoluntariosRoscaChart } from './VoluntariosRoscaChart';
import {
  exportBeneficiariesToCsv,
  exportProjectsReportToCsv,
  exportExecutiveSummaryToCsv,
} from '../../utils/exportCsv';

interface AdminDashboardProps {
  currentEmail: string;
  currentUser?: AuthUser;
  onLogout: () => void;
  onBackToSite: () => void;

  beneficiaries: Beneficiary[];
  onUpdateBeneficiaries: (beneficiaries: Beneficiary[]) => void;

  projects: ProjectCard[];
  onUpdateProjects: (projects: ProjectCard[]) => void;

  gallery: GalleryPhoto[];
  onUpdateGallery: (photos: GalleryPhoto[]) => void;

  content: SiteContent;
  onUpdateContent: (content: SiteContent) => void;

  admins: AdminUser[];
  onUpdateAdmins: (admins: AdminUser[]) => void;

  volunteers?: Volunteer[];
  onUpdateVolunteers?: (volunteers: Volunteer[]) => void;

  onRequestEmailNotification: (notif: StatusEmailNotification) => void;
  onRestoreAll: (data: {
    beneficiaries: Beneficiary[];
    projects: ProjectCard[];
    gallery: GalleryPhoto[];
    content: SiteContent;
  }) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentEmail,
  currentUser,
  onLogout,
  onBackToSite,
  beneficiaries,
  onUpdateBeneficiaries,
  projects,
  onUpdateProjects,
  gallery,
  onUpdateGallery,
  content,
  onUpdateContent,
  admins,
  onUpdateAdmins,
  volunteers = [],
  onUpdateVolunteers,
  onRequestEmailNotification,
  onRestoreAll,
}) => {
  const userRole = currentUser?.role || 'admin';
  const isVolunteer = userRole === 'voluntario';
  const isCoordinator = userRole === 'coordenador';
  const isAdmin = userRole === 'admin';

  const [activeTab, setActiveTab] = useState<
    'visao-geral' | 'graficos' | 'beneficiarios' | 'projetos' | 'voluntarios' | 'conteudo' | 'galeria' | 'usuarios' | 'backup'
  >('visao-geral');

  // Estado para feedback de exportação CSV
  const [exportNotification, setExportNotification] = useState<string | null>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerExportNotification = (msg: string) => {
    setExportNotification(msg);
    setIsExportDropdownOpen(false);
    setTimeout(() => setExportNotification(null), 4500);
  };

  const handleExportBeneficiarios = () => {
    exportBeneficiariesToCsv(beneficiaries);
    triggerExportNotification(
      `Lista de Beneficiários (${beneficiaries.length} registros) exportada em CSV com sucesso!`
    );
  };

  const handleExportProjetos = () => {
    exportProjectsReportToCsv(projects, beneficiaries);
    triggerExportNotification(
      `Relatório de Projetos Sociais (${projects.length} modalidades) exportado em CSV com sucesso!`
    );
  };

  const handleExportExecutivo = () => {
    exportExecutiveSummaryToCsv(projects, beneficiaries, content);
    triggerExportNotification('Resumo Executivo Institucional exportado em CSV com sucesso!');
  };

  // Cálculos de Totais por Status
  const countPendentes = beneficiaries.filter((b) => b.status === 'Pendente').length;
  const countEmAnalise = beneficiaries.filter((b) => b.status === 'Em análise').length;
  const countAprovados = beneficiaries.filter((b) => b.status === 'Aprovado').length;
  const countAtendidos = beneficiaries.filter((b) => b.status === 'Atendido/Entregue').length;
  const countRecusados = beneficiaries.filter((b) => b.status === 'Recusado').length;
  const totalBeneficiarios = beneficiaries.length;

  // Totais por Projeto
  const projectStats = projects.map((p) => ({
    title: p.titulo,
    count: beneficiaries.filter((b) => b.projeto === p.titulo).length,
  }));

  type TabId = typeof activeTab;
  const tabs: { id: TabId; label: string; icon: React.ElementType; show: boolean; badge?: number }[] = [
    { id: 'visao-geral', label: 'Visão geral', icon: TrendingUp, show: true },
    { id: 'graficos', label: 'Gráficos e análises', icon: BarChart3, show: true },
    { id: 'beneficiarios', label: `Beneficiários (${beneficiaries.length})`, icon: Users, show: true, badge: countPendentes },
    { id: 'projetos', label: `Projetos (${projects.length})`, icon: Layers, show: true },
    { id: 'voluntarios', label: `Voluntários (${volunteers.length})`, icon: HandHeart, show: !isVolunteer },
    { id: 'conteudo', label: 'Textos do site', icon: FileText, show: !isVolunteer },
    { id: 'galeria', label: `Galeria (${gallery.length})`, icon: ImageIcon, show: !isVolunteer },
    { id: 'usuarios', label: 'Usuários e papéis', icon: Shield, show: isAdmin },
    { id: 'backup', label: 'Backup e dados', icon: Download, show: isAdmin },
  ];
  const visibleTabs = tabs.filter((t) => t.show);
  const activeLabel = tabs.find((t) => t.id === activeTab)?.label ?? '';
  const roleLabel = isAdmin ? 'Admin geral' : isCoordinator ? 'Coordenação' : 'Voluntário';
  const roleTitle = isAdmin ? 'Acesso total de administrador' : isCoordinator ? 'Acesso de coordenação' : 'Acesso de voluntário (dados pessoais restritos pela LGPD)';
  const roleChip = isAdmin ? 'bg-sun text-ink' : isCoordinator ? 'bg-brand-soft text-brand-ink' : 'bg-white/15 text-white';

  return (
    <div className="min-h-screen bg-paper font-sans lg:flex">
      <aside className="bg-footer sticky top-0 hidden h-screen w-64 shrink-0 flex-col text-brand-light lg:flex">
        <div className="border-b border-brand-line px-5 py-5">
          <NovoAmanhecerLogo size="sm" inverted />
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Seções do painel">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition-colors ${active ? 'bg-white/12 text-white shadow-[inset_3px_0_0_var(--color-sun)]' : 'text-brand-light hover:bg-white/8 hover:text-white'}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-sun' : ''}`} />
                <span className="flex-1 truncate">{t.label}</span>
                {!!t.badge && t.badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sun px-1.5 text-[11px] font-extrabold text-ink">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="flex flex-col gap-3 border-t border-brand-line px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <span className="truncate text-sm font-bold text-white">{currentUser?.nome || currentEmail}</span>
            <span className={`chip self-start text-xs font-bold ${roleChip}`} title={roleTitle}>{roleLabel}</span>
          </div>
          <button onClick={onBackToSite} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-light hover:text-white">
            <ExternalLink className="h-4 w-4" /> Ver o site
          </button>
          <button onClick={onLogout} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-light hover:text-white">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="lg:hidden"><NovoAmanhecerLogo size="sm" showText={false} /></span>
              <div className="min-w-0">
                <span className="block text-[11px] font-extrabold uppercase tracking-[0.04em] text-brand lg:text-xs">Painel de gestão</span>
                <h1 className="truncate text-base font-extrabold text-brand-dark lg:text-lg">{activeLabel}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" ref={exportDropdownRef}>
                <button type="button" onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} aria-expanded={isExportDropdownOpen} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 text-sm font-bold text-brand-dark hover:border-brand" title="Exportar dados para planilha (Excel)">
                  <FileSpreadsheet className="h-4 w-4 text-brand" />
                  <span className="hidden sm:inline">Exportar CSV</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted" />
                </button>
                {isExportDropdownOpen && (
                  <div className="card absolute right-0 z-50 mt-2 w-72 py-2 text-sm">
                    <div className="border-b border-line px-4 pb-2 pt-1 text-[11px] font-extrabold uppercase tracking-wider text-muted">Relatórios em planilha</div>
                    {[
                      { onClick: handleExportBeneficiarios, icon: FileSpreadsheet, title: 'Lista de beneficiários', sub: `${beneficiaries.length} cadastrados (todos os dados)` },
                      { onClick: handleExportProjetos, icon: Layers, title: 'Relatório de projetos', sub: `${projects.length} projetos e vagas` },
                      { onClick: handleExportExecutivo, icon: FileText, title: 'Resumo executivo', sub: 'Números para prestação de contas' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button key={item.title} type="button" onClick={item.onClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-paper">
                          <Icon className="h-4 w-4 shrink-0 text-brand" />
                          <div><div className="font-bold text-ink">{item.title}</div><div className="text-xs text-muted">{item.sub}</div></div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button onClick={onBackToSite} className="hidden min-h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-brand hover:bg-brand-soft sm:inline-flex lg:hidden">
                <ExternalLink className="h-4 w-4" /> Ver o site
              </button>
              <button onClick={onLogout} aria-label="Sair do painel" className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-body hover:bg-sand lg:hidden">
                <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
          <nav className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-line px-4 py-2 sm:px-6 lg:hidden" aria-label="Seções do painel">
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)} aria-current={active ? 'page' : undefined} className={`inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 text-[13px] font-bold transition-colors ${active ? 'bg-brand text-white' : 'bg-sand text-body hover:bg-line'}`}>
                  <Icon className="h-4 w-4" />{t.label}
                  {!!t.badge && t.badge > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sun px-1.5 text-[11px] font-extrabold text-ink">{t.badge}</span>}
                </button>
              );
            })}
          </nav>
        </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Global de Notificação de Download CSV */}
        {exportNotification && (
          <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
              <span className="text-xs sm:text-sm font-bold">{exportNotification}</span>
            </div>
            <button
              onClick={() => setExportNotification(null)}
              className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
            >
              Fechar
            </button>
          </div>
        )}

        {/* ABA: VISÃO GERAL */}
        {activeTab === 'visao-geral' && (
          <div className="space-y-8">
            {/* Banner de Boas-Vindas */}
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-amber-200">
                  Painel de Controle Oficial
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mt-1">
                  Associação Novo Amanhecer
                </h2>
                <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-xl">
                  Bem-vindo(a) à coordenação de Trindade - GO. Aqui você aprova novos cadastros de ballet, futebol, gestantes e gerencia todo o conteúdo do site.
                </p>
              </div>

              {countPendentes > 0 && (
                <div className="bg-white/20 backdrop-blur-xs p-4 rounded-2xl border border-white/30 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-amber-200 shrink-0" />
                  <div>
                    <div className="text-lg font-black">{countPendentes}</div>
                    <div className="text-xs text-amber-100">Inscrições aguardando análise</div>
                  </div>
                  <button
                    onClick={() => setActiveTab('beneficiarios')}
                    className="ml-2 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Analisar
                  </button>
                </div>
              )}
            </div>

            {/* Cards de Métricas por Status */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                Distribuição de Cadastros por Status
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                  <div className="text-xs font-bold text-slate-500 uppercase">Pendente</div>
                  <div className="text-2xl font-black text-amber-600 mt-1">{countPendentes}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Aguardando aprovação</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                  <div className="text-xs font-bold text-slate-500 uppercase">Em Análise</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">{countEmAnalise}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Conferindo documentos</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                  <div className="text-xs font-bold text-slate-500 uppercase">Aprovado</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{countAprovados}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Vaga confirmada</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                  <div className="text-xs font-bold text-slate-500 uppercase">Atendido / Entregue</div>
                  <div className="text-2xl font-black text-blue-600 mt-1">{countAtendidos}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Kit ou ensaio entregue</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                  <div className="text-xs font-bold text-slate-500 uppercase">Recusado</div>
                  <div className="text-2xl font-black text-slate-400 mt-1">{countRecusados}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Inscrições canceladas</div>
                </div>
              </div>
            </div>

            {/* SEÇÃO ANALÍTICA RECHARTS: CRESCIMENTO MENSAL & DISTRIBUIÇÃO POR PROJETO */}
            <AnalyticsCharts
              beneficiaries={beneficiaries}
              projects={projects}
              volunteers={volunteers}
              onUpdateVolunteers={onUpdateVolunteers}
            />

            {/* Informações Institucionais do Sistema */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Barras por Projeto */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Inscrições por Projeto Social
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    Total: {totalBeneficiarios} cadastros
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {projectStats.map((item, idx) => {
                    const percentage = totalBeneficiarios > 0
                      ? Math.round((item.count / totalBeneficiarios) * 100)
                      : 0;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700">{item.title}</span>
                          <span className="font-bold text-slate-900">
                            {item.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informações Institucionais do Sistema */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Resumo Institucional (Trindade - GO)
                </h3>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Razão Social:</span>
                    <span className="font-bold text-slate-800">Associação Novo Amanhecer</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">CNPJ:</span>
                    <span className="font-mono font-bold text-slate-800">{content.contato_cnpj}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Chave PIX:</span>
                    <span className="font-mono font-bold text-slate-800">{content.contato_pix_chave}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Endereço:</span>
                    <span className="font-semibold text-slate-800">{content.contato_endereco}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Instagram Oficial:</span>
                    <a
                      href={content.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-amber-700 hover:underline"
                    >
                      @anovoamanhecer
                    </a>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setActiveTab('beneficiarios')}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors text-center"
                  >
                    Gerenciar Beneficiários
                  </button>
                  <button
                    onClick={() => setActiveTab('conteudo')}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
                  >
                    Editar Textos do Site
                  </button>
                </div>
              </div>
            </div>

            {/* SEÇÃO: EXPORTAÇÃO DE RELATÓRIOS OFFLINE (CSV / EXCEL) */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Controle & Registro Offline
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">Compatível com Excel e Planilhas Google</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    Exportação de Relatórios Oficiais em Planilhas CSV
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Gere cópias para chamadas presenciais nas oficinas de ballet e futebol, arquivos físicos de prestação de contas ou auditorias.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('backup')}
                  className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ver Central de Backup</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Lista de Beneficiários */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {beneficiaries.length} inscritos
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm">
                      Lista de Beneficiários Completa
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Planilha com todos os cadastros: Nome, CPF, Telefone, Endereço ViaCEP, Projeto, Status e Observações.
                    </p>
                  </div>

                  <button
                    onClick={handleExportBeneficiarios}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Beneficiários (.csv)</span>
                  </button>
                </div>

                {/* 2. Relatório Gerencial de Projetos */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-amber-400 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-amber-700" />
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {projects.length} modalidades
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm">
                      Relatório Consolidado por Projeto
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Estatísticas por projeto (Ballet, Futebol, Gestantes, Festas): total de vagas, confirmados, fila de espera e coordenadores.
                    </p>
                  </div>

                  <button
                    onClick={handleExportProjetos}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Relatório Projetos (.csv)</span>
                  </button>
                </div>

                {/* 3. Resumo Executivo para Prestação de Contas */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-700" />
                      </div>
                      <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Conselho & Editais
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm">
                      Resumo Executivo de Impacto
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Documento sintético com dados formais da sede em Trindade, CNPJ, PIX e métricas de impacto comunitário anual.
                    </p>
                  </div>

                  <button
                    onClick={handleExportExecutivo}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Resumo Executivo (.csv)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: GRÁFICOS & ANÁLISES RECHARTS */}
        {activeTab === 'graficos' && (
          <AnalyticsCharts
            beneficiaries={beneficiaries}
            projects={projects}
            volunteers={volunteers}
            onUpdateVolunteers={onUpdateVolunteers}
          />
        )}

        {/* ABA: BENEFICIÁRIOS CRUD */}
        {activeTab === 'beneficiarios' && (
          <BeneficiariosCrud
            beneficiaries={beneficiaries}
            onUpdateBeneficiaries={onUpdateBeneficiaries}
            onRequestEmailNotification={onRequestEmailNotification}
            projects={projects}
          />
        )}

        {/* ABA: PROJETOS SOCIAIS */}
        {activeTab === 'projetos' && (
          <ProjetosCrud
            projects={projects}
            beneficiaries={beneficiaries}
            onUpdateProjects={onUpdateProjects}
          />
        )}

        {/* ABA: GESTÃO DA EQUIPE DE VOLUNTÁRIOS */}
        {activeTab === 'voluntarios' && (
          <VoluntariosRoscaChart
            volunteers={volunteers}
            onUpdateVolunteers={onUpdateVolunteers}
          />
        )}

        {/* ABA: CONTEÚDO CMS */}
        {activeTab === 'conteudo' && (
          <CmsConteudo
            content={content}
            onUpdateContent={onUpdateContent}
          />
        )}

        {/* ABA: GALERIA */}
        {activeTab === 'galeria' && (
          <GaleriaCrud
            photos={gallery}
            onUpdatePhotos={onUpdateGallery}
          />
        )}

        {/* ABA: USUÁRIOS ADMIN */}
        {activeTab === 'usuarios' && (
          <AdminUsers
            currentEmail={currentEmail}
            currentUserRole={userRole}
          />
        )}

        {/* ABA: BACKUP E DADOS */}
        {activeTab === 'backup' && (
          <BackupModal
            beneficiaries={beneficiaries}
            projects={projects}
            gallery={gallery}
            content={content}
            admins={admins}
            onRestoreAll={onRestoreAll}
          />
        )}

        {/* Rodapé do Painel Administrativo com Assinatura */}
        <footer className="pt-8 pb-4 border-t border-slate-200 mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Painel de Gestão Administrativa · Associação Novo Amanhecer
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Desenvolvido por</span>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <span className="w-4 h-4 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-xs">
                YC
              </span>
              <span className="font-bold text-xs text-slate-800">
                YC Soluções e Tecnologias
              </span>
            </div>
          </div>
        </footer>
      </main>
      </div>
    </div>
  );
};
