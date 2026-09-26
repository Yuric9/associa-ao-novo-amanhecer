import React, { useState, useEffect } from 'react';
import { Plus, Shield, Trash2, Key, UserCheck, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { UserRole } from '../../types';

interface AdminUsersProps {
  currentEmail: string;
  currentUserRole?: string;
}

interface ServerUser {
  id: string;
  nome: string;
  email: string;
  ativo: number;
  role: UserRole;
  role_nome?: string;
  criado_em: string;
  atualizado_em?: string;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ currentEmail, currentUserRole }) => {
  const [users, setUsers] = useState<ServerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal de Adição
  const [showAdd, setShowAdd] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('equipe');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar usuários do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newEmail || !newNome || !newPassword) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.createUser({
        nome: newNome.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
      });

      setSuccess(res.message || 'Usuário criado com sucesso no banco de dados.');
      setShowAdd(false);
      setNewEmail('');
      setNewNome('');
      setNewPassword('');
      setNewRole('equipe');
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar novo usuário.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (email === currentEmail) {
      alert('Você não pode excluir sua própria conta enquanto estiver logado.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja revogar o acesso e excluir a conta "${email}"? Esta ação é irreversível.`)) {
      setActionLoading(true);
      setError('');
      try {
        await api.deleteUser(id);
        setSuccess(`Usuário "${email}" excluído com sucesso.`);
        await loadUsers();
      } catch (err: any) {
        setError(err.message || 'Erro ao excluir usuário.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2.5 py-1 text-[11px] font-extrabold bg-red-100 text-red-800 border border-red-200 rounded-lg">
            Administrador Geral
          </span>
        );
      case 'coordenador':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-lg">
            Coordenador de Projetos
          </span>
        );
      case 'equipe':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 rounded-lg">
            Equipe Social
          </span>
        );
      case 'voluntario':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
            Voluntário (Sigilo LGPD)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-lg">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Perfis de Acesso & Usuários Administrativos</h3>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Gerenciamento de contas com autenticação real por hash bcrypt. Os papéis (RBAC) são armazenados em tabela separada e verificados exclusivamente no servidor a cada requisição.
          </p>
        </div>

        {currentUserRole === 'admin' && (
          <button
            onClick={() => {
              setShowAdd(true);
              setError('');
              setSuccess('');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Usuário / Admin</span>
          </button>
        )}
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            <span className="text-xs">Consultando contas e permissões no banco de dados...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhum usuário cadastrado no sistema.
          </div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <Shield className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{u.nome}</span>
                    {getRoleBadge(u.role)}
                    {u.email === currentEmail && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        Você (Sessão Atual)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Cadastrado em: {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {currentUserRole === 'admin' && u.email !== currentEmail && (
                <div className="self-end sm:self-center">
                  <button
                    onClick={() => handleDelete(u.id, u.email)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-red-100"
                    title="Excluir usuário do sistema"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Adicionar Novo Usuário */}
      {showAdd && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAdd(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cadastrar Novo Usuário</h3>
                <span className="text-xs text-slate-500">Atribuição de papel seguro (RBAC)</span>
              </div>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Coordenação Social"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  E-mail de Login
                </label>
                <input
                  type="email"
                  required
                  placeholder="maria@novoamanhecer.org.br"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Senha Provisória (Mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nível de Acesso (Papel RBAC)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
                >
                  <option value="admin">Administrador Geral (Acesso Total + Gestão de Usuários)</option>
                  <option value="coordenador">Coordenador de Projetos (Beneficiários, Galeria, CMS)</option>
                  <option value="equipe">Equipe Social / Apoio (Gestão de Cadastros e Turmas)</option>
                  <option value="voluntario">Voluntário Operacional (Acesso com Sigilo LGPD)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  O papel é gravado na tabela separada <code className="text-amber-700">user_roles</code> e verificado pelo servidor.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-xl cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  <span>Salvar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
