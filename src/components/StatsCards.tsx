import React from 'react';
import { useStock } from '../context/StockContext';
import { Package, AlertTriangle, XCircle, Archive } from 'lucide-react';

interface StatsCardsProps {
  onFilterByStatus?: (status: 'todos' | 'zerados' | 'baixo' | 'normal' | 'inativos') => void;
  activeFilter?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ onFilterByStatus, activeFilter = 'todos' }) => {
  const { stats } = useStock();
  const inativosCount = stats.produtosInativos ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. Catálogo (Ativo) */}
      <div
        onClick={() => onFilterByStatus && onFilterByStatus('todos')}
        className={`bg-[#0f172a] p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
          activeFilter === 'todos'
            ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-[#131f35]'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Catálogo</span>
          <div className="p-2 bg-slate-800 text-emerald-400 border border-slate-700/60 rounded-xl">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {stats.totalProdutos}
          </span>
          <span className="text-xs text-slate-400 font-medium">itens ativos</span>
        </div>
      </div>

      {/* 2. Estoque Baixo */}
      <div
        onClick={() => onFilterByStatus && onFilterByStatus('baixo')}
        className={`bg-[#0f172a] p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
          activeFilter === 'baixo'
            ? 'border-amber-500 ring-2 ring-amber-500/30 bg-[#221c17]'
            : 'border-slate-800 hover:border-amber-700/60'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Estoque Baixo</span>
          <div className="p-2 bg-slate-800 text-amber-400 border border-slate-700/60 rounded-xl">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 tabular-nums">
            {stats.produtosEstoqueBaixo}
          </span>
          <span className="text-xs text-slate-400 font-medium">precisam reposição</span>
        </div>
      </div>

      {/* 3. Em Falta (Zerados) */}
      <div
        onClick={() => onFilterByStatus && onFilterByStatus('zerados')}
        className={`bg-[#0f172a] p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
          activeFilter === 'zerados'
            ? 'border-rose-500 ring-2 ring-rose-500/30 bg-[#23151b]'
            : 'border-slate-800 hover:border-rose-700/60'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Em Falta</span>
          <div className="p-2 bg-slate-800 text-rose-400 border border-slate-700/60 rounded-xl">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 tabular-nums">
            {stats.produtosZerados}
          </span>
          <span className="text-xs text-slate-400 font-medium">saldo zerado</span>
        </div>
      </div>

      {/* 4. Produtos Inativos */}
      <div
        onClick={() => onFilterByStatus && onFilterByStatus('inativos')}
        className={`bg-[#0f172a] p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
          activeFilter === 'inativos'
            ? 'border-slate-400 ring-2 ring-slate-400/30 bg-[#1e293b]'
            : 'border-slate-800 hover:border-slate-600'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Produtos Inativos</span>
          <div className="p-2 bg-slate-800 text-amber-400 border border-slate-700/60 rounded-xl">
            <Archive className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-200 tabular-nums">
            {inativosCount}
          </span>
          <span className="text-xs text-slate-400 font-medium">fora da lista</span>
        </div>
      </div>
    </div>
  );
};
