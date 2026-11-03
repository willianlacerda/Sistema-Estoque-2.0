import React, { useState, useMemo } from 'react';
import { useStock } from '../context/StockContext';
import { StockMovement } from '../types';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  Calendar,
  X,
  History,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Package,
} from 'lucide-react';

export const MovementHistoryTable: React.FC = () => {
  const { movements, products, currentUser, removeMovement } = useStock();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Entrada' | 'Saída'>('Todos');
  const [movementToDelete, setMovementToDelete] = useState<StockMovement | null>(null);
  const [revertStock, setRevertStock] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Check if current user has administrator privileges
  const canDeleteMovement = Boolean(
    currentUser &&
      (currentUser.nivel === 2 ||
        Number(currentUser.nivel) === 2 ||
        currentUser.username.toLowerCase() === 'willian' ||
        currentUser.username.toLowerCase() === 'admin')
  );

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // Type filter
      if (typeFilter !== 'Todos' && m.tipo !== typeFilter) {
        return false;
      }

      // Search term (accents agnostic)
      if (searchTerm.trim()) {
        const query = searchTerm
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        const prodName = m.produto
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        const userName = (m.usuario || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        const matchNum = String(m.numero) === query;
        const matchName = prodName.includes(query);
        const matchUser = userName.includes(query);
        const matchDate = m.dataHora.includes(query);

        return matchNum || matchName || matchUser || matchDate;
      }

      return true;
    });
  }, [movements, typeFilter, searchTerm]);

  // Target product for the movement being deleted
  const targetProduct = useMemo(() => {
    if (!movementToDelete) return null;
    return (
      products.find(
        (p) =>
          p.numero === movementToDelete.numero ||
          p.nome.trim().toUpperCase() === movementToDelete.produto.trim().toUpperCase()
      ) || null
    );
  }, [movementToDelete, products]);

  // Stock simulation preview
  const stockPreview = useMemo(() => {
    if (!movementToDelete || !targetProduct) return null;
    const current = targetProduct.quantidade;
    const movQty = movementToDelete.quantidade;
    const isEntrada = movementToDelete.tipo === 'Entrada';

    if (isEntrada) {
      const next = Math.max(0, current - movQty);
      const willZeroOrNegative = current < movQty;
      return {
        current,
        next,
        diff: -movQty,
        willZeroOrNegative,
        unit: targetProduct.unidade || 'un',
      };
    } else {
      const next = current + movQty;
      return {
        current,
        next,
        diff: +movQty,
        willZeroOrNegative: false,
        unit: targetProduct.unidade || 'un',
      };
    }
  }, [movementToDelete, targetProduct]);

  const handleConfirmDelete = () => {
    if (!movementToDelete) return;
    const result = removeMovement(movementToDelete.id, revertStock);
    showToast(result.message, result.success ? 'success' : 'error');
    setMovementToDelete(null);
  };

  const handleExportCsv = () => {
    const headers = ['Data/Hora', 'Nº', 'Produto', 'Tipo', 'Quantidade', 'Usuário', 'Observação'];
    const rows = filteredMovements.map((m) => [
      `"${m.dataHora}"`,
      m.numero,
      `"${m.produto.replace(/"/g, '""')}"`,
      m.tipo,
      m.quantidade,
      `"${(m.usuario || '').replace(/"/g, '""')}"`,
      `"${(m.observacao || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_movimentacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0f172a] rounded-3xl border border-slate-800 shadow-md overflow-hidden">
      {/* Header and Toolbar */}
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-[#0c1322] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                Histórico Geral de Movimentações
              </h2>
              {canDeleteMovement && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Admin: Exclusão Ativa</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Auditoria completa de todas as cargas recebidas e expedidas no galpão
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700/60 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Exportar Histórico CSV</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por produto, operador, data ou código..."
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white placeholder:text-slate-500 font-medium"
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

          {/* Type Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#0b0f19] border border-slate-800 rounded-xl text-xs font-semibold self-start md:self-auto">
            <button
              onClick={() => setTypeFilter('Todos')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === 'Todos'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({movements.length})
            </button>
            <button
              onClick={() => setTypeFilter('Entrada')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                typeFilter === 'Entrada'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Entradas</span>
            </button>
            <button
              onClick={() => setTypeFilter('Saída')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                typeFilter === 'Saída'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Saídas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div
          className={`mx-4 sm:mx-6 mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg border animate-in fade-in duration-150 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-300'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mobile Movement Cards (md:hidden) */}
      <div className="md:hidden p-3 space-y-2.5 bg-[#0b0f19]/60 max-h-[600px] overflow-y-auto">
        {filteredMovements.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-[#0f172a] rounded-2xl border border-slate-800 p-6">
            <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">Nenhum registro encontrado</p>
          </div>
        ) : (
          filteredMovements.map((m, idx) => {
            const isEntrada = m.tipo === 'Entrada';

            return (
              <div
                key={m.id || idx}
                className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 shadow-sm space-y-2"
              >
                {/* Top: Date, Operator and Delete button for Admins */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">{m.dataHora}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 font-medium">
                      {m.usuario || 'Sistema'}
                    </span>
                    {canDeleteMovement && (
                      <button
                        onClick={() => {
                          setMovementToDelete(m);
                          setRevertStock(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
                        title="Excluir movimentação (Administrador)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Middle: Code and Product Name */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded bg-[#0b0f19] text-emerald-400 border border-slate-800 shrink-0">
                    Nº {m.numero}
                  </span>
                  <span className="font-bold text-sm text-white uppercase truncate flex-1">
                    {m.produto}
                  </span>
                </div>

                {m.observacao && (
                  <p className="text-[11px] text-slate-400 italic">
                    Obs: {m.observacao}
                  </p>
                )}

                {/* Bottom: Type badge and quantity */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isEntrada
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                    }`}
                  >
                    {isEntrada ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                    <span>{m.tipo}</span>
                  </span>

                  <span
                    className={`text-lg font-black font-mono tabular-nums ${
                      isEntrada ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isEntrada ? `+${m.quantidade}` : `-${m.quantidade}`} un
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Movements Table (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#162036] z-10 border-b border-slate-800 text-slate-200 text-xs font-extrabold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3 text-center w-12 font-mono">Nº</th>
              <th className="py-3 px-4">Produto</th>
              <th className="py-3 px-3 text-center w-28">Tipo</th>
              <th className="py-3 px-4 text-right w-32 font-mono">Quantidade</th>
              <th className="py-3 px-4 w-44 font-mono">Data / Hora</th>
              <th className="py-3 px-4 w-32">Operador</th>
              {canDeleteMovement && (
                <th className="py-3 px-3 text-center w-20">Ações</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={canDeleteMovement ? 7 : 6} className="py-12 text-center text-slate-500">
                  Nenhum registro de movimentação encontrado.
                </td>
              </tr>
            ) : (
              filteredMovements.map((m, idx) => {
                const isEntrada = m.tipo === 'Entrada';

                return (
                  <tr
                    key={m.id || idx}
                    className={`hover:bg-[#1a2744] transition-colors ${
                      idx % 2 === 1 ? 'bg-[#0c1322]' : 'bg-[#0f172a]'
                    }`}
                  >
                    {/* Nº */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 text-xs">
                      {m.numero}
                    </td>

                    {/* Produto */}
                    <td className="py-3 px-4 font-bold text-white uppercase">
                      <div className="flex flex-col">
                        <span className={isEntrada ? 'text-emerald-300' : 'text-white'}>
                          {m.produto}
                        </span>
                        {m.observacao && (
                          <span className="text-[11px] font-normal text-slate-400 italic">
                            Obs: {m.observacao}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tipo Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isEntrada
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        }`}
                      >
                        {isEntrada ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                        <span>{m.tipo}</span>
                      </span>
                    </td>

                    {/* Quantidade */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-base font-black font-mono tabular-nums ${
                          isEntrada ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isEntrada ? `+${m.quantidade}` : `-${m.quantidade}`}
                      </span>
                    </td>

                    {/* Data / Hora */}
                    <td className="py-3 px-4 text-xs font-mono text-slate-300 tabular-nums">
                      {m.dataHora}
                    </td>

                    {/* Operador */}
                    <td className="py-3 px-4 text-xs font-semibold text-slate-300">
                      {m.usuario || 'Operador'}
                    </td>

                    {/* Ações (Apenas Administrador) */}
                    {canDeleteMovement && (
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            setMovementToDelete(m);
                            setRevertStock(true);
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer group"
                          title="Excluir movimentação do histórico (Administrador)"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-400 group-hover:scale-110 transition-all" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 bg-[#0c1322] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Mostrando <span className="font-bold text-white">{filteredMovements.length}</span>{' '}
          movimentações de <span className="font-bold text-white">{movements.length}</span>
        </div>
        <div className="text-right text-[11px] text-emerald-400">
          Registros arquivados e sincronizados em tempo real
        </div>
      </div>

      {/* Confirmation Modal for Movement Deletion (Restricted to Administrators) */}
      {movementToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="p-5 sm:p-6 space-y-4">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Excluir Movimentação do Histórico
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                        Admin
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Esta ação remove permanentemente este registro da auditoria do galpão
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setMovementToDelete(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Movement Details Card */}
              <div className="p-3.5 bg-[#0b0f19] rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">{movementToDelete.dataHora}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    Operador: {movementToDelete.usuario || 'Sistema'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 shrink-0">
                    Nº {movementToDelete.numero}
                  </span>
                  <span className="font-bold text-sm text-white uppercase truncate flex-1">
                    {movementToDelete.produto}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      movementToDelete.tipo === 'Entrada'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                    }`}
                  >
                    {movementToDelete.tipo === 'Entrada' ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                    <span>{movementToDelete.tipo}</span>
                  </span>

                  <span
                    className={`text-base font-black font-mono tabular-nums ${
                      movementToDelete.tipo === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {movementToDelete.tipo === 'Entrada' ? '+' : '-'}
                    {movementToDelete.quantidade} {targetProduct?.unidade || 'un'}
                  </span>
                </div>

                {movementToDelete.observacao && (
                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                    Obs: {movementToDelete.observacao}
                  </p>
                )}
              </div>

              {/* Stock Reversal Option (Interactive Checkbox) */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={revertStock}
                    onChange={(e) => setRevertStock(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-white block">
                      Estornar / Reverter quantidade no saldo atual do produto (Recomendado)
                    </span>
                    <span className="text-slate-400 mt-0.5 block leading-relaxed">
                      {movementToDelete.tipo === 'Entrada'
                        ? `Subtrai ${movementToDelete.quantidade} ${targetProduct?.unidade || 'un'} do estoque atual, desfazendo a entrada registrada.`
                        : `Devolve ${movementToDelete.quantidade} ${targetProduct?.unidade || 'un'} de volta ao estoque atual, desfazendo a saída.`}
                    </span>
                  </div>
                </label>

                {/* Stock Simulation Preview */}
                {revertStock && stockPreview && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-medium text-slate-300">
                      <span>Saldo atual em estoque:</span>
                      <span className="font-mono font-bold text-white">
                        {stockPreview.current} {stockPreview.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-medium text-slate-300">
                      <span>Estorno da movimentação:</span>
                      <span
                        className={`font-mono font-bold ${
                          stockPreview.diff < 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {stockPreview.diff > 0 ? `+${stockPreview.diff}` : stockPreview.diff}{' '}
                        {stockPreview.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold pt-1.5 border-t border-emerald-900/60 text-emerald-300">
                      <span>Novo saldo após exclusão:</span>
                      <span className="font-mono text-sm text-emerald-400">
                        {stockPreview.next} {stockPreview.unit}
                      </span>
                    </div>

                    {stockPreview.willZeroOrNegative && (
                      <div className="p-2 mt-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          Atenção: O saldo atual ({stockPreview.current}) é menor que a entrada ({movementToDelete.quantidade}). O saldo do produto ficará zerado (0).
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!revertStock && (
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Apenas a linha no histórico será removida. O saldo do produto permanecerá inalterado ({targetProduct?.quantidade || 0} {targetProduct?.unidade || 'un'}).
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMovementToDelete(null)}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/50 text-center"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmar Exclusão</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
