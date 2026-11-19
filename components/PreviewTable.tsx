'use client';

import React, { useState } from 'react';
import { PaymentGroup, SourceRow, ConversionOptions, formatAccountCode, cleanText } from '@/lib/converter';
import { formatRupiah } from './SummaryCards';
import { Search, ChevronDown, ChevronRight, FileSpreadsheet, ListFilter, Building2, Landmark } from 'lucide-react';

interface PreviewTableProps {
  groups: PaymentGroup[];
  sourceRows: SourceRow[];
  options: ConversionOptions;
}

export default function PreviewTable({ groups, sourceRows, options }: PreviewTableProps) {
  const [activeTab, setActiveTab] = useState<'output' | 'source' | 'breakdown'>('output');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [expandAll, setExpandAll] = useState(true);

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (g.noBukti.toLowerCase().includes(term)) return true;
    if (g.kasBankShort.toLowerCase().includes(term)) return true;
    if (g.items.some((i) => i.namaAkun.toLowerCase().includes(term) || i.keterangan.toLowerCase().includes(term))) {
      return true;
    }
    return false;
  });

  // Filter source rows
  const filteredSourceRows = sourceRows.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.noBukti.toLowerCase().includes(term) ||
      r.keterangan.toLowerCase().includes(term) ||
      r.namaAkun.toLowerCase().includes(term) ||
      r.namaDepartemen.toLowerCase().includes(term)
    );
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? !expandAll : !prev[key],
    }));
  };

  const toggleAll = () => {
    const nextState = !expandAll;
    setExpandAll(nextState);
    const newExpanded: { [key: string]: boolean } = {};
    groups.forEach((g) => {
      newExpanded[g.noBukti] = nextState;
    });
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header toolbar */}
      <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('output')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'output'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Hasil OtherPayment ({filteredGroups.length} Transaksi)
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'source'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Data Sumber ({filteredSourceRows.length} Baris)
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'breakdown'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Distribusi Akun &amp; Dept
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No. Bukti, Akun, Ket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {activeTab === 'output' && (
            <button
              onClick={toggleAll}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center space-x-1"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>{expandAll ? 'Ciutkan Semua' : 'Bentangkan Semua'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
        {activeTab === 'output' && (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100/90 text-slate-700 font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-10">#</th>
                <th className="py-2.5 px-3 w-28">Tipe</th>
                <th className="py-2.5 px-3">No Pembayaran / No Akun</th>
                <th className="py-2.5 px-3">Kas/Bank / Nama Akun</th>
                <th className="py-2.5 px-3">No Cek / Nilai Akun</th>
                <th className="py-2.5 px-3">Tanggal / Departemen</th>
                <th className="py-2.5 px-3">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGroups.map((group, gIdx) => {
                const isExpanded = expandedGroups[group.noBukti] ?? expandAll;
                const rawKasBank = options.useCleanAccountCode ? group.kasBankShort : group.kasBankRaw;
                const kasBank = formatAccountCode(rawKasBank, options.useCleanAccountCode, options.removeDots);

                let catatanHeader = '';
                if (options.catatanHeaderMode === 'first') {
                  catatanHeader = group.items[0]?.keterangan || '';
                } else if (options.catatanHeaderMode === 'concat') {
                  const uniqueKets = Array.from(new Set(group.items.map((i) => i.keterangan).filter(Boolean)));
                  catatanHeader = uniqueKets.join('; ');
                }

                return (
                  <React.Fragment key={group.noBukti || gIdx}>
                    {/* HEADER ROW */}
                    <tr className="bg-emerald-50/70 hover:bg-emerald-100/60 font-medium transition-colors border-t-2 border-emerald-200/80">
                      <td className="py-2 px-3 text-slate-400">
                        <button onClick={() => toggleGroup(group.noBukti)} className="text-emerald-700">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#008000] text-white tracking-wide">
                          HEADER
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {options.fillNoPembayaran ? group.noBukti : <span className="text-slate-400 italic">Otomatis Counter</span>}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                          {kasBank}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        {options.fillNoCek ? group.noBukti : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 font-mono">
                        {group.tanggalFormatted}
                      </td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-xs" title={catatanHeader}>
                        {catatanHeader || '-'}
                      </td>
                    </tr>

                    {/* ACCOUNT ROWS */}
                    {isExpanded &&
                      group.items.map((item, itemIdx) => {
                        const rawNoAkun = options.useCleanAccountCode ? item.debitShort : item.debitFull;
                        const noAkun = formatAccountCode(rawNoAkun, options.useCleanAccountCode, options.removeDots);
                        const namaDept = options.cleanDepartment ? cleanText(item.namaDepartemen) : item.namaDepartemen;

                        return (
                          <tr key={`${group.noBukti}_item_${itemIdx}`} className="bg-white hover:bg-blue-50/40 transition-colors">
                            <td className="py-1.5 px-3 text-slate-300 text-right font-mono text-[10px]">
                              {itemIdx + 1}
                            </td>
                            <td className="py-1.5 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#4F81BD] text-white tracking-wide">
                                ACCOUNT
                              </span>
                            </td>
                            <td className="py-1.5 px-3">
                              <span className="font-mono bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-blue-200">
                                {noAkun}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-slate-800 font-medium">
                              {item.namaAkun}
                            </td>
                            <td className="py-1.5 px-3 font-semibold text-slate-900 font-mono">
                              {formatRupiah(item.nilai)}
                            </td>
                            <td className="py-1.5 px-3 text-slate-600">
                              {namaDept || '-'}
                            </td>
                            <td className="py-1.5 px-3 text-slate-500 italic truncate max-w-xs" title={item.keterangan}>
                              {item.keterangan || '-'}
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'source' && (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100/90 text-slate-700 font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Baris</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">No. Bukti</th>
                <th className="py-2.5 px-3">Keterangan</th>
                <th className="py-2.5 px-3">Debit (Akun)</th>
                <th className="py-2.5 px-3">Kredit (Kas/Bank)</th>
                <th className="py-2.5 px-3 text-right">Nilai</th>
                <th className="py-2.5 px-3">Nama Akun</th>
                <th className="py-2.5 px-3">Nama Departemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSourceRows.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 text-slate-400 font-mono">{r.rowNumber}</td>
                  <td className="py-2 px-3 font-mono">{r.tanggal}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{r.noBukti}</td>
                  <td className="py-2 px-3 text-slate-600">{r.keterangan}</td>
                  <td className="py-2 px-3 font-mono text-blue-700">{r.debitShort || r.debitFull}</td>
                  <td className="py-2 px-3 font-mono text-emerald-700">{r.kreditShort || r.kreditFull}</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">{formatRupiah(r.nilai)}</td>
                  <td className="py-2 px-3">{r.namaAkun}</td>
                  <td className="py-2 px-3 text-slate-500">{r.namaDepartemen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'breakdown' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Accounts breakdown */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-800 font-semibold mb-3 text-sm">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>Ringkasan Akun Kas/Bank (Kredit)</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {Array.from(new Set(sourceRows.map((r) => r.kreditShort || r.kreditFull))).map((bankCode) => {
                  const items = sourceRows.filter((r) => (r.kreditShort || r.kreditFull) === bankCode);
                  const total = items.reduce((sum, i) => sum + i.nilai, 0);
                  const voucherCount = new Set(items.map((i) => i.noBukti)).size;
                  return (
                    <div key={bankCode} className="bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-800 bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                          {bankCode}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {voucherCount} voucher &bull; {items.length} baris
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {formatRupiah(total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Departments breakdown */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-800 font-semibold mb-3 text-sm">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Ringkasan Departemen Terlibat</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {Array.from(new Set(sourceRows.map((r) => cleanText(r.namaDepartemen) || 'Tanpa Departemen'))).map((dept) => {
                  const count = sourceRows.filter((r) => (cleanText(r.namaDepartemen) || 'Tanpa Departemen') === dept).length;
                  return (
                    <div key={dept} className="bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 truncate max-w-xs" title={dept}>
                        {dept}
                      </span>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {count} item
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
