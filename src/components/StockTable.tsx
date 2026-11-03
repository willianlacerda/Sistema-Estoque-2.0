import React, { useState, useMemo } from 'react';
import { StockProduct, MovementType } from '../types';
import { useStock } from '../context/StockContext';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Filter,
  X,
  Archive,
  RotateCcw,
  Info,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface StockTableProps {
  onOpenMovement: (product: StockProduct, type: MovementType) => void;
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: StockProduct) => void;
  onOpenReport?: () => void;
  activeStatusFilter: 'todos' | 'zerados' | 'baixo' | 'normal' | 'inativos';
  setActiveStatusFilter: (status: 'todos' | 'zerados' | 'baixo' | 'normal' | 'inativos') => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  onOpenMovement,
  onOpenAddProduct,
  onOpenEditProduct,
  activeStatusFilter,
  setActiveStatusFilter,
}) => {
  const {
    products,
    currentUser,
    removeProduct,
    inactivateProduct,
    activateProduct,
    categories: contextCategories,
  } = useStock();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [productToDelete, setProductToDelete] = useState<StockProduct | null>(null);
  const [productToInactivate, setProductToInactivate] = useState<StockProduct | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const canManageProducts = Boolean(
    currentUser &&
      (currentUser.nivel === 2 ||
        Number(currentUser.nivel) === 2 ||
        currentUser.username.toLowerCase() === 'willian')
  );
  const canDeleteProducts = canManageProducts;

  const activeProducts = useMemo(() => products.filter((p) => !p.inativo), [products]);
  const inactiveProducts = useMemo(() => products.filter((p) => p.inativo), [products]);

  const categories = useMemo(() => {
    const set = new Set<string>(contextCategories);
    products.forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return ['Todas', ...Array.from(set)];
  }, [products, contextCategories]);

  // Clean filter logic: inativos only appear in 'inativos', never in 'todos'
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // If user selected 'inativos' filter, show ONLY inactive products
      if (activeStatusFilter === 'inativos') {
        if (!p.inativo) return false;
      } else {
        // Any standard filter ('todos', 'baixo', 'zerados', 'normal') shows ONLY active products
        if (p.inativo) return false;

        // Status filter
        if (activeStatusFilter === 'zerados' && p.quantidade > 0) return false;
        if (activeStatusFilter === 'baixo' && (p.quantidade <= 0 || p.quantidade > p.estoqueMinimo))
          return false;
        if (activeStatusFilter === 'normal' && p.quantidade <= p.estoqueMinimo) return false;
      }

      // Category filter
      if (selectedCategory !== 'Todas' && p.categoria !== selectedCategory) {
        return false;
      }

      // Text / Number Search
      if (searchTerm.trim()) {
        const query = searchTerm
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        const prodName = p.nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        const matchNum = String(p.numero) === query;
        const matchName = prodName.includes(query);

        return matchNum || matchName;
      }

      return true;
    });
  }, [products, selectedCategory, activeStatusFilter, searchTerm]);

  const handleDelete = (product: StockProduct) => {
    setProductToDelete(product);
  };


  return (
    <div className="bg-[#0f172a] rounded-3xl border border-slate-800 shadow-md overflow-hidden">
      {/* Search and Action Toolbar */}
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-[#0c1322] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por código (ex: 12) ou nome (ex: Arroz, Detergente)..."
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-white placeholder:text-slate-500 shadow-inner font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {canManageProducts && (
              <button
                onClick={onOpenAddProduct}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Produto</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Section - 100% Mobile Responsive with No Cut-off */}
        <div className="w-full min-w-0 pt-1 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Categorias:</span>
              <span className="text-[11px] font-medium text-slate-500 lowercase">
                {selectedCategory === 'Todas' ? '(todas selecionadas)' : `(${selectedCategory})`}
              </span>
            </div>

            {activeStatusFilter !== 'todos' && (
              <button
                onClick={() => setActiveStatusFilter('todos')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Filtro ativo: {activeStatusFilter === 'baixo' ? 'Estoque Baixo' : activeStatusFilter === 'zerados' ? 'Em Falta' : 'Inativos'} (Limpar ×)</span>
              </button>
            )}
          </div>

          {/* Chips container with horizontal touch swipe, custom scrollbar, and shrink-0 so words are NEVER cut off */}
          <div className="w-full min-w-0">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 custom-scrollbar touch-pan-x -mx-1 px-1">
              {categories.map((cat) => {
                const count =
                  cat === 'Todas'
                    ? activeStatusFilter === 'inativos'
                      ? inactiveProducts.length
                      : activeProducts.length
                    : products.filter(
                        (p) =>
                          (activeStatusFilter === 'inativos' ? p.inativo : !p.inativo) &&
                          p.categoria === cat
                      ).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>{cat}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          selectedCategory === cat
                            ? 'bg-emerald-800/90 text-emerald-100'
                            : 'bg-slate-900/90 text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
              {/* Spacer so the rightmost chip doesn't clip on full scroll */}
              <div className="w-3 shrink-0 h-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-emerald-950/90 border border-emerald-800 rounded-2xl text-xs font-semibold text-emerald-300 flex items-center justify-between shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Banner Informativo quando filtrando por Inativos */}
      {activeStatusFilter === 'inativos' && (
        <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-slate-900/90 border border-amber-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">Visualizando Produtos Inativos ({inactiveProducts.length})</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Estes produtos foram retirados da listagem padrão ("Todos"). Para reativar um produto, <strong>basta registrar uma Entrada (+) de estoque</strong> nele ou clicar no botão de reativação.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveStatusFilter('todos')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Voltar para Catálogo Ativo
          </button>
        </div>
      )}

      {/* Mobile Card View (Visível apenas em smartphones md:hidden) */}
      <div className="md:hidden p-3 space-y-3 bg-[#0b0f19]/60">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-[#0f172a] rounded-2xl border border-slate-800 p-6">
            <Archive className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">
              {activeStatusFilter === 'inativos'
                ? 'Nenhum produto inativo no momento'
                : 'Nenhum produto encontrado'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeStatusFilter === 'inativos'
                ? 'Você pode inativar produtos no botão "Inativar" de cada item.'
                : 'Tente alterar os termos de busca ou categoria.'}
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isInactive = Boolean(p.inativo);
            const isZero = p.quantidade <= 0;
            const isLow = !isZero && p.quantidade <= p.estoqueMinimo;

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isInactive
                    ? 'bg-[#0d121f] border-slate-800/80 opacity-90'
                    : 'bg-[#0f172a] border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                {/* Top Row: Code, Name, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-[#0b0f19] text-emerald-400 border border-slate-800 shrink-0">
                      Nº {p.numero}
                    </span>
                    <h3
                      className={`font-bold text-sm text-white uppercase leading-snug truncate ${
                        isInactive ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {p.nome}
                    </h3>
                  </div>

                  {/* Status Pill */}
                  <div className="shrink-0">
                    {isInactive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                        Inativo
                      </span>
                    ) : isZero ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                        Zerado
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                        Baixo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        Normal
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Details & Big Quantity */}
                <div className="flex items-center justify-between gap-3 pt-2 pb-1 border-y border-slate-800/60 my-2.5">
                  <div className="space-y-0.5 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-emerald-400">{p.categoria}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-300">{p.unidade}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Mínimo de segurança: <span className="text-slate-300 font-mono font-bold">{p.estoqueMinimo} {p.unidade}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Saldo em Estoque</span>
                    <div className="flex items-baseline justify-end gap-1">
                      <span
                        className={`text-2xl font-black font-mono tabular-nums leading-none ${
                          isInactive
                            ? 'text-slate-400'
                            : isZero
                            ? 'text-rose-400'
                            : isLow
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {p.quantidade.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        {p.unidade}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Quick In / Out Buttons & Actions */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Entrada (+) Quick Button */}
                    <button
                      onClick={() => onOpenMovement(p, 'Entrada')}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-98 ${
                        isInactive
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold ring-1 ring-emerald-400/50'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4 shrink-0" />
                      <span>{isInactive ? 'Ativar (+Estoque)' : 'Entrada (+)'}</span>
                    </button>

                    {/* Saída (-) Quick Button */}
                    <button
                      onClick={() => onOpenMovement(p, 'Saída')}
                      disabled={isZero || isInactive}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isZero || isInactive
                          ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                          : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white cursor-pointer shadow-sm active:scale-98 shadow-rose-950/40'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4 shrink-0" />
                      <span>Saída (-)</span>
                    </button>
                  </div>

                  {/* Secondary Actions on Mobile */}
                  {canManageProducts && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {!isInactive ? (
                        <button
                          onClick={() => setProductToInactivate(p)}
                          className="px-3 py-1.5 bg-slate-800/80 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 rounded-lg text-xs font-semibold border border-slate-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5 text-amber-400" />
                          <span>Inativar</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => activateProduct(p.id)}
                          className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-800/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Reativar no Catálogo</span>
                        </button>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenEditProduct(p)}
                          title="Editar Cadastro"
                          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDeleteProducts && (
                          <button
                            onClick={() => handleDelete(p)}
                            title="Excluir Produto"
                            className="p-2 bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 rounded-lg border border-rose-900/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Main Desktop Table (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-[#162036] text-slate-200 text-xs font-extrabold uppercase tracking-wider">
              <th className="py-3 px-3 text-center w-12 font-mono">Nº</th>
              <th className="py-3 px-4">Produto</th>
              <th className="py-3 px-3 text-center w-28">Entrada (+)</th>
              <th className="py-3 px-3 text-center w-28">Saída (-)</th>
              <th className="py-3 px-4 text-right w-36 font-mono">Qtd Atual</th>
              <th className="py-3 px-4 text-center w-32">Status</th>
              <th className="py-3 px-4 text-center w-36">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <Archive className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-300">
                    {activeStatusFilter === 'inativos'
                      ? 'Nenhum produto inativo no momento'
                      : 'Nenhum produto encontrado'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeStatusFilter === 'inativos'
                      ? 'Você pode inativar produtos clicando no ícone de arquivamento na coluna Ações.'
                      : 'Tente ajustar o termo de pesquisa ou os filtros selecionados.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p, idx) => {
                const isInactive = Boolean(p.inativo);
                const isZero = p.quantidade <= 0;
                const isLow = !isZero && p.quantidade <= p.estoqueMinimo;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-[#1a2744] transition-colors ${
                      isInactive
                        ? 'bg-[#0d121f]/90 opacity-85 hover:opacity-100'
                        : idx % 2 === 1
                        ? 'bg-[#0c1322]'
                        : 'bg-[#0f172a]'
                    }`}
                  >
                    {/* Nº */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400 text-xs">
                      {p.numero}
                    </td>

                    {/* Produto */}
                    <td className="py-3.5 px-4 font-bold text-white uppercase">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={isInactive ? 'text-slate-300 line-through decoration-slate-600' : ''}>
                            {p.nome}
                          </span>
                          {isInactive && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-400 border border-amber-900/50">
                              Inativo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-normal text-slate-400 mt-0.5">
                          <span className="font-semibold text-emerald-400">{p.categoria}</span>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono text-slate-300">Embalagem: {p.unidade}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-500">Mín: {p.estoqueMinimo}</span>
                        </div>
                      </div>
                    </td>

                    {/* Entrada (+) Quick Button */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onOpenMovement(p, 'Entrada')}
                        title={
                          isInactive
                            ? 'Adicionar estoque reativa este produto automaticamente'
                            : 'Registrar Entrada de Mercadoria'
                        }
                        className={`inline-flex items-center justify-center gap-1 w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-98 ${
                          isInactive
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-sm'
                            : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>{isInactive ? '+ Ativar' : 'Entrada'}</span>
                      </button>
                    </td>

                    {/* Saída (-) Quick Button */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onOpenMovement(p, 'Saída')}
                        disabled={isZero || isInactive}
                        title={
                          isInactive
                            ? 'Produto inativo (adicione estoque para reativá-lo)'
                            : isZero
                            ? 'Sem estoque para saída'
                            : 'Registrar Saída de Mercadoria'
                        }
                        className={`inline-flex items-center justify-center gap-1 w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                          isZero || isInactive
                            ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40'
                            : 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 cursor-pointer shadow-xs hover:scale-102 active:scale-98'
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Saída</span>
                      </button>
                    </td>

                    {/* Quantidade Atual */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span
                          className={`text-lg font-black font-mono tabular-nums ${
                            isInactive
                              ? 'text-slate-400'
                              : isZero
                              ? 'text-rose-400'
                              : isLow
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {p.quantidade.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">
                          {p.unidade}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {isInactive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-amber-300 border border-slate-700 shadow-xs">
                          <Archive className="w-3.5 h-3.5 text-amber-400" />
                          <span>Inativo</span>
                        </span>
                      ) : isZero ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Zerado</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Baixo ({p.quantidade})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Disponível</span>
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                        {/* Se o produto for ATIVO: botão Inativar com nome/texto visível */}
                        {!isInactive && canManageProducts && (
                          <button
                            onClick={() => setProductToInactivate(p)}
                            title="Inativar Produto (Remove de Todos e move para Inativos)"
                            className="inline-flex items-center justify-center px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer bg-slate-800 hover:bg-amber-950/70 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-800/60 shadow-xs hover:scale-102 active:scale-98 shrink-0"
                          >
                            <span>Inativar</span>
                          </button>
                        )}

                        {/* Se o produto for INATIVO: botão Reativar com texto claro */}
                        {isInactive && canManageProducts && (
                          <button
                            onClick={() => {
                              const res = activateProduct(p.id);
                              showToast(res.message);
                            }}
                            title="Reativar Produto no Catálogo"
                            className="inline-flex items-center justify-center px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer bg-teal-950/70 hover:bg-teal-900 text-teal-300 border border-teal-800/60 shadow-xs hover:scale-102 active:scale-98 shrink-0"
                          >
                            <span>Reativar</span>
                          </button>
                        )}

                        {/* Editar Produto */}
                        {canManageProducts && (
                          <button
                            onClick={() => onOpenEditProduct(p)}
                            title="Editar Dados do Produto"
                            className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Excluir Produto Definitivo */}
                        {canDeleteProducts && (
                          <button
                            onClick={() => handleDelete(p)}
                            title="Remover Produto Definitivamente"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {!canManageProducts && (
                          <span className="text-xs text-slate-600 font-mono">--</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 bg-[#0c1322] border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 font-medium">
        <div>
          Mostrando <span className="font-bold text-white">{filteredProducts.length}</span> produtos{' '}
          {activeStatusFilter === 'inativos' ? (
            <span className="text-amber-400 font-bold">(Inativos)</span>
          ) : (
            <span>(de {activeProducts.length} ativos)</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-xs shadow-emerald-400/50" /> Disponível
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-xs shadow-amber-400/50" /> Abaixo do Mínimo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shadow-xs shadow-rose-400/50" /> Em Falta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block shadow-xs shadow-slate-500/50" /> Inativo
          </span>
        </div>
      </div>

      {/* Modal de Confirmação In-App para Inativação de Produto */}
      <ConfirmModal
        isOpen={Boolean(productToInactivate)}
        title="Inativar Produto"
        message={`Deseja inativar o produto Nº ${productToInactivate?.numero} - "${productToInactivate?.nome}"? Ele sairá da visualização padrão ("Todos") e passará a constar na aba "Inativos". Para reativá-lo depois, basta adicionar estoque nele.`}
        confirmLabel="Sim, Inativar Produto"
        cancelLabel="Cancelar"
        isDestructive={false}
        onConfirm={() => {
          if (productToInactivate) {
            const res = inactivateProduct(productToInactivate.id);
            setProductToInactivate(null);
            showToast(res.message);
          }
        }}
        onCancel={() => setProductToInactivate(null)}
      />

      {/* Modal de Confirmação In-App para Exclusão de Produto */}
      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        title="Excluir Produto"
        message={`Deseja realmente remover o produto Nº ${productToDelete?.numero} - "${productToDelete?.nome}"? O item será retirado do catálogo e as movimentações permanecerão no histórico.`}
        confirmLabel="Sim, Excluir Produto"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          if (productToDelete) {
            removeProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
