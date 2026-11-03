import React, { useState } from 'react';
import { useStock } from '../context/StockContext';
import { UserAccount, UserLevel } from '../types';
import { X, UserPlus, KeyRound, Shield, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface UsersManagementModalProps {
  onClose: () => void;
}

export const UsersManagementModal: React.FC<UsersManagementModalProps> = ({ onClose }) => {
  const { users, currentUser, addUser, updateUserPassword, updateUserLevel, removeUser } =
    useStock();

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newLevel, setNewLevel] = useState<UserLevel>(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Password edit state
  const [editingPasswordUser, setEditingPasswordUser] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addUser(newUsername, newPassword, newLevel);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setNewUsername('');
      setNewPassword('');
      setActiveTab('list');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleSavePassword = (username: string) => {
    if (!tempPassword.trim()) return;
    const res = updateUserPassword(username, tempPassword.trim());
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setEditingPasswordUser(null);
      setTempPassword('');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleLevelChange = (username: string, level: UserLevel) => {
    const res = updateUserLevel(username, level);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    }
  };

  const handleDeleteUser = (username: string) => {
    if (window.confirm(`Deseja realmente remover o usuário "${username}"?`)) {
      const res = removeUser(username);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Gerenciamento de Usuários</h2>
              <p className="text-xs text-slate-500 font-medium">
                Controle de permissões e acessos do galpão (Nível 3)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-100">
          <button
            onClick={() => {
              setActiveTab('list');
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Usuários Cadastrados ({users.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('add');
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Cadastrar Novo Usuário</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1">
          {feedback && (
            <div
              className={`p-3.5 mb-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {activeTab === 'list' ? (
            <div className="space-y-3">
              {users.map((u) => {
                const isCurrent = currentUser?.username === u.username;
                const isEditingThisPassword = editingPasswordUser === u.username;

                return (
                  <div
                    key={u.username}
                    className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{u.username}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Você
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            u.nivel === 2
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {u.roleName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">
                        Senha cadastrada: •••••• ({u.passwordHash})
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Level Selector */}
                      <select
                        value={u.nivel}
                        disabled={isCurrent}
                        onChange={(e) =>
                          handleLevelChange(u.username, parseInt(e.target.value, 10) as UserLevel)
                        }
                        className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 disabled:opacity-50 cursor-pointer"
                      >
                        <option value={1}>Operador de Estoque</option>
                        <option value={2}>Administrador</option>
                      </select>

                      {/* Change Password Button */}
                      {isEditingThisPassword ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            placeholder="Nova senha"
                            className="w-24 px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePassword(u.username)}
                            className="px-2 py-1 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => {
                              setEditingPasswordUser(null);
                              setTempPassword('');
                            }}
                            className="px-1.5 py-1 text-xs text-slate-400 hover:text-slate-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPasswordUser(u.username);
                            setTempPassword(u.passwordHash);
                          }}
                          title="Alterar senha"
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      )}

                      {/* Remove Button */}
                      {!isCurrent && (
                        <button
                          onClick={() => handleDeleteUser(u.username)}
                          title="Remover usuário"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleAddUser} className="space-y-4 max-w-md mx-auto py-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome de Usuário *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: Roberto, Mariana..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Senha de Acesso *
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Senha do usuário"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nível de Permissão
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(parseInt(e.target.value, 10) as UserLevel)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold cursor-pointer"
                >
                  <option value={1}>Operador de Estoque (Consultas, Entradas/Saídas e Relatórios)</option>
                  <option value={2}>Administrador (Acesso Total, Catálogo e Gestão de Contas)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Usuário</span>
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
