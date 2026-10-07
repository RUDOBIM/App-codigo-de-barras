import React, { useState } from 'react';
import { ScanLine, CheckCircle2, AlertTriangle, Search, Volume2, Sparkles, ShoppingBag } from 'lucide-react';
import { ProductItem } from '../types/barcode';
import { calculateCheckDigit } from '../utils/ean13';

interface ScannerTesterProps {
  items: ProductItem[];
}

export const ScannerTester: React.FC<ScannerTesterProps> = ({ items }) => {
  const [scanInput, setScanInput] = useState('');
  const [lastScanned, setLastScanned] = useState<{
    code: string;
    isValidChecksum: boolean;
    isGs1Mexico: boolean;
    matchedProduct?: ProductItem;
    timestamp: string;
  } | null>(null);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = scanInput.trim().replace(/\D/g, '');
    if (!cleanCode) return;

    verifyBarcode(cleanCode);
    setScanInput('');
  };

  const verifyBarcode = (code: string) => {
    let isValidChecksum = false;
    let isGs1Mexico = false;

    if (code.length === 13) {
      isGs1Mexico = code.startsWith('750');
      try {
        const expectedCheck = calculateCheckDigit(code.slice(0, 12));
        isValidChecksum = expectedCheck === Number(code[12]);
      } catch {
        isValidChecksum = false;
      }
    }

    const matched = items.find((it) => it.fullCode === code);

    // Audio beep simulation via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = isValidChecksum ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isValidChecksum ? 1750 : 350, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + (isValidChecksum ? 0.12 : 0.25));
    } catch {
      // Audio not permitted or not supported
    }

    setLastScanned({
      code,
      isValidChecksum,
      isGs1Mexico,
      matchedProduct: matched,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-3xl mx-auto">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-6">
        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
          <ScanLine className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Simulador y Validador de Lector Óptico (Escáner TiendaTek)
          </h3>
          <p className="text-xs text-slate-500">
            Prueba tus códigos con pistola de código de barras USB/Bluetooth o teclea el número.
          </p>
        </div>
      </div>

      {/* Input scanner field */}
      <form onSubmit={handleScanSubmit} className="space-y-4">
        <div>
          <label htmlFor="scan-input-field" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Escanear o ingresar código de 13 dígitos
          </label>
          <div className="relative">
            <input
              id="scan-input-field"
              type="text"
              autoFocus
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Apunta tu pistola lectora o escribe (ej. 7501234000017)"
              className="w-full font-mono text-lg px-4 py-3 pl-11 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            <ScanLine className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <button
              type="submit"
              className="absolute right-2 top-2 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Comprobar
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-teal-600" />
            Las pistolas USB envían automáticamente una tecla Enter al escanear, disparando la validación inmediata con pitido sonoro.
          </p>
        </div>

        {/* Quick test buttons from catalog */}
        {items.length > 0 && (
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Probar con un producto de tu catálogo actual:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {items.slice(0, 5).map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => verifyBarcode(it.fullCode)}
                  className="px-2.5 py-1 text-xs font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors"
                >
                  {it.name} ({it.fullCode})
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Result Display */}
      {lastScanned && (
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Resultado de la Lectura ({lastScanned.timestamp})
            </h4>
            <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {lastScanned.code}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Length & GS1 Mexico check */}
            <div className="p-3.5 rounded-xl border bg-slate-50/70 border-slate-200">
              <span className="block text-[11px] text-slate-500 mb-1">País / GS1 México</span>
              {lastScanned.isGs1Mexico ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Prefijo 750 Oficial</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>No inicia con 750</span>
                </div>
              )}
            </div>

            {/* Check Digit */}
            <div className="p-3.5 rounded-xl border bg-slate-50/70 border-slate-200">
              <span className="block text-[11px] text-slate-500 mb-1">Dígito Verificador (M10)</span>
              {lastScanned.isValidChecksum ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Matemáticamente Válido</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Inválido / Error de lectura</span>
                </div>
              )}
            </div>

            {/* Catalog Match */}
            <div className="p-3.5 rounded-xl border bg-slate-50/70 border-slate-200">
              <span className="block text-[11px] text-slate-500 mb-1">Catálogo TiendaTek</span>
              {lastScanned.matchedProduct ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                  <ShoppingBag className="w-4 h-4 text-teal-600" />
                  <span>Producto Encontrado</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <span>No registrado en la lista</span>
                </div>
              )}
            </div>
          </div>

          {/* Product details card if found */}
          {lastScanned.matchedProduct && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider block">
                  Artículo Identificado para Punto de Venta:
                </span>
                <h5 className="text-sm font-bold text-slate-900 mt-0.5">
                  {lastScanned.matchedProduct.name}
                </h5>
                <span className="text-xs text-slate-500 font-mono">
                  Referencia GS1: {lastScanned.matchedProduct.refString}
                </span>
              </div>
              {lastScanned.matchedProduct.price && (
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Precio de Venta</span>
                  <span className="text-base font-bold font-mono text-teal-900">
                    ${Number(lastScanned.matchedProduct.price).toFixed(2)} MXN
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
