import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro inesperado ao sincronizar com o servidor.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('WL System ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendlyText = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error) {
          if (String(parsed.error).includes('Quota exceeded')) {
            friendlyText =
              'Limite diário gratuito do banco de dados atingido. A cota será redefinida automaticamente amanhã.';
          } else if (String(parsed.error).includes('Missing or insufficient permissions')) {
            friendlyText = `Permissão negada na operação (${parsed.operationType || 'acesso'}) em "${parsed.path || 'banco de dados'}". Verifique seu nível de acesso com o Administrador.`;
          } else {
            friendlyText = parsed.error;
          }
        }
      } catch {
        // Keep original message
      }

      return (
        <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Ocorreu um problema na sincronização
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed break-words">
                {friendlyText}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recarregar Aplicativo</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
