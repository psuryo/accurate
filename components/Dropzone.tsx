'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface DropzoneProps {
  onFileLoaded: (file: File, buffer: ArrayBuffer) => void;
  isLoading: boolean;
  currentFileName?: string;
  onLoadSample: () => void;
}

export default function Dropzone({ onFileLoaded, isLoading, currentFileName, onLoadSample }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    setErrorMessage(null);

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage('Harap unggah file spreadsheet Excel (.xlsx atau .xls).');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      onFileLoaded(file, buffer);
    } catch (err: any) {
      setErrorMessage('Gagal membaca file Excel: ' + (err.message || 'Format tidak valid'));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/60 scale-[1.005]'
            : currentFileName
            ? 'border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/40'
            : 'border-slate-300 hover:border-emerald-400 bg-white hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-transform ${
              isDragOver
                ? 'scale-110 bg-emerald-600 text-white'
                : currentFileName
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            ) : currentFileName ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <UploadCloud className="w-8 h-8 text-slate-600" />
            )}
          </div>

          <div>
            {currentFileName ? (
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  File Terpilih: <span className="underline">{currentFileName}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Klik atau seret file lain untuk mengganti
                </p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-slate-800">
                  Tarik &amp; Letakkan file <span className="text-emerald-700">Sumber.xlsx</span> di sini
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Atau klik untuk memilih file Excel dari komputer Anda (.xlsx, .xls)
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
              Format Kolom: Tanggal &bull; No. bukti &bull; Keterangan &bull; Debit &bull; Kredit &bull; Nilai &bull; Akun &bull; Dept
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center space-x-2 text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Test Button */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-500">
        <span>Ingin mencoba langsung tanpa upload manual?</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLoadSample();
          }}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 text-emerald-700 hover:text-emerald-800 font-semibold hover:underline bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Muat Data Contoh Sumber.xlsx</span>
        </button>
      </div>
    </div>
  );
}
