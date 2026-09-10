import "dotenv/config";
import * as path from "path";
import { createRequire } from "module";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Menggunakan require untuk modul CommonJS seperti xlsx
const require = createRequire(import.meta.url);
const xlsx = require("xlsx");

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("⏳ Membaca file Excel dataSubSLS3205.xlsx...");

  // Path file Excel di dalam folder prisma
  const filePath = path.join(process.cwd(), "prisma", "dataSubSLS3205.xlsx");
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = xlsx.utils.sheet_to_json(sheet);

  console.log(`📊 Ditemukan ${rows.length} baris data. Memproses hierarki wilayah...`);

  const kecMap = new Map<string, string>();
  const desaMap = new Map<string, { kdkec: string; kddesa: string; nmdesa: string }>();

  for (const r of rows) {
    const rawKec = String(r["Kode Kec"] || "").trim();
    const rawDesa = String(r["Kode Desa"] || "").trim();

    const kdkec = rawKec.slice(0, 3).trim();
    const nmkec = rawKec.slice(3).trim();

    const kddesa = rawDesa.slice(0, 3).trim();
    const nmdesa = rawDesa.slice(3).trim();

    if (kdkec && !kecMap.has(kdkec)) {
      kecMap.set(kdkec, nmkec);
    }

    const desaKey = `${kdkec}_${kddesa}`;
    if (kdkec && kddesa && !desaMap.has(desaKey)) {
      desaMap.set(desaKey, { kdkec, kddesa, nmdesa });
    }
  }

  // 1. Simpan Seluruh 42 Kecamatan
  console.log(`💾 Memasukkan ${kecMap.size} Kecamatan...`);
  for (const [kdkec, nmkec] of kecMap.entries()) {
    await prisma.kecamatan.upsert({
      where: { kdkec },
      update: { nmkec },
      create: { kdkec, nmkec },
    });
  }

  // 2. Simpan Seluruh 442 Desa
  console.log(`💾 Memasukkan ${desaMap.size} Desa...`);
  for (const d of desaMap.values()) {
    await prisma.desa.upsert({
      where: { kdkec_kddesa: { kdkec: d.kdkec, kddesa: d.kddesa } },
      update: { nmdesa: d.nmdesa },
      create: { kdkec: d.kdkec, kddesa: d.kddesa, nmdesa: d.nmdesa },
    });
  }

  // 3. Simpan 18.551 SLS dalam batch
  console.log(`💾 Mempersiapkan data 18.551 SLS...`);
  const slsData = rows.map((r) => {
    const rawKec = String(r["Kode Kec"] || "").trim();
    const rawDesa = String(r["Kode Desa"] || "").trim();
    const kdkec = rawKec.slice(0, 3).trim();
    const kddesa = rawDesa.slice(0, 3).trim();

    return {
      id_sls: String(r["Kode"]).trim(),
      nama_sls: String(r["Sub Satuan Lingkungan Setempat (Sub-SLS)"] || "").trim(),
      kdkec,
      kddesa,
      nama_ppl: String(r["Nama PPL"] || "").trim(),
      nama_pml: String(r["Nama PML"] || "").trim(),
      jenis_sls: "SLS",
    };
  });

  console.log("🚀 Mengimpor batch SLS ke Supabase...");
  const BATCH_SIZE = 1000;
  for (let i = 0; i < slsData.length; i += BATCH_SIZE) {
    const chunk = slsData.slice(i, i + BATCH_SIZE);
    await prisma.sls.createMany({
      data: chunk as any,
      skipDuplicates: true,
    });
    console.log(`   -> Terproses: ${Math.min(i + BATCH_SIZE, slsData.length)} / ${slsData.length} SLS`);
  }

  console.log("✅ Semua data Kecamatan, Desa, dan Sub-SLS Garut berhasil masuk ke Supabase!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
