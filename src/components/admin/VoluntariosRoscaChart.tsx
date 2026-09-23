import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import {
  Users,
  HandHeart,
  Clock,
  Briefcase,
  Search,
  Plus,
  MessageCircle,
  Phone,
  CheckCircle2,
  Calendar,
  Filter,
  Download,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Volunteer, VolunteerArea, VolunteerAvailability } from '../../types';
import Papa from 'papaparse';

interface VoluntariosRoscaChartProps {
  volunteers: Volunteer[];
  onUpdateVolunteers?: (volunteers: Volunteer[]) => void;
  compactMode?: boolean;
}

// Cores temáticas para as Áreas de Atuação dos voluntários
const AREA_COLORS: Record<string, string> = {
  'Oficina de Ballet': '#ec4899', // Rosa
  'Treinos de Futebol': '#059669', // Verde Esmeralda
  'Fotografia & Produção (Book)': '#8b5cf6', // Violeta
  'Cozinha Comunitária & Alimentação': '#f97316', // Laranja quente
  'Apoio Pedagógico & Escolar': '#3b82f6', // Azul real
  'Logística, Triagem & Eventos': '#eab308', // Amarelo Ouro
  'Saúde Comunitária (Acolhimento)': '#06b6d4', // Ciano
};

// Cores temáticas para a Disponibilidade da equipe
const AVAILABILITY_COLORS: Record<string, string> = {
  'Sábados (Manhã)': '#d97706', // Âmbar
  'Finais de Semana (Geral)': '#10b981', // Verde
  'Dias de Semana (Tarde)': '#6366f1', // Índigo
  'Dias de Semana (Manhã)': '#0284c7', // Azul Céu
  'Eventos & Datas Comemorativas': '#f43f5e', // Rosa forte
  'Escala Flexível': '#8b5cf6', // Roxo
};

const FALLBACK_COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#0284c7', '#14b8a6'];

export const VoluntariosRoscaChart: React.FC<VoluntariosRoscaChartProps> = ({
  volunteers,
  onUpdateVolunteers,
  compactMode = false,
}) => {
  // Modo de visualização do gráfico de rosca: 'area' ou 'disponibilidade'
  const [viewMode, setViewMode] = useState<'area' | 'disponibilidade'>('area');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de Adicionar / Editar Voluntário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);

  // Formulário
  const [formNome, setFormNome] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formArea, setFormArea] = useState<VolunteerArea>('Oficina de Ballet');
  const [formDisponibilidade, setFormDisponibilidade] = useState<VolunteerAvailability>('Sábados (Manhã)');
  const [formHabilidades, setFormHabilidades] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');

  // 1. Dados Agrupados por Área de Atuação
  const areaData = useMemo(() => {
    const counts: Record<string, number> = {};
    volunteers.forEach((v) => {
      counts[v.area] = (counts[v.area] || 0) + 1;
    });

    const total = volunteers.length;
    return Object.entries(counts).map(([name, value], index) => {
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
      const color = AREA_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
      return {
        name,
        value,
        percentage,
        color,
      };
    }).sort((a, b) => b.value - a.value);
  }, [volunteers]);

  // 2. Dados Agrupados por Disponibilidade
  const availabilityData = useMemo(() => {
    const counts: Record<string, number> = {};
    volunteers.forEach((v) => {
      counts[v.disponibilidade] = (counts[v.disponibilidade] || 0) + 1;
    });

    const total = volunteers.length;
    return Object.entries(counts).map(([name, value], index) => {
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
      const color = AVAILABILITY_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
      return {
        name,
        value,
        percentage,
        color,
      };
    }).sort((a, b) => b.value - a.value);
  }, [volunteers]);

  const activeChartData = viewMode === 'area' ? areaData : availabilityData;
  const totalVoluntarios = volunteers.length;

  // Filtragem da lista da equipe para facilitação do gerenciamento
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((v) => {
      const matchesSearch =
        v.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.telefone.includes(searchTerm) ||
        v.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.disponibilidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.habilidades && v.habilidades.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedFilter) {
        if (viewMode === 'area') {
          return v.area === selectedFilter;
        } else {
          return v.disponibilidade === selectedFilter;
        }
      }

      return true;
    });
  }, [volunteers, searchTerm, selectedFilter, viewMode]);

  // Abertura do Modal de Adição
  const handleOpenAdd = () => {
    setEditingVolunteer(null);
    setFormNome('');
    setFormTelefone('');
    setFormEmail('');
    setFormArea('Oficina de Ballet');
    setFormDisponibilidade('Sábados (Manhã)');
    setFormHabilidades('');
    setFormObservacoes('');
    setIsModalOpen(true);
  };

  // Abertura do Modal de Edição
  const handleOpenEdit = (v: Volunteer) => {
    setEditingVolunteer(v);
    setFormNome(v.nome);
    setFormTelefone(v.telefone);
    setFormEmail(v.email);
    setFormArea(v.area);
    setFormDisponibilidade(v.disponibilidade);
    setFormHabilidades(v.habilidades || '');
    setFormObservacoes(v.observacoes || '');
    setIsModalOpen(true);
  };

  // Salvar Voluntário
  const handleSaveVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formTelefone.trim()) return;

    if (editingVolunteer) {
      const updated = volunteers.map((v) =>
        v.id === editingVolunteer.id
          ? {
              ...v,
              nome: formNome.trim(),
              telefone: formTelefone.trim(),
              email: formEmail.trim(),
              area: formArea,
              disponibilidade: formDisponibilidade,
              habilidades: formHabilidades.trim(),
              observacoes: formObservacoes.trim(),
            }
          : v
      );
      onUpdateVolunteers?.(updated);
    } else {
      const newVol: Volunteer = {
        id: `vol-${Date.now()}`,
        nome: formNome.trim(),
        telefone: formTelefone.trim(),
        email: formEmail.trim(),
        area: formArea,
        disponibilidade: formDisponibilidade,
        ativo: true,
        data_inicio: new Date().toISOString().split('T')[0],
        habilidades: formHabilidades.trim(),
        observacoes: formObservacoes.trim(),
      };
      onUpdateVolunteers?.([newVol, ...volunteers]);
    }

    setIsModalOpen(false);
  };

  // Alternar Status Ativo
  const handleToggleActive = (id: string) => {
    const updated = volunteers.map((v) =>
      v.id === id ? { ...v, ativo: !v.ativo } : v
    );
    onUpdateVolunteers?.(updated);
  };

  // Exportar Escala de Voluntários em CSV
  const handleExportCSV = () => {
    const dataToExport = filteredVolunteers.map((v) => ({
      Nome: v.nome,
      'Telefone / WhatsApp': v.telefone,
      'E-mail': v.email,
      'Área de Atuação': v.area,
      Disponibilidade: v.disponibilidade,
      Situação: v.ativo ? 'Ativo' : 'Inativo / Pausado',
      'Início do Voluntariado': v.data_inicio,
      Habilidades: v.habilidades || '',
      Observações: v.observacoes || '',
    }));

    const csv = Papa.unparse(dataToExport, { delimiter: ';' });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `escala_voluntarios_novo_amanhecer_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL DO GRÁFICO DE ROSCA */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
        {/* Cabeçalho do Gráfico com Alternador de Visão */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md">
                Gestão da Equipe Voluntária
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">Gráfico de Rosca Interativo</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
              <HandHeart className="w-5 h-5 text-rose-600" />
              <span>Distribuição de Voluntários</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Alterne entre áreas de atuação e disponibilidade para planejar escalas de oficinas, ensaios e cozinha.
            </p>
          </div>

          {/* Switch de Modo: Por Área vs Por Disponibilidade */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setViewMode('area');
                  setSelectedFilter(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'area'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                <span>Por Área de Atuação</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('disponibilidade');
                  setSelectedFilter(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'disponibilidade'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Por Disponibilidade</span>
              </button>
            </div>

            {onUpdateVolunteers && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Voluntário</span>
              </button>
            )}
          </div>
        </div>

        {/* Layout Dividido: Gráfico de Rosca à Esquerda + Legenda Detalhada à Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LADO ESQUERDO: GRÁFICO DE ROSCA COM TEXTO CENTRAL (5 Colunas) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full h-72 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={108}
                    paddingAngle={4}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(data: any) => {
                      if (data?.name && selectedFilter === data.name) {
                        setSelectedFilter(null);
                      } else if (data?.name) {
                        setSelectedFilter(String(data.name));
                      }
                    }}
                  >
                    {activeChartData.map((entry, index) => (
                      <Cell
                        key={`cell-vol-${index}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={activeIndex === index || selectedFilter === entry.name ? 3 : 2}
                        className="cursor-pointer transition-all duration-200"
                        style={{
                          filter:
                            activeIndex === index || selectedFilter === entry.name
                              ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))'
                              : 'none',
                          transform:
                            activeIndex === index || selectedFilter === entry.name
                              ? 'scale(1.03)'
                              : 'scale(1)',
                          transformOrigin: 'center center',
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs shadow-2xl border border-slate-700 min-w-[170px] space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-300 font-bold border-b border-slate-800 pb-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                              <span className="truncate">{data.name}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 text-[11px]">
                              <span className="text-slate-400">Total de voluntários:</span>
                              <span className="font-black text-rose-300 text-sm">
                                {data.value}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-400">Proporção da equipe:</span>
                              <span className="font-bold text-white">{data.percentage}%</span>
                            </div>
                            <div className="text-[10px] text-amber-400 pt-1 text-center">
                              Clique para filtrar a equipe
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Rótulo Central no Miolo da Rosca */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {totalVoluntarios}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 mt-0.5">
                  Voluntários
                </span>
                <span className="text-[9px] text-slate-400 font-medium">
                  {viewMode === 'area' ? 'em 7 áreas' : 'escalonados'}
                </span>
              </div>
            </div>

            {selectedFilter && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-900 rounded-full border border-rose-200 text-xs font-bold animate-in fade-in">
                <span>Filtrando por: <strong>{selectedFilter}</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedFilter(null)}
                  className="hover:text-rose-700 p-0.5 rounded-full hover:bg-rose-100 cursor-pointer"
                  title="Limpar filtro"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* LADO DIREITO: LEGENDA INTERATIVA COM BARRAS DE PROPORÇÃO (7 Colunas) */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
              <span>{viewMode === 'area' ? 'Área de Atuação' : 'Disponibilidade'}</span>
              <span>Voluntários (%)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeChartData.map((item, idx) => {
                const isSelected = selectedFilter === item.name;
                const isHovered = activeIndex === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedFilter(isSelected ? null : item.name);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-rose-50/80 border-rose-400 shadow-xs ring-2 ring-rose-200'
                        : isHovered
                        ? 'bg-slate-50 border-slate-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-slate-800 truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span className="font-black text-slate-900 shrink-0">
                        {item.value} <span className="text-[10px] text-slate-500 font-normal">({item.percentage}%)</span>
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between px-1">
              <span className="flex items-center gap-1 text-slate-600">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Dica: Clique em qualquer setor ou card para filtrar a escala da equipe abaixo.</span>
              </span>
              {selectedFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter(null)}
                  className="font-bold text-rose-700 hover:underline cursor-pointer"
                >
                  Ver todos ({totalVoluntarios})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: GERENCIAMENTO DA EQUIPE DE VOLUNTÁRIOS */}
      {!compactMode && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <span>Escala e Contato com a Equipe ({filteredVolunteers.length})</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Acione voluntários via WhatsApp para plantões, aulas de dança, treinos de futebol ou preparo de lanches.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Exportar escala completa em planilha CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Exportar Escala (.csv)</span>
              </button>

              {onUpdateVolunteers && (
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Voluntário</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra de Busca de Voluntários */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, habilidade, área ou horário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista de Cards dos Voluntários */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVolunteers.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-500 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-800">Nenhum voluntário encontrado</p>
                <p className="text-xs text-slate-500">
                  Tente alterar os termos de busca ou remover o filtro selecionado.
                </p>
                {(searchTerm || selectedFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedFilter(null);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                  >
                    Limpar Filtros e Ver Todos
                  </button>
                )}
              </div>
            ) : (
              filteredVolunteers.map((vol) => {
                const areaColor = AREA_COLORS[vol.area] || '#64748b';
                const cleanPhone = vol.telefone.replace(/\D/g, '');
                const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                  `Olá ${vol.nome}! Aqui é da coordenação da Associação Novo Amanhecer (Trindade). Gostaria de falar sobre a nossa escala do ${vol.area}.`
                )}`;

                return (
                  <div
                    key={vol.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">
                            {vol.nome}
                          </h4>
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md mt-1"
                            style={{
                              backgroundColor: `${areaColor}15`,
                              color: areaColor,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: areaColor }}
                            />
                            {vol.area}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            vol.ativo
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {vol.ativo ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">{vol.disponibilidade}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{vol.telefone}</span>
                        </div>

                        {vol.habilidades && (
                          <p className="text-[11px] text-slate-500 pt-1 line-clamp-2">
                            <strong>Habilidades:</strong> {vol.habilidades}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação Rápida */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                        title="Conversar no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chamar no Zap</span>
                      </a>

                      {onUpdateVolunteers && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(vol)}
                            className="p-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar voluntário"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(vol.id)}
                            className="p-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={vol.ativo ? 'Pausar participação' : 'Reativar voluntário'}
                          >
                            {vol.ativo ? 'Pausar' : 'Ativar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE VOLUNTÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
                <HandHeart className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingVolunteer ? 'Editar Voluntário' : 'Novo Voluntário da Equipe'}
                </h3>
                <span className="text-xs text-slate-500">
                  Associação Novo Amanhecer · Trindade - GO
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveVolunteer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vanessa Cristina Mendonça"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(62) 99999-9999"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="voluntario@gmail.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Área de Atuação
                  </label>
                  <select
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value as VolunteerArea)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Oficina de Ballet">Oficina de Ballet</option>
                    <option value="Treinos de Futebol">Treinos de Futebol</option>
                    <option value="Fotografia & Produção (Book)">Fotografia & Produção (Book)</option>
                    <option value="Cozinha Comunitária & Alimentação">Cozinha Comunitária & Alimentação</option>
                    <option value="Apoio Pedagógico & Escolar">Apoio Pedagógico & Escolar</option>
                    <option value="Logística, Triagem & Eventos">Logística, Triagem & Eventos</option>
                    <option value="Saúde Comunitária (Acolhimento)">Saúde Comunitária (Acolhimento)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Disponibilidade
                  </label>
                  <select
                    value={formDisponibilidade}
                    onChange={(e) => setFormDisponibilidade(e.target.value as VolunteerAvailability)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Sábados (Manhã)">Sábados (Manhã)</option>
                    <option value="Finais de Semana (Geral)">Finais de Semana (Geral)</option>
                    <option value="Dias de Semana (Tarde)">Dias de Semana (Tarde)</option>
                    <option value="Dias de Semana (Manhã)">Dias de Semana (Manhã)</option>
                    <option value="Eventos & Datas Comemorativas">Eventos & Datas Comemorativas</option>
                    <option value="Escala Flexível">Escala Flexível</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Habilidades & Especialidades
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dança clássica, arbitragem, culinária, contação de histórias..."
                  value={formHabilidades}
                  onChange={(e) => setFormHabilidades(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observações Internas da Coordenação
                </label>
                <textarea
                  rows={2}
                  placeholder="Anotações sobre disponibilidade, turmas acompanhadas, etc."
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
                >
                  {editingVolunteer ? 'Salvar Alterações' : 'Cadastrar na Equipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
