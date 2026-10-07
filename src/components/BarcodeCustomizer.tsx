import React from 'react';
import { Sliders, Eye, Palette, Maximize2 } from 'lucide-react';
import { BarcodeAppearanceOptions, BarcodeDisplayMode } from '../types/barcode';

interface BarcodeCustomizerProps {
  options: BarcodeAppearanceOptions;
  setOptions: React.Dispatch<React.SetStateAction<BarcodeAppearanceOptions>>;
}

const PRESET_COLORS = [
  { label: 'Negro GS1', hex: '#000000' },
  { label: 'Azul Marino', hex: '#0a2540' },
  { label: 'Gris Grafito', hex: '#1e293b' },
  { label: 'Verde Bosque', hex: '#0d4a2b' },
  { label: 'Vino Oscuro', hex: '#4c0519' },
];

export const BarcodeCustomizer: React.FC<BarcodeCustomizerProps> = ({
  options,
  setOptions,
}) => {
  const updateOption = <K extends keyof BarcodeAppearanceOptions>(
    key: K,
    val: BarcodeAppearanceOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">3. Apariencia y Formato de Etiqueta</h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">Personalización</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scale (Module Width) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="escala-modulo-input" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Escala de Módulo
            </label>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
              {options.moduleWidth}x
            </span>
          </div>
          <input
            id="escala-modulo-input"
            type="range"
            min="1"
            max="3.5"
            step="0.25"
            value={options.moduleWidth}
            onChange={(e) => updateOption('moduleWidth', parseFloat(e.target.value))}
            className="w-full accent-teal-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>1x (Compacto)</span>
            <span>2x (Estándar)</span>
            <span>3.5x (Grande)</span>
          </div>
        </div>

        {/* Bar Height */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="altura-barras-input" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Altura de Barras
            </label>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
              {options.barHeight} px
            </span>
          </div>
          <input
            id="altura-barras-input"
            type="range"
            min="40"
            max="140"
            step="5"
            value={options.barHeight}
            onChange={(e) => updateOption('barHeight', parseInt(e.target.value, 10))}
            className="w-full accent-teal-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>40 px (Bajo)</span>
            <span>70 px (Recomendado)</span>
            <span>140 px (Alto)</span>
          </div>
        </div>

        {/* Visual Content Elements */}
        <div>
          <label htmlFor="mostrar-elementos-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Mostrar en Etiqueta
          </label>
          <select
            id="mostrar-elementos-select"
            value={options.displayMode}
            onChange={(e) => updateOption('displayMode', e.target.value as BarcodeDisplayMode)}
            className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="np">Nombre y Precio ($ MXN)</option>
            <option value="n">Solo Nombre del Producto</option>
            <option value="x">Solo Código de Barras</option>
          </select>
          <div className="mt-2 flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeBorder}
                onChange={(e) => updateOption('includeBorder', e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Borde suave de corte
            </label>
          </div>
        </div>

        {/* Bar Color Selection */}
        <div>
          <label htmlFor="color-picker-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Color de Barras
          </label>
          <div className="flex items-center gap-1.5 mb-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => updateOption('barColor', c.hex)}
                style={{ backgroundColor: c.hex }}
                title={c.label}
                className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                  options.barColor.toLowerCase() === c.hex.toLowerCase()
                    ? 'ring-2 ring-teal-500 ring-offset-1 border-white'
                    : 'border-slate-300'
                }`}
              />
            ))}
            <div className="relative inline-flex items-center ml-1">
              <input
                id="color-picker-input"
                type="color"
                value={options.barColor}
                onChange={(e) => updateOption('barColor', e.target.value)}
                className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                title="Elegir color personalizado"
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Fondo: <span className="font-mono text-slate-700">Blanco (#FFFFFF)</span> para óptima lectura óptica.
          </div>
        </div>

        {/* Store Title in Barcode Image */}
        <div className="md:col-span-2 lg:col-span-4 pt-3 mt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="titulo-tienda-input" className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Título de Negocio en la Etiqueta</span>
                <span className="text-[10px] text-teal-700 font-mono bg-teal-50 px-1.5 py-0.2 rounded font-normal">
                  Por defecto: Miscelánea Ternuritas
                </span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="titulo-tienda-input"
                type="text"
                value={options.storeTitle}
                onChange={(e) => updateOption('storeTitle', e.target.value)}
                placeholder="Miscelánea Ternuritas"
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={options.showStoreTitle}
                  onChange={(e) => updateOption('showStoreTitle', e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Imprimir título
              </label>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 max-w-sm">
            Aparece en el encabezado superior de cada imagen SVG/PNG y en las hojas de etiquetas impresas.
          </div>
        </div>
      </div>
    </div>
  );
};
