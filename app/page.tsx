'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Dropzone from '@/components/Dropzone';
import SummaryCards from '@/components/SummaryCards';
import OptionsPanel from '@/components/OptionsPanel';
import PreviewTable from '@/components/PreviewTable';
import {
  SourceRow,
  PaymentGroup,
  ConversionSummary,
  ConversionOptions,
  DEFAULT_OPTIONS,
  parseSumberExcel,
  generateOtherPaymentWorkbook,
} from '@/lib/converter';
import { Download, FileCheck, ArrowRight, Sparkles, CheckCircle2, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);

  const [parsedData, setParsedData] = useState<{
    rows: SourceRow[];
    groups: PaymentGroup[];
    summary: ConversionSummary;
  } | null>(null);

  // Auto-process file buffer
  const processBuffer = async (name: string, buf: ArrayBuffer) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await parseSumberExcel(buf);
      setParsedData(result);
      setFileName(name);
      setBuffer(buf);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memproses file Excel.');
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileLoaded = (selectedFile: File, buf: ArrayBuffer) => {
    setFile(selectedFile);
    processBuffer(selectedFile.name, buf);
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/samples/Sumber_Contoh.xlsx');
      if (!res.ok) throw new Error('File contoh tidak ditemukan.');
      const buf = await res.arrayBuffer();
      await processBuffer('Sumber_Contoh.xlsx', buf);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat file contoh.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!parsedData) return;
    setIsDownloading(true);
    try {
      const wb = await generateOtherPaymentWorkbook(parsedData.groups, options);
      const outputBuffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Data';
      a.download = `OtherPayment_${baseName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('Gagal membuat file Excel: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero title */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-2 bg-emerald-100/70 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Converter Otomatis Template Accurate Online</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Konversi Tabel <span className="text-emerald-600">Sumber</span> ke{' '}
            <span className="text-[#008000]">Other</span>
            <span className="text-[#4F81BD]">Payment</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Unggah file laporan atau jurnal pengeluaran (format <em>Sumber.xlsx</em>). Sistem akan mengelompokkan
            transaksi berdasarkan No. Bukti, menyusun baris <strong>HEADER</strong> dan <strong>ACCOUNT</strong>, serta
            menghasilkan file Excel siap impor ke Accurate Online.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">1. Unggah File Sumber Excel</h3>
              <p className="text-xs text-slate-500">Mendukung file .xlsx dan .xls dengan rumus atau nilai statis</p>
            </div>
            {parsedData && (
              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Siap Dikonversi ({parsedData.groups.length} Transaksi)</span>
              </span>
            )}
          </div>

          <Dropzone
            onFileLoaded={handleFileLoaded}
            isLoading={isLoading}
            currentFileName={fileName}
            onLoadSample={handleLoadSample}
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Terjadi Kesalahan</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results section */}
        {parsedData && (
          <div className="space-y-6">
            {/* Step 2 Header & Action CTA */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-emerald-200" />
                  <h3 className="text-lg font-bold">File Berhasil Dianalisis &amp; Dikelompokkan</h3>
                </div>
                <p className="text-xs text-emerald-100">
                  Ditemukan {parsedData.summary.totalTransactions} nomor bukti pembayaran dengan total{' '}
                  {parsedData.summary.totalDetailItems} rincian akun.
                </p>
              </div>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center justify-center space-x-2 bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex-shrink-0"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                    <span>Membuat Excel...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>Unduh OtherPayment.xlsx</span>
                  </>
                )}
              </button>
            </div>

            {/* Step 3: Statistics */}
            <SummaryCards summary={parsedData.summary} />

            {/* Step 4: Options Settings */}
            <OptionsPanel options={options} onChange={setOptions} />

            {/* Step 5: Interactive Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pratinjau Data Konversi</h3>
                  <p className="text-xs text-slate-500">
                    Periksa hierarki baris HEADER (Hijau) dan ACCOUNT (Biru) sebelum mengunduh
                  </p>
                </div>
              </div>

              <PreviewTable groups={parsedData.groups} sourceRows={parsedData.rows} options={options} />
            </div>
          </div>
        )}

        {/* Guidance section */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Petunjuk Impor ke Accurate Online</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
              <p className="font-semibold text-slate-800">1. Menu Accurate Online</p>
              <p className="leading-relaxed">
                Masuk ke menu <strong>Kas &amp; Bank</strong> &rarr; <strong>Pembayaran</strong>, lalu klik tombol{' '}
                <strong>Impor Data</strong> (ikon folder/titik tiga di kanan atas).
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
              <p className="font-semibold text-slate-800">2. Pilih File Hasil Konversi</p>
              <p className="leading-relaxed">
                Pilih file <em>OtherPayment_...xlsx</em> yang telah diunduh dari aplikasi ini. Pastikan sheet pertama yang
                dipilih adalah <strong>Template Pembayaran</strong>.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
              <p className="font-semibold text-slate-800">3. Pemetaan &amp; Eksekusi</p>
              <p className="leading-relaxed">
                Kolom sudah disesuaikan persis dengan template resmi Accurate Online, sehingga pemetaan kolom akan otomatis
                cocok tanpa perlu penyesuaian manual.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <p>Aplikasi Konverter Accurate Online &bull; Dibuat khusus untuk efisiensi akuntansi &amp; keuangan</p>
      </footer>
    </div>
  );
}
