import { JenisSls } from '../types';

/**
 * Mengambil karakter digit ke-11 dari kode 14-digit ID SubSLS BPS.
 *
 * Struktur 14 digit kode SubSLS BPS:
 * - Digit 1-2   : Provinsi (contoh: 32 = Jawa Barat)
 * - Digit 3-4   : Kabupaten (contoh: 05 = Garut)
 * - Digit 5-7   : Kecamatan (contoh: 240 = Tarogong Kidul)
 * - Digit 8-10  : Desa/Kelurahan (contoh: 001 = Sukagalih)
 * - Digit 11-14 : Nomor Kode SubSLS/Non-SubSLS (4 digit)
 *                 -> Digit ke-11 adalah karakter pada index ke-10 (0-indexed).
 *
 * Aturan BPS:
 * - Jika digit ke-11 = '0', maka jenisnya adalah SubSLS.
 * - Jika digit ke-11 > 1 (atau >= 1 / selain '0'), maka jenisnya adalah Non SubSLS.
 */
export function getDigit11(idsls: string): string {
  if (!idsls || idsls.length < 11) return '0';
  return idsls.charAt(10);
}

/**
 * Menentukan jenis SubSLS langsung dari digit ke-11 ID SubSLS:
 * @param idsls Kode ID SubSLS 14 digit
 * @returns 'SLS' jika digit ke-11 bernilai '0', atau 'NON_SLS' jika digit ke-11 bernilai > 1 (>= 1)
 */
export function getJenisSlsFromIdsls(idsls: string): JenisSls {
  const digit11 = getDigit11(idsls);
  const num11 = parseInt(digit11, 10);

  if (digit11 === '0' || num11 === 0) {
    return 'SLS';
  }

  // Jika digit 11 bernilai 1..9 (atau > 1), maka Non SubSLS
  return 'NON_SLS';
}

/**
 * Memberikan keterangan deskriptif standar BPS berdasarkan digit ke-11
 */
export function getDigit11Description(idsls: string): string {
  const digit11 = getDigit11(idsls);

  switch (digit11) {
    case '0':
      return 'SubSLS (Satuan Lingkungan Setempat: RT/RW/Dusun)';
    case '1':
      return 'Non-SubSLS: Wilayah Bervegetasi Pertanian';
    case '2':
      return 'Non-SubSLS: Wilayah Bervegetasi Bukan Pertanian';
    case '3':
      return 'Non-SubSLS: Lahan Terbuka';
    case '4':
      return 'Non-SubSLS: Kawasan Terbangun Pemukiman';
    case '5':
      return 'Non-SubSLS: Kawasan Terbangun Bukan Pemukiman';
    case '6':
      return 'Non-SubSLS: Wilayah Perairan';
    default:
      return parseInt(digit11, 10) > 1 ? `Non-SubSLS (Kode Digit: ${digit11})` : 'Non-SubSLS';
  }
}

