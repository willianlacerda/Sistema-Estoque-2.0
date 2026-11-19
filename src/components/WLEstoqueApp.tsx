import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStock } from '../context/StockContext';
import { StockProduct, StockMovement } from '../types';
import {
  Search,
  Plus,
  Trash2,
  FileText,
  X,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  Package,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Minimize2,
  Maximize2,
  DatabaseBackup,
  RotateCcw,
  Upload,
  AlertTriangle,
  History,
  Check,
} from 'lucide-react';

export function WLEstoqueApp() {
  const {
    products,
    movements,
    currentUser,
    lastUpdatedTime,
    registerMovement,
    addProduct,
    updateProduct,
    removeProduct,
    logout,
    users,
    addUser,
    updateUserPassword,
    updateUserLevel,
    removeUser,
    exportBackupJson,
    importBackupJson,
    resetDataToInitial,
  } = useStock();

  interface OpenTab {
    id: 'menu' | 'estoque' | 'usuarios';
    title: string;
    closable: boolean;
  }

  // Dynamic Open Tabs state (Menu always present, Estoque opens)
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([
    { id: 'menu', title: 'Menu', closable: false },
    { id: 'estoque', title: 'Estoque', closable: true },
  ]);
  const [activeTabId, setActiveTabId] = useState<'menu' | 'estoque' | 'usuarios'>('estoque');

  const handleOpenTab = (tabId: 'menu' | 'estoque' | 'usuarios') => {
    const exists = openTabs.some((t) => t.id === tabId);
    if (!exists) {
      const title = tabId === 'menu' ? 'Menu' : tabId === 'estoque' ? 'Estoque' : 'Usuários';
      setOpenTabs((prev) => [...prev, { id: tabId, title, closable: tabId !== 'menu' }]);
    }
    setActiveTabId(tabId);
  };

  const handleCloseTab = (tabId: 'menu' | 'estoque' | 'usuarios', e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabId === 'menu') return;

    const nextTabs = openTabs.filter((t) => t.id !== tabId);
    setOpenTabs(nextTabs);

    if (activeTabId === tabId) {
      const lastTab = nextTabs[nextTabs.length - 1] || { id: 'menu', title: 'Menu', closable: false };
      setActiveTabId(lastTab.id);
    }
  };

  // Sub Tab inside Estoque window: 'estoque' | 'historico'
  const [estoqueSubTab, setEstoqueSubTab] = useState<'estoque' | 'historico'>('estoque');

  // Search state
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [tipoPesquisa, setTipoPesquisa] = useState<'Nome' | 'Número'>('Nome');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'zerados' | 'baixo' | 'disponivel'>('todos');

  // Selection states
  const [selectedProductId, setSelectedProductId] = useState<string | null>('prod_57');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Dialog State for cell editing (PyQt5 QInputDialog style)
  const [editDialog, setEditDialog] = useState<{
    isOpen: boolean;
    product: StockProduct | null;
    field: 'entrada' | 'saida' | 'quantidade' | 'nome' | 'novo';
    title: string;
    label: string;
    defaultValue: string;
  }>({
    isOpen: false,
    product: null,
    field: 'entrada',
    title: '',
    label: '',
    defaultValue: '',
  });

  const [dialogInputVal, setDialogInputVal] = useState('');
  const [dialogObservacao, setDialogObservacao] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Report Modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<'todos' | 'zerados' | 'baixo' | 'disponivel'>('todos');

  // Backup Modal
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History search & type filter
  const [historicoSearch, setHistoricoSearch] = useState('');
  const [historicoTipoFilter, setHistoricoTipoFilter] = useState<'todos' | 'Entrada' | 'Saída'>('todos');

  // Toast alert
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products;

    // Status filter
    if (statusFilter === 'zerados') {
      result = result.filter((p) => p.quantidade <= 0);
    } else if (statusFilter === 'baixo') {
      result = result.filter((p) => p.quantidade > 0 && p.quantidade <= p.estoqueMinimo);
    } else if (statusFilter === 'disponivel') {
      result = result.filter((p) => p.quantidade > p.estoqueMinimo);
    }

    // Text / Number search
    const termo = termoPesquisa.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!termo) return result;

    if (tipoPesquisa === 'Número') {
      const num = parseInt(termo, 10);
      if (isNaN(num)) return result;
      return result.filter((p: StockProduct) => p.numero === num);
    }

    const tokens = termo.split('%').filter((t: string) => t.trim().length > 0);
    return result.filter((p: StockProduct) => {
      const nomeLimpo = p.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (tokens.length === 0) return true;
      return tokens.every((token: string) => nomeLimpo.includes(token));
    });
  }, [products, termoPesquisa, tipoPesquisa, statusFilter]);

  // Keyboard navigation & Shortcuts (Galpão efficiency)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts when writing inside an input or modal
      const activeTag = document.activeElement?.tagName;
      if (editDialog.isOpen || isReportOpen || isBackupOpen) {
        if (e.key === 'Escape') {
          setEditDialog((prev) => ({ ...prev, isOpen: false }));
          setIsReportOpen(false);
          setIsBackupOpen(false);
        }
        return;
      }

      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement)?.blur();
          setTermoPesquisa('');
        }
        return;
      }

      // Shortcut '/' to focus search
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredProducts.length === 0) return;

        const currentIndex = filteredProducts.findIndex((p) => p.id === selectedProductId);
        let nextIndex = 0;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < filteredProducts.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredProducts.length - 1;
        }

        const nextProd = filteredProducts[nextIndex];
        if (nextProd) {
          setSelectedProductId(nextProd.id);
          setSelectedProductIds([nextProd.id]);

          // Scroll into view
          const el = document.getElementById(`row-${nextProd.id}`);
          el?.scrollIntoView({ block: 'nearest' });
        }
        return;
      }

      // Enter on selected row -> opens entrada dialog
      if (e.key === 'Enter' && selectedProductId) {
        const prod = products.find((p) => p.id === selectedProductId);
        if (prod) {
          handleOpenCellDialog(prod, 'entrada');
        }
        return;
      }

      // Delete -> removes selected
      if (e.key === 'Delete' && selectedProductId) {
        handleRemoveSelected();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editDialog.isOpen, isReportOpen, isBackupOpen, filteredProducts, selectedProductId, products]);

  // Handle cell click / action
  const handleOpenCellDialog = (product: StockProduct, field: 'entrada' | 'saida' | 'quantidade' | 'nome') => {
    setSelectedProductId(product.id);
    setDialogError(null);
    setDialogObservacao('');

    let title = 'Editar';
    let label = 'Novo valor:';
    let defaultValue = '';

    if (field === 'entrada') {
      title = 'Entrada de Estoque';
      label = `Quantidade a ADICIONAR ao produto Nº ${product.numero} (${product.nome}):`;
      defaultValue = '';
    } else if (field === 'saida') {
      title = 'Saída de Estoque';
      label = `Quantidade a SUBTRAIR do produto Nº ${product.numero} (Disponível: ${product.quantidade}):`;
      defaultValue = '';
    } else if (field === 'quantidade') {
      title = 'Ajustar Quantidade Total';
      label = `Nova quantidade total para ${product.nome}:`;
      defaultValue = String(product.quantidade);
    } else if (field === 'nome') {
      title = 'Editar Nome do Produto';
      label = `Novo nome para o produto Nº ${product.numero}:`;
      defaultValue = product.nome;
    }

    setDialogInputVal(defaultValue);
    setEditDialog({
      isOpen: true,
      product,
      field,
      title,
      label,
      defaultValue,
    });
  };

  const handleOpenAddProductDialog = () => {
    setDialogError(null);
    setDialogInputVal('');
    setDialogObservacao('');
    setEditDialog({
      isOpen: true,
      product: null,
      field: 'novo',
      title: 'Novo Produto',
      label: 'Digite o nome do produto:',
      defaultValue: '',
    });
  };

  const handleConfirmDialog = (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError(null);

    if (editDialog.field === 'novo') {
      const nome = dialogInputVal.trim().toUpperCase();
      if (!nome) {
        setDialogError('O nome do produto não pode ficar em branco.');
        return;
      }
      const res = addProduct(nome, 0);
      if (res.success) {
        showToast(res.message, 'success');
        setEditDialog({ ...editDialog, isOpen: false });
      } else {
        setDialogError(res.message);
      }
      return;
    }

    if (!editDialog.product) return;
    const prod = editDialog.product;

    if (editDialog.field === 'entrada') {
      const qtd = parseInt(dialogInputVal, 10);
      if (isNaN(qtd) || qtd <= 0) {
        setDialogError('Digite uma quantidade válida maior que zero.');
        return;
      }
      const res = registerMovement(prod.id, 'Entrada', qtd, dialogObservacao.trim() || undefined);
      if (res.success) {
        showToast(res.message, 'success');
        setEditDialog({ ...editDialog, isOpen: false });
      } else {
        setDialogError(res.message);
      }
    } else if (editDialog.field === 'saida') {
      const qtd = parseInt(dialogInputVal, 10);
      if (isNaN(qtd) || qtd <= 0) {
        setDialogError('Digite uma quantidade válida maior que zero.');
        return;
      }
      if (qtd > prod.quantidade) {
        setDialogError(`Saída (${qtd}) maior que o estoque disponível (${prod.quantidade}).`);
        return;
      }
      const res = registerMovement(prod.id, 'Saída', qtd, dialogObservacao.trim() || undefined);
      if (res.success) {
        showToast(res.message, 'success');
        setEditDialog({ ...editDialog, isOpen: false });
      } else {
        setDialogError(res.message);
      }
    } else if (editDialog.field === 'quantidade') {
      const novaQtd = parseInt(dialogInputVal, 10);
      if (isNaN(novaQtd) || novaQtd < 0) {
        setDialogError('Digite uma quantidade válida (0 ou superior).');
        return;
      }
      const res = updateProduct(prod.id, { quantidade: novaQtd });
      if (res.success) {
        showToast(`Quantidade ajustada para ${novaQtd}.`, 'success');
        setEditDialog({ ...editDialog, isOpen: false });
      } else {
        setDialogError(res.message);
      }
    } else if (editDialog.field === 'nome') {
      const novoNome = dialogInputVal.trim().toUpperCase();
      if (!novoNome) {
        setDialogError('O nome do produto não pode ficar em branco.');
        return;
      }
      const res = updateProduct(prod.id, { nome: novoNome });
      if (res.success) {
        showToast('Nome do produto atualizado!', 'success');
        setEditDialog({ ...editDialog, isOpen: false });
      } else {
        setDialogError(res.message);
      }
    }
  };

  // Add preset values quickly
  const handleAddPreset = (val: number) => {
    const current = parseInt(dialogInputVal, 10) || 0;
    setDialogInputVal(String(current + val));
    setDialogError(null);
  };

  // Remove selected products
  const handleRemoveSelected = () => {
    const toRemove = selectedProductIds.length > 0
      ? selectedProductIds
      : selectedProductId
      ? [selectedProductId]
      : [];

    if (toRemove.length === 0) {
      alert('Selecione ao menos um produto para remover.');
      return;
    }

    if (window.confirm(`Deseja remover ${toRemove.length} produto(s) selecionado(s)?`)) {
      toRemove.forEach((id) => removeProduct(id));
      setSelectedProductIds([]);
      setSelectedProductId(null);
      showToast(`${toRemove.length} produto(s) removido(s) com sucesso!`, 'success');
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    setSelectedProductId(id);
    if (e.ctrlKey || e.metaKey) {
      setSelectedProductIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedProductIds([id]);
    }
  };

  // Batch Select All
  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Nº', 'Produto', 'Categoria', 'Unidade', 'Quantidade em Estoque', 'Estoque Mínimo'];
    const rows = filteredProducts.map((p) => [
      p.numero,
      `"${p.nome.replace(/"/g, '""')}"`,
      p.categoria,
      p.unidade,
      p.quantidade,
      p.estoqueMinimo,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estoque_galpao_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Planilha CSV gerada e baixada!', 'success');
  };

  // Filtered movements for History tab
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (historicoTipoFilter !== 'todos' && m.tipo !== historicoTipoFilter) {
        return false;
      }
      if (historicoSearch.trim()) {
        const query = historicoSearch.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const prod = m.produto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const user = (m.usuario || '').toLowerCase();
        const date = m.dataHora;
        return prod.includes(query) || user.includes(query) || date.includes(query) || String(m.numero) === query;
      }
      return true;
    });
  }, [movements, historicoTipoFilter, historicoSearch]);

  // Projected balance in modal
  const inputQuantityNum = parseInt(dialogInputVal, 10) || 0;
  const projectedBalance =
    editDialog.product && editDialog.field === 'entrada'
      ? editDialog.product.quantidade + inputQuantityNum
      : editDialog.product && editDialog.field === 'saida'
      ? editDialog.product.quantidade - inputQuantityNum
      : null;

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-800 font-sans flex flex-col select-none">
      {/* 1. OS-Style Window Title Bar (Exact replicate of PyQt5 window bar) */}
      <div className="bg-[#f0f4f7] border-b border-[#ddd] px-3 py-1.5 flex items-center justify-between text-xs text-slate-700 select-none">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
            WL
          </div>
          <span className="font-semibold text-slate-800">
            WL System - {activeTabId === 'menu' ? 'Menu Principal' : activeTabId === 'usuarios' ? 'Usuários' : 'Estoque'}
          </span>
        </div>

        {/* User indicator & Window controls */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500">
            Usuário: <strong className="text-slate-800">{currentUser?.username}</strong> (Nível {currentUser?.nivel})
          </span>

          {/* Backup Button */}
          <button
            onClick={() => setIsBackupOpen(true)}
            title="Backup e Restauração de Dados"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-[#e8f5e9] hover:bg-[#d8eed9] border border-[#c8e6c9] px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            <DatabaseBackup className="w-3 h-3 text-emerald-700" />
            <span>Backup</span>
          </button>

          <div className="flex items-center gap-1.5 ml-2 text-slate-400">
            <Minimize2 className="w-3.5 h-3.5 hover:text-slate-700 cursor-pointer" />
            <Maximize2 className="w-3.5 h-3.5 hover:text-slate-700 cursor-pointer" />
            <button
              onClick={logout}
              title="Sair"
              className="hover:text-rose-600 cursor-pointer px-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Tabs ([ Menu ✕ ] | [ Estoque ✕ ] | [ Usuários ✕ ]) */}
      <div className="bg-[#f0f4f7] px-4 pt-1.5 border-b border-[#ddd] flex items-center gap-1">
        {openTabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer select-none ${
                isActive
                  ? 'bg-white text-slate-900 border-t border-l border-r border-[#ccc] font-bold shadow-2xs'
                  : 'bg-[#e8f5e9] text-[#1b5e20] hover:bg-[#dcf0de] border border-[#c8e6c9]'
              }`}
            >
              <span>{tab.title}</span>
              {tab.closable ? (
                <span
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  title={`Fechar aba ${tab.title}`}
                  className={`text-[10px] px-1 py-0.5 rounded hover:bg-slate-200/80 transition-colors ${
                    isActive ? 'text-rose-500 font-bold hover:text-rose-700' : 'text-slate-400 hover:text-rose-600'
                  }`}
                >
                  ✕
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 opacity-40 px-0.5">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main Window Body */}
      {activeTabId === 'menu' ? (
        /* MENU VIEW (Replicates Login_menu_3d2bd95a.py without Financeiro) */
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#f0f4f7] to-[#e8edf2]">
          <div className="w-full max-w-sm space-y-5 text-center">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-8">MENU</h1>

            {/* Estoque Card Button */}
            <div
              onClick={() => handleOpenTab('estoque')}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all border border-slate-200 flex items-center gap-4 cursor-pointer hover:scale-102 active:scale-98"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Package className="w-7 h-7" />
              </div>
              <div className="text-left">
                <span className="text-lg font-bold text-slate-800 block">Estoque</span>
                <span className="text-xs text-slate-400">Controle de galpão e mercadorias</span>
              </div>
            </div>

            {/* Usuários Card Button (Administrador - Nível 2) */}
            {currentUser?.nivel === 2 && (
              <div
                onClick={() => handleOpenTab('usuarios')}
                className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all border border-slate-200 flex items-center gap-4 cursor-pointer hover:scale-102 active:scale-98"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Users className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <span className="text-lg font-bold text-slate-800 block">Usuários</span>
                  <span className="text-xs text-slate-400">Gerenciar contas e níveis de acesso</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeTabId === 'usuarios' ? (
        /* USERS MANAGEMENT VIEW */
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              Cadastro de Usuários do Sistema
            </h2>
            <button
              onClick={() => handleOpenTab('estoque')}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
            >
              Voltar ao Estoque
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-2 px-3">Usuário</th>
                  <th className="py-2 px-3">Nível</th>
                  <th className="py-2 px-3">Cargo</th>
                  <th className="py-2 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u: any) => (
                  <tr key={u.username} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{u.username}</td>
                    <td className="py-2.5 px-3">
                      <select
                        value={u.nivel}
                        disabled={u.username === currentUser?.username}
                        onChange={(e) =>
                          updateUserLevel(u.username, parseInt(e.target.value, 10) as any)
                        }
                        className="text-xs border rounded px-2 py-1 font-semibold"
                      >
                        <option value={1}>1 - Operador</option>
                        <option value={2}>2 - Gerente</option>
                        <option value={3}>3 - Admin</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-600 font-medium">{u.roleName}</td>
                    <td className="py-2.5 px-3 text-right">
                      {u.username !== currentUser?.username && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remover usuário "${u.username}"?`)) {
                              removeUser(u.username);
                            }
                          }}
                          className="text-xs text-rose-600 hover:underline font-semibold ml-2"
                        >
                          Remover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ESTOQUE MAIN VIEW */
        <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-[1550px] w-full mx-auto space-y-3.5">
          {/* Header Title Section with Logo and Green Decorative Line */}
          <div className="relative flex items-center justify-between pb-1">
            {/* Left: DM Santos Logo */}
            <div className="w-32 shrink-0">
              <img
                src="/logo.png"
                alt="WL System"
                className="h-16 w-16 object-contain"
              />
            </div>

            {/* Center: Green Accent Bar + Estoque Galpão Title */}
            <div className="text-center flex-1 pr-32">
              <div className="w-56 h-1 bg-[#2e7d32] mx-auto rounded-full mb-1.5" />
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl text-amber-500">📦</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2e7d32] tracking-tight">
                  Estoque Galpão
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">Controle de Estoque</p>
            </div>
          </div>

          {/* Search Bar Container */}
          <div className="bg-white border border-[#ddd] p-3 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                placeholder="Pesquisar produto... (Atalho: pressione / )"
                className="w-full px-3 py-1.5 text-sm sm:text-base text-slate-800 border-none focus:outline-none placeholder:text-slate-400 font-medium"
              />
              {termoPesquisa && (
                <button
                  type="button"
                  onClick={() => setTermoPesquisa('')}
                  className="text-slate-400 hover:text-slate-600 px-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={tipoPesquisa}
                onChange={(e: any) => setTipoPesquisa(e.target.value)}
                className="border border-[#bbb] rounded-xl px-3 py-1.5 text-xs sm:text-sm bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="Nome">Nome</option>
                <option value="Número">Número</option>
              </select>

              {/* Green Magnifying Search Button */}
              <button
                type="button"
                className="bg-[#66bb6a] hover:bg-[#57a95b] active:bg-[#43a047] text-white p-2 px-3.5 rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
                title="Pesquisar"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Gray Clear Button */}
              <button
                type="button"
                onClick={() => setTermoPesquisa('')}
                className="bg-[#90a4ae] hover:bg-[#78909c] text-white p-2 px-3.5 rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section Sub Tabs: [ 📦 Estoque ] | [ 📜 Histórico ] AND Quick Status Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setEstoqueSubTab('estoque')}
                className={`flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all cursor-pointer ${
                  estoqueSubTab === 'estoque'
                    ? 'bg-white border-t border-l border-r border-[#c8e6c9] text-emerald-900 font-bold shadow-2xs'
                    : 'bg-[#e8f5e9] border border-[#c8e6c9] text-emerald-800 hover:bg-[#dcf0de]'
                }`}
              >
                <span>📦 Estoque</span>
              </button>

              <button
                onClick={() => setEstoqueSubTab('historico')}
                className={`flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all cursor-pointer ${
                  estoqueSubTab === 'historico'
                    ? 'bg-white border-t border-l border-r border-[#c8e6c9] text-emerald-900 font-bold shadow-2xs'
                    : 'bg-[#e8f5e9] border border-[#c8e6c9] text-emerald-800 hover:bg-[#dcf0de]'
                }`}
              >
                <span>📜 Histórico</span>
              </button>
            </div>

            {/* Quick Status Filter Pills (Audit) */}
            {estoqueSubTab === 'estoque' && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Filtro:</span>
                <button
                  onClick={() => setStatusFilter('todos')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'todos'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Todos ({products.length})
                </button>
                <button
                  onClick={() => setStatusFilter('baixo')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'baixo'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Estoque Baixo
                </button>
                <button
                  onClick={() => setStatusFilter('zerados')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'zerados'
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  Zerados
                </button>
                <button
                  onClick={handleExportCsv}
                  title="Exportar planilha CSV"
                  className="ml-2 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* View Tab Body */}
          {estoqueSubTab === 'estoque' ? (
            /* MAIN TABLE REPLICATION */
            <div className="bg-white border border-[#ccc] rounded-2xl p-2 shadow-xs flex-1 flex flex-col overflow-hidden">
              <div
                ref={tableContainerRef}
                className="overflow-x-auto flex-1 max-h-[580px] overflow-y-auto rounded-xl border border-[#ddd]"
              >
                <table className="w-full text-left border-collapse">
                  {/* Table Green Header */}
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#8bc34a] text-[#1b5e20] font-bold text-sm select-none border-b-2 border-[#33691e]">
                      <th className="py-2.5 px-2 text-center w-8 border-r border-[#33691e]">
                        <input
                          type="checkbox"
                          checked={
                            selectedProductIds.length > 0 &&
                            selectedProductIds.length === filteredProducts.length
                          }
                          onChange={handleToggleSelectAll}
                          title="Selecionar todos os visíveis"
                          className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3 text-center w-12 border-r border-[#33691e]">
                        Nº
                      </th>
                      <th className="py-2.5 px-4 border-r border-[#33691e]">
                        Produto
                      </th>
                      <th className="py-2.5 px-4 text-center w-24 border-r border-[#33691e]">
                        Entrada
                      </th>
                      <th className="py-2.5 px-4 text-center w-24 border-r border-[#33691e]">
                        Saída
                      </th>
                      <th className="py-2.5 px-4 text-center w-32">
                        Quantidade
                      </th>
                    </tr>
                  </thead>

                  {/* Rows */}
                  <tbody className="text-sm divide-y divide-[#eee]">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Nenhum produto encontrado com os filtros atuais.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p: StockProduct, idx: number) => {
                        const isSelected = selectedProductIds.includes(p.id) || selectedProductId === p.id;
                        const isZero = p.quantidade <= 0;
                        const isLow = !isZero && p.quantidade <= p.estoqueMinimo;

                        return (
                          <tr
                            id={`row-${p.id}`}
                            key={p.id}
                            onClick={(e) => toggleSelectRow(p.id, e)}
                            className={`transition-colors cursor-pointer select-none ${
                              isSelected
                                ? 'bg-[#a5d6a7] text-black font-semibold ring-1 ring-emerald-600 ring-dashed'
                                : idx % 2 === 1
                                ? 'bg-[#f8f9fa] hover:bg-[#e8f5e9]'
                                : 'bg-white hover:bg-[#e8f5e9]'
                            }`}
                          >
                            {/* Checkbox */}
                            <td
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProductIds((prev) =>
                                  prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                                );
                              }}
                              className="py-2 px-2 text-center border-r border-[#eee]"
                            >
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(p.id)}
                                onChange={() => {}}
                                className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                              />
                            </td>

                            {/* Nº */}
                            <td className="py-2.5 px-3 text-center border-r border-[#eee] font-mono text-slate-700">
                              {p.numero}
                            </td>

                            {/* Produto (Click to edit) */}
                            <td
                              onDoubleClick={() => handleOpenCellDialog(p, 'nome')}
                              className="py-2.5 px-4 border-r border-[#eee] uppercase font-medium text-slate-900"
                              title="Duplo clique para editar o nome"
                            >
                              <div className="flex items-center justify-between">
                                <span>{p.nome}</span>
                                {isZero && (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                    ZERADO
                                  </span>
                                )}
                                {isLow && (
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    BAIXO ({p.quantidade})
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Entrada (Click to add stock) */}
                            <td
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCellDialog(p, 'entrada');
                              }}
                              className="py-2.5 px-4 text-center border-r border-[#eee] font-mono text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors font-bold"
                              title="Clique para lançar Entrada"
                            >
                              <span className="hover:underline">0</span>
                            </td>

                            {/* Saída (Click to dispatch stock) */}
                            <td
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCellDialog(p, 'saida');
                              }}
                              className="py-2.5 px-4 text-center border-r border-[#eee] font-mono text-slate-700 hover:bg-rose-100 hover:text-rose-900 transition-colors font-bold"
                              title="Clique para lançar Saída"
                            >
                              <span className="hover:underline">0</span>
                            </td>

                            {/* Quantidade (Current balance) */}
                            <td
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleOpenCellDialog(p, 'quantidade');
                              }}
                              className={`py-2.5 px-4 text-center font-mono font-bold tabular-nums text-base ${
                                isZero ? 'text-rose-700 font-extrabold' : isLow ? 'text-amber-700' : 'text-slate-900'
                              }`}
                              title="Duplo clique para ajustar quantidade total"
                            >
                              {p.quantidade}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Instructions hint & Keyboard Navigation */}
              <div className="pt-2 px-1 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1">
                <span>
                  💡 Clique em <strong>Entrada</strong> ou <strong>Saída</strong> para movimentar. Duplo clique para editar.
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  Atalhos: [ ↑ / ↓ ] navegar linhas · [ Enter ] movimentar · [ / ] buscar
                </span>
              </div>
            </div>
          ) : (
            /* HISTORICO TABLE ENHANCED */
            <div className="bg-white border border-[#ccc] rounded-2xl p-3 shadow-xs flex-1 flex flex-col overflow-hidden space-y-3">
              {/* Filter bar for history */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={historicoSearch}
                    onChange={(e) => setHistoricoSearch(e.target.value)}
                    placeholder="Filtrar histórico por produto, operador ou data..."
                    className="w-full text-xs bg-transparent focus:outline-none"
                  />
                  {historicoSearch && (
                    <button onClick={() => setHistoricoSearch('')} className="text-slate-400 hover:text-slate-600">
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[11px] text-slate-500 font-semibold mr-1">Tipo:</span>
                  <button
                    onClick={() => setHistoricoTipoFilter('todos')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      historicoTipoFilter === 'todos' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'
                    }`}
                  >
                    Todos ({movements.length})
                  </button>
                  <button
                    onClick={() => setHistoricoTipoFilter('Entrada')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      historicoTipoFilter === 'Entrada' ? 'bg-green-700 text-white' : 'bg-white border text-green-700'
                    }`}
                  >
                    Entradas
                  </button>
                  <button
                    onClick={() => setHistoricoTipoFilter('Saída')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      historicoTipoFilter === 'Saída' ? 'bg-red-700 text-white' : 'bg-white border text-red-700'
                    }`}
                  >
                    Saídas
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto flex-1 max-h-[520px] overflow-y-auto rounded-xl border border-[#ddd]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#8bc34a] text-[#1b5e20] font-bold text-sm select-none border-b-2 border-[#33691e]">
                      <th className="py-2.5 px-3 text-center w-14 border-r border-[#33691e]">
                        Nº
                      </th>
                      <th className="py-2.5 px-4 border-r border-[#33691e]">
                        Produto
                      </th>
                      <th className="py-2.5 px-4 text-center w-28 border-r border-[#33691e]">
                        Tipo
                      </th>
                      <th className="py-2.5 px-4 text-center w-28 border-r border-[#33691e]">
                        Quantidade
                      </th>
                      <th className="py-2.5 px-4 text-center w-44">
                        Data/Hora
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-[#eee]">
                    {filteredMovements.map((m: StockMovement, idx: number) => {
                      const isEntrada = m.tipo === 'Entrada';
                      return (
                        <tr
                          key={m.id || idx}
                          className={idx % 2 === 1 ? 'bg-[#f8f9fa]' : 'bg-white'}
                        >
                          <td
                            className={`py-2 px-3 text-center border-r border-[#eee] font-mono font-bold ${
                              isEntrada ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {m.numero}
                          </td>
                          <td
                            className={`py-2 px-4 border-r border-[#eee] uppercase font-bold ${
                              isEntrada ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {m.produto}
                          </td>
                          <td
                            className={`py-2 px-4 text-center border-r border-[#eee] font-bold ${
                              isEntrada ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {m.tipo}
                          </td>
                          <td
                            className={`py-2 px-4 text-center border-r border-[#eee] font-mono font-bold ${
                              isEntrada ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {m.quantidade}
                          </td>
                          <td
                            className={`py-2 px-4 text-center font-mono ${
                              isEntrada ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {m.dataHora}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Action Buttons (Pill buttons from original screen) */}
          <div className="flex items-center justify-center flex-wrap gap-4 pt-2">
            {/* ➕ Adicionar Produto (Green gradient pill) */}
            <button
              onClick={handleOpenAddProductDialog}
              className="px-6 py-2.5 min-w-[180px] bg-gradient-to-r from-[#00c9ff] to-[#92fe9d] hover:from-[#00b2e2] hover:to-[#7de87c] text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Produto</span>
            </button>

            {/* 🗑️ Remover Selecionados (Red gradient pill) */}
            <button
              onClick={handleRemoveSelected}
              className="px-6 py-2.5 min-w-[180px] bg-gradient-to-r from-[#ef5350] to-[#e53935] hover:from-[#e53935] hover:to-[#d32f2f] text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remover Selecionados</span>
            </button>

            {/* 📄 Exportar Relatório (Orange/Yellow gradient pill) */}
            <button
              onClick={() => setIsReportOpen(true)}
              className="px-6 py-2.5 min-w-[180px] bg-gradient-to-r from-[#ffb74d] to-[#ffa726] hover:from-[#ffa726] hover:to-[#fb8c00] text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <FileText className="w-4 h-4" />
              <span>Exportar Relatório</span>
            </button>
          </div>

          {/* 5. Status Bar at the Bottom */}
          <div className="bg-white text-[#444] text-xs px-4 py-2 rounded-xl border border-[#ddd] shadow-2xs flex items-center justify-between">
            <div>
              Total de produtos: <strong>{products.length}</strong> | Mostrando: <strong>{filteredProducts.length}</strong> | Última atualização: {lastUpdatedTime}
            </div>
            <div className="text-[11px] text-slate-400">
              WL System · DM Santos Empreendimentos
            </div>
          </div>
        </div>
      )}

      {/* Interactive Input Dialog with Presets and Balance Preview */}
      {editDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-[#f0f4f7] px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">{editDialog.title}</h3>
              <button
                onClick={() => setEditDialog({ ...editDialog, isOpen: false })}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDialog} className="p-5 space-y-4">
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                {editDialog.label}
              </p>

              {/* Main Input */}
              <input
                type={editDialog.field === 'nome' || editDialog.field === 'novo' ? 'text' : 'number'}
                value={dialogInputVal}
                onChange={(e) => {
                  setDialogInputVal(e.target.value);
                  setDialogError(null);
                }}
                className="w-full px-3 py-2 text-base font-semibold border border-[#bbb] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                autoFocus
                required
              />

              {/* Quick Presets for Entrada and Saída */}
              {(editDialog.field === 'entrada' || editDialog.field === 'saida') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-medium">Atalhos:</span>
                    {[5, 10, 20, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddPreset(preset)}
                        className="px-2 py-0.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer"
                      >
                        +{preset}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDialogInputVal('')}
                      className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-auto"
                    >
                      Limpar
                    </button>
                  </div>

                  {/* Projected Balance Preview */}
                  {projectedBalance !== null && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between font-mono">
                      <span className="text-slate-500">Saldo Atual: {editDialog.product?.quantidade}</span>
                      <span
                        className={`font-bold ${
                          projectedBalance < 0
                            ? 'text-rose-600'
                            : projectedBalance <= (editDialog.product?.estoqueMinimo || 15)
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        Saldo Projetado: {Math.max(0, projectedBalance)}
                      </span>
                    </div>
                  )}

                  {/* Optional Note */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Observação / Carga (Opcional)
                    </label>
                    <input
                      type="text"
                      value={dialogObservacao}
                      onChange={(e) => setDialogObservacao(e.target.value)}
                      placeholder="Ex: Fornecedor X, Carga caminhão 01..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-slate-50"
                    />
                  </div>
                </div>
              )}

              {dialogError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{dialogError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditDialog({ ...editDialog, isOpen: false })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  OK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Relatório de Estoque (Galpão)</h3>
                  <p className="text-xs text-slate-500">Padrão DM Santos Empreendimentos</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={reportFilter}
                  onChange={(e: any) => setReportFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                >
                  <option value="todos">Todos os Produtos ({products.length})</option>
                  <option value="zerados">Apenas Zerados</option>
                  <option value="baixo">Apenas Estoque Baixo</option>
                  <option value="disponivel">Apenas com Estoque Normal</option>
                </select>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir PDF</span>
                </button>
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              {/* Report Header */}
              <div className="bg-[#2e7d32] text-white p-4 rounded-t-lg flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="WL System"
                    className="h-10 w-10 object-contain"
                  />
                  <div>
                    <h2 className="text-xl font-bold">Relatório de Estoque</h2>
                    <p className="text-xs text-emerald-100">DM Santos Empreendimentos</p>
                  </div>
                </div>
                <div className="text-xs text-emerald-100 font-mono">
                  Gerado em: {lastUpdatedTime}
                </div>
              </div>

              {/* Table */}
              <div className="bg-[#81c784] text-slate-900 font-bold text-xs uppercase grid grid-cols-12 py-2 px-3 rounded-md mb-2">
                <div className="col-span-1 text-center font-mono">Nº</div>
                <div className="col-span-8">Produto</div>
                <div className="col-span-3 text-right">Quantidade</div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {products
                  .filter((p) => {
                    if (reportFilter === 'zerados') return p.quantidade <= 0;
                    if (reportFilter === 'baixo') return p.quantidade > 0 && p.quantidade <= p.estoqueMinimo;
                    if (reportFilter === 'disponivel') return p.quantidade > p.estoqueMinimo;
                    return true;
                  })
                  .map((p: StockProduct, idx: number) => (
                    <div
                      key={p.id}
                      className={`grid grid-cols-12 py-2 px-3 ${
                        idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'
                      }`}
                    >
                      <div className="col-span-1 text-center font-mono font-bold text-slate-600">
                        {p.numero}
                      </div>
                      <div className="col-span-8 font-semibold text-slate-900 uppercase">
                        {p.nome}
                      </div>
                      <div className="col-span-3 text-right font-mono font-bold text-slate-900">
                        {p.quantidade} {p.unidade}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-6 pt-4 border-t-2 border-slate-300 flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Total de produtos listados: {products.length}</span>
                <span>
                  Total em estoque:{' '}
                  {products.reduce((acc: number, p: StockProduct) => acc + p.quantidade, 0).toLocaleString('pt-BR')} unidades
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup and Restore Modal */}
      {isBackupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-300 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <DatabaseBackup className="w-5 h-5 text-emerald-700" />
                Backup & Restauração
              </h3>
              <button onClick={() => setIsBackupOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Exporte seus dados em JSON ou restaure a base de 57 produtos padrão.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  const jsonStr = exportBackupJson();
                  const blob = new Blob([jsonStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `estoque_backup_${Date.now()}.json`;
                  a.click();
                  showToast('Backup JSON exportado com sucesso!', 'success');
                }}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Backup JSON</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result as string;
                    if (text) {
                      const res = importBackupJson(text);
                      if (res.success) {
                        showToast(res.message, 'success');
                        setIsBackupOpen(false);
                      } else {
                        alert(res.message);
                      }
                    }
                  };
                  reader.readAsText(file);
                }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Importar Arquivo JSON</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Restaurar a base inicial com os 57 produtos padrão do galpão?')) {
                    resetDataToInitial();
                    showToast('Base restaurada com sucesso!', 'success');
                    setIsBackupOpen(false);
                  }
                }}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Restaurar Base Padrão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
