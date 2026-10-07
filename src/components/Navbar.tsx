import React from 'react';
import { Download, Printer, Barcode, FileSpreadsheet, ScanLine, HelpCircle, History } from 'lucide-react';

interface NavbarProps {
  activeTab: 'generator' | 'labels' | 'history' | 'inspector' | 'scanner';
  setActiveTab: (tab: 'generator' | 'labels' | 'history' | 'inspector' | 'scanner') => void;
  onExportCsv: () => void;
  onPrintClick: () => void;
  itemCount: number;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onExportCsv,
  onPrintClick,
  itemCount,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand single text element wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Barcode className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            EAN-13 GS1 México <span className="text-teal-400 font-normal text-sm">· TiendaTek</span>
          </span>
        </div>

        {/* Zone 2: clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'generator'
                ? 'bg-slate-800 text-teal-300 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Generador
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-800 text-teal-300 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historial
            {historyCount > 0 && (
              <span className="text-[11px] bg-teal-500/20 text-teal-300 font-mono px-1.5 py-0.2 rounded font-bold border border-teal-500/30">
                {historyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('labels')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'labels'
                ? 'bg-slate-800 text-teal-300 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Hoja de Impresión
            {itemCount > 0 && (
              <span className="text-xs bg-slate-700 text-teal-300 font-mono px-1.5 py-0.2 rounded">
                {itemCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'inspector'
                ? 'bg-slate-800 text-teal-300 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Inspector GS1 (M10)
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'scanner'
                ? 'bg-slate-800 text-teal-300 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            Validador
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            disabled={itemCount === 0}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Exportar archivo CSV listo para importar en TiendaTek"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV TiendaTek</span>
          </button>

          <button
            onClick={onPrintClick}
            disabled={itemCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
