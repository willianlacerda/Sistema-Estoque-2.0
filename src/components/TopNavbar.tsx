import React from 'react';
import { useStock } from '../context/StockContext';
import { LogOut, ShieldCheck, Clock, Settings, Menu as MenuIcon } from 'lucide-react';
import { SidebarTab } from './Sidebar';
import { PWAInstallButton } from './PWAInstallButton';

interface TopNavbarProps {
  activeTab: SidebarTab;
  onOpenMobileMenu: () => void;
  onOpenSettings: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenSettings,
}) => {
  const { currentUser, logout, lastUpdatedTime } = useStock();

  const isAdmin = Boolean(
    currentUser &&
      (currentUser.nivel === 2 ||
        Number(currentUser.nivel) === 2 ||
        currentUser.username.toLowerCase() === 'willian')
  );

  const tabTitles: Record<SidebarTab, { title: string; subtitle: string }> = {
    estoque: {
      title: 'Estoque Galpão',
      subtitle: 'Controle de mercadorias, entradas e saídas físicas',
    },
    historico: {
      title: 'Histórico de Movimentações',
      subtitle: 'Auditoria de entradas e saídas registradas por data e operador',
    },
    relatorios: {
      title: 'Relatórios de Estoque',
      subtitle: 'Emissão de relatórios em PDF e planilhas para conferência e auditoria',
    },
    cadastro: {
      title: 'Cadastro de Produto',
      subtitle: 'Inclusão de novos produtos no catálogo do armazém',
    },
    configuracoes: {
      title: 'Configurações do Sistema',
      subtitle: 'Gestão e criação de usuários, permissões e cópias de segurança (Backup)',
    },
  };

  const currentTabInfo = tabTitles[activeTab] || tabTitles.estoque;

  return (
    <header className="bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Trigger + Breadcrumb Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Abrir menu lateral"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug">
                  {currentTabInfo.title}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-emerald-400 border border-slate-700/60">
                  WL System
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                {currentTabInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Live Sync, Settings shortcut, and User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock / Last Sync */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400 font-mono tabular-nums bg-[#0b0f19] px-2.5 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lastUpdatedTime}</span>
            </div>

            {/* In-App PWA Install Button */}
            <PWAInstallButton variant="navbar" />

            {/* Shortcut to Settings (em desktop, pois no mobile já está na barra inferior) */}
            <button
              onClick={onOpenSettings}
              title="Abrir Configurações e Backup"
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                activeTab === 'configuracoes'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'text-slate-200 bg-slate-800 hover:bg-slate-700 border-slate-700/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configurações</span>
            </button>

            {/* User Profile Badge */}
            {currentUser && (
              <div className="flex items-center gap-1.5 sm:gap-2.5 bg-[#0b0f19] px-2 sm:pl-3 sm:pr-1.5 py-1 sm:py-1.5 rounded-xl border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30 sm:hidden shrink-0">
                  {currentUser.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-sm font-bold text-white leading-tight">
                      {currentUser.username}
                    </span>
                    {isAdmin && (
                      <span title="Administrador">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider block ${
                      isAdmin ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {isAdmin ? 'Administrador' : 'Operador'}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Sair do Sistema"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
