/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StockProvider, useStock } from './context/StockContext';
import { Sidebar, SidebarTab } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { LoginView } from './components/LoginView';
import { StatsCards } from './components/StatsCards';
import { StockTable } from './components/StockTable';
import { MovementHistoryTable } from './components/MovementHistoryTable';
import { ProductRegisterView } from './components/ProductRegisterView';
import { SettingsView } from './components/SettingsView';
import { ReportsView } from './components/ReportsView';
import { MovementModal } from './components/MovementModal';
import { ProductFormModal } from './components/ProductFormModal';
import { StockProduct, MovementType } from './types';
import { Boxes, History, PackagePlus, FileSpreadsheet, Settings } from 'lucide-react';

function MainApp() {
  const { currentUser, lastUpdatedTime, stats } = useStock();

  // Navigation tab state: 'estoque' | 'historico' | 'relatorios' | 'cadastro' | 'configuracoes'
  const [activeTab, setActiveTab] = useState<SidebarTab>('estoque');
  const [settingsSubTab, setSettingsSubTab] = useState<'usuarios' | 'categorias' | 'backup' | 'sistema'>('usuarios');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<'todos' | 'zerados' | 'baixo' | 'normal' | 'inativos'>('todos');

  // Modal States for stock movement and product edit
  const [movementModalData, setMovementModalData] = useState<{
    product: StockProduct;
    type: MovementType;
  } | null>(null);

  const [productFormModalData, setProductFormModalData] = useState<{
    isOpen: boolean;
    product?: StockProduct | null;
  }>({ isOpen: false, product: null });

  // Function to smoothly open Settings with target subtab
  const handleOpenSettings = (subtab: 'usuarios' | 'categorias' | 'backup' | 'sistema' = 'usuarios') => {
    setSettingsSubTab(subtab);
    setActiveTab('configuracoes');
  };

  // If user is not authenticated, show Login Screen
  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans flex flex-row">
      {/* 1. Sidebar Menu (Estoque, Histórico, Relatórios PDF, Cadastro, Configurações) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        onOpenReport={() => setActiveTab('relatorios')}
        onOpenSettings={(subtab) => handleOpenSettings(subtab || 'usuarios')}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Navbar */}
        <TopNavbar
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSettings={() => handleOpenSettings('usuarios')}
        />

        {/* Dynamic Content View according to activeTab */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-6">
          {activeTab === 'estoque' && (
            <>
              {/* KPI Summary Cards */}
              <StatsCards
                activeFilter={activeStatusFilter}
                onFilterByStatus={(status) => {
                  setActiveStatusFilter(status);
                }}
              />

              {/* Main Stock Table */}
              <StockTable
                activeStatusFilter={activeStatusFilter}
                setActiveStatusFilter={setActiveStatusFilter}
                onOpenMovement={(product, type) => setMovementModalData({ product, type })}
                onOpenAddProduct={() => setActiveTab('cadastro')}
                onOpenEditProduct={(product) => setProductFormModalData({ isOpen: true, product })}
              />
            </>
          )}

          {activeTab === 'historico' && (
            <MovementHistoryTable />
          )}

          {activeTab === 'relatorios' && (
            <ReportsView />
          )}

          {activeTab === 'cadastro' && (
            <ProductRegisterView onSuccessReturn={() => setActiveTab('estoque')} />
          )}

          {activeTab === 'configuracoes' && (
            <SettingsView defaultSubTab={settingsSubTab} />
          )}
        </main>

        {/* Global Footer */}
        <footer className="no-print bg-[#0f172a] border-t border-slate-800 py-4 px-6 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto mb-16 md:mb-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">WL System</span>
            <span className="text-emerald-500">·</span>
            <span>Controle Operacional de Estoque Galpão</span>
          </div>
          <div className="font-mono tabular-nums text-[11px] text-emerald-400">
            Sincronizado: {lastUpdatedTime}
          </div>
        </footer>

        {/* Mobile Sticky Bottom Navigation Bar (Visível apenas em smartphones md:hidden) */}
        <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => setActiveTab('estoque')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'estoque'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Boxes className="w-5 h-5" />
              <span className="absolute -top-1 -right-2.5 px-1 text-[9px] font-bold rounded-full bg-emerald-500 text-slate-950 font-mono">
                {stats.totalProdutos}
              </span>
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Estoque</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'historico'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Histórico</span>
          </button>

          <button
            onClick={() => setActiveTab('cadastro')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'cadastro'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="p-1 rounded-lg bg-emerald-600 text-white shadow-xs">
              <PackagePlus className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">+ Novo</span>
          </button>

          <button
            onClick={() => setActiveTab('relatorios')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'relatorios'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Relatórios</span>
          </button>

          <button
            onClick={() => handleOpenSettings('usuarios')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'configuracoes'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Ajustes</span>
          </button>
        </nav>
      </div>

      {/* Global Modals for Stock In/Out and Product Edit */}
      {movementModalData && (
        <MovementModal
          product={movementModalData.product}
          initialType={movementModalData.type}
          onClose={() => setMovementModalData(null)}
        />
      )}

      {productFormModalData.isOpen && (
        <ProductFormModal
          product={productFormModalData.product}
          onClose={() => setProductFormModalData({ isOpen: false, product: null })}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <StockProvider>
      <MainApp />
    </StockProvider>
  );
}
