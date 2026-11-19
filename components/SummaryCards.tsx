'use client';

import React from 'react';
import { Layers, Receipt, Calendar, CreditCard } from 'lucide-react';
import { ConversionSummary } from '@/lib/converter';

interface SummaryCardsProps {
  summary: ConversionSummary;
}

export function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Transaksi */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
          <Receipt className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Transaksi</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{summary.totalTransactions}</span>
            <span className="text-xs text-slate-500">voucher (HEADER)</span>
          </div>
        </div>
      </div>

      {/* Total Baris Rincian */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
          <Layers className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rincian Akun</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{summary.totalDetailItems}</span>
            <span className="text-xs text-slate-500">baris (ACCOUNT)</span>
          </div>
        </div>
      </div>

      {/* Total Nilai Pembayaran */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0">
          <CreditCard className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Nilai</p>
          <p className="text-lg font-bold text-slate-900 truncate" title={formatRupiah(summary.totalAmount)}>
            {formatRupiah(summary.totalAmount)}
          </p>
        </div>
      </div>

      {/* Rentang Tanggal */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 flex-shrink-0">
          <Calendar className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Periode Tanggal</p>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {summary.dateRange.start} {summary.dateRange.start !== summary.dateRange.end && ` - ${summary.dateRange.end}`}
          </p>
        </div>
      </div>
    </div>
  );
}
