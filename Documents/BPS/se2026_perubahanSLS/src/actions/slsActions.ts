/**
 * Server Actions for Next.js App Router (Vercel + Supabase/Neon PostgreSQL + Prisma ORM)
 * Filename: src/actions/slsActions.ts (or app/actions/slsActions.ts)
 */

'use server';

import { PerubahanFormValues } from '../types';

// In Next.js App Router with Prisma:
// import prisma from '@/lib/prisma';
// import { revalidatePath } from 'next/cache';

export interface ActionResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * 1. Fetch 42 Kecamatan di Kabupaten Garut
 */
export async function getKecamatanAction(): Promise<ActionResponse> {
  try {
    // In production with Prisma:
    // const kecamatanList = await prisma.kecamatan.findMany({
    //   orderBy: { kdkec: 'asc' },
    // });
    // return { success: true, message: 'Berhasil memuat kecamatan', data: kecamatanList };

    return {
      success: true,
      message: 'Berhasil memuat 42 Kecamatan Kabupaten Garut',
      data: [],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal memuat daftar kecamatan',
    };
  }
}

/**
 * 2. Fetch Desa/Kelurahan berdasarkan Kode Kecamatan
 */
export async function getDesaByKecamatanAction(kdkec: string): Promise<ActionResponse> {
  try {
    if (!kdkec) {
      return { success: false, message: 'Kode kecamatan wajib diisi' };
    }

    // In production with Prisma:
    // const desaList = await prisma.desa.findMany({
    //   where: { kdkec },
    //   orderBy: { kddesa: 'asc' },
    // });
    // return { success: true, message: 'Berhasil memuat desa', data: desaList };

    return {
      success: true,
      message: `Berhasil memuat desa untuk kecamatan ${kdkec}`,
      data: [],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal memuat daftar desa',
    };
  }
}

/**
 * 3. Fetch SLS berdasarkan Kecamatan, Desa, dan filter pencarian
 */
export async function getSlsListAction(
  kdkec: string,
  kddesa: string,
  search?: string
): Promise<ActionResponse> {
  try {
    if (!kdkec || !kddesa) {
      return { success: false, message: 'Kecamatan dan desa wajib dipilih' };
    }

    // In production with Prisma:
    // const whereClause: any = { kdkec, kddesa };
    // if (search?.trim()) {
    //   whereClause.OR = [
    //     { idsls: { contains: search.trim(), mode: 'insensitive' } },
    //     { nmsls: { contains: search.trim(), mode: 'insensitive' } },
    //   ];
    // }
    // const slsList = await prisma.sls.findMany({
    //   where: whereClause,
    //   orderBy: { idsls: 'asc' },
    // });
    // return { success: true, message: 'Berhasil memuat data SLS', data: slsList };

    return {
      success: true,
      message: 'Berhasil memuat data SLS',
      data: [],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal memuat data SLS',
    };
  }
}

/**
 * 4. Server Action: Mutasi Update Baris Perubahan SLS dengan Validasi Ketat
 * Sesuai aturan:
 * - Jika Pemekaran = Ya -> pemekaran_note WAJIB diisi
 * - Jika Penggabungan = Ya -> penggabungan_note WAJIB diisi
 * - Jika Perubahan Nama = Ya -> perubahan_nama_note WAJIB diisi
 * - Jika Wilayah Tertukar = Ya -> wilayah_tertukar_note WAJIB diisi
 * - Khusus Perubahan Batas = Ya -> TIDAK PERLU text input
 * - Jika Tidak -> Reset note ke null
 */
export async function updateSlsPerubahanAction(
  id: string,
  values: PerubahanFormValues
): Promise<ActionResponse> {
  try {
    const errors: Record<string, string> = {};

    // Validasi kondisional wajib isi keterangan jika Ya
    if (values.pemekaran && !values.pemekaran_note?.trim()) {
      errors.pemekaran_note = 'Rincian / SLS baru untuk kasus Pemekaran wajib diisi!';
    }
    if (values.penggabungan && !values.penggabungan_note?.trim()) {
      errors.penggabungan_note = 'Rincian penggabungan SLS tujuan wajib diisi!';
    }
    if (values.perubahan_nama && !values.perubahan_nama_note?.trim()) {
      errors.perubahan_nama_note = 'Rincian perubahan nama SLS baru wajib diisi!';
    }
    if (values.wilayah_tertukar && !values.wilayah_tertukar_note?.trim()) {
      errors.wilayah_tertukar_note = 'Rincian keterangan wilayah tertukar wajib diisi!';
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Validasi gagal: Terdapat keterangan kasus yang belum diisi.',
        errors,
      };
    }

    // Prepare clean sanitized payload
    const updatePayload = {
      pemekaran: values.pemekaran,
      pemekaran_note: values.pemekaran ? values.pemekaran_note.trim() : null,
      penggabungan: values.penggabungan,
      penggabungan_note: values.penggabungan ? values.penggabungan_note.trim() : null,
      perubahan_nama: values.perubahan_nama,
      perubahan_nama_note: values.perubahan_nama ? values.perubahan_nama_note.trim() : null,
      perubahan_batas: values.perubahan_batas,
      wilayah_tertukar: values.wilayah_tertukar,
      wilayah_tertukar_note: values.wilayah_tertukar ? values.wilayah_tertukar_note.trim() : null,
      updatedAt: new Date(),
    };

    // In production with Prisma:
    // const updated = await prisma.sls.update({
    //   where: { id },
    //   data: updatePayload,
    // });
    // revalidatePath('/identifikasi');
    // revalidatePath('/laporan-kec');
    // return { success: true, message: 'Data perubahan SLS berhasil disimpan!', data: updated };

    return {
      success: true,
      message: 'Data identifikasi perubahan SLS berhasil diperbarui ke database!',
      data: updatePayload,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal menyimpan perubahan SLS ke database',
    };
  }
}

/**
 * 5. Server Action: Agregasi Rekapitulasi Kasus Perubahan 42 Kecamatan di Garut
 */
export async function getRekapitulasiKecamatanAction(): Promise<ActionResponse> {
  try {
    // In production with Prisma, aggregate count per kecamatan:
    // const allKec = await prisma.kecamatan.findMany({
    //   include: {
    //     desas: {
    //       include: {
    //         slsList: true,
    //       },
    //     },
    //   },
    //   orderBy: { kdkec: 'asc' },
    // });
    // const summary = allKec.map(kec => {
    //   const allSls = kec.desas.flatMap(d => d.slsList);
    //   return {
    //     kdkec: kec.kdkec,
    //     nmkec: kec.nmkec,
    //     totalSls: allSls.length,
    //     totalPemekaran: allSls.filter(s => s.pemekaran).length,
    //     totalPenggabungan: allSls.filter(s => s.penggabungan).length,
    //     totalPerubahanNama: allSls.filter(s => s.perubahan_nama).length,
    //     totalPerubahanBatas: allSls.filter(s => s.perubahan_batas).length,
    //     totalWilayahTertukar: allSls.filter(s => s.wilayah_tertukar).length,
    //     totalAdaPerubahan: allSls.filter(s => s.pemekaran || s.penggabungan || s.perubahan_nama || s.perubahan_batas || s.wilayah_tertukar).length,
    //   };
    // });
    // return { success: true, message: 'Rekapitulasi berhasil dimuat', data: summary };

    return {
      success: true,
      message: 'Rekapitulasi berhasil dimuat',
      data: [],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal memuat data rekapitulasi',
    };
  }
}
