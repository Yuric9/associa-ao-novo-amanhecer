import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Image as ImageIcon, FileSpreadsheet, Download } from 'lucide-react';
import { ProjectCard, Beneficiary } from '../../types';
import { exportProjectsReportToCsv } from '../../utils/exportCsv';

interface ProjetosCrudProps {
  projects: ProjectCard[];
  beneficiaries?: Beneficiary[];
  onUpdateProjects: (projects: ProjectCard[]) => void;
}

export const ProjetosCrud: React.FC<ProjetosCrudProps> = ({ projects, beneficiaries = [], onUpdateProjects }) => {
  const [editingProject, setEditingProject] = useState<ProjectCard | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [formData, setFormData] = useState<Partial<ProjectCard>>({});

  const handleOpenAdd = () => {
    setIsNew(true);
    setFormData({
      id: `proj-${Date.now()}`,
      titulo: '',
      descricao: '',
      foto_url: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=800&q=80',
      ativo: true,
      ordem: projects.length + 1,
      idade_publico: 'Crianças e Jovens',
      horario: 'Sábados pela manhã',
    });
    setEditingProject({} as ProjectCard);
  };

  const handleOpenEdit = (project: ProjectCard) => {
    setIsNew(false);
    setFormData(project);
    setEditingProject(project);
  };

  const handleToggleAtivo = (id: string) => {
    const updated = projects.map((p) => {
      if (p.id === id) {
        return { ...p, ativo: !p.ativo };
      }
      return p;
    });
    onUpdateProjects(updated);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o projeto "${title}"?`)) {
      onUpdateProjects(projects.filter((p) => p.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo) return;

    if (isNew) {
      const newProj = formData as ProjectCard;
      onUpdateProjects([...projects, newProj]);
    } else {
      const updated = projects.map((p) => {
        if (p.id === editingProject?.id) {
          return { ...p, ...formData } as ProjectCard;
        }
        return p;
      });
      onUpdateProjects(updated);
    }

    setEditingProject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-ink">Cards de Projetos Sociais</h3>
          <p className="text-xs text-muted">
            Gerencie os projetos exibidos no site público (Ballet, Futebol, Book Solidário, Festas).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportProjectsReportToCsv(projects, beneficiaries)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-ink bg-sand hover:bg-slate-200 border border-line rounded-xl transition-colors cursor-pointer"
            title="Exportar dados consolidados dos projetos em planilha CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Exportar Relatório CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Projeto Social</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-[14px] border border-line p-5 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-[14px] overflow-hidden bg-sand shrink-0">
                <img
                  src={project.foto_url}
                  alt={project.titulo}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-ink text-sm truncate">{project.titulo}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      project.ativo
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sand text-muted'
                    }`}
                  >
                    {project.ativo ? 'Ativo no Site' : 'Oculto'}
                  </span>
                </div>

                <p className="text-xs text-body line-clamp-2 mt-1">
                  {project.descricao}
                </p>

                <div className="text-[11px] text-muted mt-2">
                  Público: {project.idade_publico || 'Livre'} · Ordem: #{project.ordem}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-line mt-4 flex items-center justify-between">
              <button
                onClick={() => handleToggleAtivo(project.id)}
                className="inline-flex items-center gap-1 text-xs text-body hover:text-ink"
              >
                {project.ativo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{project.ativo ? 'Ocultar do Site' : 'Tornar Visível'}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(project)}
                  className="p-1.5 text-body hover:bg-sand rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(project.id, project.titulo)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação / Edição */}
      {editingProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white rounded-[14px] shadow-2xl border border-line overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingProject(null)}
              className="absolute top-4 right-4 p-2 text-muted hover:text-body rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-ink mb-4">
              {isNew ? 'Criar Novo Projeto Social' : 'Editar Projeto Social'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-body uppercase mb-1">
                  Título do Projeto
                </label>
                <input
                  type="text"
                  required
                  value={formData.titulo || ''}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl"
                  placeholder="Ex: Aulas de Ballet Solidário"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-body uppercase mb-1">
                  Descrição Curta (para o card)
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-body uppercase mb-1">
                  URL da Imagem / Foto
                </label>
                <input
                  type="url"
                  required
                  value={formData.foto_url || ''}
                  onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-body uppercase mb-1">
                    Público-Alvo / Idade
                  </label>
                  <input
                    type="text"
                    value={formData.idade_publico || ''}
                    onChange={(e) => setFormData({ ...formData, idade_publico: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl"
                    placeholder="Ex: 4 a 14 anos"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-body uppercase mb-1">
                    Horários
                  </label>
                  <input
                    type="text"
                    value={formData.horario || ''}
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl"
                    placeholder="Ex: Sábados 08h30 às 10h30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-body uppercase mb-1">
                  Detalhes Operacionais (exibido no modal "Saiba Mais")
                </label>
                <textarea
                  rows={2}
                  value={formData.detalhes || ''}
                  onChange={(e) => setFormData({ ...formData, detalhes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-xs text-body hover:bg-sand rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-dark rounded-xl"
                >
                  Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
