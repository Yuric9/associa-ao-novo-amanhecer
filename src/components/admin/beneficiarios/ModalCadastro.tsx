// Modal para cadastrar um beneficiário manualmente pelo painel.
import React from 'react';
import { UserPlus, X } from 'lucide-react';
import type { Beneficiary, BeneficiaryStatus, ProjectCard } from '../../../types';
import { formatCPF, formatPhone } from '../../../utils/validation';

interface ModalCadastroProps {
  formData: Partial<Beneficiary>;
  setFormData: (data: Partial<Beneficiary>) => void;
  projects?: ProjectCard[];
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ModalCadastro: React.FC<ModalCadastroProps> = ({ formData, setFormData, projects, onSave, onClose }) => (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-[14px] shadow-2xl border border-line overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-body rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[14px] bg-amber-100 text-amber-900 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink">
              Cadastrar Novo Beneficiário
            </h3>
            <p className="text-xs text-muted">
              Adicione um participante manualmente à base de dados da associação.
            </p>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-body uppercase mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Nome do aluno ou assistido"
              value={formData.nome || ''}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                CPF *
              </label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={formData.cpf || ''}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={formData.nascimento || ''}
                onChange={(e) => setFormData({ ...formData, nascimento: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(62) 99999-0000"
                value={formData.telefone || ''}
                onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                E-mail (opcional)
              </label>
              <input
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                Projeto Social
              </label>
              <select
                value={formData.projeto || 'Escolinha de Futebol Comunitário'}
                onChange={(e) => setFormData({ ...formData, projeto: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Escolinha de Futebol Comunitário">Escolinha de Futebol Comunitário</option>
                <option value="Aulas de Ballet Solidário">Aulas de Ballet Solidário</option>
                <option value="Projeto Book Solidário para Gestantes">Projeto Book Solidário para Gestantes</option>
                <option value="Festas em Datas Comemorativas">Festas em Datas Comemorativas</option>
                {projects
                  ?.filter(
                    (p) =>
                      !p.titulo.toLowerCase().includes('futebol') &&
                      !p.titulo.toLowerCase().includes('ballet') &&
                      !p.titulo.toLowerCase().includes('book') &&
                      !p.titulo.toLowerCase().includes('festa')
                  )
                  .map((p) => (
                    <option key={p.id} value={p.titulo}>
                      {p.titulo}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                Status Inicial
              </label>
              <select
                value={formData.status || 'Pendente'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BeneficiaryStatus })}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Pendente">Pendente</option>
                <option value="Em análise">Em análise</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Atendido/Entregue">Atendido/Entregue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-body uppercase mb-1">
              Endereço / Bairro (Trindade - GO)
            </label>
            <input
              type="text"
              placeholder="Rua, número, setor"
              value={formData.endereco || ''}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-body uppercase mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Informações adicionais, tamanho do uniforme, responsável legal..."
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-body hover:bg-sand rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-dark hover:bg-brand-dark rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              Cadastrar Beneficiário
            </button>
          </div>
        </form>
      </div>
    </div>
);
