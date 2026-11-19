import React, { useState } from 'react';
import { useStock } from '../context/StockContext';
import { Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useStock();
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem('wl_last_username') || 'Willian';
    } catch {
      return 'Willian';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError('Informe o usuário.');
      return;
    }
    if (!password) {
      setError('Informe a senha.');
      return;
    }

    const result = login(username, password);
    if (result.success) {
      try {
        localStorage.setItem('wl_last_username', username.trim());
      } catch (err) {
        console.error(err);
      }
    } else {
      setError(result.message || 'Usuário ou senha incorretos.');
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
            Controle de Estoque Galpão
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs font-semibold text-rose-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nome de usuário"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:bg-[#111927] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-medium text-white placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha de acesso"
                autoFocus={Boolean(username)}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#0b0f19] border border-slate-700/80 rounded-xl focus:bg-[#111927] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-medium text-white placeholder:text-slate-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Acessar Estoque</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        WL System · Sistema de Gestão de Galpão © {new Date().getFullYear()}
      </div>
    </div>
  );
};
