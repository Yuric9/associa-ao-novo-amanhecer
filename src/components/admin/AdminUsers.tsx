import React, { useState } from 'react';
import { Plus, Shield, Trash2, Key, UserCheck, X } from 'lucide-react';
import { AdminUser } from '../../types';

interface AdminUsersProps {
  admins: AdminUser[];
  onUpdateAdmins: (admins: AdminUser[]) => void;
  currentEmail: string;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ admins, onUpdateAdmins, currentEmail }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newNome) return;

    const newAdmin: AdminUser = {
      id: `admin-${Date.now()}`,
      email: newEmail.trim().toLowerCase(),
      nome: newNome.trim(),
      criado_em: new Date().toISOString().split('T')[0],
    };

    onUpdateAdmins([...admins, newAdmin]);
    setShowAdd(false);
    setNewEmail('');
    setNewNome('');
  };

  const handleDelete = (id: string, email: string) => {
    if (email === currentEmail) {
      alert('Você não pode excluir o seu próprio usuário logado.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja revogar o acesso de "${email}"?`)) {
      onUpdateAdmins(admins.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gerenciamento de Administradores</h3>
          <p className="text-xs text-slate-500">
            Controle de coordenadores com acesso ao painel de beneficiários e edição de conteúdos.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Administrador</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{admin.nome}</span>
                  {admin.email === currentEmail && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Você (Sessão Atual)
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">{admin.email}</div>
                <div className="text-[10px] text-slate-400">Criado em: {admin.criado_em}</div>
              </div>
            </div>

            <div>
              {admin.email !== currentEmail && (
                <button
                  onClick={() => handleDelete(admin.id, admin.email)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Revogar acesso"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAdd(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">Adicionar Administrador</h3>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Coordenação"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="carlos@novoamanhecer.org.br"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl"
                >
                  Salvar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
