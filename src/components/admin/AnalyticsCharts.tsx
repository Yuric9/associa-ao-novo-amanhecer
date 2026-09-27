import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Users,
  Award,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  HeartHandshake,
  HandHeart,
} from 'lucide-react';
import { Beneficiary, ProjectCard, Volunteer } from '../../types';
import { VoluntariosRoscaChart } from './VoluntariosRoscaChart';

interface AnalyticsChartsProps {
  beneficiaries: Beneficiary[];
  projects: ProjectCard[];
  volunteers?: Volunteer[];
  onUpdateVolunteers?: (volunteers: Volunteer[]) => void;
}

// Cores temáticas para os projetos sociais da associação
const PROJECT_COLORS: Record<string, string> = {
  'Aulas de Ballet Solidário': '#ec4899', // Rosa
  'Escolinha de Futebol Comunitário': '#059669', // Verde Esmeralda
  'Projeto Book Solidário para Gestantes': '#8b5cf6', // Violeta
  'Festas em Datas Comemorativas': '#f59e0b', // Âmbar / Laranja
};

const FALLBACK_COLORS = [
  '#0284c7', // Azul Céu
  '#10b981', // Verde
  '#f97316', // Laranja
  '#6366f1', // Índigo
  '#14b8a6', // Teal
  '#d946ef', // Fúcsia
];

const STATUS_COLORS: Record<string, string> = {
  Pendente: '#d97706', // Âmbar
  'Em análise': '#eab308', // Amarelo
  Aprovado: '#059669', // Verde
  'Atendido/Entregue': '#2563eb', // Azul
  Recusado: '#94a3b8', // Cinza Slate
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  beneficiaries,
  projects,
  volunteers = [],
  onUpdateVolunteers,
}) => {
  const [chartTimeRange, setChartTimeRange] = useState<'6m' | 'ano' | 'todos'>('6m');
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null);

  // 1. DADOS DE CRESCIMENTO MENSAL DE BENEFICIÁRIOS (Gráfico de Barras / Linha Composta)
  const monthlyData = useMemo(() => {
    // Meses de referência para 2026
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    // Criar mapa dos meses de 2026 (Jan a Set como ativos principais)
    const monthsMap: Record<
      string,
      { mes: string; key: string; novos: number; aprovados: number; acumulado: number }
    > = {};

    // Inicializa últimos meses de 2026
    const relevantMonths =
      chartTimeRange === '6m'
        ? [3, 4, 5, 6, 7, 8] // Abr até Set 2026
        : [0, 1, 2, 3, 4, 5, 6, 7, 8]; // Jan até Set 2026

    relevantMonths.forEach((mIndex) => {
      const monthKey = `2026-${String(mIndex + 1).padStart(2, '0')}`;
      monthsMap[monthKey] = {
        mes: `${monthNames[mIndex]}/26`,
        key: monthKey,
        novos: 0,
        aprovados: 0,
        acumulado: 0,
      };
    });

    // Contabiliza cadastros reais por mês
    beneficiaries.forEach((b) => {
      if (!b.criado_em) return;
      const datePart = b.criado_em.substring(0, 7); // '2026-08'
      if (monthsMap[datePart]) {
        monthsMap[datePart].novos += 1;
        if (b.status === 'Aprovado' || b.status === 'Atendido/Entregue') {
          monthsMap[datePart].aprovados += 1;
        }
      }
    });

    // Calcula acumulado progressivo
    const list = Object.values(monthsMap);
    let runningTotal = 0;
    return list.map((item) => {
      runningTotal += item.novos;
      return {
        ...item,
        acumulado: runningTotal,
      };
    });
  }, [beneficiaries, chartTimeRange]);

  // 2. DADOS DE DISTRIBUIÇÃO POR PROJETO (Gráfico de Pizza / Donut)
  const projectDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};

    // Garante que todos os projetos cadastrados apareçam
    projects.forEach((p) => {
      counts[p.titulo] = 0;
    });

    // Contabiliza beneficiários por projeto
    beneficiaries.forEach((b) => {
      if (counts[b.projeto] !== undefined) {
        counts[b.projeto] += 1;
      } else {
        counts[b.projeto] = (counts[b.projeto] || 0) + 1;
      }
    });

    const total = beneficiaries.length;

    return Object.entries(counts).map(([name, value], index) => {
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
      const color =
        PROJECT_COLORS[name] ||
        FALLBACK_COLORS[index % FALLBACK_COLORS.length];

      return {
        name,
        value,
        percentage,
        color,
      };
    });
  }, [beneficiaries, projects]);

  // 3. DADOS DE DISTRIBUIÇÃO POR STATUS (Gráfico de Barras)
  const statusDistributionData = useMemo(() => {
    const statuses = [
      'Pendente',
      'Em análise',
      'Aprovado',
      'Atendido/Entregue',
      'Recusado',
    ];

    const counts: Record<string, number> = {
      Pendente: 0,
      'Em análise': 0,
      Aprovado: 0,
      'Atendido/Entregue': 0,
      Recusado: 0,
    };

    beneficiaries.forEach((b) => {
      if (counts[b.status] !== undefined) {
        counts[b.status] += 1;
      }
    });

    const total = beneficiaries.length;

    return statuses.map((status) => ({
      status,
      quantidade: counts[status] || 0,
      percentual: total > 0 ? Math.round(((counts[status] || 0) / total) * 100) : 0,
      fill: STATUS_COLORS[status] || '#94a3b8',
    }));
  }, [beneficiaries]);

  // Métricas Consolidadas Rápidas
  const totalBeneficiarios = beneficiaries.length;
  const totalAprovados = beneficiaries.filter(
    (b) => b.status === 'Aprovado' || b.status === 'Atendido/Entregue'
  ).length;
  const taxaAprovacao =
    totalBeneficiarios > 0
      ? Math.round((totalAprovados / totalBeneficiarios) * 100)
      : 0;

  // Projeto com maior número de inscritos
  const topProject = useMemo(() => {
    if (projectDistributionData.length === 0) return null;
    const sorted = [...projectDistributionData].sort((a, b) => b.value - a.value);
    return sorted[0];
  }, [projectDistributionData]);

  // Custom Tooltip estilizado para o Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-brand-dark text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[150px]">
          <p className="font-black text-amber-300 border-b border-slate-800 pb-1">
            {label || payload[0]?.name}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-white">
                {entry.value} {entry.unit || 'cadastros'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção de Gráficos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[14px] border border-line shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
              Métricas & Análises Recharts
            </span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-muted">Dados em Tempo Real</span>
          </div>
          <h3 className="text-lg font-black text-ink mt-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <span>Indicadores de Impacto e Crescimento</span>
          </h3>
          <p className="text-xs text-body mt-0.5">
            Visualize o fluxo de novos acolhidos e a representatividade de cada oficina comunitária em Trindade.
          </p>
        </div>

        {/* Alternador de Período do Gráfico de Crescimento */}
        <div className="inline-flex items-center p-1 bg-sand rounded-xl border border-line text-xs">
          <button
            type="button"
            onClick={() => setChartTimeRange('6m')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              chartTimeRange === '6m'
                ? 'bg-white text-ink shadow-xs'
                : 'text-body hover:text-ink'
            }`}
          >
            Últimos 6 Meses
          </button>
          <button
            type="button"
            onClick={() => setChartTimeRange('ano')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              chartTimeRange === 'ano'
                ? 'bg-white text-ink shadow-xs'
                : 'text-body hover:text-ink'
            }`}
          >
            Ano 2026
          </button>
        </div>
      </div>

      {/* Mini Cards de KPIs Rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[14px] border border-line shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase">
            <span>Total Acolhido</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-ink">{totalBeneficiarios}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Base ativa comunitária</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[14px] border border-line shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase">
            <span>Taxa de Vagas / Efetivação</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{taxaAprovacao}%</div>
          <div className="text-[11px] text-muted">
            {totalAprovados} de {totalBeneficiarios} confirmados
          </div>
        </div>

        <div className="bg-white p-5 rounded-[14px] border border-line shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase">
            <span>Projeto Destaque</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-black text-ink truncate">
            {topProject?.name || 'Carregando...'}
          </div>
          <div className="text-[11px] text-purple-700 font-semibold">
            {topProject ? `${topProject.value} inscritos (${topProject.percentage}%)` : '-'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-[14px] border border-line shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-bold uppercase">
            <span>Oficinas Ativas</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700">
            {projects.filter((p) => p.ativo).length}
          </div>
          <div className="text-[11px] text-muted">Ballet, Futebol, Gestante, Festas</div>
        </div>
      </div>

      {/* Grid Principal de Gráficos Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO 1: CRESCIMENTO MENSAL DE BENEFICIÁRIOS (7 Colunas no Desktop) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-[14px] border border-line shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>Crescimento Mensal de Beneficiários</span>
              </h4>
              <span className="text-[11px] font-semibold text-muted">
                Novos Cadastros x Acumulado
              </span>
            </div>
            <p className="text-xs text-muted">
              Evolução mensal do acolhimento comunitário por período de inscrição.
            </p>
          </div>

          <div className="w-full h-72 sm:h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                />
                <Bar
                  dataKey="novos"
                  name="Novos Inscritos"
                  fill="#d97706"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
                <Line
                  type="monotone"
                  dataKey="acumulado"
                  name="Total Acumulado"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between text-[11px] text-muted">
            <span>Pico recente em Agosto/Setembro com início das turmas de primavera.</span>
            <span className="font-bold text-body">Atualizado automaticamente</span>
          </div>
        </div>

        {/* GRÁFICO 2: DISTRIBUIÇÃO POR PROJETO SOCIAL (PIE / DONUT CHART - 5 Colunas) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-[14px] border border-line shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-600" />
                <span>Distribuição por Projeto Social</span>
              </h4>
              <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full">
                {totalBeneficiarios} inscritos
              </span>
            </div>
            <p className="text-xs text-muted">
              Proporção de vagas por modalidade esportiva, artística e de acolhimento.
            </p>
          </div>

          <div className="w-full h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveProjectIndex(index)}
                  onMouseLeave={() => setActiveProjectIndex(null)}
                >
                  {projectDistributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="cursor-pointer transition-transform hover:scale-105"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-brand-dark text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700">
                          <p className="font-bold text-slate-200">{data.name}</p>
                          <p className="text-amber-300 font-black">
                            {data.value} cadastros ({data.percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Texto Central do Donut Chart */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-ink">
                {totalBeneficiarios}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Inscritos
              </span>
            </div>
          </div>

          {/* Legenda Customizada com Tags Visuais e Percentuais */}
          <div className="space-y-2 pt-2 border-t border-line">
            {projectDistributionData.map((proj, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-1.5 rounded-xl transition-colors text-xs ${
                  activeProjectIndex === idx ? 'bg-sand font-bold' : ''
                }`}
                onMouseEnter={() => setActiveProjectIndex(idx)}
                onMouseLeave={() => setActiveProjectIndex(null)}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: proj.color }}
                  />
                  <span className="text-body truncate font-medium">
                    {proj.name}
                  </span>
                </div>
                <span className="font-bold text-ink shrink-0">
                  {proj.value} ({proj.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRÁFICO 3: DISTRIBUIÇÃO DETALHADA POR STATUS DE CADASTRO (Bar Chart Horizontal / Vertical) */}
      <div className="bg-white p-6 rounded-[14px] border border-line shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Funil de Atendimento & Status das Inscrições</span>
            </h4>
            <p className="text-xs text-muted">
              Acompanhamento de filas de espera, verificação de documentos e entregas de fardamentos/kits.
            </p>
          </div>
          <span className="text-xs text-muted font-semibold self-start sm:self-center">
            Meta de análise: 48h
          </span>
        </div>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statusDistributionData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-brand-dark text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700">
                        <p className="font-bold text-slate-200">{data.status}</p>
                        <p className="text-emerald-400 font-black">
                          {data.quantidade} inscrições ({data.percentual}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="quantidade"
                name="Cadastros"
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              >
                {statusDistributionData.map((entry, index) => (
                  <Cell key={`cell-status-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SEÇÃO ANALÍTICA: GRÁFICO DE ROSCA DE DISTRIBUIÇÃO DE VOLUNTÁRIOS */}
      {volunteers.length > 0 && (
        <VoluntariosRoscaChart
          volunteers={volunteers}
          onUpdateVolunteers={onUpdateVolunteers}
        />
      )}
    </div>
  );
};
