'use client';

import React from 'react';
import { FileSpreadsheet, Download, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">Accurate Converter</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Other Payment
              </span>
            </div>
            <p className="text-xs text-slate-500">Konversi Format Sumber.xlsx &rarr; OtherPayment.xlsx Accurate Online</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/samples/Sumber_Contoh.xlsx"
            download="Sumber_Contoh.xlsx"
            className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
            title="Unduh contoh file sumber"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Contoh Sumber.xlsx</span>
          </a>

          <a
            href="/template/OtherPayment_Template.xlsx"
            download="OtherPayment_Template.xlsx"
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200"
            title="Unduh template resmi OtherPayment"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Template Accurate</span>
          </a>
        </div>
      </div>
    </header>
  );
}
