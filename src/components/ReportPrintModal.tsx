import React, { useState } from 'react';
import { StockProduct } from '../types';
import { X, Printer, Download, FileText, CheckCircle } from 'lucide-react';

interface ReportPrintModalProps {
  products: StockProduct[];
  lastUpdatedTime: string;
  onClose: () => void;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  products,
  lastUpdatedTime,
  onClose,
}) => {
  const [filterMode, setFilterMode] = useState<'todos' | 'em_estoque' | 'zerados'>('todos');

  const filteredProducts = products.filter((p) => {
    if (filterMode === 'em_estoque') return p.quantidade > 0;
    if (filterMode === 'zerados') return p.quantidade <= 0;
    return true;
  });

  const totalUnidades = filteredProducts.reduce((acc, p) => acc + p.quantidade, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ['Nº', 'Produto', 'Categoria', 'Unidade', 'Quantidade'];
    const rows = filteredProducts.map((p) => [
      p.numero,
      `"${p.nome.replace(/"/g, '""')}"`,
      p.categoria,
      p.unidade,
      p.quantidade,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_estoque_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Controls Header (Hidden during print) */}
        <div className="no-print p-4 sm:p-6 bg-[#0c1322] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 text-emerald-400 border border-slate-700/60 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Relatório de Estoque</h2>
              <p className="text-xs text-slate-400 font-medium">
                Padrão institucional DM Santos Empreendimentos
              </p>
            </div>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-2">
            <select
              value={filterMode}
              onChange={(e: any) => setFilterMode(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-[#0b0f19] border border-slate-700/80 rounded-lg text-slate-200 cursor-pointer"
            >
              <option value="todos">Todos os Produtos ({products.length})</option>
              <option value="em_estoque">Apenas com Estoque</option>
              <option value="zerados">Apenas Zerados</option>
            </select>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="overflow-y-auto p-4 sm:p-8 flex-1 bg-[#0b0f19]">
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-xl print:border-none print:shadow-none p-6 sm:p-8 rounded-xl print:p-0">
            {/* Report Header (Exact pattern from relatorio_estoque_*.pdf) */}
            <div className="bg-[#2e7d32] text-white p-4 sm:p-5 rounded-t-lg print:rounded-none flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="WL Logo"
                  className="h-10 w-10 object-contain drop-shadow-sm shrink-0"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Relatório de Estoque
                  </h1>
                  <p className="text-[11px] text-emerald-100">WL System · Controle de Galpão</p>
                </div>
              </div>
              <div className="text-right text-xs text-emerald-100 font-mono">
                Gerado em: {lastUpdatedTime}
              </div>
            </div>

            {/* Table Header Bar */}
            <div className="bg-[#81c784] text-slate-900 font-bold text-xs uppercase grid grid-cols-12 py-2 px-3 rounded-md mb-2">
              <div className="col-span-1 text-center font-mono">Nº</div>
              <div className="col-span-8">Produto</div>
              <div className="col-span-3 text-right">Quantidade</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className={`grid grid-cols-12 py-2 px-3 items-center ${
                    idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                  }`}
                >
                  <div className="col-span-1 text-center font-mono font-bold text-slate-600">
                    {p.numero}
                  </div>
                  <div className="col-span-8 font-semibold text-slate-900 pr-2 uppercase">
                    {p.nome}
                  </div>
                  <div className="col-span-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {p.quantidade} {p.unidade}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="mt-6 pt-4 border-t-2 border-slate-300 flex items-center justify-between text-xs font-bold text-slate-800">
              <div>
                Total de itens listados: <span className="font-mono">{filteredProducts.length}</span>
              </div>
              <div className="text-right">
                Volume Total em Estoque:{' '}
                <span className="text-sm font-mono text-emerald-800">
                  {totalUnidades.toLocaleString('pt-BR')} unidades
                </span>
              </div>
            </div>

            <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
              WL System · DM Santos Empreendimentos · Documento emitido para controle interno de galpão
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
