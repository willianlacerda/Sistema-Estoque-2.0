import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-150">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isDestructive
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {isDestructive ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer text-center"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 py-3 px-4 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md text-center ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
