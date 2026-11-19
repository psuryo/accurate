'use client';

import React from 'react';
import { SlidersHorizontal, Settings2, Info } from 'lucide-react';
import { ConversionOptions } from '@/lib/converter';

interface OptionsPanelProps {
  options: ConversionOptions;
  onChange: (options: ConversionOptions) => void;
}

export default function OptionsPanel({ options, onChange }: OptionsPanelProps) {
  const updateOption = <K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
          <Settings2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan Konversi Format Accurate</span>
        </div>
        <span className="text-xs text-slate-400">Sesuaikan dengan preferensi Accurate Online Anda</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Format Kode Akun */}
        <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/60">
          <label className="text-xs font-semibold text-slate-700 block">Format Kode Akun & Kas/Bank</label>
          <div className="space-y-1.5">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="codeFormat"
                checked={options.useCleanAccountCode}
                onChange={() => updateOption('useCleanAccountCode', true)}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span>Kode Bersih 6-digit (cth: <strong>614.01</strong> &amp; <strong>110.12</strong>)</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="codeFormat"
                checked={!options.useCleanAccountCode}
                onChange={() => updateOption('useCleanAccountCode', false)}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span>Kode Lengkap (cth: <strong>614.01.1000</strong>)</span>
            </label>
          </div>

          <div className="pt-2 border-t border-slate-200/70">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.removeDots}
                onChange={(e) => updateOption('removeDots', e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Hapus tanda titik (cth: 61401)</span>
            </label>
          </div>
        </div>

        {/* Pemetaan No Bukti */}
        <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/60">
          <label className="text-xs font-semibold text-slate-700 block">Penempatan No. Bukti</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.fillNoPembayaran}
                onChange={(e) => updateOption('fillNoPembayaran', e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Isi kolom <strong>No Pembayaran</strong></span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.fillNoCek}
                onChange={(e) => updateOption('fillNoCek', e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Isi kolom <strong>No Cek</strong></span>
            </label>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
            Jika No Pembayaran dikosongkan, Accurate Online akan membuat nomor otomatis.
          </p>
        </div>

        {/* Catatan & Departemen */}
        <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/60">
          <label className="text-xs font-semibold text-slate-700 block">Catatan Header & Departemen</label>
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-600 block">Catatan pada baris HEADER:</label>
            <select
              value={options.catatanHeaderMode}
              onChange={(e) => updateOption('catatanHeaderMode', e.target.value as any)}
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="first">Keterangan baris pertama</option>
              <option value="concat">Gabungan semua keterangan</option>
              <option value="empty">Kosongkan catatan header</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-200/70">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.cleanDepartment}
                onChange={(e) => updateOption('cleanDepartment', e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Bersihkan spasi tersembunyi pada Departemen</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
