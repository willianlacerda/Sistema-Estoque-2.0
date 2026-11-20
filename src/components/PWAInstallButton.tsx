import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'sidebar' | 'login';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Hide completely when already running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = () => {
    if (isInstallable) {
      void install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (!isInstallable && !isIOS) {
    return null;
  }

  const label = isIOS ? 'Instalar no iPhone' : 'Instalar App';

  return (
    <>
      {variant === 'navbar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Instalar WL Estoque no dispositivo"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border border-emerald-500/60 shadow-sm transition-colors cursor-pointer shrink-0"
        >
          {isIOS ? <Smartphone className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          <span className="hidden xs:inline sm:inline">{label}</span>
          <span className="xs:hidden sm:hidden">App</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
        >
          {isIOS ? <Smartphone className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4 text-emerald-400" />}
          <span>{label}</span>
        </button>
      )}

      {variant === 'login' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold shadow-lg transition-all cursor-pointer"
        >
          {isIOS ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          <span>{label} na Tela Inicial</span>
        </button>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#0f172a] border border-slate-700/80 p-6 shadow-2xl text-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/apple-touch-icon.png"
                  alt="WL Estoque"
                  className="w-11 h-11 rounded-xl shadow-md border border-slate-700"
                />
                <div>
                  <h3 className="text-base font-extrabold text-white leading-tight">
                    Instalar no iPhone / iPad
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium">WL Estoque · App Web</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-3 bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div className="flex-1">
                  Toque no botão <strong className="text-white">Compartilhar</strong>{' '}
                  <Share className="w-3.5 h-3.5 inline text-sky-400 -mt-0.5" /> na barra inferior do Safari.
                </div>
              </li>
              <li className="flex items-start gap-3 bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div className="flex-1">
                  Role para baixo e toque em <strong className="text-white">Adicionar à Tela de Início</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 -mt-0.5" />.
                </div>
              </li>
              <li className="flex items-start gap-3 bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div className="flex-1">
                  Confirme tocando em <strong className="text-white">Adicionar</strong>{' '}
                  <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-400 -mt-0.5" /> no canto superior direito.
                </div>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
