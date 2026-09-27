import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ProjectCard } from '../../types';

interface ProjetosSectionProps {
  projects: ProjectCard[];
  onOpenCadastro: (projectName: string) => void;
}

export const ProjetosSection: React.FC<ProjetosSectionProps> = ({ projects, onOpenCadastro }) => {
  const [selectedProject, setSelectedProject] = useState<ProjectCard | null>(null);
  const activeProjects = projects.filter((p) => p.ativo).sort((a, b) => a.ordem - b.ordem);

  useEffect(() => {
    if (!selectedProject) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedProject(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedProject]);

  return (
    <section id="projetos" className="container-site flex flex-col gap-12 py-20 sm:py-28">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex max-w-2xl flex-col gap-3.5">
          <span className="kicker">Projetos</span>
          <h2 className="section-title">O que fazemos toda semana</h2>
        </div>
        <p className="text-[15px] text-muted">Todas as atividades são gratuitas.</p>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {activeProjects.map((project) => (
          <article key={project.id} className="flex flex-col gap-4">
            <img
              src={project.foto_url}
              alt={project.titulo}
              loading="lazy"
              className="aspect-[4/3] w-full rounded-lg bg-sand object-cover"
            />
            <h3 className="text-lg font-bold text-ink">{project.titulo}</h3>
            <p className="text-[15px] leading-relaxed text-body">{project.descricao}</p>
            <dl className="grid grid-cols-[72px_1fr] gap-y-1.5 text-sm">
              {project.idade_publico && (
                <>
                  <dt className="text-muted">Público</dt>
                  <dd className="text-ink">{project.idade_publico}</dd>
                </>
              )}
              {project.horario && (
                <>
                  <dt className="text-muted">Horário</dt>
                  <dd className="text-ink">{project.horario}</dd>
                </>
              )}
            </dl>
            <div className="mt-auto flex items-center gap-5 pt-2">
              <button onClick={() => onOpenCadastro(project.titulo)} className="link-underline">
                Inscrever-se
              </button>
              <button
                onClick={() => setSelectedProject(project)}
                className="text-[15px] font-medium text-muted hover:text-ink"
              >
                Saiba mais
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="projeto-titulo"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-lg bg-white sm:rounded-lg"
          >
            <div className="relative">
              <img src={selectedProject.foto_url} alt="" className="aspect-[16/9] w-full object-cover" />
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-md bg-white text-ink"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-5 p-6 sm:p-8">
              <h3 id="projeto-titulo" className="text-2xl font-bold text-ink">
                {selectedProject.titulo}
              </h3>
              <p className="text-[15px] leading-relaxed text-body">{selectedProject.descricao}</p>
              {selectedProject.detalhes && (
                <p className="rounded-md bg-sand p-4 text-[15px] leading-relaxed text-body">{selectedProject.detalhes}</p>
              )}
              <dl className="grid grid-cols-[110px_1fr] gap-y-2 border-t border-line pt-5 text-sm">
                {selectedProject.idade_publico && (
                  <>
                    <dt className="text-muted">Público</dt>
                    <dd className="text-ink">{selectedProject.idade_publico}</dd>
                  </>
                )}
                {selectedProject.horario && (
                  <>
                    <dt className="text-muted">Horário</dt>
                    <dd className="text-ink">{selectedProject.horario}</dd>
                  </>
                )}
                {selectedProject.coordenador && (
                  <>
                    <dt className="text-muted">Coordenação</dt>
                    <dd className="text-ink">{selectedProject.coordenador}</dd>
                  </>
                )}
              </dl>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button onClick={() => setSelectedProject(null)} className="btn-secondary">
                  Voltar
                </button>
                <button
                  onClick={() => {
                    const title = selectedProject.titulo;
                    setSelectedProject(null);
                    onOpenCadastro(title);
                  }}
                  className="btn-primary"
                >
                  Inscrever-se neste projeto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
