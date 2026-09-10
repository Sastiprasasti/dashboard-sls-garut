import React from 'react';
import { Menu, Database, ShieldCheck, RefreshCw, FileCode, MapPin } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenCodeModal: () => void;
  onResetData: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenCodeModal,
  onResetData,
  onToggleSidebar,
}) => {
  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white px-4 lg:px-8 py-3 transition-colors"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu + Title & Region Badge */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-sm tracking-wider shadow-md shadow-orange-500/20">
              SE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  SE2026
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Perubahan SubSLS
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>BPS Kabupaten Garut (3205) • 42 Kecamatan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Status Badges & Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Public Access Badge */}
          <div className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Akses Terbuka (Tanpa Login)</span>
          </div>

          {/* Prisma & Next.js Code Viewer */}
          <button
            id="open-prisma-code-btn"
            onClick={onOpenCodeModal}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors shadow-sm"
            title="Lihat Skema Prisma, Seed & Server Actions untuk Deploy Vercel"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Skema Prisma & Next.js</span>
            <span className="sm:hidden">Prisma</span>
          </button>

          {/* Reset Seed Button */}
          <button
            id="header-reset-seed-btn"
            onClick={onResetData}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset Data SubSLS ke Nilai Awal (Seed)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Reset Seed</span>
          </button>
        </div>
      </div>
    </header>
  );
};
