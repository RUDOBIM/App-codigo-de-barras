import React, { useState, useMemo } from 'react';
import {
  History,
  Trash2,
  FileSpreadsheet,
  Search,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  Barcode,
  Calendar,
  Store,
  Eye,
  Download,
  Info,
} from 'lucide-react';
import { HistoricalBarcodeItem, BarcodeAppearanceOptions } from '../types/barcode';
import { exportHistoryToCsv, clearBarcodeHistory, deleteHistoricalItem } from '../utils/historyStorage';
import { downloadBlob, buildEan13Svg, svgToPngBlob } from '../utils/ean13';

interface BarcodeHistoryViewProps {
  history: HistoricalBarcodeItem[];
  onRefreshHistory: () => void;
  onLoadIntoGenerator: (items: HistoricalBarcodeItem[]) => void;
  options: BarcodeAppearanceOptions;
}

export const BarcodeHistoryView: React.FC<BarcodeHistoryViewProps> = ({
  history,
  onRefreshHistory,
  onLoadIntoGenerator,
  options,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [previewItem, setPreviewItem] = useState<HistoricalBarcodeItem | null>(null);

  // Filter history items by search
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const q = searchTerm.toLowerCase();
    return history.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.fullCode.includes(q) ||
        h.refString.includes(q) ||
        h.storeTitle.toLowerCase().includes(q) ||
        h.generatedAt.toLowerCase().includes(q)
    );
  }, [history, searchTerm]);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      // Ignore
    }
  };

  const handleDeleteOne = (id: string) => {
    deleteHistoricalItem(id);
    onRefreshHistory();
  };

  const handleClearAll = () => {
    clearBarcodeHistory();
    setShowClearConfirm(false);
    onRefreshHistory();
  };

  const handleExportCsv = () => {
    if (history.length === 0) return;
    const csvContent = exportHistoryToCsv(history);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `historial_codigos_tiendatek_gs1.csv`);
  };

  const handleDownloadSvg = (item: HistoricalBarcodeItem) => {
    const fakeProduct = {
      id: item.id,
      name: item.name,
      price: item.price,
      ref: item.ref,
      refString: item.refString,
      code12: item.code12,
      checkDigit: Number(item.fullCode[12]),
      fullCode: item.fullCode,
      isCustomRef: true,
    };
    const svg = buildEan13Svg(fakeProduct, {
      ...options,
      storeTitle: item.storeTitle || 'Miscelánea Ternuritas',
    });
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `EAN13_${item.fullCode}_${item.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Historial de Códigos Registrados
              </h2>
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                {history.length} en archivo
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Registro permanente para prevenir emisión de códigos duplicados y referencias repetidas.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                title="Exportar archivo CSV con todo el historial para TiendaTek"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                <span>Exportar CSV Maestro</span>
              </button>

              <button
                type="button"
                onClick={() => onLoadIntoGenerator(history)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
                title="Carga todos los artículos de este historial al generador actual"
              >
                <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                <span>Cargar al Generador</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Vaciar Historial</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Clear History */}
      {showClearConfirm && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong>¿Eliminar todos los {history.length} registros del historial?</strong>
              <p className="text-rose-700 text-[11px] mt-0.5">
                Esta acción es irreversible y se perderá la memoria de códigos usados en este navegador.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 bg-rose-600 text-white font-semibold rounded-md hover:bg-rose-700"
            >
              Confirmar Vaciar
            </button>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      {history.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por producto, código EAN-13 o fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Mostrando {filteredHistory.length} de {history.length}
          </span>
        </div>
      )}

      {/* History Data Table */}
      {history.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 mx-auto flex items-center justify-center text-teal-600 mb-3">
            <Barcode className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Aún no hay códigos registrados en el historial
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Cada vez que generes códigos o exportes para TiendaTek, se guardarán automáticamente aquí para evitar colisiones y referencias repetidas.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No hay registros que coincidan con la búsqueda &quot;{searchTerm}&quot;.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Código EAN-13</th>
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3">Precio</th>
                <th className="py-2.5 px-3">Ref GS1</th>
                <th className="py-2.5 px-3">Título en Etiqueta</th>
                <th className="py-2.5 px-3">Registrado</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 tracking-wider">
                      <span className="text-teal-700">{item.fullCode.slice(0, 3)}</span>
                      <span>{item.fullCode.slice(3, 12)}</span>
                      <span className="text-rose-600 bg-rose-50 px-0.5 rounded">
                        {item.fullCode.slice(12)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.fullCode)}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                        title="Copiar código de barras"
                      >
                        {copiedCode === item.fullCode ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-teal-800">
                    ${Number(item.price || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">
                    #{item.refString}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      <Store className="w-3 h-3 text-slate-400" />
                      {item.storeTitle || 'Miscelánea Ternuritas'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {item.generatedAt}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="p-1 text-slate-400 hover:text-teal-700 rounded hover:bg-slate-100"
                        title="Ver etiqueta"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSvg(item)}
                        className="p-1 text-slate-400 hover:text-teal-700 rounded hover:bg-slate-100"
                        title="Descargar SVG"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOne(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                        title="Eliminar de historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal for single historical item */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Etiqueta Histórica</h4>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
            <div className="py-2 flex justify-center bg-slate-50 rounded-lg p-2">
              <div
                dangerouslySetInnerHTML={{
                  __html: buildEan13Svg(
                    {
                      id: previewItem.id,
                      name: previewItem.name,
                      price: previewItem.price,
                      ref: previewItem.ref,
                      refString: previewItem.refString,
                      code12: previewItem.code12,
                      checkDigit: Number(previewItem.fullCode[12]),
                      fullCode: previewItem.fullCode,
                      isCustomRef: true,
                    },
                    {
                      ...options,
                      storeTitle: previewItem.storeTitle || 'Miscelánea Ternuritas',
                      moduleWidth: 2,
                    }
                  ),
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDownloadSvg(previewItem)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Descargar SVG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
