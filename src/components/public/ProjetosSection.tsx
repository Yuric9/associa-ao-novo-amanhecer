import React, { useState } from 'react';
import { ArrowRight, UserPlus, Clock, User, Calendar, Sparkles, X, Heart } from 'lucide-react';
import { ProjectCard } from '../../types';

interface ProjetosSectionProps {
  projects: ProjectCard[];
  onOpenCadastro: (projectName: string) => void;
}

export const ProjetosSection: React.FC<ProjetosSectionProps> = ({ projects, onOpenCadastro }) => {
  const [selectedProject, setSelectedProject] = useState<ProjectCard | null>(null);

  const activeProjects = projects.filter((p) => p.ativo).sort((a, b) => a.ordem - b.ordem);

  return (
    <section id="projetos" className="py-16 sm:py-24 bg-amber-50/30 border-t border-amber-100/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
              <span>Nossos Projetos Sociais</span>
              <span aria-hidden="true">·</span>
              <span>100% Gratuitos</span>
              <span aria-hidden="true">·</span>
              <span>Trindade - GO</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Ações que transformam vidas através da arte, do esporte e do afeto.
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Conheça os 4 pilares centrais de atuação da Associação Novo Amanhecer. Cada projeto foi planejado para acolher com carinho e sem burocracia.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Exibindo <span className="font-bold text-slate-800">{activeProjects.length}</span> projetos sociais em andamento
          </div>
        </div>

        {/* Grid de Cards dos Projetos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeProjects.map((project) => (
            <div
              key={project.id}
              className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                {/* Imagem do Projeto */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={project.foto_url}
                    alt={project.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                      {project.idade_publico || 'Comunitário'}
                    </span>
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug mb-2">
                    {project.titulo}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {project.descricao}
                  </p>

                  {project.horario && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3 bg-amber-50/60 p-2 rounded-xl border border-amber-100/60">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{project.horario}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações do Card */}
              <div className="p-5 pt-0 flex items-center justify-between gap-2 border-t border-slate-100/80 mt-2">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="text-xs font-bold text-slate-700 hover:text-amber-800 transition-colors py-2 flex items-center gap-1 cursor-pointer"
                >
                  <span>Saiba mais</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onOpenCadastro(project.titulo)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
                  title="Cadastrar neste projeto"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Cadastrar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Saiba Mais */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Imagem de Capa do Modal */}
            <div className="relative h-56">
              <img
                src={selectedProject.foto_url}
                alt={selectedProject.titulo}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6 text-white">
                <div>
                  <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                    {selectedProject.idade_publico}
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-0.5">
                    {selectedProject.titulo}
                  </h3>
                </div>
              </div>
            </div>

            {/* Conteúdo Detalhado */}
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Sobre esta ação social:
                </h4>
                <p className="text-slate-700 leading-relaxed text-sm">
                  {selectedProject.descricao}
                </p>
              </div>

              {selectedProject.detalhes && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-xs sm:text-sm text-amber-950 leading-relaxed">
                  <strong>Como funciona:</strong> {selectedProject.detalhes}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                {selectedProject.horario && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block">Horários:</span>
                      <span className="text-slate-600">{selectedProject.horario}</span>
                    </div>
                  </div>
                )}

                {selectedProject.coordenador && (
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block">Coordenação:</span>
                      <span className="text-slate-600">{selectedProject.coordenador}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões do Rodapé do Modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Voltar
                </button>

                <button
                  onClick={() => {
                    const title = selectedProject.titulo;
                    setSelectedProject(null);
                    onOpenCadastro(title);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Fazer Inscrição Neste Projeto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
