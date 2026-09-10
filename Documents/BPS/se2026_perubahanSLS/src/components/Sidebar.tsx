import React from 'react';
import {
  BarChart3,
  Edit3,
  Layers,
  Database,
  Building2,
  FileCheck2,
  ChevronRight,
  Info,
  BookOpen
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenCodeModal: () => void;
  stats: {
    totalKecamatan: number;
    totalSls: number;
    totalAdaPerubahan: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
  onOpenCodeModal,
  stats,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* BPS Emblem & App Title */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-sm tracking-tight leading-tight">
                SE2026 - SUBSLS GARUT
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Monitoring & Rekonsiliasi
              </p>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">Total SubSLS Terdata:</span>
            <span className="font-bold text-white font-mono">{stats.totalSls.toLocaleString()}</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Group 1: Dashboard Laporan */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dashboard Laporan
            </div>
            <nav className="space-y-1">
              <button
                id="nav-btn-rekapitulasi"
                onClick={() => {
                  onTabChange('rekapitulasi');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  activeTab === 'rekapitulasi'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3
                    className={`w-4 h-4 ${
                      activeTab === 'rekapitulasi' ? 'text-white' : 'text-blue-400'
                    }`}
                  />
                  <span>Laporan Kec.</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-mono ${
                    activeTab === 'rekapitulasi'
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  42
                </span>
              </button>
            </nav>
          </div>

          {/* Group 2: Menu Input Data */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Menu Input Data
            </div>
            <nav className="space-y-1">
              <button
                id="nav-btn-identifikasi"
                onClick={() => {
                  onTabChange('identifikasi');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  activeTab === 'identifikasi'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Edit3
                    className={`w-4 h-4 ${
                      activeTab === 'identifikasi' ? 'text-white' : 'text-orange-400'
                    }`}
                  />
                  <div className="text-left">
                    <span className="block">Identifikasi Perubahan SubSLS</span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    activeTab === 'identifikasi' ? 'rotate-90 text-white' : 'text-slate-500'
                  }`}
                />
              </button>
            </nav>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Progres Identifikasi Garut</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>SubSLS dengan Kasus:</span>
                <span className="font-semibold text-amber-400 font-mono">
                  {stats.totalAdaPerubahan}
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.totalSls > 0
                        ? Math.round((stats.totalAdaPerubahan / stats.totalSls) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-slate-400 text-right">
                {stats.totalSls > 0
                  ? Math.round((stats.totalAdaPerubahan / stats.totalSls) * 100)
                  : 0}
                % teridentifikasi mengalami perubahan
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Database & Next.js/Vercel info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>PostgreSQL / Prisma</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">Supabase / Neon</span>
          </div>

          <button
            id="sidebar-show-code-btn"
            onClick={onOpenCodeModal}
            className="w-full py-1.5 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center justify-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Panduan Deploy Vercel</span>
          </button>
        </div>
      </aside>
    </>
  );
};
