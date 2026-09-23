import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  Check,
  XCircle,
  Edit2,
  Trash2,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  FileSpreadsheet,
  User,
  CreditCard,
  RotateCcw,
  AlertCircle,
  Trophy,
  Sparkles,
  Camera,
  Gift,
  Layers,
  Award,
  Users,
  SlidersHorizontal,
} from 'lucide-react';
import Papa from 'papaparse';
import { Beneficiary, BeneficiaryStatus, StatusEmailNotification, ProjectCard } from '../../types';
import { formatCPF, formatPhone, validateCPF, cleanDigits } from '../../utils/validation';
import { exportBeneficiariesToCsv } from '../../utils/exportCsv';

interface BeneficiariosCrudProps {
  beneficiaries: Beneficiary[];
  onUpdateBeneficiaries: (beneficiaries: Beneficiary[]) => void;
  onRequestEmailNotification: (notif: StatusEmailNotification) => void;
  projects?: ProjectCard[];
}

export const BeneficiariosCrud: React.FC<BeneficiariosCrudProps> = ({
  beneficiaries,
  onUpdateBeneficiaries,
  onRequestEmailNotification,
  projects,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilterType, setSearchFilterType] = useState<'todos' | 'nome' | 'cpf'>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedProject, setSelectedProject] = useState<string>('todos');

  // Modal de Edição / Adição manual
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulário de Edição
  const [formData, setFormData] = useState<Partial<Beneficiary>>({});

  // Função auxiliar para busca insensível a acentos e maiúsculas
  const normalize = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  // Helper para casamento flexível e avançado de projetos (ex: 'futebol', 'ballet', etc.)
  const isProjectMatch = (beneficiaryProject: string, filterVal: string) => {
    if (!filterVal || filterVal === 'todos') return true;
    if (beneficiaryProject === filterVal) return true;

    const bLower = normalize(beneficiaryProject);
    const fLower = normalize(filterVal);

    if (fLower === 'futebol' || fLower === 'apenas futebol') {
      return bLower.includes('futebol') || bLower.includes('futsal');
    }
    if (fLower === 'ballet' || fLower === 'apenas ballet') {
      return bLower.includes('ballet') || bLower.includes('danca');
    }
    if (
      fLower === 'book' ||
      fLower === 'apenas book' ||
      fLower === 'gestante' ||
      fLower === 'apenas book gestante'
    ) {
      return bLower.includes('book') || bLower.includes('gestante');
    }
    if (fLower === 'festas' || fLower === 'apenas festas' || fLower === 'datas comemorativas') {
      return bLower.includes('festa') || bLower.includes('data');
    }

    return bLower.includes(fLower);
  };

  // Contagem dinâmica de inscritos por projeto social
  const projectCounts = useMemo(() => {
    const counts = {
      todos: beneficiaries.length,
      futebol: 0,
      ballet: 0,
      book: 0,
      festas: 0,
    };
    beneficiaries.forEach((b) => {
      if (isProjectMatch(b.projeto, 'futebol')) counts.futebol++;
      if (isProjectMatch(b.projeto, 'ballet')) counts.ballet++;
      if (isProjectMatch(b.projeto, 'book')) counts.book++;
      if (isProjectMatch(b.projeto, 'festas')) counts.festas++;
    });
    return counts;
  }, [beneficiaries]);

  // Presets visuais de filtros rápidos por projeto social
  const PROJECT_PRESETS = [
    {
      id: 'todos',
      label: 'Todos os Projetos',
      shortLabel: 'Todos',
      icon: Layers,
      activeBtnClass: 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-400/30',
      inactiveBtnClass: 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200',
      count: projectCounts.todos,
    },
    {
      id: 'futebol',
      label: 'Apenas Futebol',
      shortLabel: 'Futebol',
      projectName: 'Escolinha de Futebol Comunitário',
      icon: Trophy,
      activeBtnClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300 font-bold',
      inactiveBtnClass: 'bg-white text-emerald-800 hover:bg-emerald-50 border-emerald-200',
      count: projectCounts.futebol,
    },
    {
      id: 'ballet',
      label: 'Apenas Ballet',
      shortLabel: 'Ballet',
      projectName: 'Aulas de Ballet Solidário',
      icon: Sparkles,
      activeBtnClass: 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-300 font-bold',
      inactiveBtnClass: 'bg-white text-rose-800 hover:bg-rose-50 border-rose-200',
      count: projectCounts.ballet,
    },
    {
      id: 'book',
      label: 'Apenas Book Gestante',
      shortLabel: 'Book Gestante',
      projectName: 'Projeto Book Solidário para Gestantes',
      icon: Camera,
      activeBtnClass: 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-300 font-bold',
      inactiveBtnClass: 'bg-white text-purple-800 hover:bg-purple-50 border-purple-200',
      count: projectCounts.book,
    },
    {
      id: 'festas',
      label: 'Apenas Festas & Ações',
      shortLabel: 'Festas',
      projectName: 'Festas em Datas Comemorativas',
      icon: Gift,
      activeBtnClass: 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-300 font-bold',
      inactiveBtnClass: 'bg-white text-amber-800 hover:bg-amber-50 border-amber-200',
      count: projectCounts.festas,
    },
  ];

  const activePreset = PROJECT_PRESETS.find(
    (p) =>
      p.id === selectedProject ||
      (p.projectName && isProjectMatch(p.projectName, selectedProject))
  );

  const activeProjectCard = projects?.find((p) =>
    isProjectMatch(p.titulo, selectedProject)
  );

  // Filtragem inteligente por Nome ou CPF e Projeto Social
  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const trimmed = searchTerm.trim();
    let matchesSearch = true;

    if (trimmed) {
      const normalizedSearch = normalize(trimmed);
      const normalizedName = normalize(b.nome);
      const cleanedSearchCpf = cleanDigits(trimmed);
      const cleanedBeneficiaryCpf = cleanDigits(b.cpf);

      if (searchFilterType === 'nome') {
        matchesSearch = normalizedName.includes(normalizedSearch);
      } else if (searchFilterType === 'cpf') {
        matchesSearch =
          (cleanedSearchCpf.length > 0 && cleanedBeneficiaryCpf.includes(cleanedSearchCpf)) ||
          b.cpf.includes(trimmed);
      } else {
        const nameMatch = normalizedName.includes(normalizedSearch);
        const cpfMatch =
          (cleanedSearchCpf.length > 0 && cleanedBeneficiaryCpf.includes(cleanedSearchCpf)) ||
          b.cpf.includes(trimmed);
        const phoneMatch =
          cleanedSearchCpf.length >= 3 && cleanDigits(b.telefone).includes(cleanedSearchCpf);

        matchesSearch = nameMatch || cpfMatch || phoneMatch;
      }
    }

    const matchesStatus =
      selectedStatus === 'todos' || b.status === selectedStatus;

    const matchesProject = isProjectMatch(b.projeto, selectedProject);

    return matchesSearch && matchesStatus && matchesProject;
  });

  // Métricas em tempo real calculadas dinamicamente para o Card de Resumo
  const totalGeral = beneficiaries.length;
  const totalFiltrado = filteredBeneficiaries.length;
  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedStatus !== 'todos' ||
    selectedProject !== 'todos';

  const filterStats = useMemo(() => {
    let aprovados = 0;
    let pendentes = 0;
    let emAnalise = 0;
    let atendidos = 0;
    let recusados = 0;

    filteredBeneficiaries.forEach((b) => {
      if (b.status === 'Aprovado') aprovados++;
      else if (b.status === 'Pendente') pendentes++;
      else if (b.status === 'Em análise') emAnalise++;
      else if (b.status === 'Atendido/Entregue') atendidos++;
      else if (b.status === 'Recusado') recusados++;
    });

    const percentOfTotal = totalGeral > 0 ? Math.round((totalFiltrado / totalGeral) * 100) : 0;

    return {
      aprovados,
      pendentes,
      emAnalise,
      atendidos,
      recusados,
      percentOfTotal,
    };
  }, [filteredBeneficiaries, totalGeral, totalFiltrado]);

  // Alteração de Status com Gatilho de E-mail
  const handleStatusChange = (beneficiaryId: string, newStatus: BeneficiaryStatus) => {
    const target = beneficiaries.find((b) => b.id === beneficiaryId);
    if (!target) return;

    const prevStatus = target.status;

    const updated = beneficiaries.map((b) => {
      if (b.id === beneficiaryId) {
        return {
          ...b,
          status: newStatus,
          atualizado_em: new Date().toISOString().split('T')[0],
        };
      }
      return b;
    });

    onUpdateBeneficiaries(updated);

    // Mensagem de e-mail personalizada conforme status
    let defaultMsg = `Olá, ${target.nome}! Informamos que a sua inscrição para o projeto "${target.projeto}" na Associação Novo Amanhecer (Trindade - GO) teve seu status atualizado para: ${newStatus.toUpperCase()}.`;
    if (newStatus === 'Aprovado') {
      defaultMsg += ` Parabéns! Por favor, entre em contato pelo nosso WhatsApp ou venha à nossa sede para confirmar sua participação e retirar os materiais/agendar o ensaio.`;
    } else if (newStatus === 'Atendido/Entregue') {
      defaultMsg += ` Registramos com alegria o atendimento ou entrega concluída. Esperamos que faça bom proveito!`;
    }

    onRequestEmailNotification({
      beneficiaryName: target.nome,
      beneficiaryEmail: target.email,
      project: target.projeto,
      previousStatus: prevStatus,
      newStatus,
      date: new Date().toISOString().split('T')[0],
      messageText: defaultMsg,
    });
  };

  // Exclusão
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o cadastro de "${name}"?`)) {
      onUpdateBeneficiaries(beneficiaries.filter((b) => b.id !== id));
    }
  };

  // Salvar Edição
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBeneficiary) return;

    const updated = beneficiaries.map((b) => {
      if (b.id === editingBeneficiary.id) {
        return {
          ...b,
          ...formData,
          atualizado_em: new Date().toISOString().split('T')[0],
        } as Beneficiary;
      }
      return b;
    });

    onUpdateBeneficiaries(updated);
    setEditingBeneficiary(null);
  };

  // Salvar Novo Beneficiário
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.cpf) {
      alert('Por favor, preencha pelo menos o Nome e o CPF do beneficiário.');
      return;
    }

    const cleanCpfDigits = cleanDigits(formData.cpf);
    if (cleanCpfDigits.length === 11 && !validateCPF(cleanCpfDigits)) {
      alert('CPF informado é inválido. Por favor, verifique os dígitos.');
      return;
    }

    const newBeneficiary: Beneficiary = {
      id: `ben-${Date.now()}`,
      nome: formData.nome.trim(),
      cpf: formData.cpf.trim(),
      nascimento: formData.nascimento || '2010-01-01',
      telefone: formData.telefone || '(62) 99999-0000',
      email: formData.email || '',
      endereco: formData.endereco || 'Trindade - GO',
      projeto: formData.projeto || 'Escolinha de Futebol Comunitário',
      status: (formData.status as BeneficiaryStatus) || 'Pendente',
      observacoes: formData.observacoes || '',
      criado_em: new Date().toISOString().split('T')[0],
      atualizado_em: new Date().toISOString().split('T')[0],
    };

    onUpdateBeneficiaries([newBeneficiary, ...beneficiaries]);
    setShowAddModal(false);
    setFormData({});
  };

  // Exportação CSV via utilitário centralizado com UTF-8 BOM
  const handleExportCSV = () => {
    let customFilename = undefined;
    const dateStr = new Date().toISOString().split('T')[0];
    if (selectedProject === 'futebol' || selectedProject.toLowerCase().includes('futebol')) {
      customFilename = `inscritos_apenas_futebol_${dateStr}.csv`;
    } else if (selectedProject === 'ballet' || selectedProject.toLowerCase().includes('ballet')) {
      customFilename = `inscritos_apenas_ballet_${dateStr}.csv`;
    } else if (
      selectedProject === 'book' ||
      selectedProject.toLowerCase().includes('book') ||
      selectedProject.toLowerCase().includes('gestante')
    ) {
      customFilename = `inscritos_apenas_book_gestante_${dateStr}.csv`;
    } else if (selectedProject === 'festas' || selectedProject.toLowerCase().includes('festa')) {
      customFilename = `inscritos_apenas_festas_${dateStr}.csv`;
    } else if (selectedProject !== 'todos') {
      customFilename = `inscritos_${selectedProject.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${dateStr}.csv`;
    }
    exportBeneficiariesToCsv(filteredBeneficiaries, customFilename);
  };

  return (
    <div className="space-y-6">
      {/* CARD DE RESUMO NO PAINEL ADMINISTRATIVO COM CONTADOR EM TEMPO REAL */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 relative overflow-hidden transition-all duration-300">
        {/* Glows sutis decorativos de fundo */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Cabeçalho do Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-100/90 text-amber-900 border border-amber-300/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Contador em Tempo Real
                </span>
                {hasActiveFilters ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-white shadow-2xs">
                    <Filter className="w-3 h-3 text-amber-400" />
                    Filtros da Tabela Ativos
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Base Completa Visível
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Resumo Geral de Beneficiários
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Monitoramento instantâneo do cadastro institucional com atualização dinâmica a cada filtro aplicado.
              </p>
            </div>

            {/* Ações Rápidas no Topo do Card */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    status: 'Pendente',
                    projeto:
                      selectedProject !== 'todos' && activePreset?.projectName
                        ? activePreset.projectName
                        : 'Escolinha de Futebol Comunitário',
                  });
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Novo Beneficiário</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 transition-all cursor-pointer"
                title="Exportar registros filtrados em tempo real"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exportar CSV ({totalFiltrado})</span>
              </button>
            </div>
          </div>

          {/* Destaque Principal: Contador Gigante e Submétricas em Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Bloco 1: Contador Principal em Tempo Real (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-bold">
                    <Users className="w-4 h-4 text-amber-400" />
                    {hasActiveFilters ? 'Beneficiários Filtrados' : 'Total Cadastrado na Base'}
                  </span>
                  <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-[11px] text-amber-300 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Tempo Real
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                    {totalFiltrado}
                  </span>
                  <div className="text-xs sm:text-sm font-medium text-slate-400">
                    <div>
                      de <strong className="text-amber-300 font-bold">{totalGeral}</strong> no total
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {hasActiveFilters ? 'filtrados na tabela' : 'cadastros ativos'}
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso / Proporção do Filtro */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">Proporção visível</span>
                    <span className="font-bold text-amber-300 font-mono">
                      {filterStats.percentOfTotal}% do banco total
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(2, filterStats.percentOfTotal)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status do Filtro / Botão de Reset Rápido */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  {hasActiveFilters ? 'Exibindo subconjunto dinâmico' : 'Mostrando 100% dos cadastros'}
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedStatus('todos');
                      setSelectedProject('todos');
                      setSearchFilterType('todos');
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Ver Todos ({totalGeral})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bloco 2: Sub-Cards Dinâmicos por Status da Seleção Atual (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Aprovados */}
              <button
                type="button"
                onClick={() => setSelectedStatus(selectedStatus === 'Aprovado' ? 'todos' : 'Aprovado')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStatus === 'Aprovado'
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-emerald-50/50 hover:border-emerald-200'
                }`}
                title="Clique para filtrar apenas Aprovados"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                    Aprovados
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
                    {filterStats.aprovados}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                    {totalFiltrado > 0
                      ? `${Math.round((filterStats.aprovados / totalFiltrado) * 100)}% da seleção`
                      : '0%'}
                  </div>
                </div>
              </button>

              {/* Pendentes */}
              <button
                type="button"
                onClick={() => setSelectedStatus(selectedStatus === 'Pendente' ? 'todos' : 'Pendente')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStatus === 'Pendente'
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-amber-50/50 hover:border-amber-200'
                }`}
                title="Clique para filtrar apenas Pendentes"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                    Pendentes
                  </span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
                    {filterStats.pendentes}
                  </div>
                  <div className="text-[10px] text-amber-700 font-semibold mt-1">
                    {totalFiltrado > 0
                      ? `${Math.round((filterStats.pendentes / totalFiltrado) * 100)}% da seleção`
                      : '0%'}
                  </div>
                </div>
              </button>

              {/* Em Análise */}
              <button
                type="button"
                onClick={() => setSelectedStatus(selectedStatus === 'Em análise' ? 'todos' : 'Em análise')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStatus === 'Em análise'
                    ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-300 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-orange-50/50 hover:border-orange-200'
                }`}
                title="Clique para filtrar apenas Em análise"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wide">
                    Em Análise
                  </span>
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-orange-950 font-mono">
                    {filterStats.emAnalise}
                  </div>
                  <div className="text-[10px] text-orange-700 font-semibold mt-1">
                    {totalFiltrado > 0
                      ? `${Math.round((filterStats.emAnalise / totalFiltrado) * 100)}% da seleção`
                      : '0%'}
                  </div>
                </div>
              </button>

              {/* Atendidos */}
              <button
                type="button"
                onClick={() =>
                  setSelectedStatus(
                    selectedStatus === 'Atendido/Entregue' ? 'todos' : 'Atendido/Entregue'
                  )
                }
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStatus === 'Atendido/Entregue'
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200'
                }`}
                title="Clique para filtrar apenas Atendidos / Entregues"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">
                    Atendidos
                  </span>
                  <Check className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-blue-950 font-mono">
                    {filterStats.atendidos}
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold mt-1">
                    {totalFiltrado > 0
                      ? `${Math.round((filterStats.atendidos / totalFiltrado) * 100)}% da seleção`
                      : '0%'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Chips Indicadores dos Filtros Ativos no Momento */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">
                Filtros ativos recalculando o contador:
              </span>

              {selectedProject !== 'todos' && activePreset && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                  <activePreset.icon className="w-3.5 h-3.5 text-amber-600" />
                  <span>Projeto: {activePreset.label}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedProject('todos')}
                    className="hover:text-red-600 p-0.5 rounded-full hover:bg-amber-100 cursor-pointer"
                    title="Remover filtro de projeto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedStatus !== 'todos' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                  <span>Status: {selectedStatus}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('todos')}
                    className="hover:text-red-600 p-0.5 rounded-full hover:bg-slate-200 cursor-pointer"
                    title="Remover filtro de status"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchTerm.trim() && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                  <Search className="w-3 h-3 text-slate-500" />
                  <span>
                    Busca: "{searchTerm}" (
                    {searchFilterType === 'nome'
                      ? 'por Nome'
                      : searchFilterType === 'cpf'
                      ? 'por CPF'
                      : 'Nome/CPF'}
                    )
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="hover:text-red-600 p-0.5 rounded-full hover:bg-slate-200 cursor-pointer"
                    title="Limpar texto de busca"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('todos');
                  setSelectedProject('todos');
                  setSearchFilterType('todos');
                }}
                className="text-[11px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer ml-auto"
              >
                Limpar todos os filtros ({totalGeral} cadastrados)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        {/* FILTROS RÁPIDOS AVANÇADOS POR PROJETO SOCIAL */}
        <div className="space-y-2.5 pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>Filtro Rápido por Projeto Social:</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Selecione para isolar especificamente os alunos de uma turma ou oficina
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PROJECT_PRESETS.map((preset) => {
              const isSelected =
                selectedProject === preset.id ||
                (preset.projectName && isProjectMatch(preset.projectName, selectedProject));

              const Icon = preset.icon;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    if (isSelected && preset.id !== 'todos') {
                      setSelectedProject('todos');
                    } else {
                      setSelectedProject(preset.id);
                    }
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected ? preset.activeBtnClass : preset.inactiveBtnClass
                  }`}
                  title={`Visualizar apenas inscritos em: ${preset.label}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{preset.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}
                  >
                    {preset.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Campo de Busca Avançada por Nome ou CPF */}
          <div className="flex-1 max-w-xl space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  searchFilterType === 'nome'
                    ? 'Buscar por nome do beneficiário...'
                    : searchFilterType === 'cpf'
                    ? 'Buscar por CPF (ex: 123.456 ou apenas números)...'
                    : 'Buscar beneficiário por Nome ou CPF...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white shadow-2xs transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Limpar busca"
                  aria-label="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chips de Seleção de Tipo de Busca (Nome / CPF / Ambos) */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Filtrar por:</span>
              <button
                type="button"
                onClick={() => setSearchFilterType('todos')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  searchFilterType === 'todos'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Nome ou CPF
              </button>
              <button
                type="button"
                onClick={() => setSearchFilterType('nome')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  searchFilterType === 'nome'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <User className="w-3 h-3" />
                <span>Apenas Nome</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchFilterType('cpf')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  searchFilterType === 'cpf'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CreditCard className="w-3 h-3" />
                <span>Apenas CPF</span>
              </button>
            </div>
          </div>

          {/* Botões de Ação: Exportar CSV */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200"
              title="Baixar lista filtrada em arquivo CSV / Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>
                Exportar CSV ({filteredBeneficiaries.length}
                {selectedProject !== 'todos' && activePreset ? ` em ${activePreset.shortLabel}` : ''})
              </span>
            </button>
          </div>
        </div>

        {/* Filtros por Status e Projeto */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-600">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
              >
                <option value="todos">Todos os Status ({beneficiaries.length})</option>
                <option value="Pendente">Pendente</option>
                <option value="Em análise">Em análise</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Atendido/Entregue">Atendido/Entregue</option>
                <option value="Recusado">Recusado</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Projeto:</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
              >
                <option value="todos">Todos os Projetos ({beneficiaries.length})</option>
                <option value="futebol">Apenas Futebol ({projectCounts.futebol})</option>
                <option value="ballet">Apenas Ballet ({projectCounts.ballet})</option>
                <option value="book">Apenas Book Gestante ({projectCounts.book})</option>
                <option value="festas">Apenas Festas & Ações ({projectCounts.festas})</option>
                {projects
                  ?.filter(
                    (p) =>
                      !isProjectMatch(p.titulo, 'futebol') &&
                      !isProjectMatch(p.titulo, 'ballet') &&
                      !isProjectMatch(p.titulo, 'book') &&
                      !isProjectMatch(p.titulo, 'festas')
                  )
                  .map((p) => (
                    <option key={p.id} value={p.titulo}>
                      {p.titulo}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Feedback de Busca Ativa */}
          {(searchTerm || selectedStatus !== 'todos' || selectedProject !== 'todos') && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">
                {filteredBeneficiaries.length} de {beneficiaries.length} encontrados
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('todos');
                  setSelectedProject('todos');
                  setSearchFilterType('todos');
                }}
                className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md border border-amber-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar Filtros</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BANNER INFORMATIVO DO PROJETO SELECIONADO */}
      {selectedProject !== 'todos' && activePreset && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-purple-500/10 p-5 rounded-3xl border border-amber-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-2xs ${
                  activePreset.id === 'futebol'
                    ? 'bg-emerald-600'
                    : activePreset.id === 'ballet'
                    ? 'bg-rose-600'
                    : activePreset.id === 'book'
                    ? 'bg-purple-600'
                    : 'bg-amber-600'
                }`}
              >
                <activePreset.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                    Visualização Específica Ativa
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-600 font-medium">
                    {filteredBeneficiaries.length}{' '}
                    {filteredBeneficiaries.length === 1 ? 'inscrito encontrado' : 'inscritos encontrados'}
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900 mt-0.5">
                  {activePreset.projectName || activePreset.label}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="Exportar apenas os alunos desta turma em planilha CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Exportar Lista da Turma (.csv)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProject('todos')}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="Remover filtro e voltar a ver todos os projetos"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ver Todos</span>
              </button>
            </div>
          </div>

          {/* Dados Adicionais da Turma: Horário, Coordenador, Faixa Etária */}
          {activeProjectCard && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-2 border-t border-amber-200/60">
              {activeProjectCard.coordenador && (
                <div>
                  <strong className="text-slate-800">Coordenação:</strong> {activeProjectCard.coordenador}
                </div>
              )}
              {activeProjectCard.horario && (
                <div>
                  <strong className="text-slate-800">Horários:</strong> {activeProjectCard.horario}
                </div>
              )}
              {activeProjectCard.idade_publico && (
                <div>
                  <strong className="text-slate-800">Público-alvo:</strong> {activeProjectCard.idade_publico}
                </div>
              )}
            </div>
          )}

          {/* Sub-chips de Status Rápidos dentro deste projeto */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[11px] text-slate-500 font-semibold mr-1">Filtrar status nesta turma:</span>
            {(['todos', 'Aprovado', 'Em análise', 'Pendente', 'Atendido/Entregue', 'Recusado'] as (BeneficiaryStatus | 'todos')[]).map((st) => {
              const countInProject = beneficiaries.filter(
                (b) => isProjectMatch(b.projeto, selectedProject) && (st === 'todos' || b.status === st)
              ).length;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                  }`}
                >
                  {st === 'todos' ? 'Todos os Status' : st} ({countInProject})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista / Tabela de Beneficiários */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredBeneficiaries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Nenhum beneficiário encontrado</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {searchTerm
                  ? `Não encontramos nenhum resultado para "${searchTerm}" no filtro de ${
                      searchFilterType === 'nome'
                        ? 'nome'
                        : searchFilterType === 'cpf'
                        ? 'CPF'
                        : 'nome ou CPF'
                    }. Verifique a digitação ou tente buscar por outro termo.`
                  : 'Nenhum cadastro coincide com os filtros de status e projeto selecionados.'}
              </p>
            </div>
            {(searchTerm || selectedStatus !== 'todos' || selectedProject !== 'todos') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('todos');
                  setSelectedProject('todos');
                  setSearchFilterType('todos');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar busca e ver todos ({beneficiaries.length})</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBeneficiaries.map((b) => (
              <div
                key={b.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                {/* Dados Principais do Beneficiário */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{b.nome}</span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        b.status === 'Aprovado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'Em análise'
                          ? 'bg-amber-100 text-amber-900'
                          : b.status === 'Atendido/Entregue'
                          ? 'bg-blue-100 text-blue-900'
                          : b.status === 'Recusado'
                          ? 'bg-red-100 text-red-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isProjectMatch(b.projeto, 'futebol')) {
                          setSelectedProject('futebol');
                        } else if (isProjectMatch(b.projeto, 'ballet')) {
                          setSelectedProject('ballet');
                        } else if (isProjectMatch(b.projeto, 'book')) {
                          setSelectedProject('book');
                        } else if (isProjectMatch(b.projeto, 'festas')) {
                          setSelectedProject('festas');
                        } else {
                          setSelectedProject(b.projeto);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                        isProjectMatch(b.projeto, selectedProject) && selectedProject !== 'todos'
                          ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-300/70 shadow-2xs'
                          : 'text-amber-800 bg-amber-50/90 hover:bg-amber-100/90 border-amber-200 hover:border-amber-300'
                      }`}
                      title={`Clique para filtrar apenas inscritos de: ${b.projeto}`}
                    >
                      <Filter className="w-2.5 h-2.5 text-amber-600" />
                      <span>{b.projeto}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md transition-colors ${
                        searchTerm &&
                        (cleanDigits(b.cpf).includes(cleanDigits(searchTerm)) ||
                          b.cpf.includes(searchTerm.trim()))
                          ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      <strong className="text-slate-700">CPF:</strong> {b.cpf}
                    </span>
                    <span>·</span>
                    <span>
                      <strong className="text-slate-700">Nasc:</strong> {b.nascimento}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {b.telefone}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {b.endereco}
                    </span>
                  </div>

                  {b.observacoes && (
                    <div className="text-xs text-slate-600 bg-amber-50/60 p-2 rounded-xl border border-amber-100/60 mt-1">
                      <strong>Obs:</strong> {b.observacoes}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-0.5">
                    Cadastrado em: {b.criado_em} {b.atualizado_em && `· Atualizado em: ${b.atualizado_em}`}
                  </div>
                </div>

                {/* Ações de Gestão de Status e Edição */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0">
                  {/* Botões Rápidos de Status */}
                  <div className="flex items-center gap-1">
                    {b.status !== 'Aprovado' && (
                      <button
                        onClick={() => handleStatusChange(b.id, 'Aprovado')}
                        className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                        title="Aprovar e disparar notificação"
                      >
                        Aprovar
                      </button>
                    )}

                    {b.status !== 'Em análise' && (
                      <button
                        onClick={() => handleStatusChange(b.id, 'Em análise')}
                        className="px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                        title="Colocar em análise"
                      >
                        Em Análise
                      </button>
                    )}

                    {b.status !== 'Atendido/Entregue' && (
                      <button
                        onClick={() => handleStatusChange(b.id, 'Atendido/Entregue')}
                        className="px-2.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer"
                        title="Marcar como atendido/entregue"
                      >
                        Atendido
                      </button>
                    )}

                    {b.status !== 'Recusado' && (
                      <button
                        onClick={() => handleStatusChange(b.id, 'Recusado')}
                        className="px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Recusar cadastro"
                      >
                        Recusar
                      </button>
                    )}
                  </div>

                  {/* Editar e Excluir */}
                  <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                    <button
                      onClick={() => {
                        setEditingBeneficiary(b);
                        setFormData(b);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      title="Editar cadastro"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(b.id, b.nome)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Excluir cadastro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingBeneficiary && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingBeneficiary(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Editar Cadastro do Beneficiário
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cpf || ''}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telefone || ''}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Projeto
                  </label>
                  <select
                    value={formData.projeto || ''}
                    onChange={(e) => setFormData({ ...formData, projeto: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Aulas de Ballet Solidário">Aulas de Ballet Solidário</option>
                    <option value="Escolinha de Futebol Comunitário">Escolinha de Futebol Comunitário</option>
                    <option value="Projeto Book Solidário para Gestantes">Projeto Book Solidário para Gestantes</option>
                    <option value="Festas em Datas Comemorativas">Festas em Datas Comemorativas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status || 'Pendente'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as BeneficiaryStatus })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Atendido/Entregue">Atendido/Entregue</option>
                    <option value="Recusado">Recusado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.endereco || ''}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observações da Equipe
                </label>
                <textarea
                  rows={3}
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBeneficiary(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro Manual de Novo Beneficiário */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowAddModal(false);
                setFormData({});
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Cadastrar Novo Beneficiário
                </h3>
                <p className="text-xs text-slate-500">
                  Adicione um participante manualmente à base de dados da associação.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do aluno ou assistido"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={formData.cpf || ''}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.nascimento || ''}
                    onChange={(e) => setFormData({ ...formData, nascimento: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(62) 99999-0000"
                    value={formData.telefone || ''}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Projeto Social
                  </label>
                  <select
                    value={formData.projeto || 'Escolinha de Futebol Comunitário'}
                    onChange={(e) => setFormData({ ...formData, projeto: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Escolinha de Futebol Comunitário">Escolinha de Futebol Comunitário</option>
                    <option value="Aulas de Ballet Solidário">Aulas de Ballet Solidário</option>
                    <option value="Projeto Book Solidário para Gestantes">Projeto Book Solidário para Gestantes</option>
                    <option value="Festas em Datas Comemorativas">Festas em Datas Comemorativas</option>
                    {projects
                      ?.filter(
                        (p) =>
                          !p.titulo.toLowerCase().includes('futebol') &&
                          !p.titulo.toLowerCase().includes('ballet') &&
                          !p.titulo.toLowerCase().includes('book') &&
                          !p.titulo.toLowerCase().includes('festa')
                      )
                      .map((p) => (
                        <option key={p.id} value={p.titulo}>
                          {p.titulo}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={formData.status || 'Pendente'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as BeneficiaryStatus })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Atendido/Entregue">Atendido/Entregue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Endereço / Bairro (Trindade - GO)
                </label>
                <input
                  type="text"
                  placeholder="Rua, número, setor"
                  value={formData.endereco || ''}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais, tamanho do uniforme, responsável legal..."
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({});
                  }}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  Cadastrar Beneficiário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
