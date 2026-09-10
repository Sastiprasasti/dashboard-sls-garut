import React, { useState, useEffect } from "react";
import { ActiveTab, ToastMessage } from "./types";
import { dataService } from "./services/dataService";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { RekapitulasiView } from "./components/RekapitulasiView";
import { IdentifikasiSlsView } from "./components/IdentifikasiSlsView";
import { PrismaCodeModal } from "./components/PrismaCodeModal";
import { Toast } from "./components/Toast";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("rekapitulasi");
  const [selectedKecForIdentifikasi, setSelectedKecForIdentifikasi] = useState<string>("010");
  const [selectedDesaForIdentifikasi, setSelectedDesaForIdentifikasi] = useState<string>("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [statsVersion, setStatsVersion] = useState<number>(0);

  // Triggered when any SLS change occurs
  const handleDataChanged = () => {
    setStatsVersion((v) => v + 1);
  };

  const showToast = (type: "success" | "error" | "info", title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // User clicks "Pilih Desa" or a specific Desa on a kecamatan row in Rekapitulasi
  const handleSelectKecamatanFromRekap = (kdkec: string, kddesa?: string) => {
    setSelectedKecForIdentifikasi(kdkec);
    setSelectedDesaForIdentifikasi(kddesa || "");
    setActiveTab("identifikasi");
  };

  // Reset data to default seed
  const handleResetData = () => {
    if (window.confirm("Kembalikan seluruh data identifikasi perubahan SubSLS ke nilai awal (seed)?")) {
      dataService.resetToDefault?.();
      handleDataChanged();
      showToast("info", "Data Direset", "Data SubSLS telah dikembalikan ke kondisi awal seed.");
    }
  };

  // State asinkron untuk statistik sidebar
  const [stats, setStats] = useState({
    totalKecamatan: 42,
    totalSls: 18551,
    totalAdaPerubahan: 0,
  });

  useEffect(() => {
    const res = dataService.getGlobalStats();
    if (res) setStats(res);
  }, [statsVersion]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Header */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} onOpenCodeModal={() => setIsCodeModalOpen(true)} onResetData={handleResetData} onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />

      {/* Main Layout Body: Sidebar + Dynamic Content View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenCodeModal={() => setIsCodeModalOpen(true)}
          stats={{
            totalKecamatan: stats.totalKecamatan,
            totalSls: stats.totalSls,
            totalAdaPerubahan: stats.totalAdaPerubahan,
          }}
        />

        {/* Content Area */}
        <main id="main-app-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-[calc(100vh-61px)]">
          <div className="max-w-7xl mx-auto">
            {activeTab === "rekapitulasi" && <RekapitulasiView key={`rekap-${statsVersion}`} onSelectKecamatan={handleSelectKecamatanFromRekap} showToast={showToast} />}

            {activeTab === "identifikasi" && (
              <IdentifikasiSlsView key={`identifikasi-${statsVersion}`} initialKdkec={selectedKecForIdentifikasi} initialKddesa={selectedDesaForIdentifikasi} onDataChanged={handleDataChanged} showToast={showToast} />
            )}
          </div>
        </main>
      </div>

      {/* Code Modal for Prisma & Next.js Deployment */}
      <PrismaCodeModal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} showToast={showToast} />

      {/* Floating Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
