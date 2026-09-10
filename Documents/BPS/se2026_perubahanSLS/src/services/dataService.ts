import { supabase } from "../lib/supabaseClient";
import { RekapKecamatan } from "../types";

let cachedKecamatan: any[] = [];
let cachedDesa: any[] = [];
let cachedSls: any[] = [];
let cachedRekap: RekapKecamatan[] = [];

// Helper normalisasi kode (mendukung format 3 digit maupun 7 digit 3205xxx)
const cleanKec = (val: string) => {
  const s = String(val || "").trim();
  if (s.startsWith("3205") && s.length >= 7) return s.slice(4, 7);
  return s;
};

const cleanDesa = (val: string) => {
  const s = String(val || "").trim();
  if (s.startsWith("3205") && s.length >= 10) return s.slice(7, 10);
  return s;
};

export const initializeDataCache = async () => {
  try {
    // 1. Ambil Kecamatan (cek tabel Kecamatan atau kecamatan)
    let kecRes = await supabase.from("Kecamatan").select("*").order("kdkec", { ascending: true });
    if (!kecRes.data || kecRes.data.length === 0) {
      kecRes = await supabase.from("kecamatan").select("*").order("kdkec", { ascending: true });
    }

    // 2. Ambil Desa (cek tabel Desa atau desa)
    let desaRes = await supabase.from("Desa").select("*").order("kddesa", { ascending: true });
    if (!desaRes.data || desaRes.data.length === 0) {
      desaRes = await supabase.from("desa").select("*").order("kddesa", { ascending: true });
    }

    // Berikan (k: any) agar tidak kena error implicit any di TypeScript
    if (kecRes.data) {
      cachedKecamatan = kecRes.data.map((k: any) => {
        const rawKode = String(k.kdkec || "").trim();
        return {
          ...k,
          kdkec_raw: rawKode,
          kdkec: rawKode.startsWith("3205") ? rawKode : `3205${rawKode}`,
        };
      });
    }

    // Berikan (d: any) agar garis merah hilang
    if (desaRes.data) {
      cachedDesa = desaRes.data.map((d: any) => {
        const rawKec = String(d.kdkec || "").trim();
        const rawDesa = String(d.kddesa || "").trim();
        return {
          ...d,
          kdkec_raw: rawKec,
          kddesa_raw: rawDesa,
          kdkec: rawKec.startsWith("3205") ? rawKec : `3205${rawKec}`,
          kddesa: rawDesa.length > 3 ? rawDesa : `3205${rawKec}${rawDesa}`,
        };
      });
    }

    cachedRekap = cachedKecamatan.map((k: any) => ({
      kdkec: String(k.kdkec || ""),
      nmkec: String(k.nmkec || ""),
      totalSls: Number(k.totalSls) || 0,
      totalPemekaran: Number(k.totalPemekaran) || 0,
      totalPenggabungan: Number(k.totalPenggabungan) || 0,
      totalPerubahanNama: Number(k.totalPerubahanNama) || 0,
      totalPerubahanBatas: Number(k.totalPerubahanBatas) || 0,
      totalWilayahTertukar: Number(k.totalWilayahTertukar) || 0,
      totalAdaPerubahan: Number(k.totalAdaPerubahan) || 0,
    }));
  } catch (err) {
    console.error("Gagal memuat cache master data:", err);
  }
};

// Jalankan preload
initializeDataCache();

export const dataService = {
  // 1. Rekapitulasi
  getRekapitulasi: (): RekapKecamatan[] => {
    return cachedRekap;
  },

  syncRekapData: async () => {
    try {
      let { data: kecList } = await supabase.from("Kecamatan").select("*").order("kdkec", { ascending: true });

      if (!kecList || kecList.length === 0) {
        const retry = await supabase.from("kecamatan").select("*").order("kdkec", { ascending: true });
        kecList = retry.data || [];
      }

      const { data: desaList } = await supabase.from("Desa").select("*").order("kddesa", { ascending: true });

      if (desaList) cachedDesa = desaList;

      if (kecList && kecList.length > 0) {
        cachedRekap = kecList.map((k: any) => ({
          kdkec: String(k.kdkec || ""),
          nmkec: String(k.nmkec || ""),
          totalSls: Number(k.totalSls) || 0,
          totalPemekaran: 0,
          totalPenggabungan: 0,
          totalPerubahanNama: 0,
          totalPerubahanBatas: 0,
          totalWilayahTertukar: 0,
          totalAdaPerubahan: 0,
        }));
      }

      return cachedRekap;
    } catch (err) {
      console.error("Gagal sinkron data rekap:", err);
      return [];
    }
  },

  getRekapDesaList: (kdkec: string) => {
    const rawKec = cleanKec(kdkec);
    return cachedDesa
      .filter((d) => cleanKec(d.kdkec) === rawKec)
      .map((d) => ({
        kddesa: d.kddesa,
        nmdesa: d.nmdesa,
        totalSls: 0,
        totalAdaPerubahan: 0,
      }));
  },

  // 2. Kecamatan
  getKecamatanList: () => {
    return cachedKecamatan;
  },

  getKecamatanListAsync: async () => {
    try {
      // Coba ambil dari tabel "Kecamatan"
      let { data, error } = await supabase.from("Kecamatan").select("*").order("kdkec", { ascending: true });

      // Jika error atau kosong, coba cek tabel dengan huruf kecil "kecamatan"
      if (error || !data || data.length === 0) {
        const retry = await supabase.from("kecamatan").select("*").order("kdkec", { ascending: true });

        if (!retry.error && retry.data && retry.data.length > 0) {
          data = retry.data;
          error = null;
        }
      }

      if (error) {
        console.error("Error saat mengambil kecamatan:", error.message);
        return [];
      }

      console.log("HASIL DATA KECAMATAN:", data);
      return data || [];
    } catch (err) {
      console.error("Fetch error:", err);
      return [];
    }
  },

  // 3. Desa (Cocokkan baik format 3 digit maupun 7 digit)
  getDesaList: (kdkec: string) => {
    const rawKec = cleanKec(kdkec);
    return cachedDesa.filter((d) => cleanKec(d.kdkec) === rawKec);
  },

  getDesaListAsync: async (kdkec: string) => {
    const rawKec = cleanKec(kdkec);
    const { data } = await supabase.from("Desa").select("*").eq("kdkec", rawKec).order("kddesa", { ascending: true });

    return (data || []).map((d) => ({
      ...d,
      kdkec: `3205${d.kdkec}`,
      kddesa: `3205${d.kdkec}${d.kddesa}`,
    }));
  },

  // 4. SLS Data
  getSlsList: async (kdkec: string, kddesa: string) => {
    const rawKec = cleanKec(kdkec);
    const rawDesa = cleanDesa(kddesa);

    if (!rawKec || !rawDesa) return [];

    const { data, error } = await supabase.from("Sls").select("*").eq("kdkec", rawKec).eq("kddesa", rawDesa).order("id_sls", { ascending: true });

    if (error) {
      console.error("Gagal mengambil SLS:", error);
      return [];
    }

    cachedSls = data || [];
    return cachedSls;
  },

  getSlsByKecDesa: (kdkec: string, kddesa: string) => {
    const rawKec = cleanKec(kdkec);
    const rawDesa = cleanDesa(kddesa);
    return cachedSls.filter((s) => cleanKec(s.kdkec) === rawKec && cleanDesa(s.kddesa) === rawDesa);
  },

  // 5. Update SLS
  saveSlsChanges: async (id_sls: string, payload: any) => {
    const { data, error } = await supabase
      .from("Sls")
      .update({
        pemekaran: Boolean(payload.pemekaran),
        pemekaran_note: payload.pemekaran ? payload.pemekaran_note : null,
        penggabungan: Boolean(payload.penggabungan),
        penggabungan_note: payload.penggabungan ? payload.penggabungan_note : null,
        perubahan_nama: Boolean(payload.perubahan_nama),
        perubahan_nama_note: payload.perubahan_nama ? payload.perubahan_nama_note : null,
        perubahan_batas: Boolean(payload.perubahan_batas),
        wilayah_tertukar: Boolean(payload.wilayah_tertukar),
        wilayah_tertukar_note: payload.wilayah_tertukar ? payload.wilayah_tertukar_note : null,
      })
      .eq("id_sls", id_sls)
      .select();

    if (!error && data) {
      cachedSls = cachedSls.map((item) => (item.id_sls === id_sls ? { ...item, ...payload } : item));
      return { success: true, data };
    }
    return { success: false, error };
  },

  updateSls: async (id_sls: string, payload: any) => {
    return await dataService.saveSlsChanges(id_sls, payload);
  },

  // 6. Global Stats
  getGlobalStats: () => {
    return {
      totalKecamatan: 42,
      totalSls: 18551,
      totalAdaPerubahan: 0,
    };
  },

  resetToDefault: () => {
    return true;
  },
};
