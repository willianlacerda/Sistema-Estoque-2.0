import React, { useState, useEffect } from 'react';
import { useStock } from '../context/StockContext';
import {
  Settings,
  Users,
  Shield,
  KeyRound,
  RotateCcw,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  DatabaseBackup,
  UserPlus,
  Trash2,
  Info,
  Eye,
  EyeOff,
  ShieldCheck,
  Package,
  History,
  FileText,
  Tags,
  Plus,
  Edit2,
  Save,
  X,
  Layers,
  AlertTriangle,
  Boxes,
} from 'lucide-react';
import { UserLevel } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface SettingsViewProps {
  defaultSubTab?: 'usuarios' | 'categorias' | 'backup' | 'sistema';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ defaultSubTab = 'usuarios' }) => {
  const {
    currentUser,
    users,
    addUser,
    updateUserPassword,
    updateUserLevel,
    removeUser,
    exportBackupJson,
    importBackupJson,
    resetDataToInitial,
    products,
    movements,
    categories,
    packagingTypes,
    addCategory,
    updateCategory,
    removeCategory,
    addPackagingType,
    updatePackagingType,
    removePackagingType,
  } = useStock();

  const [activeTab, setActiveTab] = useState<'usuarios' | 'categorias' | 'backup' | 'sistema'>(defaultSubTab);
  const isAdmin = Boolean(
    currentUser &&
      (currentUser.nivel === 2 ||
        Number(currentUser.nivel) === 2 ||
        currentUser.username.toLowerCase() === 'willian')
  );

  useEffect(() => {
    if (defaultSubTab) {
      setActiveTab(defaultSubTab);
    }
  }, [defaultSubTab]);

  // Form states for creating new user
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newLevel, setNewLevel] = useState<UserLevel>(1);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Password editing inline
  const [editingPasswordUser, setEditingPasswordUser] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('');

  // States for Categories management
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);

  // States for Packaging types management
  const [newPackSigla, setNewPackSigla] = useState('');
  const [newPackNome, setNewPackNome] = useState('');
  const [editingPackaging, setEditingPackaging] = useState<{ oldSigla: string; newSigla: string; newNome: string } | null>(null);

  // User feedback toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modern in-app confirmation modal (replacing blocked window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      showFeedback('Preencha o nome de usuário e a senha.', 'error');
      return;
    }

    const res = addUser(newUsername.trim(), newPassword.trim(), newLevel);
    if (res.success) {
      showFeedback(res.message, 'success');
      setNewUsername('');
      setNewPassword('');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleSavePassword = (username: string) => {
    if (!tempPassword.trim()) return;
    const res = updateUserPassword(username, tempPassword.trim());
    if (res.success) {
      showFeedback(res.message, 'success');
      setEditingPasswordUser(null);
      setTempPassword('');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleLevelChange = (username: string, level: UserLevel) => {
    const res = updateUserLevel(username, level);
    if (res.success) {
      showFeedback(res.message, 'success');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleDeleteUser = (username: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Usuário',
      message: `Tem certeza que deseja remover o usuário "${username}" do sistema? Esta ação é definitiva e revogará o acesso deste usuário.`,
      confirmLabel: 'Sim, Excluir Usuário',
      cancelLabel: 'Cancelar',
      isDestructive: true,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const res = removeUser(username);
        if (res.success) {
          showFeedback(res.message, 'success');
        } else {
          showFeedback(res.message, 'error');
        }
      },
    });
  };

  const handleDownloadBackup = () => {
    try {
      const jsonStr = exportBackupJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `estoque_backup_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showFeedback('Backup completo baixado com sucesso! Arquivo estoque_backup.json gerado.', 'success');
    } catch {
      showFeedback('Erro ao gerar arquivo de backup.', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const res = importBackupJson(text);
        if (res.success) {
          showFeedback(res.message, 'success');
        } else {
          showFeedback(res.message, 'error');
        }
      }
    };
    reader.onerror = () => {
      showFeedback('Falha na leitura do arquivo JSON selecionado.', 'error');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Category handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      showFeedback('Informe o nome da categoria.', 'error');
      return;
    }
    const res = addCategory(newCategoryName.trim());
    if (res.success) {
      showFeedback(res.message, 'success');
      setNewCategoryName('');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleSaveEditCategory = () => {
    if (!editingCategory || !editingCategory.newName.trim()) return;
    const res = updateCategory(editingCategory.oldName, editingCategory.newName.trim());
    if (res.success) {
      showFeedback(res.message, 'success');
      setEditingCategory(null);
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    const count = products.filter((p) => p.categoria === cat).length;
    const confirmMsg =
      count > 0
        ? `A categoria "${cat}" possui ${count} produto(s) vinculado(s). Deseja excluí-la e transferir os produtos automaticamente para "Outros"?`
        : `Deseja realmente remover a categoria "${cat}" do catálogo?`;

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Categoria',
      message: confirmMsg,
      confirmLabel: 'Sim, Excluir Categoria',
      cancelLabel: 'Cancelar',
      isDestructive: true,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const res = removeCategory(cat, 'Outros');
        if (res.success) {
          showFeedback(res.message, 'success');
        } else {
          showFeedback(res.message, 'error');
        }
      },
    });
  };

  // Packaging handlers
  const handleAddPackaging = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackSigla.trim()) {
      showFeedback('Informe a sigla da embalagem (ex: LATA, BALDE, CARTELA).', 'error');
      return;
    }
    const res = addPackagingType(newPackSigla.trim(), newPackNome.trim() || newPackSigla.trim());
    if (res.success) {
      showFeedback(res.message, 'success');
      setNewPackSigla('');
      setNewPackNome('');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleSaveEditPackaging = () => {
    if (!editingPackaging || !editingPackaging.newSigla.trim()) return;
    const res = updatePackagingType(
      editingPackaging.oldSigla,
      editingPackaging.newSigla.trim(),
      editingPackaging.newNome.trim() || editingPackaging.newSigla.trim()
    );
    if (res.success) {
      showFeedback(res.message, 'success');
      setEditingPackaging(null);
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleDeletePackaging = (sigla: string) => {
    const count = products.filter((p) => p.unidade === sigla).length;
    const confirmMsg =
      count > 0
        ? `A embalagem "${sigla}" está em uso por ${count} produto(s). Ao remover, estes produtos serão redefinidos para "UN". Confirma?`
        : `Deseja realmente remover o tipo de embalagem "${sigla}"?`;

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Tipo de Embalagem',
      message: confirmMsg,
      confirmLabel: 'Sim, Excluir Embalagem',
      cancelLabel: 'Cancelar',
      isDestructive: true,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const res = removePackagingType(sigla);
        if (res.success) {
          showFeedback(res.message, 'success');
        } else {
          showFeedback(res.message, 'error');
        }
      },
    });
  };

  // Access control: only Administrador (Nível 2) can access Settings
  if (currentUser && !isAdmin) {
    return (
      <div className="bg-[#0f172a] p-8 sm:p-12 rounded-3xl border border-slate-800 text-center max-w-xl mx-auto my-12 space-y-5 shadow-2xl animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white">Acesso Restrito a Administradores</h2>
          <p className="text-xs text-slate-400 mt-1">
            Seu usuário atual (<strong>{currentUser.username}</strong>) possui o nível <strong className="text-emerald-400">Operador (Nível 1)</strong>.
          </p>
        </div>

        <div className="p-4 bg-[#0b0f19] rounded-2xl border border-slate-800 text-left text-xs space-y-3">
          <p className="font-bold text-slate-200 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-2">
            Níveis de Usuário no Sistema:
          </p>
          <div className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
            <div>
              <strong className="text-amber-400">Nível 2 — Administrador:</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Acesso irrestrito a Configurações, criação de usuários, alteração de senhas, gestão de categorias, tipos de embalagem, backup e exclusão de produtos.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
            <div>
              <strong className="text-emerald-400">Nível 1 — Operador:</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Acesso operacional ao galpão: registro diário de Entradas (+) e Saídas (-), consulta de catálogo, saldos em tempo real e emissão de Relatórios em PDF/CSV.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Para realizar alterações nas configurações do armazém, faça login com uma conta de Administrador (ex: <strong>Willian</strong>).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Aba de Configurações
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1 pl-9">
            Gestão de usuários, categorias de produtos, tipos de embalagem e backup completo do galpão
          </p>
        </div>

        {/* Sub-tab selection */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 p-1.5 bg-[#0b0f19] border border-slate-800 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'usuarios'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários & Acesso</span>
          </button>

          <button
            onClick={() => setActiveTab('categorias')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'categorias'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Tags className="w-4 h-4" />
            <span>Categorias & Embalagens</span>
            <span className={`px-1.5 py-0.5 text-[10px] rounded font-mono font-bold ${
              activeTab === 'categorias' ? 'bg-white text-emerald-950' : 'bg-slate-800 text-slate-300'
            }`}>
              {categories.length + packagingTypes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <DatabaseBackup className="w-4 h-4" />
            <span>Backup & Dados</span>
          </button>

          <button
            onClick={() => setActiveTab('sistema')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'sistema'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Sobre o Sistema</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 border shadow-md animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
              : 'bg-rose-950/90 text-rose-300 border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA: CRIAR E GERENCIAR USUÁRIOS                                */}
      {/* ============================================================== */}
      {activeTab === 'usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário: Criar Novo Usuário (1 col) */}
          <div className="lg:col-span-1 bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-md space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Criar Novo Usuário
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Cadastro
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Cadastre operadores ou administradores para acessar o terminal com suas próprias credenciais.
            </p>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome de Usuário (Login) *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: marcos, juliana, operador1"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:bg-[#111927] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a senha"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:bg-[#111927] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nível de Permissão
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewLevel(1)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      newLevel === 1
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white ring-1 ring-emerald-500/30'
                        : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>Nível 1</span>
                      {newLevel === 1 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">Operador</div>
                    <div className="text-[10px] text-slate-500 mt-1 leading-tight">
                      Entrada/Saída de mercadorias
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewLevel(2)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      newLevel === 2
                        ? 'bg-amber-950/40 border-amber-500/60 text-white ring-1 ring-amber-500/30'
                        : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>Nível 2</span>
                      {newLevel === 2 && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[11px] font-semibold text-amber-400 mt-0.5">Administrador</div>
                    <div className="text-[10px] text-slate-500 mt-1 leading-tight">
                      Acesso total e gestão
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <UserPlus className="w-4 h-4" />
                <span>Salvar e Criar Usuário</span>
              </button>
            </form>
          </div>

          {/* Lista de Usuários Existentes (2 cols) */}
          <div className="lg:col-span-2 bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Usuários Ativos no Sistema ({users.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gerencie permissões, altere senhas ou exclua acessos
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                  Nível 1: Operador
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Nível 2: Admin
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {users.map((u) => {
                const isCurrent = currentUser?.username === u.username;
                const isMasterAdmin = u.username.toLowerCase() === 'willian';
                const isEditingThisPassword = editingPasswordUser === u.username;

                return (
                  <div
                    key={u.username}
                    className="p-4 bg-[#0b0f19] rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          u.nivel === 2
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                            : 'bg-slate-800 text-emerald-400 border border-slate-700'
                        }`}
                      >
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{u.username}</span>
                          {isMasterAdmin && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-amber-400" />
                              Administrador Principal
                            </span>
                          )}
                          {isCurrent && !isMasterAdmin && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              Sessão Atual
                            </span>
                          )}
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                              u.nivel === 2
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                            }`}
                          >
                            {u.nivel === 2 && <ShieldCheck className="w-3 h-3 text-amber-400" />}
                            {u.roleName}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 font-mono">
                          <span>Senha salva: •••••• ({u.passwordHash})</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Change Role, Edit Password, Delete */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Level selector */}
                      <select
                        value={u.nivel}
                        disabled={!isAdmin || isCurrent || isMasterAdmin}
                        title={
                          !isAdmin
                            ? 'Usuários Operadores não podem alterar o nível de outros usuários'
                            : isMasterAdmin
                            ? 'Administrador Principal (permanente)'
                            : 'Alterar nível de acesso'
                        }
                        onChange={(e) =>
                          handleLevelChange(u.username, parseInt(e.target.value, 10) as UserLevel)
                        }
                        className="text-xs font-semibold bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 disabled:opacity-40 cursor-pointer focus:outline-none"
                      >
                        <option value={1}>Nível 1 - Operador</option>
                        <option value={2}>Nível 2 - Administrador</option>
                      </select>

                      {/* Password edit button / input */}
                      {isEditingThisPassword ? (
                        <div className="flex items-center gap-1.5 bg-[#131d33] p-1 rounded-xl border border-slate-700">
                          <input
                            type="text"
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            placeholder="Nova senha"
                            className="w-24 px-2.5 py-1 text-xs border border-slate-600 rounded-lg bg-[#0b0f19] text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePassword(u.username)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => {
                              setEditingPasswordUser(null);
                              setTempPassword('');
                            }}
                            className="px-2 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPasswordUser(u.username);
                            setTempPassword(u.passwordHash);
                          }}
                          title="Alterar senha"
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-emerald-400 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Senha</span>
                        </button>
                      )}

                      {/* Delete user: strictly reserved for Administrador */}
                      {isAdmin && !isCurrent && !isMasterAdmin && (
                        <button
                          onClick={() => handleDeleteUser(u.username)}
                          title="Excluir usuário"
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl border border-transparent hover:border-rose-900/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Permission footer clarification */}
            <div className="p-3 bg-[#0b0f19] rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                🔒 <strong>Regra de Acesso:</strong> Apenas usuários com perfil <strong>Administrador</strong> podem excluir outros usuários e alterar níveis de permissão.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA: GERENCIAR CATEGORIAS E TIPOS DE EMBALAGEM                 */}
      {/* ============================================================== */}
      {activeTab === 'categorias' && (
        <div className="space-y-6">
          {/* Informative Header Banner */}
          <div className="bg-[#0f172a] p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Tags className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Classificação de Mercadorias & Embalagens
                </h3>
                <p className="text-xs text-slate-400">
                  Adicione e renomeie categorias e tipos de embalagem disponíveis no cadastro e filtros do sistema.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1.5 bg-[#0b0f19] border border-slate-800 rounded-xl text-xs font-mono font-medium text-slate-300">
                <strong className="text-emerald-400 font-bold">{categories.length}</strong> Categorias
              </span>
              <span className="px-3 py-1.5 bg-[#0b0f19] border border-slate-800 rounded-xl text-xs font-mono font-medium text-slate-300">
                <strong className="text-amber-400 font-bold">{packagingTypes.length}</strong> Embalagens
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* -------------------------------------------------------- */}
            {/* COLUNA 1: CATEGORIAS DE PRODUTOS                         */}
            {/* -------------------------------------------------------- */}
            <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-md space-y-6 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Tags className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Categorias de Produtos
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Usadas nos filtros rápidos e na separação física do estoque
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  {categories.length} ativas
                </span>
              </div>

              {/* Form: Adicionar Categoria */}
              <form onSubmit={handleAddCategory} className="space-y-3 bg-[#0b0f19] p-4 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Adicionar Nova Categoria
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Congelados, Grãos, Petiscos..."
                    className="flex-1 px-3.5 py-2.5 text-xs font-semibold bg-[#0f172a] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </form>

              {/* Lista de Categorias Cadastradas */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[460px] pr-1">
                {categories.map((cat) => {
                  const prodCount = products.filter((p) => p.categoria === cat).length;
                  const isEditing = editingCategory?.oldName === cat;

                  return (
                    <div
                      key={cat}
                      className="p-3.5 bg-[#0b0f19] rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingCategory.newName}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                newName: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-1.5 text-xs font-bold bg-[#131d33] border border-emerald-500/50 rounded-xl text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveEditCategory}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Salvar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer shrink-0"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-sm" />
                            <div className="truncate">
                              <span className="font-bold text-sm text-slate-100 block truncate">
                                {cat}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {prodCount === 1 ? '1 produto cadastrado' : `${prodCount} produtos cadastrados`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                              title="Editar nome da categoria"
                              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              title="Excluir categoria"
                              disabled={categories.length <= 1}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* COLUNA 2: TIPOS DE EMBALAGEM / UNIDADES                  */}
            {/* -------------------------------------------------------- */}
            <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-md space-y-6 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Tipos de Embalagem (Unidade)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Unidades de medida física das cargas no armazém
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                  {packagingTypes.length} ativas
                </span>
              </div>

              {/* Form: Adicionar Embalagem */}
              <form onSubmit={handleAddPackaging} className="space-y-3 bg-[#0b0f19] p-4 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Cadastrar Novo Tipo de Embalagem
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={newPackSigla}
                      onChange={(e) => setNewPackSigla(e.target.value.toUpperCase())}
                      placeholder="Sigla (ex: LATA, BALDE)"
                      className="w-full px-3.5 py-2.5 text-xs font-bold uppercase bg-[#0f172a] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  <div className="sm:col-span-3 flex gap-2">
                    <input
                      type="text"
                      value={newPackNome}
                      onChange={(e) => setNewPackNome(e.target.value)}
                      placeholder="Descrição (ex: Lata de Alumínio)"
                      className="flex-1 px-3.5 py-2.5 text-xs font-semibold bg-[#0f172a] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Lista de Tipos de Embalagem */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[460px] pr-1">
                {packagingTypes.map((pt) => {
                  const prodCount = products.filter((p) => p.unidade === pt.sigla).length;
                  const isEditing = editingPackaging?.oldSigla === pt.sigla;

                  return (
                    <div
                      key={pt.sigla}
                      className="p-3.5 bg-[#0b0f19] rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                          <input
                            type="text"
                            value={editingPackaging.newSigla}
                            onChange={(e) =>
                              setEditingPackaging({
                                ...editingPackaging,
                                newSigla: e.target.value.toUpperCase(),
                              })
                            }
                            placeholder="Sigla"
                            className="w-full sm:w-28 px-3 py-1.5 text-xs font-bold uppercase bg-[#131d33] border border-amber-500/50 rounded-xl text-white focus:outline-none"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editingPackaging.newNome}
                            onChange={(e) =>
                              setEditingPackaging({
                                ...editingPackaging,
                                newNome: e.target.value,
                              })
                            }
                            placeholder="Descrição completa"
                            className="flex-1 w-full px-3 py-1.5 text-xs font-semibold bg-[#131d33] border border-amber-500/50 rounded-xl text-white focus:outline-none"
                          />
                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={handleSaveEditPackaging}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Salvar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPackaging(null)}
                              className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 font-mono font-black text-xs rounded-xl border border-amber-500/20 shrink-0">
                              {pt.sigla}
                            </span>
                            <div className="truncate">
                              <span className="font-bold text-sm text-slate-100 block truncate">
                                {pt.nome}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {prodCount === 1 ? '1 produto cadastrado' : `${prodCount} produtos cadastrados`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingPackaging({
                                  oldSigla: pt.sigla,
                                  newSigla: pt.sigla,
                                  newNome: pt.nome,
                                })
                              }
                              title="Editar embalagem"
                              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePackaging(pt.sigla)}
                              title="Excluir tipo de embalagem"
                              disabled={packagingTypes.length <= 1}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA: FUNÇÕES DE BACKUP E RESTAURAÇÃO                           */}
      {/* ============================================================== */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Status summary of the stored database */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{products.length}</div>
                <div className="text-xs font-medium text-slate-400">Produtos no Galpão</div>
              </div>
            </div>

            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                <History className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{movements.length}</div>
                <div className="text-xs font-medium text-slate-400">Movimentações Registradas</div>
              </div>
            </div>

            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{users.length}</div>
                <div className="text-xs font-medium text-slate-400">Usuários Cadastrados</div>
              </div>
            </div>
          </div>

          {/* Backup Operations Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Download Backup */}
            <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Exportar Cópia de Segurança
                    </h3>
                    <p className="text-xs text-slate-400">Download do arquivo JSON completo</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0f19] p-4 rounded-2xl border border-slate-800/80">
                  Gera um arquivo <span className="font-mono text-emerald-400 font-bold">estoque_backup.json</span> com todos os produtos, quantidades em estoque, movimentações históricas e usuários cadastrados. Esse arquivo é seguro e pode ser guardado em pen drive ou nuvem.
                </p>
              </div>

              <button
                onClick={handleDownloadBackup}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Backup Completo (.JSON)</span>
              </button>
            </div>

            {/* Restore from Backup */}
            <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Restaurar Arquivo de Backup
                    </h3>
                    <p className="text-xs text-slate-400">Importar dados de arquivo JSON anterior</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0f19] p-4 rounded-2xl border border-slate-800/80">
                  Selecione um arquivo de backup exportado anteriormente ou o arquivo <span className="font-mono text-teal-400 font-bold">estoque.json</span>. Os itens e o histórico serão mesclados ou substituídos com segurança.
                </p>
              </div>

              <div>
                <label className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-slate-700 shadow-sm">
                  <Upload className="w-4 h-4 text-teal-400" />
                  <span>Selecionar Arquivo JSON para Restaurar</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Factory Reset / Standard Catalog */}
          <div className="bg-[#0f172a] p-6 rounded-3xl border border-rose-900/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  Restaurar Catálogo Base do Galpão (57 Itens Padrão)
                </h4>
                <p className="text-xs text-slate-400">
                  Restaura os produtos originais de catálogo (Tubos, conexões, cabos, tintas, parafusos) caso deseje reiniciar os testes.
                </p>
              </div>

              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Restaurar Catálogo Base',
                    message:
                      'Atenção: Deseja realmente restaurar a lista padrão de 57 itens do galpão? As movimentações atuais serão reiniciadas para a base padrão.',
                    confirmLabel: 'Sim, Restaurar Base',
                    cancelLabel: 'Cancelar',
                    isDestructive: false,
                    onConfirm: () => {
                      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                      resetDataToInitial();
                      showFeedback('Catálogo inicial padrão de 57 itens restaurado com sucesso!', 'success');
                    },
                  });
                }}
                className="px-4 py-2.5 bg-[#0b0f19] hover:bg-rose-950/60 hover:text-rose-200 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 hover:border-rose-900/50 transition-colors cursor-pointer shrink-0 flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Base Padrão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA: SOBRE O SISTEMA                                           */}
      {/* ============================================================== */}
      {activeTab === 'sistema' && (
        <div className="bg-[#0f172a] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-md max-w-2xl space-y-6">
          <div className="flex items-center gap-4">
            <img
              src="/assets/aistudio/Emblema_circular_verde_e_amarelo_recortado_851a632b.png"
              alt="WL Logo"
              className="h-16 w-16 object-contain filter drop-shadow-md shrink-0 select-none"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('Emblema_circular_verde_e_amarelo_recortado_851a632b.png')) {
                  target.src = '/public/assets/aistudio/Emblema_circular_verde_e_amarelo_recortado_851a632b.png';
                }
              }}
            />
            <div>
              <h3 className="text-xl font-extrabold text-white">WL System</h3>
              <p className="text-xs text-emerald-400 font-semibold">
                Controle Operacional de Estoque Galpão · Versão 2.0 Midnight
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#0b0f19] rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              Sistema de gestão de estoque desenvolvido para atendimento operacional de galpões, armazéns e estoques físicos, com rastreabilidade total de entradas e saídas.
            </p>
            <div className="pt-2 border-t border-slate-800 space-y-1.5 font-mono text-[11px] text-slate-400">
              <p>• <strong>Níveis de Usuário:</strong> Operador de Estoque (Nível 1) e Administrador (Nível 2)</p>
              <p>• <strong>Aba de Configurações:</strong> Criação de usuários e central de backup JSON integrados</p>
              <p>• <strong>Relatórios:</strong> Emissão de relatório analítico e sintético em PDF e CSV</p>
              <p>• <strong>Auditoria:</strong> Rastreio de operador, data/hora e justificativa em cada movimentação</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação In-App (substitui window.confirm bloqueado por iframes) */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
