import React, { useState } from 'react';
import { useStock } from '../context/StockContext';
import { PackagePlus, CheckCircle2, AlertCircle, ArrowLeft, Layers, Sparkles } from 'lucide-react';

interface ProductRegisterViewProps {
  onSuccessReturn: () => void;
}

export const ProductRegisterView: React.FC<ProductRegisterViewProps> = ({ onSuccessReturn }) => {
  const { addProduct, products, categories, packagingTypes } = useStock();

  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('0');
  const [estoqueMinimo, setEstoqueMinimo] = useState('15');
  const [unidade, setUnidade] = useState(packagingTypes[0]?.sigla || 'FARDO');
  const [categoria, setCategoria] = useState(categories[0] || 'Alimentos');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const nextNumero = useMemoNextNumber(products);

  function useMemoNextNumber(prods: typeof products) {
    const max = prods.reduce((m, p) => (p.numero > m ? p.numero : m), 0);
    return max + 1;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = nome.trim().toUpperCase();
    if (!cleanName) {
      setError('Informe o nome / descrição do produto.');
      return;
    }

    const qtdNum = Math.max(0, parseInt(quantidade, 10) || 0);
    const minNum = Math.max(0, parseInt(estoqueMinimo, 10) || 15);

    const res = addProduct(cleanName, qtdNum, minNum, unidade, categoria);
    if (res.success) {
      setSuccessMsg(res.message);
      setNome('');
      setQuantidade('0');
      setEstoqueMinimo('15');
      setTimeout(() => {
        onSuccessReturn();
      }, 1500);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-[#162036] to-[#0f172a] text-white p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <PackagePlus className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Cadastro de Novo Produto</h2>
            <p className="text-xs text-slate-300">
              Código sequencial automático <strong className="font-mono text-amber-400">Nº {nextNumero}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onSuccessReturn}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Estoque</span>
        </button>
      </div>

      {/* Main Form Card */}
      <div className="bg-[#0f172a] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-md">
        {error && (
          <div className="mb-6 p-4 bg-rose-950/80 border border-rose-800 rounded-2xl text-xs font-bold text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-xs font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg} Redirecionando para a lista...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Nome do Produto / Descrição Completa *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: FARDO ARROZ BENTO 5X6, CX DETERGENTE YPÊ COCO..."
              className="w-full px-4 py-3 text-sm font-semibold uppercase bg-[#0b0f19] border border-slate-700/80 rounded-2xl focus:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white placeholder:text-slate-500"
              required
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Dica: Digite a marca, peso e embalagem (ex: 20X1, 5KG, 500ML)
            </p>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Categoria do Produto
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-[#0b0f19] border border-slate-700/80 rounded-2xl focus:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white font-semibold cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Tipo de Embalagem / Unidade
              </label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-[#0b0f19] border border-slate-700/80 rounded-2xl focus:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white font-semibold cursor-pointer"
              >
                {packagingTypes.map((pt) => (
                  <option key={pt.sigla} value={pt.sigla}>
                    {pt.nome || pt.sigla}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Quantidade Inicial em Galpão
              </label>
              <input
                type="number"
                min="0"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full px-4 py-3 text-base font-mono font-bold tabular-nums bg-[#0b0f19] border border-slate-700/80 rounded-2xl focus:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Gera um lançamento de entrada automático no histórico
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Limite de Estoque Mínimo (Alerta)
              </label>
              <input
                type="number"
                min="0"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                className="w-full px-4 py-3 text-base font-mono font-bold tabular-nums bg-[#0b0f19] border border-slate-700/80 rounded-2xl focus:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Avisa quando a quantidade ficar abaixo desse valor
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={onSuccessReturn}
              className="py-3 px-5 border border-slate-700/80 text-slate-300 font-bold text-sm rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Cadastrar Produto no Catálogo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
