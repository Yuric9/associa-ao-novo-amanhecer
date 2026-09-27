import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ProjectCard } from '../../types';

/** Ícone de cada projeto, escolhido pelo nome (traço fino, mesmo estilo da v2). */
const ICONES: { chave: RegExp; d: string }[] = [
  { chave: /ballet|dan[çc]a/i, d: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z' },
  { chave: /futebol|river|bola/i, d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5l3.8 2.8-1.4 4.4H9.6l-1.4-4.4zM12 3v4.5M20.3 9.6l-4.5.7M17.3 19.3l-2.9-4.6M6.7 19.3l2.9-4.6M3.7 9.6l4.5.7' },
  { chave: /book|gestante|foto/i, d: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { chave: /a[çc][õo]es|festa|social/i, d: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2 0-4-1-4-2.5S10 3 12 7zM12 7c2 0 4-1 4-2.5S14 3 12 7z' },
];
const CORACAO = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z';

const ProjetoIcone: React.FC<{ titulo: string }> = ({ titulo }) => {
  const d = ICONES.find((i) => i.chave.test(titulo))?.d ?? CORACAO;
  return (
    <section id="projetos" className="bg-white">
      <div className="container-site flex flex-col gap-6 py-12 sm:gap-11 sm:py-24">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex max-w-2xl flex-col gap-2 sm:gap-3">
            <span className="kicker">Nossos projetos</span>
            <h2 className="section-title">O que fazemos toda semana, de graça</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {activeProjects.map((project) => (
            <article key={project.id} className="card flex flex-col overflow-hidden">
              <div className="relative">
                <img
                  src={project.foto_url}
                  alt={project.titulo}
                  loading="lazy"
                  className="block h-[180px] w-full bg-sand object-cover lg:h-[200px]"
                />
                <div className="bg-card-scrim absolute inset-0" />
                <div className="absolute -bottom-6 left-4 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-brand text-white lg:-bottom-[26px] lg:left-5 lg:h-[52px] lg:w-[52px]">
                  <ProjetoIcone titulo={project.titulo} />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 px-[18px] pb-5 pt-9 lg:gap-3 lg:px-[22px] lg:pb-6 lg:pt-10">
                <h3 className="text-lg font-extrabold text-brand-dark lg:text-[19px]">{project.titulo}</h3>
                <p className="flex-1 text-[15px] leading-relaxed text-body">{project.descricao}</p>
                {(project.idade_publico || project.horario) && (
                  <div className="flex flex-wrap gap-2">
                    {project.idade_publico && <span className="chip bg-sun-soft text-sun-ink">{project.idade_publico}</span>}
                    {project.horario && <span className="chip bg-brand-soft text-brand-ink">{project.horario}</span>}
                  </div>
                )}
                <div className="flex items-center gap-5 pt-1.5">
                  <button onClick={() => onOpenCadastro(project.titulo)} className="link-arrow">
                    Inscrever-se →
                  </button>
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="text-[15px] font-semibold text-muted hover:text-ink"
                  >
                    Saiba mais
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
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
