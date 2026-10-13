import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { Volunteer } from '../../types';
import {
  FORM_VAZIO,
  agruparVoluntarios,
  filtrarVoluntarios,
  formDoVoluntario,
  formLimpo,
  linhasCsvVoluntarios,
  type FormVoluntario,
  type ModoGrafico,
} from './voluntarios/dados';
import { GraficoRosca } from './voluntarios/GraficoRosca';
import { ListaEquipe } from './voluntarios/ListaEquipe';
import { ModalVoluntario } from './voluntarios/ModalVoluntario';

interface VoluntariosRoscaChartProps {
  volunteers: Volunteer[];
  onUpdateVolunteers?: (volunteers: Volunteer[]) => void;
  compactMode?: boolean;
}

/**
 * Tela de voluntários: gráfico de rosca, lista da equipe e modal de cadastro/edição.
 * Este arquivo guarda o estado e as ações; as partes visuais ficam em ./voluntarios/
 * e as regras (agrupamento, busca, WhatsApp, CSV) em ./voluntarios/dados.ts.
 * Com compactMode (aba "Gráficos"), mostra só o gráfico.
 */
export const VoluntariosRoscaChart: React.FC<VoluntariosRoscaChartProps> = ({
  volunteers,
  onUpdateVolunteers,
  compactMode = false,
}) => {
  const [viewMode, setViewModeState] = useState<ModoGrafico>('area');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de Adicionar / Editar Voluntário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [form, setForm] = useState<FormVoluntario>(FORM_VAZIO);

  const areaData = useMemo(() => agruparVoluntarios(volunteers, 'area'), [volunteers]);
  const availabilityData = useMemo(() => agruparVoluntarios(volunteers, 'disponibilidade'), [volunteers]);
  const activeChartData = viewMode === 'area' ? areaData : availabilityData;

  const filteredVolunteers = useMemo(
    () => filtrarVoluntarios(volunteers, searchTerm, selectedFilter, viewMode),
    [volunteers, searchTerm, selectedFilter, viewMode]
  );

  // Trocar o modo do gráfico limpa o filtro clicado (ele é de outro tipo)
  const setViewMode = (modo: ModoGrafico) => {
    setViewModeState(modo);
    setSelectedFilter(null);
  };

  const handleOpenAdd = () => {
    setEditingVolunteer(null);
    setForm(FORM_VAZIO);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Volunteer) => {
    setEditingVolunteer(v);
    setForm(formDoVoluntario(v));
    setIsModalOpen(true);
  };

  const handleSaveVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.telefone.trim()) return;

    if (editingVolunteer) {
      onUpdateVolunteers?.(
        volunteers.map((v) => (v.id === editingVolunteer.id ? { ...v, ...formLimpo(form) } : v))
      );
    } else {
      const newVol: Volunteer = {
        id: `vol-${Date.now()}`,
        ...formLimpo(form),
        ativo: true,
        data_inicio: new Date().toISOString().split('T')[0],
      };
      onUpdateVolunteers?.([newVol, ...volunteers]);
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    onUpdateVolunteers?.(volunteers.map((v) => (v.id === id ? { ...v, ativo: !v.ativo } : v)));
  };

  // Exportar Escala de Voluntários em CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(linhasCsvVoluntarios(filteredVolunteers), { delimiter: ';' });
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
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
      <GraficoRosca
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeChartData={activeChartData}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        totalVoluntarios={volunteers.length}
        podeEditar={Boolean(onUpdateVolunteers)}
        onNovo={handleOpenAdd}
      />

      {!compactMode && (
        <ListaEquipe
          filteredVolunteers={filteredVolunteers}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          podeEditar={Boolean(onUpdateVolunteers)}
          onNovo={handleOpenAdd}
          onEditar={handleOpenEdit}
          onAlternarAtivo={handleToggleActive}
          onExportar={handleExportCSV}
        />
      )}

      {isModalOpen && (
        <ModalVoluntario
          editando={Boolean(editingVolunteer)}
          form={form}
          setForm={setForm}
          onSave={handleSaveVolunteer}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
