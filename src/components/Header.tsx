import React from 'react';
import { useStock } from '../context/StockContext';
import { LogOut, Users, ShieldCheck, Warehouse, Clock, DatabaseBackup, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenUsers?: () => void;
  onOpenBackup?: () => void;
  activeTab: 'estoque' | 'historico';
  setActiveTab: (tab: 'estoque' | 'historico') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUsers,
  onOpenBackup,
  activeTab,
  setActiveTab,
}) => {
  const { currentUser, logout, lastUpdatedTime } = useStock();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Company Title */}
          <div className="flex items-center gap-4">
            <img
              src="/assets/aistudio/Emblema_circular_verde_e_amarelo_recortado_851a632b.png"
              alt="WL Logo"
              className="h-12 w-12 object-contain shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('Emblema_circular_verde_e_amarelo_recortado_851a632b.png')) {
                  target.src = '/public/assets/aistudio/Emblema_circular_verde_e_amarelo_recortado_851a632b.png';
                }
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-emerald-800 flex items-center gap-2">
                  <Warehouse className="w-6 h-6 text-emerald-600 inline-block" />
                  Estoque Galpão
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  WL System
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                DM Santos Empreendimentos · Controle de Cargas e Mercadorias
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Single line clean controls) */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('estoque')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'estoque'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📦 Estoque
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'historico'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📜 Histórico
            </button>
          </div>

          {/* User Account & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock / Last Sync */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{lastUpdatedTime}</span>
            </div>

            {/* Backup Quick Button */}
            {onOpenBackup && (
              <button
                onClick={onOpenBackup}
                title="Backup e Restauração de Dados"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <DatabaseBackup className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Backup</span>
              </button>
            )}

            {/* User Profile Badge */}
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 pl-3 pr-1.5 py-1.5 rounded-xl border border-slate-200">
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-sm font-bold text-slate-800 leading-tight">
                      {currentUser.username}
                    </span>
                    {currentUser.nivel === 2 && (
                      <span title="Administrador">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block">
                    {currentUser.roleName}
                  </span>
                </div>

                {/* Manage users if Admin */}
                {currentUser.nivel === 2 && onOpenUsers && (
                  <button
                    onClick={onOpenUsers}
                    title="Gerenciar Usuários"
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Sair do Sistema"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('estoque')}
            className={`flex-1 py-1.5 text-sm font-semibold text-center rounded-lg transition-all ${
              activeTab === 'estoque'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-slate-600'
            }`}
          >
            📦 Estoque
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-1.5 text-sm font-semibold text-center rounded-lg transition-all ${
              activeTab === 'historico'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-slate-600'
            }`}
          >
            📜 Histórico
          </button>
        </div>
      </div>
    </header>
  );
};
