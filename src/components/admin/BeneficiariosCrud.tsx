import React, { useMemo, useState } from 'react';
import { Beneficiary, BeneficiaryStatus, StatusEmailNotification, ProjectCard } from '../../types';
import { validateCPF, cleanDigits } from '../../utils/validation';
import { exportBeneficiariesToCsv } from '../../utils/exportCsv';
import {
  FILTROS_VAZIOS,
  contarPorProjeto,
  contarPorStatus,
  filtrarBeneficiarios,
  hoje,
  isProjectMatch,
  mensagemMudancaStatus,
  nomeArquivoCsv,
  temFiltrosAtivos,
  type Filtros,
} from './beneficiarios/filtros';
import { montarPresets, presetSelecionado } from './beneficiarios/presets';
import { ResumoCard } from './beneficiarios/ResumoCard';
import { BarraFiltros } from './beneficiarios/BarraFiltros';
import { BannerProjeto } from './beneficiarios/BannerProjeto';
import { ListaBeneficiarios } from './beneficiarios/ListaBeneficiarios';
import { ModalEdicao } from './beneficiarios/ModalEdicao';
import { ModalCadastro } from './beneficiarios/ModalCadastro';

interface BeneficiariosCrudProps {
  beneficiaries: Beneficiary[];
  onUpdateBeneficiaries: (beneficiaries: Beneficiary[]) => void;
  onRequestEmailNotification: (notif: StatusEmailNotification) => void;
  projects?: ProjectCard[];
}

/**
 * Tela de beneficiários do painel. Este arquivo guarda o estado (filtros, modais, formulário)
 * e as ações; as partes visuais ficam em ./beneficiarios/ e as regras de filtro em
 * ./beneficiarios/filtros.ts.
 */
export const BeneficiariosCrud: React.FC<BeneficiariosCrudProps> = ({
  beneficiaries,
  onUpdateBeneficiaries,
  onRequestEmailNotification,
  projects,
}) => {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const onFiltrar = (mudanca: Partial<Filtros>) => setFiltros((f) => ({ ...f, ...mudanca }));
  const onLimparFiltros = () => setFiltros(FILTROS_VAZIOS);

  // Modal de Edição / Adição manual
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Beneficiary>>({});

  const projectCounts = useMemo(() => contarPorProjeto(beneficiaries), [beneficiaries]);
  const presets = montarPresets(projectCounts);
  const activePreset = presets.find((p) => presetSelecionado(p, filtros.projeto));
  const activeProjectCard = projects?.find((p) => isProjectMatch(p.titulo, filtros.projeto));

  const filteredBeneficiaries = filtrarBeneficiarios(beneficiaries, filtros);
  const totalGeral = beneficiaries.length;
  const totalFiltrado = filteredBeneficiaries.length;
  const hasActiveFilters = temFiltrosAtivos(filtros);
  const filterStats = contarPorStatus(filteredBeneficiaries, totalGeral);

  // Alteração de Status com Gatilho de E-mail
  const handleStatusChange = (beneficiaryId: string, newStatus: BeneficiaryStatus) => {
    const target = beneficiaries.find((b) => b.id === beneficiaryId);
    if (!target) return;

    onUpdateBeneficiaries(
      beneficiaries.map((b) => (b.id === beneficiaryId ? { ...b, status: newStatus, atualizado_em: hoje() } : b))
    );

    onRequestEmailNotification({
      beneficiaryName: target.nome,
      beneficiaryEmail: target.email,
      project: target.projeto,
      previousStatus: target.status,
      newStatus,
      date: hoje(),
      messageText: mensagemMudancaStatus(target.nome, target.projeto, newStatus),
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o cadastro de "${name}"?`)) {
      onUpdateBeneficiaries(beneficiaries.filter((b) => b.id !== id));
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBeneficiary) return;

    onUpdateBeneficiaries(
      beneficiaries.map((b) =>
        b.id === editingBeneficiary.id ? ({ ...b, ...formData, atualizado_em: hoje() } as Beneficiary) : b
      )
    );
    setEditingBeneficiary(null);
  };

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
      criado_em: hoje(),
      atualizado_em: hoje(),
    };

    onUpdateBeneficiaries([newBeneficiary, ...beneficiaries]);
    setShowAddModal(false);
    setFormData({});
  };

  // Exportação CSV via utilitário centralizado com UTF-8 BOM
  const handleExportCSV = () => {
    exportBeneficiariesToCsv(filteredBeneficiaries, nomeArquivoCsv(filtros.projeto, hoje()));
  };

  const abrirCadastro = () => {
    setFormData({
      status: 'Pendente',
      projeto:
        filtros.projeto !== 'todos' && activePreset?.projectName
          ? activePreset.projectName
          : 'Escolinha de Futebol Comunitário',
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <ResumoCard
        filtros={filtros}
        hasActiveFilters={hasActiveFilters}
        totalGeral={totalGeral}
        totalFiltrado={totalFiltrado}
        stats={filterStats}
        activePreset={activePreset}
        onNovoBeneficiario={abrirCadastro}
        onExportar={handleExportCSV}
        onFiltrar={onFiltrar}
        onLimparFiltros={onLimparFiltros}
      />

      <BarraFiltros
        filtros={filtros}
        presets={presets}
        activePreset={activePreset}
        projectCounts={projectCounts}
        projects={projects}
        totalGeral={totalGeral}
        totalFiltrado={totalFiltrado}
        onFiltrar={onFiltrar}
        onLimparFiltros={onLimparFiltros}
        onExportar={handleExportCSV}
      />

      {filtros.projeto !== 'todos' && activePreset && (
        <BannerProjeto
          preset={activePreset}
          projetoCard={activeProjectCard}
          filtros={filtros}
          beneficiaries={beneficiaries}
          totalFiltrado={totalFiltrado}
          onFiltrar={onFiltrar}
          onExportar={handleExportCSV}
        />
      )}

      <ListaBeneficiarios
        filtrados={filteredBeneficiaries}
        totalGeral={totalGeral}
        filtros={filtros}
        onFiltrar={onFiltrar}
        onLimparFiltros={onLimparFiltros}
        onMudarStatus={handleStatusChange}
        onEditar={(b) => {
          setEditingBeneficiary(b);
          setFormData(b);
        }}
        onExcluir={handleDelete}
      />

      {editingBeneficiary && (
        <ModalEdicao
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveEdit}
          onClose={() => setEditingBeneficiary(null)}
        />
      )}

      {showAddModal && (
        <ModalCadastro
          formData={formData}
          setFormData={setFormData}
          projects={projects}
          onSave={handleSaveAdd}
          onClose={() => {
            setShowAddModal(false);
            setFormData({});
          }}
        />
      )}
    </div>
  );
};
