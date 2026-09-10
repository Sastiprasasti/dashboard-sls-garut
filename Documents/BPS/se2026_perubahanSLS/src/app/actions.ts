import { prisma } from "@/lib/prisma"; // atau '../lib/prisma' sesuaikan path

// 1. Mengambil daftar 42 Kecamatan se-Garut
export async function getKecamatanList() {
  try {
    return await prisma.kecamatan.findMany({
      orderBy: { kdkec: "asc" },
    });
  } catch (error) {
    console.error("Gagal mengambil daftar kecamatan:", error);
    return [];
  }
}

// 2. Mengambil daftar Desa/Kelurahan berdasarkan Kecamatan yang dipilih
export async function getDesaList(kdkec: string) {
  try {
    return await prisma.desa.findMany({
      where: { kdkec },
      orderBy: { kddesa: "asc" },
    });
  } catch (error) {
    console.error(`Gagal mengambil desa untuk kecamatan ${kdkec}:`, error);
    return [];
  }
}

// 3. Mengambil daftar SLS berdasarkan Kecamatan dan Desa
export async function getSlsList(kdkec: string, kddesa: string) {
  try {
    return await prisma.sls.findMany({
      where: { kdkec, kddesa },
      orderBy: { id_sls: "asc" },
    });
  } catch (error) {
    console.error(`Gagal mengambil SLS untuk ${kdkec}-${kddesa}:`, error);
    return [];
  }
}

// 4. Menyimpan perubahan status SLS (Pemekaran, Penggabungan, dsb.)
export async function updateSlsChanges(
  id_sls: string,
  payload: {
    pemekaran: boolean;
    pemekaran_note?: string | null;
    penggabungan: boolean;
    penggabungan_note?: string | null;
    perubahan_nama: boolean;
    perubahan_nama_note?: string | null;
    perubahan_batas: boolean;
    wilayah_tertukar: boolean;
    wilayah_tertukar_note?: string | null;
  },
) {
  try {
    const updated = await prisma.sls.update({
      where: {
        id_sls: String(id_sls),
      },
      data: {
        pemekaran: Boolean(payload.pemekaran),
        pemekaran_note: payload.pemekaran ? payload.pemekaran_note : null,
        penggabungan: Boolean(payload.penggabungan),
        penggabungan_note: payload.penggabungan ? payload.penggabungan_note : null,
        perubahan_nama: Boolean(payload.perubahan_nama),
        perubahan_nama_note: payload.perubahan_nama ? payload.perubahan_nama_note : null,
        perubahan_batas: Boolean(payload.perubahan_batas),
        wilayah_tertukar: Boolean(payload.wilayah_tertukar),
        wilayah_tertukar_note: payload.wilayah_tertukar ? payload.wilayah_tertukar_note : null,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error(`Gagal mengupdate SLS ${id_sls}:`, error);
    return { success: false, error };
  }
}

// 5. Agregasi rekapitulasi data per Kecamatan untuk halaman Rekapitulasi
export async function getRekapKecamatan() {
  try {
    const result = await prisma.$queryRaw<
      Array<{
        kdkec: string;
        nmkec: string;
        total_sls: bigint;
        pemekaran: bigint;
        penggabungan: bigint;
        perubahan_nama: bigint;
        perubahan_batas: bigint;
        wilayah_tertukar: bigint;
        total_perubahan: bigint;
      }>
    >`
      SELECT 
        k.kdkec,
        k.nmkec,
        COUNT(s.id_sls) AS total_sls,
        COUNT(s.id_sls) FILTER (WHERE s.pemekaran = true) AS pemekaran,
        COUNT(s.id_sls) FILTER (WHERE s.penggabungan = true) AS penggabungan,
        COUNT(s.id_sls) FILTER (WHERE s.perubahan_nama = true) AS perubahan_nama,
        COUNT(s.id_sls) FILTER (WHERE s.perubahan_batas = true) AS perubahan_batas,
        COUNT(s.id_sls) FILTER (WHERE s.wilayah_tertukar = true) AS wilayah_tertukar,
        COUNT(s.id_sls) FILTER (
          WHERE s.pemekaran = true 
             OR s.penggabungan = true 
             OR s.perubahan_nama = true 
             OR s.perubahan_batas = true 
             OR s.wilayah_tertukar = true
        ) AS total_perubahan
      FROM "Kecamatan" k
      LEFT JOIN "Sls" s ON k.kdkec = s.kdkec
      GROUP BY k.kdkec, k.nmkec
      ORDER BY k.kdkec ASC;
    `;

    return result.map((r) => ({
      kdkec: r.kdkec,
      nmkec: r.nmkec,
      total_sls: Number(r.total_sls),
      pemekaran: Number(r.pemekaran),
      penggabungan: Number(r.penggabungan),
      perubahan_nama: Number(r.perubahan_nama),
      perubahan_batas: Number(r.perubahan_batas),
      wilayah_tertukar: Number(r.wilayah_tertukar),
      total_perubahan: Number(r.total_perubahan),
    }));
  } catch (error) {
    console.error("Gagal mengambil data rekap kecamatan:", error);
    return [];
  }
}

// 6. Menghitung ringkasan global untuk badge di Sidebar
export async function getGlobalStats() {
  try {
    const [totalKecamatan, totalSls, totalAdaPerubahan] = await Promise.all([
      prisma.kecamatan.count(),
      prisma.sls.count(),
      prisma.sls.count({
        where: {
          OR: [{ pemekaran: true }, { penggabungan: true }, { perubahan_nama: true }, { perubahan_batas: true }, { wilayah_tertukar: true }],
        },
      }),
    ]);

    return { totalKecamatan, totalSls, totalAdaPerubahan };
  } catch (error) {
    console.error("Gagal mengambil global stats:", error);
    return { totalKecamatan: 42, totalSls: 18551, totalAdaPerubahan: 0 };
  }
}
