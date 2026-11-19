import React from 'react';
import { useStock } from '../context/StockContext';
import {
  Boxes,
  History,
  PackagePlus,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu as MenuIcon,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export type SidebarTab = 'estoque' | 'historico' | 'cadastro' | 'relatorios' | 'configuracoes';

interface SidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenReport?: () => void;
  onOpenSettings?: (subtab?: 'usuarios' | 'backup') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  onOpenReport,
  onOpenSettings,
}) => {
  const { currentUser, logout, stats } = useStock();

  // All 5 core navigation options requested by user are permanently visible
  const navItems: {
    id: SidebarTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: 'estoque',
      label: 'Estoque',
      icon: Boxes,
      badge: stats.totalProdutos,
    },
    {
      id: 'historico',
      label: 'Histórico',
      icon: History,
    },
    {
      id: 'cadastro',
      label: 'Cadastro de Produto',
      icon: PackagePlus,
    },
    {
      id: 'relatorios',
      label: 'Relatórios PDF',
      icon: FileSpreadsheet,
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
    },
  ];

  const handleSelectTab = (tab: SidebarTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const isAdmin = Boolean(
    currentUser &&
      (currentUser.nivel === 2 ||
        Number(currentUser.nivel) === 2 ||
        currentUser.username.toLowerCase() === 'willian')
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-100 select-none border-r border-slate-800 shadow-xl">
      {/* Brand Header with WL Logo */}
      <div className="p-5 border-b border-slate-800 bg-gradient-to-b from-[#131d33] to-[#0f172a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="WL System Logo"
              className="h-11 w-11 object-contain filter drop-shadow-md shrink-0 select-none"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">
                  WL System
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#f59e0b] text-slate-950 rounded shadow-xs">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">
                Controle de Estoque Galpão
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Options: Estoque, Histórico, Cadastro, Relatórios, Configurações */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Menu Principal
        </p>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer group ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800/90 text-emerald-400 group-hover:text-emerald-300 group-hover:bg-slate-700/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full ${
                      isActive
                        ? 'bg-white text-emerald-900'
                        : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'opacity-100 translate-x-0.5' : 'opacity-0 group-hover:opacity-60'
                  }`}
                />
              </div>
            </button>
          );
        })}


      </nav>

      {/* User Profile Footer in Sidebar */}
      {currentUser && (
        <div className="p-4 border-t border-slate-800 bg-[#0c1322]">
          <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white text-sm shadow-inner shrink-0">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white truncate">
                    {currentUser.username}
                  </span>
                  {isAdmin ? (
                    <span
                      title="Nível 2 - Administrador"
                      className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded flex items-center gap-0.5 border border-amber-500/20"
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                      ADM
                    </span>
                  ) : (
                    <span
                      title="Nível 1 - Operador"
                      className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20"
                    >
                      OP
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold block truncate ${
                    isAdmin ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {isAdmin ? 'Administrador' : 'Operador'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Encerrar sessão"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed left, 260px) */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Backdrop overlay + Sliding drawer) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
