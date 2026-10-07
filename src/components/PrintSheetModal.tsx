import React, { useState } from 'react';
import { Printer, X, Sliders, CheckSquare, Layers, FileSpreadsheet } from 'lucide-react';
import { ProductItem, BarcodeAppearanceOptions, PrintSheetConfig, SheetTemplate } from '../types/barcode';
import { buildEan13Svg } from '../utils/ean13';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ProductItem[];
  options: BarcodeAppearanceOptions;
}

const TEMPLATE_PRESETS: Record<SheetTemplate, Partial<PrintSheetConfig>> = {
  avery_3x10: {
    columns: 3,
    rowsPerPage: 10,
    labelWidthMm: 66,
    labelHeightMm: 25.4,
    gapMm: 2.5,
    pageMarginMm: 8,
  },
  gondola_2x5: {
    columns: 2,
    rowsPerPage: 5,
    labelWidthMm: 95,
    labelHeightMm: 50,
    gapMm: 4,
    pageMarginMm: 10,
  },
  compact_4x10: {
    columns: 4,
    rowsPerPage: 10,
    labelWidthMm: 48,
    labelHeightMm: 25,
    gapMm: 2,
    pageMarginMm: 6,
  },
  thermal_58mm: {
    columns: 1,
    rowsPerPage: 999,
    labelWidthMm: 54,
    labelHeightMm: 35,
    gapMm: 3,
    pageMarginMm: 2,
  },
  thermal_80mm: {
    columns: 1,
    rowsPerPage: 999,
    labelWidthMm: 76,
    labelHeightMm: 40,
    gapMm: 4,
    pageMarginMm: 2,
  },
  custom: {
    columns: 3,
    rowsPerPage: 8,
    labelWidthMm: 65,
    labelHeightMm: 30,
    gapMm: 3,
    pageMarginMm: 8,
  },
};

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  isOpen,
  onClose,
  items,
  options,
}) => {
  const [config, setConfig] = useState<PrintSheetConfig>({
    template: 'avery_3x10',
    columns: 3,
    rowsPerPage: 10,
    labelWidthMm: 66,
    labelHeightMm: 25.4,
    gapMm: 2.5,
    pageMarginMm: 8,
    showProductPrice: true,
    showProductName: true,
    showBarcodeNumber: true,
    copiesPerProduct: 1,
  });

  if (!isOpen) return null;

  const handleTemplateChange = (template: SheetTemplate) => {
    const preset = TEMPLATE_PRESETS[template];
    setConfig((prev) => ({
      ...prev,
      template,
      ...preset,
    }));
  };

  // Expand items by copies
  const expandedItems: ProductItem[] = [];
  items.forEach((item) => {
    for (let c = 0; c < Math.max(1, config.copiesPerProduct); c++) {
      expandedItems.push(item);
    }
  });

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[92vh] flex flex-col border border-slate-200 shadow-2xl print:border-none print:shadow-none print:h-auto print:w-auto">
        {/* Modal Header (Hidden during print) */}
        <div className="bg-white border-b border-slate-200 p-4 sm:p-5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Imprimir Hoja de Etiquetas Adhesivas / Góndola
              </h3>
              <p className="text-xs text-slate-500">
                {expandedItems.length} etiquetas generadas ({items.length} productos × {config.copiesPerProduct} copia{config.copiesPerProduct > 1 ? 's' : ''})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ahora (Ctrl + P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Layout Controls Bar (Hidden during print) */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0 print:hidden text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Plantilla de Hoja
            </label>
            <select
              value={config.template}
              onChange={(e) => handleTemplateChange(e.target.value as SheetTemplate)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-slate-800"
            >
              <option value="avery_3x10">Avery 3×10 (30 etiquetas / Carta)</option>
              <option value="gondola_2x5">Góndola Anaquel 2×5 (10 etiquetas)</option>
              <option value="compact_4x10">Miniatura 4×10 (40 etiquetas)</option>
              <option value="thermal_58mm">Rollo Térmico 58mm (Continuo)</option>
              <option value="thermal_80mm">Rollo Térmico 80mm (Continuo)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Copias por Producto
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={config.copiesPerProduct}
              onChange={(e) => setConfig((p) => ({ ...p, copiesPerProduct: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Columnas por Fila
            </label>
            <input
              type="number"
              min={1}
              max={6}
              value={config.columns}
              onChange={(e) => setConfig((p) => ({ ...p, columns: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-slate-800"
            />
          </div>

          <div className="flex flex-col justify-end">
            <div className="flex flex-wrap items-center gap-3 py-1">
              <label className="inline-flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.showStoreTitle}
                  onChange={(e) => {
                    // Passed via options
                  }}
                  disabled
                  className="rounded border-slate-300 text-teal-600"
                />
                <span className="font-medium text-teal-800">{options.storeTitle || 'Miscelánea Ternuritas'}</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showProductPrice}
                  onChange={(e) => setConfig((p) => ({ ...p, showProductPrice: e.target.checked }))}
                  className="rounded border-slate-300 text-teal-600"
                />
                Precio
              </label>
              <label className="inline-flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showProductName}
                  onChange={(e) => setConfig((p) => ({ ...p, showProductName: e.target.checked }))}
                  className="rounded border-slate-300 text-teal-600"
                />
                Nombre
              </label>
            </div>
          </div>
        </div>

        {/* Printable Canvas View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          <div
            className="mx-auto bg-white shadow-md print:shadow-none print:m-0"
            style={{
              padding: `${config.pageMarginMm}mm`,
              maxWidth: config.template.includes('thermal') ? '380px' : '850px',
            }}
          >
            <div
              className="grid print:grid"
              style={{
                gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
                gap: `${config.gapMm}mm`,
              }}
            >
              {expandedItems.map((item, idx) => {
                // Generate SVG with customized options for this print sheet
                const printOptions: BarcodeAppearanceOptions = {
                  ...options,
                  moduleWidth: config.columns >= 4 ? 1.2 : config.columns === 3 ? 1.5 : 2,
                  barHeight: config.columns >= 4 ? 45 : 55,
                  displayMode:
                    config.showProductName && config.showProductPrice
                      ? 'np'
                      : config.showProductName
                      ? 'n'
                      : 'x',
                  includeBorder: false,
                };
                const svgString = buildEan13Svg(item, printOptions);

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-2 border border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-center break-inside-avoid print:border-slate-400 print:rounded-none bg-white"
                    style={{ minHeight: `${config.labelHeightMm}mm` }}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: svgString }}
                      className="w-full flex justify-center"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden during print) */}
        <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between shrink-0 print:hidden text-xs">
          <span className="text-slate-500">
            Consejo: En el diálogo de impresión, desmarca &quot;Encabezados y pies de página&quot; y selecciona márgenes personalizados o mínimos.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
