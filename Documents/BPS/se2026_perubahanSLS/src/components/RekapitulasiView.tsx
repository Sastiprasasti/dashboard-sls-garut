import React, { useState, useMemo, useEffect } from "react";
import { RefreshCw, Search, Building2, TrendingUp, GitMerge, GitFork, FileSignature, Maximize2, Shuffle, ChevronRight, ChevronDown, ChevronUp, Building, Download, Printer, CheckCircle2, BarChart3 } from "lucide-react";
import { RekapKecamatan } from "../types";
import { dataService } from "../services/dataService";

interface RekapitulasiViewProps {
  onSelectKecamatan: (kdkec: string, kddesa?: string) => void;
  showToast: (type: "success" | "error" | "info", title: string, message: string) => void;
}

export const RekapitulasiView: React.FC<RekapitulasiViewProps> = ({ onSelectKecamatan, showToast }) => {
  const [rekapData, setRekapData] = useState<RekapKecamatan[]>(() => dataService.getRekapitulasi());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedKec, setExpandedKec] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString("id-ID"));
  useEffect(() => {
    // Tarik data kecamatan & rekap secara langsung saat komponen dimuat
    dataService.syncRekapData().then((res) => {
      if (res && res.length > 0) {
        setRekapData(res);
      }
    });
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const refreshed = await dataService.syncRekapData();
    setRekapData(refreshed);
    setLastRefreshed(new Date().toLocaleTimeString("id-ID"));
    setIsRefreshing(false);
    showToast("info", "Data Diperbarui", "Rekapitulasi 42 Kecamatan berhasil disinkronkan.");
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return rekapData;
    const q = searchQuery.toLowerCase().trim();
    return rekapData.filter((r) => r.nmkec.toLowerCase().includes(q) || r.kdkec.includes(q));
  }, [rekapData, searchQuery]);

  // Aggregate summary totals dengan proteksi NaN
  const totals = useMemo(() => {
    return (rekapData || []).reduce(
      (acc, curr) => ({
        totalSls: acc.totalSls + (Number(curr?.totalSls) || 0),
        totalPemekaran: acc.totalPemekaran + (Number(curr?.totalPemekaran) || 0),
        totalPenggabungan: acc.totalPenggabungan + (Number(curr?.totalPenggabungan) || 0),
        totalPerubahanNama: acc.totalPerubahanNama + (Number(curr?.totalPerubahanNama) || 0),
        totalPerubahanBatas: acc.totalPerubahanBatas + (Number(curr?.totalPerubahanBatas) || 0),
        totalWilayahTertukar: acc.totalWilayahTertukar + (Number(curr?.totalWilayahTertukar) || 0),
        totalAdaPerubahan: acc.totalAdaPerubahan + (Number(curr?.totalAdaPerubahan) || 0),
      }),
      {
        totalSls: 0,
        totalPemekaran: 0,
        totalPenggabungan: 0,
        totalPerubahanNama: 0,
        totalPerubahanBatas: 0,
        totalWilayahTertukar: 0,
        totalAdaPerubahan: 0,
      },
    );
  }, [rekapData]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["No", "Kode Kecamatan", "Nama Kecamatan", "Total SubSLS", "Pemekaran", "Penggabungan", "Perubahan Nama", "Perubahan Batas", "Wilayah Tertukar", "Total Kasus Perubahan"];

    const rows = rekapData.map((r, i) => [i + 1, r.kdkec, r.nmkec, r.totalSls, r.totalPemekaran, r.totalPenggabungan, r.totalPerubahanNama, r.totalPerubahanBatas, r.totalWilayahTertukar, r.totalAdaPerubahan]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Perubahan_SubSLS_Garut_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "Ekspor Berhasil", "File CSV rekapitulasi berhasil diunduh.");
  };

  return (
    <div id="rekapitulasi-view" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Sensus Ekonomi 2026</span>
            <span>/</span>
            <span>Dashboard Laporan</span>
            <span>/</span>
            <span className="text-blue-600 font-semibold">Laporan Kec.</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Rekapitulasi Perubahan SubSLS per Kecamatan</h2>
          <p className="text-sm text-slate-600 mt-0.5">Monitoring rekapitulasi agregasi kasus perubahan wilayah SubSLS pada 42 Kecamatan di Kabupaten Garut.</p>
        </div>

        {/* Action Buttons: Refresh & Export */}
        <div className="flex items-center gap-2">
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium transition-colors shadow-2xs"
            title="Download Rekap CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            id="btn-refresh-rekap"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Refresh Data Rekapitulasi"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Card 1 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Kecamatan</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">42</span>
            <span className="text-[10px] text-slate-400">Kab. Garut</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total SubSLS</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-700 font-mono">{totals.totalSls}</span>
            <span className="text-[10px] text-blue-500 font-medium">Terdaftar</span>
          </div>
        </div>

        {/* Card 3: Pemekaran */}
        <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">Pemekaran</span>
            <GitFork className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">{totals.totalPemekaran}</span>
        </div>

        {/* Card 4: Penggabungan */}
        <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-900 uppercase tracking-wider">Penggabungan</span>
            <GitMerge className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <span className="text-2xl font-black text-indigo-600 font-mono mt-1 block">{totals.totalPenggabungan}</span>
        </div>

        {/* Card 5: Perubahan Nama */}
        <div className="bg-white p-3.5 rounded-xl border border-violet-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-violet-900 uppercase tracking-wider">Ubah Nama</span>
            <FileSignature className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <span className="text-2xl font-black text-violet-600 font-mono mt-1 block">{totals.totalPerubahanNama}</span>
        </div>

        {/* Card 6: Perubahan Batas */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">Ubah Batas</span>
            <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">{totals.totalPerubahanBatas}</span>
        </div>

        {/* Card 7: Wilayah Tertukar */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-900 uppercase tracking-wider">Tertukar</span>
            <Shuffle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">{totals.totalWilayahTertukar}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <input
            id="search-kecamatan-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau kode kecamatan..."
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
          <span>Terakhir disinkron: {lastRefreshed}</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">{filteredData.length} Kecamatan</span>
        </div>
      </div>

      {/* REKAPITULASI TABEL 42 KECAMATAN */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-rekap-kecamatan" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3.5 px-3 w-12 text-center">No</th>
                <th className="py-3.5 px-3 w-28">Kode Kec</th>
                <th className="py-3.5 px-4 min-w-[170px]">Nama Kecamatan</th>
                <th className="py-3.5 px-3 text-center w-24">Total SubSLS</th>
                <th className="py-3.5 px-3 text-center border-l border-slate-800">1. Pemekaran</th>
                <th className="py-3.5 px-3 text-center border-l border-slate-800">2. Penggabungan</th>
                <th className="py-3.5 px-3 text-center border-l border-slate-800">3. Perubahan Nama</th>
                <th className="py-3.5 px-3 text-center border-l border-slate-800">4. Perubahan Batas</th>
                <th className="py-3.5 px-3 text-center border-l border-slate-800">5. Wilayah Tertukar</th>
                <th className="py-3.5 px-3 text-center border-l border-slate-800 font-bold bg-slate-950">Total Berubah</th>
                <th className="py-3.5 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredData.map((kec, index) => {
                const hasAnyChange = kec.totalAdaPerubahan > 0;
                const isExpanded = expandedKec === kec.kdkec;
                const desaRekapList = isExpanded ? dataService.getRekapDesaList(kec.kdkec) : [];

                return (
                  <React.Fragment key={kec.kdkec}>
                    <tr id={`rekap-row-${kec.kdkec}`} className={`hover:bg-blue-50/40 transition-colors ${isExpanded ? "bg-blue-50/60 border-l-4 border-l-blue-600" : hasAnyChange ? "bg-amber-50/20" : ""}`}>
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">{index + 1}</td>

                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">{kec.kdkec}</span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <button
                          type="button"
                          onClick={() => setExpandedKec(isExpanded ? null : kec.kdkec)}
                          className="flex items-center gap-1.5 text-left hover:text-blue-700 transition-colors group cursor-pointer"
                          title="Klik untuk melihat rincian desa di kecamatan ini"
                        >
                          <span className="p-0.5 rounded bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-700">{isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
                          <span className="font-bold underline decoration-dotted decoration-slate-300 group-hover:decoration-blue-500">{kec.nmkec}</span>
                        </button>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">{kec.totalSls}</td>

                      <td className="py-3 px-3 text-center font-mono border-l border-slate-100">
                        <span className={`inline-block px-2 py-0.5 rounded ${kec.totalPemekaran > 0 ? "bg-blue-100 text-blue-800 font-bold" : "text-slate-400"}`}>{kec.totalPemekaran}</span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono border-l border-slate-100">
                        <span className={`inline-block px-2 py-0.5 rounded ${kec.totalPenggabungan > 0 ? "bg-indigo-100 text-indigo-800 font-bold" : "text-slate-400"}`}>{kec.totalPenggabungan}</span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono border-l border-slate-100">
                        <span className={`inline-block px-2 py-0.5 rounded ${kec.totalPerubahanNama > 0 ? "bg-violet-100 text-violet-800 font-bold" : "text-slate-400"}`}>{kec.totalPerubahanNama}</span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono border-l border-slate-100">
                        <span className={`inline-block px-2 py-0.5 rounded ${kec.totalPerubahanBatas > 0 ? "bg-amber-100 text-amber-800 font-bold" : "text-slate-400"}`}>{kec.totalPerubahanBatas}</span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono border-l border-slate-100">
                        <span className={`inline-block px-2 py-0.5 rounded ${kec.totalWilayahTertukar > 0 ? "bg-rose-100 text-rose-800 font-bold" : "text-slate-400"}`}>{kec.totalWilayahTertukar}</span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-black border-l border-slate-100 bg-slate-50/80">
                        <span className={`inline-block px-2.5 py-0.5 rounded ${kec.totalAdaPerubahan > 0 ? "bg-amber-500 text-white shadow-2xs" : "text-slate-400"}`}>{kec.totalAdaPerubahan}</span>
                      </td>

                      {/* Action Button: Jump into Step 2 (Pilih Desa) for this Kecamatan */}
                      <td className="py-3 px-3 text-center">
                        <button
                          id={`btn-open-kec-${kec.kdkec}`}
                          onClick={() => onSelectKecamatan(kec.kdkec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                          title={`Buka & Pilih Desa di Kec. ${kec.nmkec}`}
                        >
                          <span>Pilih Desa</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Sub-Row: Daftar Desa di Kecamatan Ini */}
                    {isExpanded && (
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <td colSpan={11} className="p-4 pl-12">
                          <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-2xs space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-100 gap-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                <Building className="w-4 h-4 text-blue-600" />
                                <span>
                                  Daftar Desa / Kelurahan di Kec. {kec.nmkec} ({desaRekapList.length} Desa):
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500">Alur: Pilih desa terlebih dahulu untuk melihat & mengidentifikasi SubSLS</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {desaRekapList.map((desa) => (
                                <div key={desa.kddesa} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-white transition-all text-xs">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">{desa.kddesa}</span>
                                      <span className="font-bold text-slate-900">{desa.nmdesa}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1">
                                      {desa.totalSls} SubSLS &bull; {desa.totalAdaPerubahan > 0 ? <span className="text-amber-700 font-semibold">{desa.totalAdaPerubahan} Berubah</span> : <span className="text-slate-400">0 Perubahan</span>}
                                    </div>
                                  </div>

                                  <button
                                    id={`btn-open-desa-${kec.kdkec}-${desa.kddesa}`}
                                    onClick={() => onSelectKecamatan(kec.kdkec, desa.kddesa)}
                                    className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                                  >
                                    <span>Input SubSLS</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Total Footer Row */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
                <td colSpan={3} className="py-3.5 px-4 text-right tracking-wider">
                  TOTAL KABUPATEN GARUT (42 KECAMATAN):
                </td>
                <td className="py-3.5 px-3 text-center font-mono text-amber-400">{totals.totalSls}</td>
                <td className="py-3.5 px-3 text-center font-mono border-l border-slate-800">{totals.totalPemekaran}</td>
                <td className="py-3.5 px-3 text-center font-mono border-l border-slate-800">{totals.totalPenggabungan}</td>
                <td className="py-3.5 px-3 text-center font-mono border-l border-slate-800">{totals.totalPerubahanNama}</td>
                <td className="py-3.5 px-3 text-center font-mono border-l border-slate-800">{totals.totalPerubahanBatas}</td>
                <td className="py-3.5 px-3 text-center font-mono border-l border-slate-800">{totals.totalWilayahTertukar}</td>
                <td className="py-3.5 px-3 text-center font-mono text-amber-300 bg-slate-950 border-l border-slate-800">{totals.totalAdaPerubahan}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
