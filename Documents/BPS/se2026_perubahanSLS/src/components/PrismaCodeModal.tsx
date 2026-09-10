import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Database, Terminal, Globe, ExternalLink } from 'lucide-react';

interface PrismaCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const PrismaCodeModal: React.FC<PrismaCodeModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'schema' | 'seed' | 'actions' | 'deploy'>('schema');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('success', 'Disalin', 'Kode berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const schemaPrismaCode = `// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional: untuk Supabase connection pooler
}

generator client {
  provider = "prisma-client-js"
}

model Kecamatan {
  id        String   @id @default(cuid())
  kdkec     String   @unique // e.g. "3205240" (7 digit BPS code)
  nmkec     String   // e.g. "Tarogong Kidul"
  desas     Desa[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([kdkec])
  @@map("kecamatan")
}

model Desa {
  id        String    @id @default(cuid())
  kddesa    String    // e.g. "001"
  nmdesa    String    // e.g. "Sukagalih"
  kdkec     String
  kecamatan Kecamatan @relation(fields: [kdkec], references: [kdkec], onDelete: Cascade)
  slsList   Sls[]
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  @@unique([kdkec, kddesa])
  @@index([kdkec])
  @@map("desa")
}

enum JenisSls {
  SLS
  NON_SLS
}

model Sls {
  id                    String   @id @default(cuid())
  idsls                 String   @unique // e.g. "32052400010001" (14 digit BPS)
  nmsls                 String   // e.g. "RT 001 RW 001 DUSUN CANTILAN"
  // Jenis SLS ditentukan langsung dari digit ke-11 IDSLS: 0 = SLS, > 1 (>= 1) = NON_SLS
  jenis_sls             JenisSls @default(SLS) @map("jenis_sls")
  
  kdkec                 String
  kddesa                String
  desa                  Desa     @relation(fields: [kdkec, kddesa], references: [kdkec, kddesa], onDelete: Cascade)

  // Kasus Identifikasi Perubahan SLS
  pemekaran             Boolean  @default(false)
  pemekaran_note        String?  @map("pemekaran_note")

  penggabungan          Boolean  @default(false)
  penggabungan_note     String?  @map("penggabungan_note")

  perubahan_nama        Boolean  @default(false)
  perubahan_nama_note   String?  @map("perubahan_nama_note")

  perubahan_batas       Boolean  @default(false)

  wilayah_tertukar      Boolean  @default(false)
  wilayah_tertukar_note String?  @map("wilayah_tertukar_note")

  updatedBy             String?  @map("updated_by")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  @@index([kdkec, kddesa])
  @@index([idsls])
  @@map("sls")
}`;

  const seedCode = `// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Master Data Kecamatan, Desa, dan SLS Kabupaten Garut (3205)...");

  // Contoh data master Tarogong Kidul, Garut Kota, dan Samarang
  const masterData = [
    {
      kdkec: "3205240",
      nmkec: "Tarogong Kidul",
      desas: [
        {
          kddesa: "001",
          nmdesa: "Sukagalih",
          slsList: [
            {
              idsls: "32052400010001",
              nmsls: "RT 001 RW 001 DUSUN CANTILAN",
              jenis_sls: "SLS" as const,
              pemekaran: false,
              pemekaran_note: null,
              penggabungan: false,
              penggabungan_note: null,
              perubahan_nama: false,
              perubahan_nama_note: null,
              perubahan_batas: false,
              wilayah_tertukar: false,
              wilayah_tertukar_note: null,
            },
            {
              idsls: "32052400010002",
              nmsls: "RT 002 RW 001 DUSUN CANTILAN",
              jenis_sls: "SLS" as const,
              pemekaran: true,
              pemekaran_note: "Pemekaran menjadi RT 002 dan calon RT 005 baru",
              penggabungan: false,
              penggabungan_note: null,
              perubahan_nama: false,
              perubahan_nama_note: null,
              perubahan_batas: false,
              wilayah_tertukar: false,
              wilayah_tertukar_note: null,
            },
          ],
        },
      ],
    },
    // ... Tambahkan kecamatan lainnya sesuai kebutuhan
  ];

  for (const kec of masterData) {
    await prisma.kecamatan.upsert({
      where: { kdkec: kec.kdkec },
      update: { nmkec: kec.nmkec },
      create: { kdkec: kec.kdkec, nmkec: kec.nmkec },
    });

    for (const desa of kec.desas) {
      await prisma.desa.upsert({
        where: { kdkec_kddesa: { kdkec: kec.kdkec, kddesa: desa.kddesa } },
        update: { nmdesa: desa.nmdesa },
        create: { kdkec: kec.kdkec, kddesa: desa.kddesa, nmdesa: desa.nmdesa },
      });

      for (const sls of desa.slsList) {
        await prisma.sls.upsert({
          where: { idsls: sls.idsls },
          update: sls,
          create: { ...sls, kdkec: kec.kdkec, kddesa: desa.kddesa },
        });
      }
    }
  }

  console.log("Seeding selesai!");
}

main().catch(console.error).finally(() => prisma.$disconnect());`;

  const serverActionsCode = `// app/actions/slsActions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateSlsPerubahanAction(id: string, values: any) {
  const errors: Record<string, string> = {};

  if (values.pemekaran && !values.pemekaran_note?.trim()) {
    errors.pemekaran_note = 'Rincian / SLS baru untuk Pemekaran wajib diisi!';
  }
  if (values.penggabungan && !values.penggabungan_note?.trim()) {
    errors.penggabungan_note = 'Rincian penggabungan tujuan wajib diisi!';
  }
  if (values.perubahan_nama && !values.perubahan_nama_note?.trim()) {
    errors.perubahan_nama_note = 'Rincian perubahan nama baru wajib diisi!';
  }
  if (values.wilayah_tertukar && !values.wilayah_tertukar_note?.trim()) {
    errors.wilayah_tertukar_note = 'Rincian wilayah SLS tertukar wajib diisi!';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Validasi gagal', errors };
  }

  const updated = await prisma.sls.update({
    where: { id },
    data: {
      pemekaran: values.pemekaran,
      pemekaran_note: values.pemekaran ? values.pemekaran_note.trim() : null,
      penggabungan: values.penggabungan,
      penggabungan_note: values.penggabungan ? values.penggabungan_note.trim() : null,
      perubahan_nama: values.perubahan_nama,
      perubahan_nama_note: values.perubahan_nama ? values.perubahan_nama_note.trim() : null,
      perubahan_batas: values.perubahan_batas,
      wilayah_tertukar: values.wilayah_tertukar,
      wilayah_tertukar_note: values.wilayah_tertukar ? values.wilayah_tertukar_note.trim() : null,
    },
  });

  revalidatePath('/identifikasi');
  revalidatePath('/laporan-kec');
  return { success: true, message: 'Data SLS berhasil disimpan!', data: updated };
}`;

  return (
    <div
      id="prisma-code-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="prisma-code-modal-content"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Prisma ORM & Next.js Server Actions Setup
              </h3>
              <p className="text-xs text-slate-400">
                Panduan deploy ke Vercel dengan PostgreSQL gratis (Supabase / Neon)
              </p>
            </div>
          </div>

          <button
            id="modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-4 bg-slate-900/50 gap-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveCodeTab('schema')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeCodeTab === 'schema'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>schema.prisma</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('seed')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeCodeTab === 'seed'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>prisma/seed.ts</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('actions')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeCodeTab === 'actions'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Server Actions (Next.js)</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('deploy')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeCodeTab === 'deploy'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>Langkah Deploy Vercel</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-slate-300">
          {activeCodeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">
                  Lokasi: <code className="text-cyan-400">prisma/schema.prisma</code>
                </span>
                <button
                  onClick={() => handleCopy(schemaPrismaCode, 'schema')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs transition-colors"
                >
                  {copiedKey === 'schema' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{copiedKey === 'schema' ? 'Tersalin' : 'Salin Skema'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                {schemaPrismaCode}
              </pre>
            </div>
          )}

          {activeCodeTab === 'seed' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">
                  Lokasi: <code className="text-cyan-400">prisma/seed.ts</code>
                </span>
                <button
                  onClick={() => handleCopy(seedCode, 'seed')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs transition-colors"
                >
                  {copiedKey === 'seed' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{copiedKey === 'seed' ? 'Tersalin' : 'Salin Seed'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                {seedCode}
              </pre>
            </div>
          )}

          {activeCodeTab === 'actions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">
                  Lokasi: <code className="text-cyan-400">app/actions/slsActions.ts</code>
                </span>
                <button
                  onClick={() => handleCopy(serverActionsCode, 'actions')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs transition-colors"
                >
                  {copiedKey === 'actions' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{copiedKey === 'actions' ? 'Tersalin' : 'Salin Server Action'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                {serverActionsCode}
              </pre>
            </div>
          )}

          {activeCodeTab === 'deploy' && (
            <div className="font-sans text-xs text-slate-300 space-y-4">
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40">
                <h4 className="font-bold text-white text-sm">
                  Langkah-Langkah Deploy ke Vercel + Supabase / Neon (Gratis)
                </h4>
                <p className="text-slate-400 mt-1">
                  Aplikasi ini dirancang 100% kompatibel dengan Next.js App Router, Prisma ORM, dan PostgreSQL cloud gratis.
                </p>
              </div>

              <ol className="space-y-3 list-decimal list-inside text-slate-300">
                <li className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white">Buat Database PostgreSQL Gratis:</strong>
                  <p className="text-slate-400 mt-1">
                    Daftar di <strong>Supabase</strong> (supabase.com) atau <strong>Neon</strong> (neon.tech), buat proyek gratis baru, dan dapatkan connection string PostgreSQL.
                  </p>
                </li>

                <li className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white">Konfigurasi Environment Variables di Vercel:</strong>
                  <div className="mt-2 p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1">
                    <p className="text-emerald-400">DATABASE_URL=&quot;postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require&quot;</p>
                    <p className="text-cyan-400">DIRECT_URL=&quot;postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require&quot;</p>
                  </div>
                </li>

                <li className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white">Eksekusi Push Skema &amp; Seed Database:</strong>
                  <div className="mt-2 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px]">
                    <p className="text-amber-300">npx prisma db push</p>
                    <p className="text-amber-300">npx tsx prisma/seed.ts</p>
                  </div>
                </li>

                <li className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <strong className="text-white">Build Command di Vercel:</strong>
                  <p className="text-slate-400 mt-1">
                    Pastikan build script di <code className="text-cyan-400">package.json</code> menyertakan:
                  </p>
                  <div className="mt-1.5 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400">
                    &quot;build&quot;: &quot;prisma generate &amp;&amp; next build&quot;
                  </div>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
