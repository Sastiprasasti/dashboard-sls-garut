import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Check,
  X,
  Pencil,
  AlertTriangle,
  Building,
  MapPin,
  Info,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { Kecamatan, Desa, Sls, PerubahanFormValues } from '../types';
import { dataService } from '../services/dataService';
import { getJenisSlsFromIdsls, getDigit11, getDigit11Description } from '../utils/slsHelper';

interface IdentifikasiSlsViewProps {
  initialKdkec?: string;
  initialKddesa?: string;
  onDataChanged: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const IdentifikasiSlsView: React.FC<IdentifikasiSlsViewProps> = ({
  initialKdkec,
  initialKddesa,
  onDataChanged,
  showToast,
}) => {
  // Cascading Dropdown States
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);
  const [selectedKec, setSelectedKec] = useState<string>(initialKdkec || '');
  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [selectedDesa, setSelectedDesa] = useState<string>(initialKddesa || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [desaSearchQuery, setDesaSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'changed' | 'unchanged' | 'sls' | 'non_sls'>('all');

  // Table Data & Editing States
  const [slsItems, setSlsItems] = useState<any[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PerubahanFormValues>({
    pemekaran: false,
    pemekaran_note: '',
    penggabungan: false,
    penggabungan_note: '',
    perubahan_nama: false,
    perubahan_nama_note: '',
    perubahan_batas: false,
    wilayah_tertukar: false,
    wilayah_tertukar_note: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 1. Muat 42 Kecamatan secara asinkron saat mount
  useEffect(() => {
    let isMounted = true;
    dataService.getKecamatanListAsync().then((list: any) => {
      if (isMounted && list && list.length > 0) {
        setKecamatanList(list);
        if (!selectedKec) {
          const defaultKec = initialKdkec || list[0].kdkec;
          setSelectedKec(defaultKec);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update selectedKec jika prop berubah
  useEffect(() => {
    if (initialKdkec) {
      setSelectedKec(initialKdkec);
    }
  }, [initialKdkec]);

  // Update selectedDesa jika prop berubah
  useEffect(() => {
    if (initialKddesa !== undefined) {
      setSelectedDesa(initialKddesa);
    }
  }, [initialKddesa]);

  // 2. Muat daftar Desa setiap kali selectedKec berubah
  useEffect(() => {
    let isMounted = true;
    if (selectedKec) {
      dataService.getDesaListAsync(selectedKec).then((desas: any) => {
        if (isMounted) {
          setDesaList(desas || []);
          const exists = (desas || []).some((d: any) => d.kddesa === selectedDesa);
          if (!exists && !initialKddesa) {
            setSelectedDesa('');
          }
        }
      });
    } else {
      setDesaList([]);
      setSelectedDesa('');
    }
    return () => {
      isMounted = false;
    };
  }, [selectedKec]);

  // 3. Muat daftar SLS saat Desa dipilih
  const loadSlsData = () => {
    if (selectedKec && selectedDesa) {
      dataService.getSlsList(selectedKec, selectedDesa).then((items: any) => {
        setSlsItems(items || []);
      });
    } else {
      setSlsItems([]);
    }
  };

  useEffect(() => {
    loadSlsData();
    setEditingRowId(null);
    setFormErrors({});
  }, [selectedKec, selectedDesa]);

  const handleKecamatanChange = (newKdkec: string) => {
    setSelectedKec(newKdkec);
    setSelectedDesa('');
    setSearchQuery('');
    setDesaSearchQuery('');
  };

  const handleSelectDesa = (kddesa: string) => {
    setSelectedDesa(kddesa);
    setSearchQuery('');
  };

  const handleResetDesa = () => {
    setSelectedDesa('');
    setSearchQuery('');
  };

  const filteredDesaList = useMemo(() => {
    if (!desaSearchQuery.trim()) return desaList;
    const q = desaSearchQuery.toLowerCase().trim();
    return desaList.filter(
      (d) => d.nmdesa?.toLowerCase().includes(q) || d.kddesa?.includes(q)
    );
  }, [desaList, desaSearchQuery]);

  // Filter SLS sesuai status dan kata kunci pencarian
  const filteredSls = useMemo(() => {
    let result = slsItems;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.id_sls || s.idsls || '').toLowerCase().includes(q) ||
          (s.nama_sls || s.nmsls || '').toLowerCase().includes(q)
      );
    }

    return result.filter((item) => {
      const hasChange =
        item.pemekaran ||
        item.penggabungan ||
        item.perubahan_nama ||
        item.perubahan_batas ||
        item.wilayah_tertukar;

      const currentId = item.id_sls || item.idsls || '';
      if (statusFilter === 'changed') return hasChange;
      if (statusFilter === 'unchanged') return !hasChange;
      if (statusFilter === 'sls') return getJenisSlsFromIdsls(currentId) === 'SLS';
      if (statusFilter === 'non_sls') return getJenisSlsFromIdsls(currentId) === 'NON_SLS';
      return true;
    });
  }, [slsItems, statusFilter, searchQuery]);

  // Edit SLS
  const handleStartEdit = (sls: any) => {
    const activeId = sls.id_sls || sls.idsls || sls.id;
    setEditingRowId(activeId);
    setFormErrors({});
    setEditForm({
      pemekaran: Boolean(sls.pemekaran),
      pemekaran_note: sls.pemekaran_note || '',
      penggabungan: Boolean(sls.penggabungan),
      penggabungan_note: sls.penggabungan_note || '',
      perubahan_nama: Boolean(sls.perubahan_nama),
      perubahan_nama_note: sls.perubahan_nama_note || '',
      perubahan_batas: Boolean(sls.perubahan_batas),
      wilayah_tertukar: Boolean(sls.wilayah_tertukar),
      wilayah_tertukar_note: sls.wilayah_tertukar_note || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setFormErrors({});
  };

  const handleRadioChange = (field: keyof PerubahanFormValues, value: boolean) => {
    setEditForm((prev) => {
      const next = { ...prev, [field]: value };
      if (!value) {
        if (field === 'pemekaran') next.pemekaran_note = '';
        if (field === 'penggabungan') next.penggabungan_note = '';
        if (field === 'perubahan_nama') next.perubahan_nama_note = '';
        if (field === 'wilayah_tertukar') next.wilayah_tertukar_note = '';
      }
      return next;
    });

    if (!value) {
      setFormErrors((prev) => {
        const next = { ...prev };
        if (field === 'pemekaran') delete next.pemekaran_note;
        if (field === 'penggabungan') delete next.penggabungan_note;
        if (field === 'perubahan_nama') delete next.perubahan_nama_note;
        if (field === 'wilayah_tertukar') delete next.wilayah_tertukar_note;
        return next;
      });
    }
  };

  const handleNoteChange = (
    noteField: 'pemekaran_note' | 'penggabungan_note' | 'perubahan_nama_note' | 'wilayah_tertukar_note',
    value: string
  ) => {
    setEditForm((prev) => ({ ...prev, [noteField]: value }));
    if (value.trim()) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[noteField];
        return next;
      });
    }
  };

  const handleSave = async (slsId: string) => {
    const errors: Record<string, string> = {};
    if (editForm.pemekaran && !editForm.pemekaran_note.trim()) {
      errors.pemekaran_note = 'Rincian / SubSLS baru wajib diisi!';
    }
    if (editForm.penggabungan && !editForm.penggabungan_note.trim()) {
      errors.penggabungan_note = 'Rincian penggabungan tujuan wajib diisi!';
    }
    if (editForm.perubahan_nama && !editForm.perubahan_nama_note.trim()) {
      errors.perubahan_nama_note = 'Nama SubSLS baru wajib diisi!';
    }
    if (editForm.wilayah_tertukar && !editForm.wilayah_tertukar_note.trim()) {
      errors.wilayah_tertukar_note = 'Keterangan wilayah tertukar wajib diisi!';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('error', 'Validasi Gagal', 'Harap lengkapi semua kolom rincian yang dipilih "Ya".');
      return;
    }

    setIsSubmitting(true);
    const result = await dataService.updateSls(slsId, editForm);
    setIsSubmitting(false);

    if (result.success) {
      showToast('success', 'Berhasil Disimpan', 'Data perubahan SubSLS berhasil diperbarui di Supabase.');
      setEditingRowId(null);
      setFormErrors({});
      loadSlsData();
      onDataChanged();
    } else {
      showToast('error', 'Gagal Menyimpan', 'Gagal memperbarui data ke Supabase.');
    }
  };

  const currentKecObj = kecamatanList.find((k) => k.kdkec === selectedKec);
  const currentDesaObj = desaList.find((d) => d.kddesa === selectedDesa);

  return (
    <div id="identifikasi-sls-view" className="space-y-6">
      {/* Page Title & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Sensus Ekonomi 2026</span>
            <span>/</span>
            <span>Menu Input Data</span>
            <span>/</span>
            <span className="text-blue-600 font-semibold">Identifikasi Perubahan SubSLS</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Identifikasi Perubahan SubSLS
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Alur identifikasi berjenjang: <strong>Pilih Kecamatan &rarr; Pilih Desa &rarr; Identifikasi Kasus Perubahan SubSLS</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedDesa ? (
            <span className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200">
              {filteredSls.length} SubSLS Ditampilkan di Desa {currentDesaObj?.nmdesa}
            </span>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Langkah 2: Silakan Pilih Desa
            </span>
          )}
        </div>
      </div>

      {/* STEP-BY-STEP PROGRESS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50/50 border border-blue-200">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-blue-800">
              Langkah 1: Kecamatan
            </div>
            <div className="text-xs font-extrabold text-slate-900 truncate">
              {currentKecObj ? `${currentKecObj.nmkec} (${currentKecObj.kdkec})` : 'Memuat Kecamatan...'}
            </div>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
            selectedDesa
              ? 'bg-blue-50/50 border-blue-200'
              : 'bg-amber-50 border-amber-300 ring-2 ring-amber-100'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
              selectedDesa
                ? 'bg-blue-600 text-white'
                : 'bg-amber-600 text-white animate-pulse'
            }`}
          >
            {selectedDesa ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className={`text-[10px] uppercase font-bold tracking-wider ${
                selectedDesa ? 'text-blue-800' : 'text-amber-800'
              }`}
            >
              Langkah 2: Desa / Kelurahan {selectedDesa ? '' : '(Wajib)'}
            </div>
            <div
              className={`text-xs font-extrabold truncate ${
                selectedDesa ? 'text-slate-900' : 'text-amber-900'
              }`}
            >
              {selectedDesa && currentDesaObj
                ? `${currentDesaObj.nmdesa} (${currentDesaObj.kddesa})`
                : 'Pilih Desa Terlebih Dahulu'}
            </div>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
            selectedDesa
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
              selectedDesa
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            3
          </div>
          <div className="min-w-0 flex-1">
            <div
              className={`text-[10px] uppercase font-bold tracking-wider ${
                selectedDesa ? 'text-emerald-800' : 'text-slate-400'
              }`}
            >
              Langkah 3: Identifikasi SubSLS
            </div>
            <div className="text-xs font-extrabold truncate">
              {selectedDesa
                ? `${filteredSls.length} SubSLS Ditampilkan`
                : 'Terkunci (Pilih Desa Dulu)'}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER WILAYAH BERTINGKAT */}
      <div
        id="hierarki-filter-container"
        className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Hierarki Filter Wilayah (Kabupaten Garut)</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Alur: Kecamatan &rarr; Desa &rarr; SubSLS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dropdown Kecamatan */}
          <div className="space-y-1.5">
            <label
              htmlFor="select-kecamatan"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
            >
              1. Kecamatan (42 Kecamatan Garut) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="select-kecamatan"
                value={selectedKec}
                onChange={(e) => handleKecamatanChange(e.target.value)}
                className="w-full h-11 px-3.5 pr-8 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
              >
                {kecamatanList.length === 0 && <option value="">Memuat Kecamatan...</option>}
                {kecamatanList.map((kec) => (
                  <option key={kec.kdkec} value={kec.kdkec}>
                    [{kec.kdkec}] {kec.nmkec}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-slate-500">
              Kode Terpilih: {selectedKec || '-'}
            </span>
          </div>

          {/* Dropdown Desa */}
          <div className="space-y-1.5">
            <label
              htmlFor="select-desa"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
            >
              2. Desa / Kelurahan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="select-desa"
                value={selectedDesa}
                disabled={!selectedKec || desaList.length === 0}
                onChange={(e) => handleSelectDesa(e.target.value)}
                className={`w-full h-11 px-3.5 pr-8 rounded-lg border text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                  selectedDesa
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-amber-50 border-amber-300 text-amber-950 font-semibold ring-1 ring-amber-200'
                }`}
              >
                <option value="">-- Silakan Pilih Desa / Kelurahan --</option>
                {desaList.map((desa) => (
                  <option key={desa.kddesa} value={desa.kddesa}>
                    [{desa.kddesa}] {desa.nmdesa}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-slate-500">
              {desaList.length} Desa/Kelurahan terdaftar di Kec. {currentKecObj?.nmkec || selectedKec}
            </span>
          </div>

          {/* Input Search SubSLS */}
          <div className="space-y-1.5">
            <label
              htmlFor="input-search-sls"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
            >
              3. Cari ID SubSLS / Nama SubSLS
            </label>
            <div className="relative">
              <input
                id="input-search-sls"
                type="text"
                value={searchQuery}
                disabled={!selectedDesa}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  selectedDesa
                    ? "Cari ID misal '3205...' atau 'RT 001'..."
                    : 'Pilih desa dulu untuk mencari SubSLS...'
                }
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              {selectedDesa
                ? 'Ketik untuk memfilter SubSLS seketika'
                : 'Aktif otomatis setelah Desa dipilih'}
            </span>
          </div>
        </div>

        {/* Quick Pills Filter */}
        {selectedDesa && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Status:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({slsItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('changed')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                statusFilter === 'changed'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Ada Perubahan (
              {
                slsItems.filter(
                  (s) =>
                    s.pemekaran ||
                    s.penggabungan ||
                    s.perubahan_nama ||
                    s.perubahan_batas ||
                    s.wilayah_tertukar
                ).length
              }
              )
            </button>
            <button
              onClick={() => setStatusFilter('unchanged')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                statusFilter === 'unchanged'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Tanpa Perubahan (
              {
                slsItems.filter(
                  (s) =>
                    !s.pemekaran &&
                    !s.penggabungan &&
                    !s.perubahan_nama &&
                    !s.perubahan_batas &&
                    !s.wilayah_tertukar
                ).length
              }
              )
            </button>
            <button
              onClick={() => setStatusFilter('sls')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                statusFilter === 'sls'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              Hanya SubSLS ({slsItems.filter((s) => getJenisSlsFromIdsls(s.id_sls || s.idsls) === 'SLS').length})
            </button>
            <button
              onClick={() => setStatusFilter('non_sls')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                statusFilter === 'non_sls'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              Hanya Non SubSLS ({slsItems.filter((s) => getJenisSlsFromIdsls(s.id_sls || s.idsls) === 'NON_SLS').length})
            </button>
          </div>
        )}
      </div>

      {/* KONDISI 1: JIKA DESA BELUM DIPILIH */}
      {!selectedDesa ? (
        <div
          id="pilih-desa-container"
          className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden"
        >
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                Langkah 2: Pilih Desa / Kelurahan
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Daftar Desa / Kelurahan di Kecamatan {currentKecObj?.nmkec || selectedKec}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Silakan klik salah satu desa di bawah ini untuk mengidentifikasi SLS.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={desaSearchQuery}
                onChange={(e) => setDesaSearchQuery(e.target.value)}
                placeholder="Cari nama atau kode desa..."
                className="w-full h-10 pl-9 pr-8 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {desaSearchQuery && (
                <button
                  onClick={() => setDesaSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {filteredDesaList.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <p className="font-semibold text-sm text-slate-800">
                  {desaList.length === 0 ? 'Sedang memuat data desa...' : `Desa tidak ditemukan dengan kata kunci "${desaSearchQuery}"`}
                </p>
                {desaSearchQuery && (
                  <button
                    onClick={() => setDesaSearchQuery('')}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset pencarian desa
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-2 border-b border-slate-100">
                  <span>
                    Menampilkan <strong>{filteredDesaList.length}</strong> desa/kelurahan di Kecamatan{' '}
                    <strong>{currentKecObj?.nmkec || selectedKec}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDesaList.map((desa) => (
                    <div
                      key={desa.kddesa}
                      className="group bg-slate-50/60 hover:bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all p-4.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 group-hover:border-blue-200 group-hover:text-blue-700">
                            Kode: {desa.kddesa}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                          Desa/Kel. {desa.nmdesa}
                        </h4>
                      </div>

                      <div className="mt-4 pt-2">
                        <button
                          onClick={() => handleSelectDesa(desa.kddesa)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-2xs group-hover:shadow-xs cursor-pointer"
                        >
                          <span>Pilih Desa & Input SubSLS</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* KONDISI 2: JIKA DESA SUDAH DIPILIH */
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-blue-900 text-white px-5 py-3 rounded-xl shadow-xs gap-3">
            <div className="flex items-center gap-3 text-sm">
              <Building className="w-5 h-5 text-blue-300 shrink-0" />
              <div>
                <span className="font-semibold text-blue-200 text-xs uppercase tracking-wider block">
                  Wilayah Kerja Aktif:
                </span>
                <span className="font-bold text-white tracking-wide text-sm sm:text-base">
                  Kec. {currentKecObj?.nmkec || selectedKec} ({selectedKec}) &gt; Desa{' '}
                  {currentDesaObj?.nmdesa || selectedDesa} ({selectedDesa})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleResetDesa}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-900 bg-white hover:bg-blue-50 transition-colors shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ganti Desa / Kelurahan</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-950">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-semibold text-blue-900">Ketentuan Jenis SubSLS: </span>
                <span className="text-slate-700">
                  Jenis wilayah diambil langsung dari <strong>digit ke-11 IDSLS</strong>. Jika digit ke-11 bernilai{' '}
                  <span className="inline-block px-1.5 py-0.2 rounded font-mono font-bold bg-blue-600 text-white text-[11px]">0</span>{' '}
                  maka <strong>SubSLS</strong>, sedangkan jika bernilai{' '}
                  <span className="inline-block px-1.5 py-0.2 rounded font-mono font-bold bg-purple-600 text-white text-[11px]">&gt; 1</span>{' '}
                  maka <strong>Non-SubSLS</strong>.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table id="table-identifikasi-sls" className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-slate-100 border-b border-slate-700 font-semibold tracking-wide">
                    <th className="py-3.5 px-3 w-12 text-center">No</th>
                    <th className="py-3.5 px-3 w-44">
                      <div>ID SubSLS</div>
                      <div className="text-[10px] text-blue-300 font-normal">14 Digit (Digit-11)</div>
                    </th>
                    <th className="py-3.5 px-4 min-w-[200px]">Nama SubSLS</th>
                    <th className="py-3.5 px-3 w-28 text-center">
                      <div>Jenis</div>
                      <div className="text-[10px] text-blue-300 font-normal">SubSLS / Non-SubSLS</div>
                    </th>
                    <th className="py-3.5 px-3 min-w-[150px] text-center border-l border-slate-700">1. Pemekaran</th>
                    <th className="py-3.5 px-3 min-w-[150px] text-center border-l border-slate-700">2. Penggabungan</th>
                    <th className="py-3.5 px-3 min-w-[150px] text-center border-l border-slate-700">3. Perubahan Nama</th>
                    <th className="py-3.5 px-3 min-w-[110px] text-center border-l border-slate-700">4. Perubahan Batas</th>
                    <th className="py-3.5 px-3 min-w-[160px] text-center border-l border-slate-700">5. Wilayah Tertukar</th>
                    <th className="py-3.5 px-3 w-28 text-center sticky right-0 bg-slate-800 border-l border-slate-700 shadow-xs">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredSls.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                        <p className="font-semibold text-slate-600">Tidak ada data SubSLS ditemukan</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSls.map((sls, index) => {
                      const activeId = sls.id_sls || sls.idsls || sls.id;
                      const activeNama = sls.nama_sls || sls.nmsls || '';
                      const isEditing = editingRowId === activeId;
                      const hasAnyChange =
                        sls.pemekaran ||
                        sls.penggabungan ||
                        sls.perubahan_nama ||
                        sls.perubahan_batas ||
                        sls.wilayah_tertukar;

                      const digit11 = getDigit11(activeId);
                      const jenisSls = getJenisSlsFromIdsls(activeId);
                      const digit11Desc = getDigit11Description(activeId);

                      return (
                        <tr
                          key={activeId}
                          className={`transition-colors ${
                            isEditing
                              ? 'bg-blue-50/70 ring-2 ring-blue-500/50 ring-inset'
                              : hasAnyChange
                              ? 'bg-amber-50/30 hover:bg-amber-50/60'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-4 px-3 text-center text-slate-500 font-mono">
                            {index + 1}
                          </td>

                          <td className="py-4 px-3 font-mono font-medium text-slate-800">
                            <div className="flex flex-col gap-1">
                              <div className="inline-flex items-center text-[12px] bg-slate-100 rounded px-2 py-1 border border-slate-200 tracking-wider">
                                <span>{activeId.slice(0, 10)}</span>
                                <span
                                  className={`font-bold px-1 mx-0.5 rounded text-[11px] ${
                                    digit11 === '0'
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'bg-purple-600 text-white shadow-2xs'
                                  }`}
                                >
                                  {digit11}
                                </span>
                                <span>{activeId.slice(11)}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-medium text-slate-900 leading-snug">
                            {activeNama}
                            {hasAnyChange && !isEditing && (
                              <span className="inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold border border-amber-300">
                                Ada Kasus
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-3 text-center">
                            <span
                              title={digit11Desc}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${
                                jenisSls === 'SLS'
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-purple-100 text-purple-800 border-purple-200'
                              }`}
                            >
                              {jenisSls === 'SLS' ? 'SubSLS' : 'Non SubSLS'}
                            </span>
                          </td>

                          {/* Pemekaran */}
                          <td className="py-3 px-3 border-l border-slate-200 align-top">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-center gap-3">
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`pemekaran-${activeId}`}
                                    disabled={!isEditing}
                                    checked={isEditing ? editForm.pemekaran : sls.pemekaran}
                                    onChange={() => handleRadioChange('pemekaran', true)}
                                    className="w-3.5 h-3.5 text-blue-600"
                                  />
                                  <span className="text-xs">Ya</span>
                                </label>
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`pemekaran-${activeId}`}
                                    disabled={!isEditing}
                                    checked={isEditing ? !editForm.pemekaran : !sls.pemekaran}
                                    onChange={() => handleRadioChange('pemekaran', false)}
                                    className="w-3.5 h-3.5 text-slate-600"
                                  />
                                  <span className="text-xs">Tidak</span>
                                </label>
                              </div>
                              {isEditing && editForm.pemekaran && (
                                <input
                                  type="text"
                                  value={editForm.pemekaran_note}
                                  onChange={(e) => handleNoteChange('pemekaran_note', e.target.value)}
                                  placeholder="Rincian SubSLS baru..."
                                  className="w-full text-[11px] px-2 py-1 border border-blue-400 rounded"
                                />
                              )}
                              {!isEditing && sls.pemekaran && sls.pemekaran_note && (
                                <p className="text-[11px] text-slate-700 bg-amber-50 p-1 rounded italic">
                                  "{sls.pemekaran_note}"
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Penggabungan */}
                          <td className="py-3 px-3 border-l border-slate-200 align-top">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-center gap-3">
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`penggabungan-${activeId}`}
                                    disabled={!isEditing}
                                    checked={isEditing ? editForm.penggabungan : sls.penggabungan}
                                    onChange={() => handleRadioChange('penggabungan', true)}
                                    className="w-3.5 h-3.5 text-blue-600"
                                  />
                                  <span className="text-xs">Ya</span>
                                </label>
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`penggabungan-${activeId}`}
                                    disabled={!isEditing}
                                    checked={isEditing ? !editForm.penggabungan : !sls.penggabungan}
                                    onChange={() => handleRadioChange('penggabungan', false)}
                                    className="w-3.5 h-3.5 text-slate-600"
                                  />
                                  <span className="text-xs">Tidak</span>
                                </label>
                              </div>
                              {isEditing && editForm.penggabungan && (
                                <input
                                  type="text"
                                  value={editForm.penggabungan_note}
                                  onChange={(e) => handleNoteChange('penggabungan_note', e.target.value)}
                                  placeholder="Digabung ke SubSLS mana..."
                                  className="w-full text-[11px] px-2 py-1 border border-blue-400 rounded"
                                />
                              )}
                              {!isEditing && sls.penggabungan && sls.penggabungan_note && (
                                <p className="text-[11px] text-slate-700 bg-amber-50 p-1 rounded italic">
                                  "{sls.penggabungan_note}"
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Perubahan Nama */}
                          <td className="py-3 px-3 border-l border-slate-200 align-top">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-center gap-3">
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`perubahan_nama-${activeId}`}
                                    disabled={!isEditing}
                                    checked={isEditing ? editForm.perubahan_nama : sls.perubahan_nama}
                                    onChange={() => handleRadioChange('perubahan_nama', true)}
                                    className="w-3.5 h-3.5 text-blue-600"
                                  />
                                  <span className="text-xs">Ya</span>
                                </label>
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`perubahan_nama-${activeId}`}
                                    disabled={!isEditing}
                                    checked={isEditing ? !editForm.perubahan_nama : !sls.perubahan_nama}
                                    onChange={() => handleRadioChange('perubahan_nama', false)}
                                    className="w-3.5 h-3.5 text-slate-600"
                                  />
                                  <span className="text-xs">Tidak</span>
                                </label>
                              </div>
                              {isEditing && editForm.perubahan_nama && (
                                <input
                                  type="text"
                                  value={editForm.perubahan_nama_note}
                                  onChange={(e) => handleNoteChange('perubahan_nama_note', e.target.value)}
                                  placeholder="Nama baru SubSLS..."
                                  className="w-full text-[11px] px-2 py-1 border border-blue-400 rounded"
                                />
                              )}
                              {!isEditing && sls.perubahan_nama && sls.perubahan_nama_note && (
                                <p className="text-[11px] text-slate-700 bg-amber-50 p-1 rounded italic">
                                  "{sls.perubahan_nama_note}"
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Perubahan Batas */}
                          <td className="py-3 px-3 border-l border-slate-200 align-top">
                            <div className="flex items-center justify-center gap-3">
                              <label className="inline-flex items-center gap-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`perubahan_batas-${activeId}`}
                                  disabled={!isEditing}
                                  checked={isEditing ? editForm.perubahan_batas : sls.perubahan_batas}
                                  onChange={() => handleRadioChange('perubahan_batas', true)}
                                  className="w-3.5 h-3.5 text-blue-600"
                                />
                                <span className="text-xs">Ya</span>
                              </label>
                              <label className="inline-flex items-center gap-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`perubahan_batas-${activeId}`}
                                  disabled={!isEditing}
                                  checked={isEditing ? !editForm.perubahan_batas : !sls.perubahan_batas}
                                  onChange={() => handleRadioChange('perubahan_batas', false)}
                                  className="w-3.5 h-3.5 text-slate-600"
                                />
                                <span className="text-xs">Tidak</span>
                              </label>
                            </div>
                          </td>

                          {/* Wilayah Tertukar */}
                          <td className="py-3 px-3 border-l border-slate-200 align-top">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-center gap-3">
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`wilayah_tertukar-${activeId}`}
                                    disabled={!isEditing}
                                    checked={isEditing ? editForm.wilayah_tertukar : sls.wilayah_tertukar}
                                    onChange={() => handleRadioChange('wilayah_tertukar', true)}
                                    className="w-3.5 h-3.5 text-blue-600"
                                  />
                                  <span className="text-xs">Ya</span>
                                </label>
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`wilayah_tertukar-${activeId}`}
                                    disabled={!isEditing}
                                    checked={isEditing ? !editForm.wilayah_tertukar : !sls.wilayah_tertukar}
                                    onChange={() => handleRadioChange('wilayah_tertukar', false)}
                                    className="w-3.5 h-3.5 text-slate-600"
                                  />
                                  <span className="text-xs">Tidak</span>
                                </label>
                              </div>
                              {isEditing && editForm.wilayah_tertukar && (
                                <input
                                  type="text"
                                  value={editForm.wilayah_tertukar_note}
                                  onChange={(e) => handleNoteChange('wilayah_tertukar_note', e.target.value)}
                                  placeholder="Keterangan wilayah tertukar..."
                                  className="w-full text-[11px] px-2 py-1 border border-blue-400 rounded"
                                />
                              )}
                              {!isEditing && sls.wilayah_tertukar && sls.wilayah_tertukar_note && (
                                <p className="text-[11px] text-slate-700 bg-amber-50 p-1 rounded italic">
                                  "{sls.wilayah_tertukar_note}"
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-3 text-center border-l border-slate-200 sticky right-0 bg-white/95 align-top">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleSave(activeId)}
                                  disabled={isSubmitting}
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={isSubmitting}
                                  className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(sls)}
                                className="inline-flex items-center justify-center p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};