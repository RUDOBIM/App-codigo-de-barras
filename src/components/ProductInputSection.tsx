import React, { useState } from 'react';
import {
  ListPlus,
  Table,
  FileText,
  Upload,
  Sparkles,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { SAMPLE_MEXICAN_PRODUCTS } from '../utils/ean13';
import { ProductItem } from '../types/barcode';

interface ProductInputSectionProps {
  rawText: string;
  setRawText: (val: string) => void;
  onGenerate: () => void;
  items: ProductItem[];
  errorMsg?: string;
  onQuickAddProduct: (name: string, price: string, ref?: number) => void;
  onDeleteProduct: (index: number) => void;
  onUpdateProduct: (index: number, field: keyof ProductItem, val: string | number) => void;
}

export const ProductInputSection: React.FC<ProductInputSectionProps> = ({
  rawText,
  setRawText,
  onGenerate,
  items,
  errorMsg,
  onQuickAddProduct,
  onDeleteProduct,
  onUpdateProduct,
}) => {
  const [inputMode, setInputMode] = useState<'text' | 'table'>('text');
  const [newRowName, setNewRowName] = useState('');
  const [newRowPrice, setNewRowPrice] = useState('');
  const [newRowRef, setNewRowRef] = useState('');

  const lineCount = rawText.split('\n').filter((l) => l.trim().length > 0).length;

  const handleLoadSamples = () => {
    setRawText(SAMPLE_MEXICAN_PRODUCTS);
  };

  const handleClear = () => {
    setRawText('');
  };

  const handleAddSingleRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRowName.trim()) return;

    onQuickAddProduct(
      newRowName.trim(),
      newRowPrice.trim(),
      newRowRef ? parseInt(newRowRef, 10) : undefined
    );
    setNewRowName('');
    setNewRowPrice('');
    setNewRowRef('');
  };

  // CSV Import file handler
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r?\n/).filter(Boolean);
      const parsedRows: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0 && (line.toLowerCase().includes('codigo') || line.toLowerCase().includes('nombre') || line.toLowerCase().includes('precio'))) {
          // Skip header row
          continue;
        }

        // Parse comma or semicolon separated
        // Matches standard TiendaTek csv: codigo_barras,nombre,precio...
        const cols = line.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
        if (cols.length >= 2) {
          // If first col looks like barcode, second is name, third is price
          let name = cols[1];
          let price = cols[2] || '';
          let ref = '';

          // If second col was empty or inverted
          if (!name && cols[0]) {
            name = cols[0];
          }

          if (cols.length >= 4 && cols[3]) {
            ref = cols[3];
          }

          if (name) {
            parsedRows.push(`${name} ; ${price}${ref ? ` ; ${ref}` : ''}`);
          }
        }
      }

      if (parsedRows.length > 0) {
        setRawText(parsedRows.join('\n'));
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <ListPlus className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">2. Lista de Productos para TiendaTek</h2>
        </div>

        {/* Input Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              inputMode === 'text'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Texto Masivo</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              inputMode === 'table'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabla Interactiva</span>
            {items.length > 0 && (
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded">
                {items.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {inputMode === 'text' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Formato por renglón: <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">Nombre ; Precio ; Referencia (opcional)</code>
            </span>
            <span className="font-mono">{lineCount} líneas detectadas</span>
          </div>

          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Refresco cola 600 ml ; 19.50\nPapas fritas 45 g ; 18.00\nGalletas de avena ; 16.00 ; 25`}
              rows={7}
              className="w-full font-mono text-xs sm:text-sm p-3.5 border border-slate-300 rounded-lg bg-slate-50/40 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSamples}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100/80 rounded-md border border-teal-200/80 transition-colors"
                title="Carga 10 productos mexicanos típicos de miscelánea"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Cargar Ejemplos Mexicanos
              </button>

              <label className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-300 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                Importar CSV
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvFileUpload}
                  className="hidden"
                />
              </label>

              {rawText && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onGenerate}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              Generar Códigos EAN-13
            </button>
          </div>
        </div>
      ) : (
        /* Interactive Table Mode */
        <div className="space-y-4">
          {/* Quick Add Row Form */}
          <form onSubmit={handleAddSingleRow} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Nombre del producto (ej. Jabón Líquido 500ml)"
                value={newRowName}
                onChange={(e) => setNewRowName(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder="Precio ($)"
                value={newRowPrice}
                onChange={(e) => setNewRowPrice(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                placeholder="Ref (opc)"
                value={newRowRef}
                onChange={(e) => setNewRowRef(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
          </form>

          {/* Table List */}
          {items.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-xs">
              No hay productos cargados aún. Usa el formulario de arriba o cambia a &quot;Texto Masivo&quot; para pegar tu lista.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Producto</th>
                    <th className="py-2 px-3">Precio</th>
                    <th className="py-2 px-3">Ref GS1</th>
                    <th className="py-2 px-3 font-mono">Código EAN-13</th>
                    <th className="py-2 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={it.name}
                          onChange={(e) => onUpdateProduct(idx, 'name', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none font-medium text-slate-800"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-slate-400">$</span>
                          <input
                            type="text"
                            value={it.price}
                            onChange={(e) => onUpdateProduct(idx, 'price', e.target.value)}
                            className="w-16 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none text-slate-800"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono text-teal-700 font-semibold">
                        {it.refString}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 tracking-wider">
                        {it.fullCode}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Eliminar de la lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Error / Warning Alert banner */}
      {errorMsg && (
        <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Atención en los datos: </strong>
            {errorMsg}
          </div>
        </div>
      )}
    </div>
  );
};
