import Papa from 'papaparse';
import { Beneficiary, ProjectCard, SiteContent } from '../types';

/**
 * Utilitário profissional para geração e download de planilhas CSV
 * com suporte a UTF-8 BOM para perfeita compatibilidade com Microsoft Excel e Google Sheets.
 */

function downloadCsvBlob(csvContent: string, fileName: string) {
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Exporta a lista de beneficiários para arquivo CSV
 */
export function exportBeneficiariesToCsv(
  beneficiaries: Beneficiary[],
  customFilename?: string
) {
  const dataToExport = beneficiaries.map((b) => ({
    ID: b.id,
    'Nome Completo': b.nome,
    CPF: b.cpf,
    'Data de Nascimento': b.nascimento,
    'Telefone / WhatsApp': b.telefone,
    'E-mail': b.email,
    'Endereço Completo / Bairro': b.endereco,
    'Projeto Social de Interesse': b.projeto,
    'Status do Cadastro': b.status,
    'Data de Inscrição': b.criado_em,
    'Última Atualização': b.atualizado_em || b.criado_em,
    'Observações / Notas': b.observacoes || 'Nenhuma',
  }));

  const csv = Papa.unparse(dataToExport, {
    quotes: true,
    delimiter: ';', // Padrão brasileiro aceito de imediato pelo Excel sem desconfigurar colunas
  });

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName =
    customFilename ||
    `relatorio_beneficiarios_novo_amanhecer_${dateStr}.csv`;

  downloadCsvBlob(csv, fileName);
}

/**
 * 2. Exporta o relatório consolidado dos projetos sociais para arquivo CSV
 */
export function exportProjectsReportToCsv(
  projects: ProjectCard[],
  beneficiaries: Beneficiary[],
  customFilename?: string
) {
  const dataToExport = projects.map((proj) => {
    const projectBeneficiaries = beneficiaries.filter(
      (b) => b.projeto === proj.titulo
    );
    const total = projectBeneficiaries.length;
    const aprovados = projectBeneficiaries.filter(
      (b) => b.status === 'Aprovado'
    ).length;
    const pendentes = projectBeneficiaries.filter(
      (b) => b.status === 'Pendente'
    ).length;
    const emAnalise = projectBeneficiaries.filter(
      (b) => b.status === 'Em análise'
    ).length;
    const atendidos = projectBeneficiaries.filter(
      (b) => b.status === 'Atendido/Entregue'
    ).length;
    const recusados = projectBeneficiaries.filter(
      (b) => b.status === 'Recusado'
    ).length;
    const taxaConfirmacao =
      total > 0 ? `${Math.round((aprovados / total) * 100)}%` : '0%';

    return {
      'Código do Projeto': proj.id,
      'Título do Projeto': proj.titulo,
      'Situação Atual': proj.ativo ? 'Ativo' : 'Inativo / Pausado',
      'Ordem de Exibição': proj.ordem,
      'Coordenador(a) Responsável': proj.coordenador || 'Coordenação Geral',
      'Faixa Etária / Público': proj.idade_publico || 'Livre para a comunidade',
      'Horários e Dias de Treino/Ensaio': proj.horario || 'A definir',
      'Total de Inscritos': total,
      'Aprovados (Vaga Confirmada)': aprovados,
      'Pendentes (Fila de Análise)': pendentes,
      'Em Análise de Documentos': emAnalise,
      'Atendidos / Entregues': atendidos,
      'Inscrições Recusadas': recusados,
      'Taxa de Aprovação': taxaConfirmacao,
      'Descrição Resumida': proj.descricao,
      'Detalhes Operacionais': proj.detalhes || '',
    };
  });

  const csv = Papa.unparse(dataToExport, {
    quotes: true,
    delimiter: ';',
  });

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName =
    customFilename ||
    `relatorio_projetos_sociais_novo_amanhecer_${dateStr}.csv`;

  downloadCsvBlob(csv, fileName);
}

/**
 * 3. Exporta Relatório Executivo Geral de Impacto Comunitário
 */
export function exportExecutiveSummaryToCsv(
  projects: ProjectCard[],
  beneficiaries: Beneficiary[],
  content: SiteContent,
  customFilename?: string
) {
  const dateStr = new Date().toISOString().split('T')[0];

  const summaryData = [
    {
      Categoria: 'Dados Institucionais',
      Métrica: 'Razão Social / Associação',
      Valor: 'Associação Novo Amanhecer',
    },
    {
      Categoria: 'Dados Institucionais',
      Métrica: 'CNPJ Oficial',
      Valor: content.contato_cnpj,
    },
    {
      Categoria: 'Dados Institucionais',
      Métrica: 'Localidade e Endereço',
      Valor: `${content.contato_cidade} - ${content.contato_estado} (${content.contato_endereco})`,
    },
    {
      Categoria: 'Dados Institucionais',
      Métrica: 'Chave PIX Oficial',
      Valor: content.contato_pix_chave,
    },
    {
      Categoria: 'Métricas de Impacto',
      Métrica: 'Total de Beneficiários Cadastrados',
      Valor: beneficiaries.length.toString(),
    },
    {
      Categoria: 'Métricas de Impacto',
      Métrica: 'Inscrições Aprovadas',
      Valor: beneficiaries.filter((b) => b.status === 'Aprovado').length.toString(),
    },
    {
      Categoria: 'Métricas de Impacto',
      Métrica: 'Inscrições Pendentes de Análise',
      Valor: beneficiaries.filter((b) => b.status === 'Pendente').length.toString(),
    },
    {
      Categoria: 'Métricas de Impacto',
      Métrica: 'Projetos Sociais Ativos',
      Valor: projects.filter((p) => p.ativo).length.toString(),
    },
    {
      Categoria: 'Métricas de Impacto',
      Métrica: 'Crianças Impactadas (Estimativa Anual)',
      Valor: content.impacto_criancas.toString(),
    },
    {
      Categoria: 'Métricas de Impacto',
      Métrica: 'Voluntários Ativos Registrados',
      Valor: content.impacto_voluntarios.toString(),
    },
  ];

  const csv = Papa.unparse(summaryData, {
    quotes: true,
    delimiter: ';',
  });

  const fileName =
    customFilename ||
    `relatorio_executivo_impacto_trindade_${dateStr}.csv`;

  downloadCsvBlob(csv, fileName);
}
