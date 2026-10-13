// Modal para editar o cadastro de um beneficiário.
import React from 'react';
import { X } from 'lucide-react';
import type { Beneficiary, BeneficiaryStatus } from '../../../types';
import { formatCPF, formatPhone } from '../../../utils/validation';

interface ModalEdicaoProps {
  formData: Partial<Beneficiary>;
  setFormData: (data: Partial<Beneficiary>) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ModalEdicao: React.FC<ModalEdicaoProps> = ({ formData, setFormData, onSave, onClose }) => (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-[14px] shadow-2xl border border-line overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-body rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-ink mb-4">
          Editar Cadastro do Beneficiário
        </h3>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-body uppercase mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              required
              value={formData.nome || ''}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                CPF
              </label>
              <input
                type="text"
                required
                value={formData.cpf || ''}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                Telefone
              </label>
              <input
                type="tel"
                required
                value={formData.telefone || ''}
                onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                Projeto
              </label>
              <select
                value={formData.projeto || ''}
                onChange={(e) => setFormData({ ...formData, projeto: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl"
              >
                <option value="Aulas de Ballet Solidário">Aulas de Ballet Solidário</option>
                <option value="Escolinha de Futebol Comunitário">Escolinha de Futebol Comunitário</option>
                <option value="Projeto Book Solidário para Gestantes">Projeto Book Solidário para Gestantes</option>
                <option value="Festas em Datas Comemorativas">Festas em Datas Comemorativas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                Status
              </label>
              <select
                value={formData.status || 'Pendente'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BeneficiaryStatus })}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl"
              >
                <option value="Pendente">Pendente</option>
                <option value="Em análise">Em análise</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Atendido/Entregue">Atendido/Entregue</option>
                <option value="Recusado">Recusado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-body uppercase mb-1">
              Endereço
            </label>
            <input
              type="text"
              value={formData.endereco || ''}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-body uppercase mb-1">
              Observações da Equipe
            </label>
            <textarea
              rows={3}
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-body hover:bg-sand rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-dark rounded-xl cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
);
