import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Beneficiary, ProjectCard, GalleryPhoto, SiteContent, AdminUser } from '../../types';
import { INITIAL_BENEFICIARIES, INITIAL_PROJECTS, INITIAL_GALLERY, INITIAL_SITE_CONTENT } from '../../data/initialData';
import {
  exportBeneficiariesToCsv,
  exportProjectsReportToCsv,
  exportExecutiveSummaryToCsv,
} from '../../utils/exportCsv';

interface BackupModalProps {
  beneficiaries: Beneficiary[];
  projects: ProjectCard[];
  gallery: GalleryPhoto[];
  content: SiteContent;
  admins: AdminUser[];
  onRestoreAll: (data: {
    beneficiaries: Beneficiary[];
    projects: ProjectCard[];
    gallery: GalleryPhoto[];
    content: SiteContent;
  }) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  beneficiaries,
  projects,
  gallery,
  content,
  admins,
  onRestoreAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Exportar Beneficiários em CSV
  const handleExportBeneficiarios = () => {
    exportBeneficiariesToCsv(beneficiaries);
    showNotification(`Planilha de Beneficiários (${beneficiaries.length} registros) exportada com sucesso!`);
  };

  // Exportar Projetos em CSV
  const handleExportProjetos = () => {
    exportProjectsReportToCsv(projects, beneficiaries);
    showNotification(`Relatório de Projetos Sociais (${projects.length} modalidades) exportado com sucesso!`);
  };

  // Exportar Resumo Executivo em CSV
  const handleExportExecutivo = () => {
    exportExecutiveSummaryToCsv(projects, beneficiaries, content);
    showNotification('Resumo Executivo para Prestação de Contas exportado com sucesso!');
  };

  // Baixar JSON com todos os dados do sistema
  const handleExportJson = () => {
    const backupData = {
      versao: '2.0.0',
      data_backup: new Date().toISOString(),
      associacao: 'Associação Novo Amanhecer - Trindade/GO',
      beneficiarios: beneficiaries,
      projetos: projects,
      galeria: gallery,
      conteudo_site: content,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `backup_novo_amanhecer_trindade_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Carregar e Restaurar Backup a partir de arquivo JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.beneficiarios && parsed.projetos) {
          onRestoreAll({
            beneficiaries: parsed.beneficiarios,
            projects: parsed.projetos,
            gallery: parsed.galeria || gallery,
            content: parsed.conteudo_site || content,
          });
          alert('Backup restaurado com sucesso!');
        } else {
          alert('Arquivo de backup inválido. Não foram encontradas as tabelas necessárias.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo JSON de backup.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Resetar para os dados originais
  const handleResetToTrindadeDefault = () => {
    if (
      window.confirm(
        'Tem certeza que deseja restaurar os dados originais da Associação Novo Amanhecer (Trindade - GO)?'
      )
    ) {
      onRestoreAll({
        beneficiaries: INITIAL_BENEFICIARIES,
        projects: INITIAL_PROJECTS,
        gallery: INITIAL_GALLERY,
        content: INITIAL_SITE_CONTENT,
      });
      alert('Dados restaurados com sucesso para os registros iniciais!');
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast / Alerta de Notificação de Sucesso */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{successMsg}</span>
        </div>
      )}

      {/* SEÇÃO 1: EXPORTAÇÃO CSV PARA CONTROLE OFFLINE E PRESTAÇÃO DE CONTAS */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
              Planilhas Offline
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            Exportação de Relatórios Oficiais em CSV / Excel
          </h3>
          <p className="text-xs text-slate-600">
            Baixe planilhas compatíveis com Microsoft Excel e Google Sheets com dados completos para impressões, listas de presença, auditorias e reuniões de coordenação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card CSV: Beneficiários */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
              </div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-bold text-slate-900 text-base">Lista de Beneficiários</h4>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {beneficiaries.length} cadastros
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Exporta todos os inscritos com Nome, CPF, Telefone, Endereço, Projeto de Interesse, Status e data de cadastro.
              </p>
            </div>

            <button
              onClick={handleExportBeneficiarios}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Beneficiários (.csv)</span>
            </button>
          </div>

          {/* Card CSV: Relatório de Projetos */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-amber-700" />
              </div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-bold text-slate-900 text-base">Relatório de Projetos</h4>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {projects.length} projetos
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Consolidado por modalidade (Ballet, Futebol, Book Gestante, Festas) com total de inscritos, vagas confirmadas, fila de espera e coordenador.
              </p>
            </div>

            <button
              onClick={handleExportProjetos}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Relatório de Projetos (.csv)</span>
            </button>
          </div>

          {/* Card CSV: Resumo Executivo / Prestação de Contas */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-700" />
              </div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-bold text-slate-900 text-base">Resumo de Impacto</h4>
                <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Oficial
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Planilha com métricas institucionais, CNPJ, dados de sede e números de impacto comunitário para editais e prestação de contas.
              </p>
            </div>

            <button
              onClick={handleExportExecutivo}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Resumo Executivo (.csv)</span>
            </button>
          </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* SEÇÃO 2: BACKUP COMPLETO JSON */}
      <div>
        <h3 className="text-lg font-bold text-slate-900">Backup Completo do Sistema (JSON)</h3>
        <p className="text-xs text-slate-500">
          Gere cópias de segurança integrais em formato JSON, importe backups anteriores ou restaure a base de dados inicial de Trindade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Opção 1: Exportar Backup JSON */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-amber-700" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Exportar Backup Completo</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Baixe um arquivo JSON com todas as tabelas: lista de beneficiários, cards dos projetos, fotos da galeria e textos do site.
            </p>
          </div>

          <button
            onClick={handleExportJson}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivo JSON</span>
          </button>
        </div>

        {/* Opção 2: Restaurar Backup JSON */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-blue-700" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Restaurar de Arquivo</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Carregue um arquivo JSON de backup gerado anteriormente para restaurar os dados no sistema.
            </p>
          </div>

          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              id="upload-backup-file"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Selecionar Arquivo JSON</span>
            </button>
          </div>
        </div>

        {/* Opção 3: Restaurar Dados Padrão de Trindade */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-900 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6 text-orange-700" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Base Padrão de Trindade</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Restaura os dados originais da Associação Novo Amanhecer (Ballet, Futebol, Book Solidário de Gestantes e Festas).
            </p>
          </div>

          <button
            onClick={handleResetToTrindadeDefault}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-orange-900 bg-orange-100 hover:bg-orange-200 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Base Inicial</span>
          </button>
        </div>
      </div>
    </div>
  );
};
