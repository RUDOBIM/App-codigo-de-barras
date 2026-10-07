import React, { useState, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Archive,
  Search,
  History,
  Sparkles,
  HelpCircle,
  ScanLine,
  Info,
  CheckCircle2,
  Barcode,
  ArrowRight,
  BookmarkCheck,
  AlertTriangle,
} from 'lucide-react';

import {
  ProductItem,
  BarcodeAppearanceOptions,
  ParseResult,
  HistoricalBarcodeItem,
} from './types/barcode';
import {
  parseProductListText,
  exportTiendaTekCsv,
  downloadBlob,
  buildEan13Svg,
  svgToPngBlob,
} from './utils/ean13';
import {
  getBarcodeHistory,
  saveBarcodesToHistory,
  getNextSafeReferenceNumber,
} from './utils/historyStorage';

import { Navbar } from './components/Navbar';
import { CompanyPrefixForm } from './components/CompanyPrefixForm';
import { ProductInputSection } from './components/ProductInputSection';
import { BarcodeCustomizer } from './components/BarcodeCustomizer';
import { BarcodeCard } from './components/BarcodeCard';
import { GS1InspectorModal } from './components/GS1InspectorModal';
import { PrintSheetModal } from './components/PrintSheetModal';
import { ScannerTester } from './components/ScannerTester';
import { BarcodeHistoryView } from './components/BarcodeHistoryView';

const INITIAL_TEXT = `Refresco cola 600 ml ; 18.50
Papas fritas 45 g ; 15.00
Galletas de avena ; 12.00 ; 25`;

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'generator' | 'labels' | 'history' | 'inspector' | 'scanner'>('generator');

  // GS1 Settings
  const [prefix, setPrefix] = useState('7501234');
  const [startRef, setStartRef] = useState(1);
  const [rawText, setRawText] = useState(INITIAL_TEXT);

  // Appearance Settings (Default title: 'Miscelánea Ternuritas')
  const [options, setOptions] = useState<BarcodeAppearanceOptions>({
    moduleWidth: 2,
    barHeight: 70,
    barColor: '#000000',
    bgColor: '#ffffff',
    storeTitle: 'Miscelánea Ternuritas',
    showStoreTitle: true,
    displayMode: 'np',
    showCurrency: true,
    currencyPrefix: 'MXN',
    includeBorder: false,
    fontSize: 12,
  });

  // Persistent History
  const [history, setHistory] = useState<HistoricalBarcodeItem[]>(() => getBarcodeHistory());
  const [historyFeedback, setHistoryFeedback] = useState<string | null>(null);

  // Parsed Items
  const [items, setItems] = useState<ProductItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [inspectingItem, setInspectingItem] = useState<ProductItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Refresh history from localStorage
  const refreshHistory = () => {
    setHistory(getBarcodeHistory());
  };

  // Next safe reference number from persistent history to avoid repeating numbers
  const nextSafeRef = useMemo(() => {
    return getNextSafeReferenceNumber(prefix, 1);
  }, [prefix, history]);

  // Generate / Recompute barcodes whenever prefix, startRef, rawText or history changes
  const runBuild = () => {
    const result: ParseResult = parseProductListText(rawText, prefix, startRef, history);
    if (result.error) {
      setErrorMsg(result.error);
      setItems([]);
    } else {
      setErrorMsg(undefined);
      setItems(result.items);
    }
  };

  useEffect(() => {
    runBuild();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, startRef, rawText, history]);

  // Count items that have already been registered in history
  const historyCollisionCount = useMemo(() => {
    return items.filter((it) => it.isInHistory).length;
  }, [items]);

  // Filtered items by search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        it.fullCode.includes(q) ||
        it.refString.includes(q)
    );
  }, [items, searchTerm]);

  // Save current batch to history
  const handleSaveBatchToHistory = (silent = false) => {
    if (items.length === 0) return;
    const res = saveBarcodesToHistory(
      items,
      prefix,
      options.storeTitle || 'Miscelánea Ternuritas'
    );
    refreshHistory();

    if (!silent) {
      if (res.addedCount > 0) {
        setHistoryFeedback(
          `¡${res.addedCount} código${res.addedCount > 1 ? 's' : ''} registrado${res.addedCount > 1 ? 's' : ''} con éxito en el historial! (Negocio: ${options.storeTitle || 'Miscelánea Ternuritas'})`
        );
      } else {
        setHistoryFeedback('Todos los códigos de este lote ya estaban registrados en el historial.');
      }
      setTimeout(() => setHistoryFeedback(null), 4000);
    }
  };

  // TiendaTek CSV Export handler (also automatically registers to history)
  const handleExportCsv = (format: 'tiendatek_standard' | 'tiendatek_inventory' = 'tiendatek_standard') => {
    if (items.length === 0) return;
    handleSaveBatchToHistory(true);
    const csvContent = exportTiendaTekCsv(items, format);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `codigos_tiendatek_gs1_${prefix}.csv`);
  };

  // Bulk ZIP Download for all barcodes in SVG
  const handleDownloadAllZip = async (format: 'svg' | 'png') => {
    if (items.length === 0 || isZipping) return;
    try {
      setIsZipping(true);
      handleSaveBatchToHistory(true);
      const zip = new JSZip();

      if (format === 'svg') {
        items.forEach((it) => {
          const svgContent = buildEan13Svg(it, options);
          const cleanName = it.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25);
          zip.file(`${it.fullCode}_${cleanName}.svg`, svgContent);
        });
      } else {
        // PNG export
        for (const it of items) {
          const svgContent = buildEan13Svg(it, options);
          const pngBlob = await svgToPngBlob(svgContent, 3);
          const cleanName = it.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25);
          zip.file(`${it.fullCode}_${cleanName}.png`, pngBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `EAN13_GS1_TiendaTek_${format.toUpperCase()}_${prefix}.zip`);
    } catch (err) {
      console.error('Error bundling ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Load items from History view into active generator
  const handleLoadHistoryIntoGenerator = (historyItems: HistoricalBarcodeItem[]) => {
    if (historyItems.length === 0) return;
    const formattedLines = historyItems
      .map((h) => `${h.name} ; ${h.price} ; ${h.ref}`)
      .join('\n');
    setRawText(formattedLines);
    setActiveTab('generator');
  };

  // Interactive Table Handlers
  const handleQuickAddProduct = (name: string, price: string, ref?: number) => {
    const refPart = ref !== undefined ? ` ; ${ref}` : '';
    const newEntry = `${name} ; ${price}${refPart}`;
    setRawText((prev) => (prev.trim() ? `${prev.trim()}\n${newEntry}` : newEntry));
  };

  const handleDeleteProduct = (index: number) => {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    lines.splice(index, 1);
    setRawText(lines.join('\n'));
  };

  const handleUpdateProduct = (
    index: number,
    field: keyof ProductItem,
    val: string | number
  ) => {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    if (!lines[index]) return;

    const parts = lines[index].split(';').map((p) => p.trim());
    if (field === 'name') parts[0] = String(val);
    if (field === 'price') parts[1] = String(val);
    if (field === 'ref') parts[2] = String(val);

    lines[index] = parts.join(' ; ');
    setRawText(lines.join('\n'));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportCsv={() => handleExportCsv('tiendatek_standard')}
        onPrintClick={() => {
          handleSaveBatchToHistory(true);
          setIsPrintModalOpen(true);
        }}
        itemCount={items.length}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Subheader / Context Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-mono">
                Estándar Oficial GS1 México · Prefijo País 750
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-medium text-teal-200">
                Título predeterminado: <strong>&ldquo;Miscelánea Ternuritas&rdquo;</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Generador Profesional de Códigos de Barras EAN-13
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Cálculo de dígito verificador Módulo 10, barras de guarda y zonas de silencio GS1. Historial automático integrado para evitar duplicados y compatibilidad total con <strong>TiendaTek</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => handleSaveBatchToHistory(false)}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors shadow-xs disabled:opacity-40"
              title="Registrar los códigos generados en el historial persistente para evitar repetirlos en el futuro"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Guardar en Historial</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportCsv('tiendatek_standard')}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-xs disabled:opacity-40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV TiendaTek</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleSaveBatchToHistory(true);
                setIsPrintModalOpen(true);
              }}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-40"
            >
              <Printer className="w-3.5 h-3.5 text-teal-300" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Global Feedback notification for saving to history */}
        {historyFeedback && (
          <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-900 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{historyFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className="font-bold underline text-teal-800 hover:text-teal-950 ml-2"
            >
              Ver en Historial →
            </button>
          </div>
        )}

        {/* History Collision Warning Banner in Generator */}
        {activeTab === 'generator' && historyCollisionCount > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <strong>Atención: {historyCollisionCount} código(s) ya fueron emitidos en el historial previo.</strong>
                <p className="text-amber-700 text-[11px] mt-0.5">
                  Para no duplicar códigos en TiendaTek, puedes avanzar el consecutivo al siguiente número libre (#{nextSafeRef}).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStartRef(nextSafeRef)}
              className="px-3 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors shrink-0 text-xs"
            >
              Avanzar a #{nextSafeRef}
            </button>
          </div>
        )}

        {/* Tab content routing */}
        {activeTab === 'history' && (
          <BarcodeHistoryView
            history={history}
            onRefreshHistory={refreshHistory}
            onLoadIntoGenerator={handleLoadHistoryIntoGenerator}
            options={options}
          />
        )}

        {activeTab === 'inspector' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                Inspector y Auditoría GS1 México (Módulo 10)
              </h2>
              <p className="text-xs text-slate-600 mb-4">
                Selecciona cualquier producto generado de la lista para ver la fórmula matemática detallada paso a paso que exige GS1 México:
              </p>
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Primero ingresa productos en el generador para auditar sus dígitos verificadores.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => setInspectingItem(it)}
                      className="p-3.5 text-left border border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50/30 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{it.name}</h4>
                        <span className="font-mono text-xs text-teal-700 font-semibold">{it.fullCode}</span>
                      </div>
                      <span className="text-[11px] font-medium text-teal-700 bg-teal-100/60 px-2 py-1 rounded">
                        Auditar CD: {it.checkDigit}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'scanner' && (
          <ScannerTester items={items} />
        )}

        {activeTab === 'labels' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Vista Previa de Etiquetas para Impresión
                </h2>
                <p className="text-xs text-slate-500">
                  Configura plantillas Avery (30 por hoja), etiquetas para góndola o rollos continuos para impresoras térmicas POS.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleSaveBatchToHistory(true);
                  setIsPrintModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Abrir Configurador de Impresión</span>
              </button>
            </div>

            {/* Quick preview grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {items.map((it, idx) => (
                <div key={it.id} className="p-3 bg-white border border-dashed border-slate-300 rounded-lg text-center">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: buildEan13Svg(it, {
                        ...options,
                        moduleWidth: 1.3,
                        barHeight: 50,
                      }),
                    }}
                    className="flex justify-center"
                  />
                  <div className="mt-1 font-mono text-[11px] text-slate-400">Etiqueta #{idx + 1}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="space-y-6">
            {/* Top Config Row: Prefix + Appearance */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5">
                <CompanyPrefixForm
                  prefix={prefix}
                  setPrefix={setPrefix}
                  startRef={startRef}
                  setStartRef={setStartRef}
                  itemCount={items.length}
                  nextSafeRef={nextSafeRef}
                />
              </div>

              <div className="lg:col-span-7">
                <BarcodeCustomizer
                  options={options}
                  setOptions={setOptions}
                />
              </div>
            </div>

            {/* Product input section */}
            <ProductInputSection
              rawText={rawText}
              setRawText={setRawText}
              onGenerate={runBuild}
              items={items}
              errorMsg={errorMsg}
              onQuickAddProduct={handleQuickAddProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateProduct={handleUpdateProduct}
            />

            {/* Catalog Output & Action Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-3">
                <div className="flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-teal-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Códigos Generados ({items.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Título: <strong>{options.storeTitle || 'Miscelánea Ternuritas'}</strong> · Listos para descargar o guardar en historial.
                    </p>
                  </div>
                </div>

                {/* Search Bar & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filtrar por nombre o código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 w-52 sm:w-60"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  {/* Bulk Actions */}
                  {items.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSaveBatchToHistory(false)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors border border-teal-300"
                        title="Guardar estos códigos en el historial persistente para que nunca se repitan"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5 text-teal-700" />
                        <span>Guardar Historial</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadAllZip('svg')}
                        disabled={isZipping}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                        title="Descargar todos los códigos vectoriales en un solo archivo ZIP"
                      >
                        <Archive className="w-3.5 h-3.5 text-teal-600" />
                        <span>ZIP (SVG)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadAllZip('png')}
                        disabled={isZipping}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                        title="Descargar todas las imágenes PNG en un solo archivo ZIP"
                      >
                        <Archive className="w-3.5 h-3.5 text-indigo-600" />
                        <span>ZIP (PNG)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportCsv('tiendatek_standard')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
                        title="Descargar lista de productos con formato CSV para TiendaTek"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                        <span>CSV TiendaTek</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Barcodes Grid */}
              {items.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 mb-3">
                    <Barcode className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">No hay códigos generados</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Verifica que tu prefijo GS1 de 7 a 10 dígitos comience con 750 y agrega tus productos arriba.
                  </p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No se encontraron productos que coincidan con la búsqueda &quot;{searchTerm}&quot;.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredItems.map((item, index) => (
                    <BarcodeCard
                      key={item.id}
                      item={item}
                      index={index}
                      options={options}
                      onInspect={(it) => setInspectingItem(it)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* TiendaTek Integration Guide Footer */}
            <div className="bg-slate-100/80 rounded-xl border border-slate-200/80 p-5 text-xs text-slate-600 space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                ¿Cómo usar estos códigos con tu punto de venta TiendaTek?
              </h4>
              <p>
                1. <strong>Importación:</strong> Descarga el archivo CSV generado y en tu panel de TiendaTek dirígete a <em>Inventario &gt; Importar Productos</em>.
              </p>
              <p>
                2. <strong>Etiquetado:</strong> Imprime tus códigos en hojas autoadheribles o impresora térmica con el botón <em>Imprimir Etiquetas</em> (con el membrete de &ldquo;Miscelánea Ternuritas&rdquo;).
              </p>
              <p>
                3. <strong>Venta:</strong> Escanea el código con tu lector de códigos de barras USB o con la cámara de TiendaTek en el punto de cobro; el sistema reconocerá el artículo y su precio al instante.
              </p>
              <p>
                4. <strong>Historial Antidupicados:</strong> Los códigos quedan registrados en la pestaña <em>Historial</em> para que nunca reutilices una referencia por error.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* GS1 Modulo 10 Inspector Modal */}
      <GS1InspectorModal
        item={inspectingItem}
        onClose={() => setInspectingItem(null)}
      />

      {/* Printable Sheet Modal */}
      <PrintSheetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        items={items}
        options={options}
      />
    </div>
  );
}
