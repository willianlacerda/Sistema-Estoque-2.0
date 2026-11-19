import React, { useState } from 'react';
import { useStock } from '../context/StockContext';
import { Loader2, ShieldCheck, Cloud, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signInWithGoogle } = useStock();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success && result.message) {
        setError(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0f19] via-[#0f172a] to-[#162036] flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Decorative background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden z-10">
        {/* Top Header Card */}
        <div className="p-8 text-center bg-[#0c1322] border-b border-slate-800">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="WL System Logo"
              className="h-24 w-24 object-contain filter drop-shadow-xl select-none"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            WL System
          </h1>
          <p className="text-xs text-emerald-400 font-medium mt-1">
            Controle de Estoque Galpão · Acesso na Nuvem
          </p>
        </div>

        {/* Google Auth Body */}
        <div className="p-7 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-xs font-semibold text-rose-300 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#0b0f19] border border-slate-800/90 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-bold text-white">
              <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Estoque sincronizado em tempo real</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Entre com sua conta Google para consultar saldos, registrar entradas e saídas e emitir relatórios sincronizados com toda a equipe.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3.5 px-5 bg-white hover:bg-slate-100 active:bg-slate-200 disabled:opacity-60 text-slate-900 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span>Conectando com o Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Entrar com Google</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Acesso protegido · Operadores e Administradores</span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        WL System · Sistema de Gestão de Galpão © {new Date().getFullYear()}
      </div>
    </div>
  );
};
