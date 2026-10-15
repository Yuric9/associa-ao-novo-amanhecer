import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Beneficiary, ProjectCard, GalleryPhoto, SiteContent, AdminUser } from '../../types';
import {
  exportBeneficiariesToCsv,
  exportProjectsReportToCsv,
  exportExecutiveSummaryToCsv,
} from '../../utils/exportCsv';
import { BackupsAutomaticos } from './BackupsAutomaticos';
import { api } from '../../services/api';

interface BackupModalProps {
  beneficiaries: Beneficiary[];
  projects: ProjectCard[];
  gallery: GalleryPhoto[];
  content: SiteContent;
  admins: AdminUser[];
}

export const BackupModal: React.FC<BackupModalProps> = ({
  beneficiaries,
  projects,
  gallery,
  content,
  admins,
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

  // Restaurar a partir de um arquivo JSON (do "Baixar Arquivo JSON" ou dos backups automáticos).
  // Grava no banco: o servidor guarda antes uma cópia do estado atual e faz tudo numa transação.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    let parsed: any;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      alert('Erro ao ler o arquivo: ele não é um JSON de backup válido.');
      return;
    }
    if (!Array.isArray(parsed?.beneficiarios) || !Array.isArray(parsed?.projetos)) {
      alert('Arquivo de backup inválido. Não foram encontradas as tabelas necessárias.');
      return;
    }

    const data = parsed.data_backup ? new Date(parsed.data_backup).toLocaleString('pt-BR') : 'data desconhecida';
    const ok = window.confirm(
      `Restaurar o backup de ${data}?\n\n` +
        `Os dados ATUAIS (${beneficiaries.length} beneficiários, projetos, galeria, textos` +
        `${parsed.voluntarios ? ', voluntários e doações' : ''}) serão substituídos pelos do arquivo ` +
        `(${parsed.beneficiarios.length} beneficiários).\n\n` +
        'Antes disso, o sistema guarda automaticamente uma cópia do estado atual na lista de backups.'
    );
    if (!ok) return;

    try {
      const { copia_de_seguranca } = await api.restaurarBackup(parsed);
      alert(`Backup restaurado com sucesso!\n\nCópia do estado anterior guardada como: ${copia_de_seguranca}`);
      window.location.reload(); // recarrega tudo do banco já restaurado
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast / Alerta de Notificação de Sucesso */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{successMsg}</span>
        </div>
      )}

      <BackupsAutomaticos />

      {/* SEÇÃO 1: EXPORTAÇÃO CSV PARA CONTROLE OFFLINE E PRESTAÇÃO DE CONTAS */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
              Planilhas Offline
            </span>
          </div>
          <h2 className="text-lg font-black text-ink mt-1">
            Exportação de Relatórios Oficiais em CSV / Excel
          </h2>
          <p className="text-xs text-body">
            Baixe planilhas compatíveis com Microsoft Excel e Google Sheets com dados completos para impressões, listas de presença, auditorias e reuniões de coordenação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card CSV: Beneficiários */}
          <div className="bg-white p-6 rounded-[14px] border border-line shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
              </div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-bold text-ink text-base">Lista de Beneficiários</h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {beneficiaries.length} cadastros
                </span>
              </div>
              <p className="text-xs text-body leading-relaxed mb-4">
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
          <div className="bg-white p-6 rounded-[14px] border border-line shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-amber-700" />
              </div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-bold text-ink text-base">Relatório de Projetos</h3>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {projects.length} projetos
                </span>
              </div>
              <p className="text-xs text-body leading-relaxed mb-4">
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
          <div className="bg-white p-6 rounded-[14px] border border-line shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-700" />
              </div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-bold text-ink text-base">Resumo de Impacto</h3>
                <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Oficial
                </span>
              </div>
              <p className="text-xs text-body leading-relaxed mb-4">
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

      <hr className="border-line" />

      {/* SEÇÃO 2: BACKUP COMPLETO JSON */}
      <div>
        <h2 className="text-lg font-bold text-ink">Backup Completo do Sistema (JSON)</h2>
        <p className="text-xs text-muted">
          Gere cópias de segurança integrais em formato JSON ou restaure um backup anterior.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opção 1: Exportar Backup JSON */}
        <div className="bg-white p-6 rounded-[14px] border border-line shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-amber-700" />
            </div>
            <h3 className="font-bold text-ink text-base mb-1">Exportar Backup Completo</h3>
            <p className="text-xs text-body leading-relaxed mb-4">
              Baixe um arquivo JSON com todas as tabelas: lista de beneficiários, cards dos projetos, fotos da galeria e textos do site.
            </p>
          </div>

          <button
            onClick={handleExportJson}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white bg-brand-dark hover:bg-brand-dark rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivo JSON</span>
          </button>
        </div>

        {/* Opção 2: Restaurar Backup JSON */}
        <div className="bg-white p-6 rounded-[14px] border border-line shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-blue-700" />
            </div>
            <h3 className="font-bold text-ink text-base mb-1">Restaurar de Arquivo</h3>
            <p className="text-xs text-body leading-relaxed mb-4">
              Carregue um arquivo JSON de backup (baixado aqui ou da lista de backups diários). Os dados atuais são substituídos; uma cópia deles é guardada antes.
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
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-ink bg-sand hover:bg-slate-200 border border-line rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-body" />
              <span>Selecionar Arquivo JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
