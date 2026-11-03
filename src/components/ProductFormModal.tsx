import React, { useState } from 'react';
import { StockProduct } from '../types';
import { useStock } from '../context/StockContext';
import { X, PackagePlus, Edit3, CheckCircle2 } from 'lucide-react';

interface ProductFormModalProps {
  product?: StockProduct | null;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, onClose }) => {
  const { addProduct, updateProduct, categories, packagingTypes } = useStock();

  const isEditing = Boolean(product);
  const [nome, setNome] = useState(product?.nome || '');
  const [quantidade, setQuantidade] = useState(product ? String(product.quantidade) : '0');
  const [estoqueMinimo, setEstoqueMinimo] = useState(product ? String(product.estoqueMinimo) : '15');
  const [unidade, setUnidade] = useState(product?.unidade || (packagingTypes[0]?.sigla || 'FARDO'));
  const [categoria, setCategoria] = useState(product?.categoria || (categories[0] || 'Alimentos'));
  const [inativo, setInativo] = useState(Boolean(product?.inativo));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor, informe a descrição do produto.');
      return;
    }

    const qtdNum = Math.max(0, parseInt(quantidade, 10) || 0);
    const minNum = Math.max(0, parseInt(estoqueMinimo, 10) || 10);

    if (isEditing && product) {
      const res = updateProduct(product.id, {
        nome: nome.trim().toUpperCase(),
        quantidade: qtdNum,
        estoqueMinimo: minNum,
        unidade,
        categoria,
        inativo,
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.message);
      }
    } else {
      const res = addProduct(nome, qtdNum, minNum, unidade, categoria);
      if (res.success) {
        onClose();
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#0c1322] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 text-emerald-400 border border-slate-700/60 rounded-xl">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <PackagePlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {isEditing ? `Código Nº ${product?.numero}` : 'Cadastrar item no catálogo do galpão'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs font-semibold text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Descrição / Nome do Produto *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: FARDO ARROZ BENTO 5X6, CX DETERGENTE YPÊ..."
              className="w-full px-3.5 py-2.5 text-sm uppercase font-semibold bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:bg-[#111927] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:bg-[#111927] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white font-medium cursor-pointer"
              >
                {/* Ensure current product category is selectable even if deleted */}
                {categoria && !categories.includes(categoria) && (
                  <option value={categoria}>{categoria}</option>
                )}
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Unidade de Embalagem
              </label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:bg-[#111927] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white font-medium cursor-pointer"
              >
                {/* Ensure current product unit is selectable even if deleted */}
                {unidade && !packagingTypes.some((pt) => pt.sigla === unidade) && (
                  <option value={unidade}>{unidade}</option>
                )}
                {packagingTypes.map((pt) => (
                  <option key={pt.sigla} value={pt.sigla}>
                    {pt.nome || pt.sigla}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {isEditing ? 'Quantidade em Estoque' : 'Estoque Inicial'}
              </label>
              <input
                type="number"
                min="0"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tabular-nums bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:bg-[#111927] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Alerta Estoque Mínimo
              </label>
              <input
                type="number"
                min="0"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tabular-nums bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:bg-[#111927] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white"
                required
              />
            </div>
          </div>

          {isEditing && (
            <div className="p-3.5 bg-[#0b0f19] rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Status no Catálogo</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {inativo
                    ? 'Inativo (oculto de "Todos", visível na aba "Inativos")'
                    : 'Ativo (visível no catálogo padrão "Todos")'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inativo}
                  onChange={(e) => setInativo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 border border-slate-700"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-300">
                  {inativo ? 'Inativo' : 'Ativo'}
                </span>
              </label>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-700/80 text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
