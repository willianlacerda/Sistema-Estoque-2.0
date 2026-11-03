import React, { useState, useRef } from 'react';
import { useStock } from '../context/StockContext';
import { X, Download, Upload, RotateCcw, AlertTriangle, CheckCircle2, FileJson } from 'lucide-react';

interface BackupModalProps {
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ onClose }) => {
  const { exportBackupJson, importBackupJson, resetDataToInitial, products, movements } =
    useStock();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = () => {
    const jsonStr = exportBackupJson();
    const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estoque_backup_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback({
      type: 'success',
      message: 'Backup JSON exportado com sucesso!',
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importBackupJson(content);
        if (res.success) {
          setFeedback({ type: 'success', message: res.message });
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Tem certeza que deseja restaurar os dados originais? As alterações locais serão substituídas pelos 57 itens padrão.'
      )
    ) {
      resetDataToInitial();
      setFeedback({
        type: 'success',
        message: 'Base de dados restaurada para o padrão inicial do galpão!',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 bg-[#0c1322] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 text-teal-400 border border-slate-700/60 rounded-xl">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Backup & Restauração de Dados</h2>
              <p className="text-xs text-slate-400 font-medium">
                Compatível com o formato estoque.json do sistema original
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

        <div className="p-6 space-y-5">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Current State Info */}
          <div className="p-3.5 bg-[#0b0f19] rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Produtos no catálogo:</span>
              <span className="font-bold font-mono text-emerald-400">{products.length} itens</span>
            </div>
            <div className="flex justify-between">
              <span>Movimentações no histórico:</span>
              <span className="font-bold font-mono text-emerald-400">{movements.length} registros</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Download */}
            <button
              onClick={handleDownloadBackup}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700/60 shadow-sm"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Baixar Backup JSON Completo</span>
            </button>

            {/* Upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Importar Arquivo estoque.json</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full py-2.5 px-4 bg-[#0b0f19] hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restaurar Base Padrão Inicial (57 Itens)</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#0c1322] border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 border border-slate-700/60 text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
