import React, { useState } from 'react';
import { Download, Copy, Check, Info, FileCode2, Image as ImageIcon } from 'lucide-react';
import { ProductItem, BarcodeAppearanceOptions } from '../types/barcode';
import { buildEan13Svg, downloadBlob, svgToPngBlob } from '../utils/ean13';

interface BarcodeCardProps {
  item: ProductItem;
  index: number;
  options: BarcodeAppearanceOptions;
  onInspect: (item: ProductItem) => void;
}

export const BarcodeCard: React.FC<BarcodeCardProps> = ({
  item,
  index,
  options,
  onInspect,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);

  const svgContent = buildEan13Svg(item, options);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(item.fullCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const cleanFileName = `EAN13_${item.fullCode}_${item.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20)}.svg`;
    downloadBlob(blob, cleanFileName);
  };

  const handleDownloadPng = async () => {
    try {
      setDownloadingPng(true);
      const blob = await svgToPngBlob(svgContent, 3);
      const cleanFileName = `EAN13_${item.fullCode}_${item.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20)}.png`;
      downloadBlob(blob, cleanFileName);
    } catch (err) {
      console.error('Error generating PNG:', err);
    } finally {
      setDownloadingPng(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-slate-400">#{index + 1}</span>
          <span className="font-medium text-slate-800 truncate" title={item.name}>
            {item.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {item.isInHistory && (
            <span
              className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded"
              title={`Este código ya fue guardado en el historial para "${item.historicalItem?.name || ''}"`}
            >
              En historial
            </span>
          )}
          {item.price && (
            <span className="font-mono font-bold text-teal-700">
              ${Number(item.price).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* SVG Barcode Preview */}
      <div className="py-2 px-1 flex items-center justify-center overflow-x-auto bg-slate-50/50 rounded-lg border border-slate-100">
        <div
          dangerouslySetInnerHTML={{ __html: svgContent }}
          className="max-w-full flex justify-center drop-shadow-xs"
        />
      </div>

      {/* Code Breakdown Pill & Copy */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          <span className="text-teal-700 font-semibold">{item.fullCode.slice(0, 3)}</span>
          <span>{item.fullCode.slice(3, 12)}</span>
          <span className="text-rose-600 font-bold bg-rose-100/70 px-0.5 rounded">
            {item.checkDigit}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
          title="Copiar código al portapapeles"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-xs">
        <button
          type="button"
          onClick={handleDownloadSvg}
          className="inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-md transition-colors"
          title="Descargar gráfico vectorial SVG para diseño o imprenta"
        >
          <FileCode2 className="w-3.5 h-3.5 text-teal-600" />
          <span>SVG</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={downloadingPng}
          className="inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-md transition-colors disabled:opacity-50"
          title="Descargar imagen rasterizada PNG de alta resolución (300 DPI)"
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
          <span>{downloadingPng ? '...' : 'PNG'}</span>
        </button>

        <button
          type="button"
          onClick={() => onInspect(item)}
          className="inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors"
          title="Ver cálculo de Dígito Verificador Módulo 10"
        >
          <Info className="w-3.5 h-3.5 text-amber-600" />
          <span>GS1</span>
        </button>
      </div>
    </div>
  );
};
