export type JenisSls = 'SLS' | 'NON_SLS';

export interface Kecamatan {
  kdkec: string;
  nmkec: string;
}

export interface Desa {
  kdkec: string;
  kddesa: string;
  nmdesa: string;
}

export interface Sls {
  id: string;
  idsls: string;
  nmsls: string;
  jenis_sls: JenisSls;
  kdkec: string;
  kddesa: string;
  
  // Kasus Perubahan
  pemekaran: boolean;
  pemekaran_note: string | null;

  penggabungan: boolean;
  penggabungan_note: string | null;

  perubahan_nama: boolean;
  perubahan_nama_note: string | null;

  perubahan_batas: boolean;

  wilayah_tertukar: boolean;
  wilayah_tertukar_note: string | null;

  updatedAt?: string;
}

export interface PerubahanFormValues {
  pemekaran: boolean;
  pemekaran_note: string;
  penggabungan: boolean;
  penggabungan_note: string;
  perubahan_nama: boolean;
  perubahan_nama_note: string;
  perubahan_batas: boolean;
  wilayah_tertukar: boolean;
  wilayah_tertukar_note: string;
}

export interface RekapKecamatan {
  kdkec: string;
  nmkec: string;
  totalSls: number;
  totalPemekaran: number;
  totalPenggabungan: number;
  totalPerubahanNama: number;
  totalPerubahanBatas: number;
  totalWilayahTertukar: number;
  totalAdaPerubahan: number;
}

export interface RekapDesa {
  kdkec: string;
  kddesa: string;
  nmdesa: string;
  totalSls: number;
  totalPemekaran: number;
  totalPenggabungan: number;
  totalPerubahanNama: number;
  totalPerubahanBatas: number;
  totalWilayahTertukar: number;
  totalAdaPerubahan: number;
}

export type ActiveTab = 'rekapitulasi' | 'identifikasi' | 'prisma_code';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}
