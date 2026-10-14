// Modal de cadastro / edição de voluntário.
import React from 'react';
import { HandHeart, X } from 'lucide-react';
import type { VolunteerArea, VolunteerAvailability } from '../../../types';
import { AREAS, DISPONIBILIDADES, type FormVoluntario } from './dados';

interface ModalVoluntarioProps {
  editando: boolean;
  form: FormVoluntario;
  setForm: (form: FormVoluntario) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ModalVoluntario: React.FC<ModalVoluntarioProps> = ({ editando, form, setForm, onSave, onClose }) => (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-[14px] shadow-2xl border border-line overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-body rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[14px] bg-rose-100 text-rose-800 flex items-center justify-center">
            <HandHeart className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink">
              {editando ? 'Editar Voluntário' : 'Novo Voluntário da Equipe'}
            </h3>
            <span className="text-xs text-muted">
              Associação Novo Amanhecer · Trindade - GO
            </span>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-body uppercase mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Vanessa Cristina Mendonça"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                required
                placeholder="(62) 99999-9999"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                E-mail
              </label>
              <input
                type="email"
                placeholder="voluntario@gmail.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                Área de Atuação
              </label>
              <select
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value as VolunteerArea })}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {AREAS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-body uppercase mb-1">
                Disponibilidade
              </label>
              <select
                value={form.disponibilidade}
                onChange={(e) => setForm({ ...form, disponibilidade: e.target.value as VolunteerAvailability })}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {DISPONIBILIDADES.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-body uppercase mb-1">
              Habilidades & Especialidades
            </label>
            <input
              type="text"
              placeholder="Ex: Dança clássica, arbitragem, culinária, contação de histórias..."
              value={form.habilidades}
              onChange={(e) => setForm({ ...form, habilidades: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-body uppercase mb-1">
              Observações Internas da Coordenação
            </label>
            <textarea
              rows={2}
              placeholder="Anotações sobre disponibilidade, turmas acompanhadas, etc."
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-paper border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-body hover:bg-sand rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
            >
              {editando ? 'Salvar Alterações' : 'Cadastrar na Equipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
);
