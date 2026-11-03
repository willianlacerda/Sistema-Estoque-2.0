import React, { useState } from 'react';
import { StockProduct, MovementType } from '../types';
import { useStock } from '../context/StockContext';
import { X, ArrowDownLeft, ArrowUpRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MovementModalProps {
  product: StockProduct;
  initialType?: MovementType;
  onClose: () => void;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  product,
  initialType = 'Entrada',
  onClose,
}) => {
  const { registerMovement } = useStock();
  const [tipo, setTipo] = useState<MovementType>(initialType);
  const [quantidadeStr, setQuantidadeStr] = useState<string>('10');
  const [observacao, setObservacao] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const quantidade = parseInt(quantidadeStr, 10) || 0;
  const saldoProjetado =
    tipo === 'Entrada' ? product.quantidade + quantidade : product.quantidade - quantidade;

  const isInvalidSaida = tipo === 'Saída' && quantidade > product.quantidade;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantidade <= 0) {
      setError('Informe uma quantidade maior que zero.');
      return;
    }
    if (isInvalidSaida) {
      setError(`Saída não permitida. O estoque disponível é de apenas ${product.quantidade} un.`);
      return;
    }

    const res = registerMovement(product.id, tipo, quantidade, observacao.trim() || undefined);
    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  };

  const handleAddPreset = (val: number) => {
    const current = parseInt(quantidadeStr, 10) || 0;
    setQuantidadeStr(String(current + val));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div
          className={`p-4 sm:p-6 border-b flex items-start justify-between ${
            tipo === 'Entrada'
              ? 'bg-[#132338] border-slate-700/60 text-white'
              : 'bg-[#291319] border-rose-900/60 text-white'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#0b0f19] border border-slate-700/60 shadow-xs text-white">
                Nº {product.numero}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {product.categoria} · {product.unidade}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
              {product.nome}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Movement Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#0b0f19] border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTipo('Entrada');
                setError(null);
              }}
              className={`py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tipo === 'Entrada'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Entrada (Recebimento)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipo('Saída');
                setError(null);
              }}
              className={`py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tipo === 'Saída'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Saída (Expedição)</span>
            </button>
          </div>

          {/* Current vs Projected Balance */}
          <div className="p-4 bg-[#0b0f19] rounded-2xl border border-slate-800 grid grid-cols-3 text-center gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Saldo Atual
              </span>
              <span className="text-xl font-black text-white font-mono tabular-nums">
                {product.quantidade}
              </span>
            </div>
            <div className="flex items-center justify-center text-slate-400 font-bold text-lg">
              {tipo === 'Entrada' ? '+' : '-'}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Saldo Projetado
              </span>
              <span
                className={`text-xl font-black font-mono tabular-nums ${
                  isInvalidSaida
                    ? 'text-rose-400'
                    : saldoProjetado <= product.estoqueMinimo
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {Math.max(0, saldoProjetado)}
              </span>
            </div>
          </div>

          {/* Quantity Input with Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Quantidade de {tipo === 'Entrada' ? 'Entrada' : 'Saída'} ({product.unidade})
            </label>
            <input
              type="number"
              min="1"
              max={tipo === 'Saída' ? product.quantidade : 999999}
              value={quantidadeStr}
              onChange={(e) => {
                setQuantidadeStr(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 text-2xl font-black text-white font-mono tabular-nums bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:bg-[#111927] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-center"
              autoFocus
              required
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-xs text-slate-400 font-medium mr-1">Adicionar:</span>
              {[5, 10, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700/60"
                >
                  +{preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQuantidadeStr('')}
                className="ml-auto text-xs text-slate-400 hover:text-white px-1.5 py-1"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Optional Observation */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Observação / Motivo (Opcional)
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Carga caminhão 02, Reposição fornecedor..."
              className="w-full px-3.5 py-2 text-sm bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:bg-[#111927] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs font-semibold text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-700/80 text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isInvalidSaida}
              className={`flex-1 py-3 px-4 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isInvalidSaida
                  ? 'bg-slate-700 cursor-not-allowed opacity-50'
                  : tipo === 'Entrada'
                  ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar {tipo}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
