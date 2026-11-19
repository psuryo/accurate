import ExcelJS from 'exceljs';

export interface SourceRow {
  rowNumber: number;
  tanggal: string;
  tanggalRaw: Date | string | null;
  noBukti: string;
  keterangan: string;
  debitFull: string;
  kreditFull: string;
  nilai: number;
  debitShort: string;
  kreditShort: string;
  namaAkun: string;
  namaDepartemen: string;
}

export interface PaymentGroup {
  noBukti: string;
  tanggalFormatted: string;
  kasBankRaw: string;
  kasBankShort: string;
  totalNilai: number;
  items: SourceRow[];
}

export interface ConversionSummary {
  totalRows: number;
  totalTransactions: number;
  totalDetailItems: number;
  totalAmount: number;
  dateRange: { start: string; end: string };
  bankAccounts: { code: string; count: number; total: number }[];
  departments: { name: string; count: number }[];
}

export interface ConversionOptions {
  useCleanAccountCode: boolean; // 6-digit (614.01) vs full (614.01.1000)
  removeDots: boolean;          // 614.01 -> 61401
  fillNoPembayaran: boolean;    // Put No. bukti into No Pembayaran
  fillNoCek: boolean;           // Put No. bukti into No Cek
  catatanHeaderMode: 'first' | 'concat' | 'empty';
  cleanDepartment: boolean;     // Clean trailing whitespace and non-breaking spaces
}

export const DEFAULT_OPTIONS: ConversionOptions = {
  useCleanAccountCode: true,
  removeDots: false,
  fillNoPembayaran: true,
  fillNoCek: true,
  catatanHeaderMode: 'first',
  cleanDepartment: true,
};

// Helper to extract value from excel cell
export function getCellText(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (val instanceof Date) {
      return formatDate(val);
    }
    if ('result' in val) {
      return val.result !== null && val.result !== undefined ? String(val.result).trim() : '';
    }
    if ('text' in val) {
      return String(val.text).trim();
    }
    if ('richText' in val && Array.isArray(val.richText)) {
      return val.richText.map((t: any) => t.text || '').join('').trim();
    }
  }
  return String(val).trim();
}

export function getCellNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'object') {
    if ('result' in val) {
      const num = Number(val.result);
      return isNaN(num) ? 0 : num;
    }
  }
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

export function formatDate(val: any): string {
  if (!val) return '';
  let d: Date;
  if (val instanceof Date) {
    d = val;
  } else if (typeof val === 'number') {
    // Excel date serial
    d = new Date((val - (25567 + 2)) * 86400 * 1000);
  } else {
    d = new Date(val);
  }

  if (isNaN(d.getTime())) {
    // Maybe format is already DD/MM/YYYY or YYYY-MM-DD
    const str = String(val).trim();
    if (str.includes('/')) return str;
    return str;
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function cleanText(text: string): string {
  if (!text) return '';
  return text.replace(/\u00A0/g, ' ').trim();
}

export function formatAccountCode(code: string, useClean: boolean, removeDots: boolean): string {
  let res = code || '';
  if (useClean) {
    // If code has format like 614.01.1000, take 614.01
    const parts = res.split('.');
    if (parts.length >= 2) {
      res = `${parts[0]}.${parts[1]}`;
    } else if (res.length > 6) {
      res = res.substring(0, 6);
    }
  }
  if (removeDots) {
    res = res.replace(/\./g, '');
  }
  return res.trim();
}

// Parse Sumber.xlsx
export async function parseSumberExcel(buffer: ArrayBuffer): Promise<{
  rows: SourceRow[];
  groups: PaymentGroup[];
  summary: ConversionSummary;
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('File Excel tidak memiliki worksheet.');
  }

  // Find header row (usually row 1)
  let headerRowIndex = 1;
  const headerMap: { [key: string]: number } = {};

  worksheet.getRow(headerRowIndex).eachCell((cell, colNumber) => {
    const text = getCellText(cell.value).toLowerCase();
    headerMap[text] = colNumber;
  });

  const rows: SourceRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return;

    // Check if row has any data
    let hasData = false;
    row.eachCell(() => {
      hasData = true;
    });
    if (!hasData) return;

    const tglVal = row.getCell(1).value;
    const noBukti = getCellText(row.getCell(2).value);
    const keterangan = cleanText(getCellText(row.getCell(3).value));
    const debitFull = getCellText(row.getCell(4).value);
    const kreditFull = getCellText(row.getCell(5).value);
    const nilai = getCellNumber(row.getCell(6).value);
    const debitShort = getCellText(row.getCell(7).value) || (debitFull ? debitFull.substring(0, 6) : '');
    const kreditShort = getCellText(row.getCell(8).value) || (kreditFull ? kreditFull.substring(0, 6) : '');
    const namaAkun = cleanText(getCellText(row.getCell(9).value));
    const namaDepartemen = cleanText(getCellText(row.getCell(10).value));

    if (!noBukti && !nilai && !namaAkun) return;

    rows.push({
      rowNumber,
      tanggal: formatDate(tglVal),
      tanggalRaw: tglVal instanceof Date ? tglVal : String(tglVal || ''),
      noBukti,
      keterangan,
      debitFull,
      kreditFull,
      nilai,
      debitShort,
      kreditShort,
      namaAkun,
      namaDepartemen,
    });
  });

  if (rows.length === 0) {
    throw new Error('Tidak ada data baris yang valid ditemukan di dalam file Excel.');
  }

  // Group by noBukti
  const groupMap = new Map<string, PaymentGroup>();
  const groupOrder: string[] = [];

  for (const r of rows) {
    const key = r.noBukti || `NO_BUKTI_${r.rowNumber}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        noBukti: r.noBukti,
        tanggalFormatted: r.tanggal,
        kasBankRaw: r.kreditFull,
        kasBankShort: r.kreditShort,
        totalNilai: 0,
        items: [],
      });
      groupOrder.push(key);
    }
    const group = groupMap.get(key)!;
    group.totalNilai += r.nilai;
    group.items.push(r);
  }

  const groups = groupOrder.map((key) => groupMap.get(key)!);

  // Summary statistics
  const totalAmount = rows.reduce((sum, r) => sum + r.nilai, 0);
  const bankAccMap: { [code: string]: { count: number; total: number } } = {};
  const deptMap: { [dept: string]: number } = {};

  for (const r of rows) {
    const bCode = r.kreditShort || r.kreditFull || 'Unknown';
    if (!bankAccMap[bCode]) bankAccMap[bCode] = { count: 0, total: 0 };
    bankAccMap[bCode].count++;
    bankAccMap[bCode].total += r.nilai;

    const dept = r.namaDepartemen || 'Tanpa Departemen';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  }

  const bankAccounts = Object.entries(bankAccMap).map(([code, stat]) => ({
    code,
    count: stat.count,
    total: stat.total,
  }));

  const departments = Object.entries(deptMap).map(([name, count]) => ({
    name,
    count,
  }));

  const dates = rows.map((r) => r.tanggal).filter(Boolean);
  const summary: ConversionSummary = {
    totalRows: rows.length,
    totalTransactions: groups.length,
    totalDetailItems: rows.length,
    totalAmount,
    dateRange: {
      start: dates[0] || '-',
      end: dates[dates.length - 1] || '-',
    },
    bankAccounts,
    departments,
  };

  return { rows, groups, summary };
}

// Convert to OtherPayment.xlsx workbook
export async function generateOtherPaymentWorkbook(
  groups: PaymentGroup[],
  options: ConversionOptions = DEFAULT_OPTIONS
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Accurate Online Converter';
  wb.created = new Date();

  // 1. Sheet: Template Pembayaran
  const wsPayment = wb.addWorksheet('Template Pembayaran', {
    views: [{ showGridLines: true }],
  });

  // Row 1: HEADER specification
  const headerCols = [
    'HEADER',
    'No Pembayaran',
    'Kas/Bank',
    'No Cek',
    'Tanggal',
    'Tanggal Cek',
    'Kurs',
    'Catatan',
    'Cabang',
    'Penerima',
    'Kustom Karakter 1',
    'Kustom Karakter 2',
    'Kustom Karakter 3',
    'Kustom Karakter 4',
    'Kustom Karakter 5',
    'Kustom Karakter 6',
    'Kustom Karakter 7',
    'Kustom Karakter 8',
    'Kustom Karakter 9',
    'Kustom Karakter 10',
    'Kustom Angka 1',
    'Kustom Angka 2',
    'Kustom Angka 3',
    'Kustom Angka 4',
    'Kustom Angka 5',
    'Kustom Angka 6',
    'Kustom Angka 7',
    'Kustom Angka 8',
    'Kustom Angka 9',
    'Kustom Angka 10',
    'Kustom Tanggal 1',
    'Kustom Tanggal 2',
  ];

  // Row 2: ACCOUNT specification
  const accountCols = [
    'ACCOUNT',
    'No Akun',
    'Nama Akun',
    'Nilai Akun',
    'Nama Departemen',
    'No Proyek',
    'Catatan Akun',
    'Kategori Keuangan 1',
    'Kategori Keuangan 2',
    'Kategori Keuangan 3',
    'Kategori Keuangan 4',
    'Kategori Keuangan 5',
    'Kategori Keuangan 6',
    'Kategori Keuangan 7',
    'Kategori Keuangan 8',
    'Kategori Keuangan 9',
    'Kategori Keuangan 10',
  ];

  const row1 = wsPayment.addRow(headerCols);
  row1.height = 23;
  row1.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF008000' }, // Green
    };
    cell.alignment = { vertical: 'middle' };
  });

  const row2 = wsPayment.addRow(accountCols);
  row2.height = 20;
  row2.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }, // Soft Blue
    };
    cell.alignment = { vertical: 'middle' };
  });

  // Data rows starting row 3
  for (const group of groups) {
    const rawKasBank = options.useCleanAccountCode ? group.kasBankShort : group.kasBankRaw;
    const kasBank = formatAccountCode(rawKasBank, options.useCleanAccountCode, options.removeDots);

    let catatanHeader = '';
    if (options.catatanHeaderMode === 'first') {
      catatanHeader = group.items[0]?.keterangan || '';
    } else if (options.catatanHeaderMode === 'concat') {
      const uniqueKets = Array.from(new Set(group.items.map((i) => i.keterangan).filter(Boolean)));
      catatanHeader = uniqueKets.join('; ');
    }

    const headerData = [
      'HEADER',
      options.fillNoPembayaran ? group.noBukti : null,
      kasBank,
      options.fillNoCek ? group.noBukti : null,
      group.tanggalFormatted,
      group.tanggalFormatted, // Tanggal Cek
      null, // Kurs
      catatanHeader || null,
      null, // Cabang
      null, // Penerima
    ];

    const hRow = wsPayment.addRow(headerData);
    hRow.height = 19;
    const hCell1 = hRow.getCell(1);
    hCell1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    hCell1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF008000' },
    };
    hCell1.alignment = { vertical: 'middle', horizontal: 'center' };

    // Detail rows
    for (const item of group.items) {
      const rawNoAkun = options.useCleanAccountCode ? item.debitShort : item.debitFull;
      const noAkun = formatAccountCode(rawNoAkun, options.useCleanAccountCode, options.removeDots);
      const namaDept = options.cleanDepartment ? cleanText(item.namaDepartemen) : item.namaDepartemen;

      const accountData = [
        'ACCOUNT',
        noAkun,
        item.namaAkun,
        item.nilai,
        namaDept || null,
        null, // No Proyek
        item.keterangan || null, // Catatan Akun
      ];

      const aRow = wsPayment.addRow(accountData);
      aRow.height = 18;
      const aCell1 = aRow.getCell(1);
      aCell1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      aCell1.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' },
      };
      aCell1.alignment = { vertical: 'middle', horizontal: 'center' };

      // Format number for Nilai Akun (col 4)
      const numCell = aRow.getCell(4);
      numCell.numFmt = '#,##0.00';
    }
  }

  // Adjust column widths
  wsPayment.columns = [
    { width: 14 }, // Type
    { width: 24 }, // No Pembayaran
    { width: 16 }, // Kas/Bank
    { width: 22 }, // No Cek
    { width: 14 }, // Tanggal
    { width: 14 }, // Tanggal Cek
    { width: 10 }, // Kurs
    { width: 35 }, // Catatan
    { width: 16 }, // Cabang
    { width: 24 }, // Penerima
    { width: 18 }, // Custom 1
    { width: 18 }, // Custom 2
  ];

  // 2. Sheet: Penjelasan Kolom Header
  const wsHeaderExplain = wb.addWorksheet('Penjelasan Kolom Header', {
    views: [{ showGridLines: true }],
  });
  const headerExplainData = [
    ['Keterangan : - Hanya Sheet Pertama yg di impor. Silahkan masuk ke sheet Pertama untuk mendefinisikan data impor'],
    ['- Baris pertama sampai baris ke-2 hanya sebagai judul kolom, mulai baris ke-4 data diimpor. Jadi pastikan data di mulai dari baris ke-4'],
    ['Nama Kolom', 'Status', 'Max. Karakter', 'Keterangan'],
    ['No Pembayaran', 'Tidak Wajib', 50, 'Jika Dikosongkan maka ACCURATE akan membuat kode otomatis secara counter'],
    ['Kas/Bank', 'Wajib', 30, 'Isi dengan kode akun Kas/Bank, kolom ini harus tepat kode nya dengan accurate online.'],
    ['No Cek', 'Tidak Wajib', 50, 'Nomor Cek'],
    ['Tanggal', 'Tidak Wajib', 'DD/MM/YYYY', 'Jika Dikosongkan maka ACCURATE akan membuat tanggal hari ini'],
    ['Tanggal Cek', 'Tidak Wajib', 'DD/MM/YYYY', 'Jika Dikosongkan maka ACCURATE akan membuat sama seperti kolom tanggal'],
    ['Kurs', 'Tidak Wajib', 5, 'Nilai Kurs'],
    ['Catatan', 'Tidak Wajib', 1000, 'Catatan mengenai pembayaran'],
    ['Cabang', 'Tidak Wajib', 80, 'Nama cabang dari pembayaran'],
    ['Penerima', 'Tidak Wajib', 240, 'Penerima pembayaran'],
    ['Kustom Karakter 1', 'Tidak Wajib', 100, 'Atribut tambahan faktur untuk tipe karakter, Aktifkan terlebih dahulu nama atribut melalui menu Rancangan Formulir'],
    ['Kustom Karakter 2', 'Tidak Wajib', 100, 'Atribut tambahan faktur untuk tipe karakter'],
    ['Kustom Karakter 3', 'Tidak Wajib', 100, 'Atribut tambahan faktur untuk tipe karakter'],
    ['Kustom Karakter 4', 'Tidak Wajib', 100, 'Atribut tambahan faktur untuk tipe karakter'],
    ['Kustom Karakter 5', 'Tidak Wajib', 100, 'Atribut tambahan faktur untuk tipe karakter'],
    ['Kustom Karakter 6', 'Tidak Wajib', 100, 'Atribut tambahan faktur untuk tipe karakter'],
    ['Kustom Karakter 7', 'Tidak Wajib', 100, 'Atribut tambahan faktur untuk tipe karakter'],
    ['Kustom Karakter 8', 'Tidak Wajib', 100, 'Atribut tambahan faktur untuk tipe karakter'],
    ['Kustom Karakter 9', 'Tidak Wajib', 100, 'Atribut tambahan faktur untuk tipe karakter'],
    ['Kustom Karakter 10', 'Tidak Wajib', 100, 'Atribut tambahan faktur untuk tipe karakter'],
    ['Kustom Angka 1', 'Tidak Wajib', '999 Milyar', 'Atribut tambahan faktur untuk tipe angka'],
    ['Kustom Angka 2', 'Tidak Wajib', '999 Milyar', 'Atribut tambahan faktur untuk tipe angka'],
    ['Kustom Angka 3', 'Tidak Wajib', '999 Milyar', 'Atribut tambahan faktur untuk tipe angka'],
    ['Kustom Angka 4', 'Tidak Wajib', '999 Milyar', 'Atribut tambahan faktur untuk tipe angka'],
    ['Kustom Angka 5', 'Tidak Wajib', '999 Milyar', 'Atribut tambahan faktur untuk tipe angka'],
    ['Kustom Angka 6', 'Tidak Wajib', '999 Milyar', 'Atribut tambahan faktur untuk tipe angka'],
    ['Kustom Angka 7', 'Tidak Wajib', '999 Milyar', 'Atribut tambahan faktur untuk tipe angka'],
    ['Kustom Angka 8', 'Tidak Wajib', '999 Milyar', 'Atribut tambahan faktur untuk tipe angka'],
    ['Kustom Angka 9', 'Tidak Wajib', '999 Milyar', 'Atribut tambahan faktur untuk tipe angka'],
    ['Kustom Angka 10', 'Tidak Wajib', '999 Milyar', 'Atribut tambahan faktur untuk tipe angka'],
    ['Kustom Tanggal 1', 'Tidak Wajib', 'DD/MM/YYYY', 'Atribut tambahan faktur untuk tipe tanggal'],
    ['Kustom Tanggal 2', 'Tidak Wajib', 'DD/MM/YYYY', 'Atribut tambahan faktur untuk tipe tanggal'],
    ['Nomor Akun Hutang', 'Tidak Wajib', 30, 'Nomor Akun Piutang'],
  ];

  headerExplainData.forEach((r, idx) => {
    const row = wsHeaderExplain.addRow(r);
    if (idx === 2) {
      row.font = { bold: true };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    }
  });
  wsHeaderExplain.columns = [{ width: 25 }, { width: 15 }, { width: 15 }, { width: 70 }];

  // 3. Sheet: Penjelasan Kolom Account
  const wsAccountExplain = wb.addWorksheet('Penjelasan Kolom Account', {
    views: [{ showGridLines: true }],
  });
  const accountExplainData = [
    ['Keterangan : - Hanya Sheet Pertama yg di impor. Silahkan masuk ke sheet Pertama untuk mendefinisikan data impor'],
    ['- Baris pertama sampai baris ke-3 hanya sebagai judul kolom, mulai baris ke-4 data diimpor. Jadi pastikan data di mulai dari baris ke-4'],
    ['Nama Kolom', 'Status', 'Max. Karakter', 'Keterangan'],
    ['No Akun', 'Wajib', 30, 'Isi dengan kode akun, kolom ini harus tepat kode nya dengan accurate online. Akan jadi acuan apakah akun ada atau tidak dalam database'],
    ['Nama Akun', 'Wajib', 240, 'Nama biaya pada rincian pembayaran, tapi kecocokan dengan penamaan dalam accurate Online akan di abaikan'],
    ['Nilai Akun', 'Wajib', '999 Milyar', 'Nilai akun pembayaran'],
    ['Nama Departemen', 'Tidak Wajib', 30, 'Nama departemen pada rincian pembayaran'],
    ['No Proyek', 'Tidak Wajib', 30, 'No proyek pada rincian pembayaran'],
    ['Catatan Akun', 'Tidak Wajib', 1000, 'Catatan mengenai pembayaran (memo)'],
    ['Kategori Keuangan 1', 'Tidak Wajib', 80, 'Atribut tambahan fitur kategori keuangan 1, aktifkan terlebih dahulu fitur keuangan pada preferensi'],
    ['Kategori Keuangan 2', 'Tidak Wajib', 80, 'Atribut tambahan fitur kategori keuangan 2'],
    ['Kategori Keuangan 3', 'Tidak Wajib', 80, 'Atribut tambahan fitur kategori keuangan 3'],
    ['Kategori Keuangan 4', 'Tidak Wajib', 80, 'Atribut tambahan fitur kategori keuangan 4'],
    ['Kategori Keuangan 5', 'Tidak Wajib', 80, 'Atribut tambahan fitur kategori keuangan 5'],
    ['Kategori Keuangan 6', 'Tidak Wajib', 80, 'Atribut tambahan fitur kategori keuangan 6'],
    ['Kategori Keuangan 7', 'Tidak Wajib', 80, 'Atribut tambahan fitur kategori keuangan 7'],
    ['Kategori Keuangan 8', 'Tidak Wajib', 80, 'Atribut tambahan fitur kategori keuangan 8'],
    ['Kategori Keuangan 9', 'Tidak Wajib', 80, 'Atribut tambahan fitur kategori keuangan 9'],
    ['Kategori Keuangan 10', 'Tidak Wajib', 80, 'Atribut tambahan fitur kategori keuangan 10'],
  ];

  accountExplainData.forEach((r, idx) => {
    const row = wsAccountExplain.addRow(r);
    if (idx === 2) {
      row.font = { bold: true };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    }
  });
  wsAccountExplain.columns = [{ width: 25 }, { width: 15 }, { width: 15 }, { width: 70 }];

  return wb;
}
