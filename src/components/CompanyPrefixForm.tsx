import React from 'react';
import { Building2, Info, CheckCircle2, AlertTriangle, Hash } from 'lucide-react';
import { validateGs1Prefix } from '../utils/ean13';

interface CompanyPrefixFormProps {
  prefix: string;
  setPrefix: (val: string) => void;
  startRef: number;
  setStartRef: (val: number) => void;
  itemCount: number;
  nextSafeRef?: number;
}

export const CompanyPrefixForm: React.FC<CompanyPrefixFormProps> = ({
  prefix,
  setPrefix,
  startRef,
  setStartRef,
  itemCount,
  nextSafeRef,
}) => {
  const validation = validateGs1Prefix(prefix);
  const refDigits = validation.refDigits;
  const maxRef = validation.maxRef;

  // Format sample padded reference
  const samplePaddedRef = refDigits > 0 ? String(startRef).padStart(refDigits, '0') : '—';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">1. Prefijo de Empresa GS1 México</h2>
        </div>
        <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          EAN-13 Oficial
        </span>
      </div>

      <div className="space-y-4">
        {/* Prefix Input */}
        <div>
          <label htmlFor="prefijo-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Prefijo Asignado por GS1 (7 a 10 dígitos)
          </label>
          <div className="relative">
            <input
              id="prefijo-input"
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Ej. 7501234"
              className={`w-full font-mono text-base tracking-widest px-3.5 py-2.5 border rounded-lg bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                validation.isValid
                  ? 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/20'
                  : 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900'
              }`}
            />
            <div className="absolute right-3 top-2.5 flex items-center gap-1.5 pointer-events-none">
              {validation.isValid ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Válido GS1
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Incompleto
                </span>
              )}
            </div>
          </div>

          {/* Validation Help / Breakdown */}
          {validation.isValid ? (
            <div className="mt-2.5 p-3 rounded-lg bg-teal-50/60 border border-teal-100 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center justify-between font-medium">
                <span className="text-teal-900">Estructura del código de 13 dígitos:</span>
                <span className="font-mono text-teal-800 font-bold">{prefix.length} prefijo + {refDigits} ref + 1 control = 13</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-slate-600 bg-white p-1.5 rounded border border-teal-200/60">
                <span className="text-teal-700 font-bold bg-teal-100/70 px-1.5 py-0.5 rounded">750 (México)</span>
                <span className="text-slate-800 font-semibold">{prefix.slice(3) || '••••'} (Empresa)</span>
                <span className="text-amber-700 bg-amber-50 px-1 rounded">{samplePaddedRef} (Artículo)</span>
                <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded">X (Módulo 10)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Capacidad de catálogo: <strong>{maxRef + 1}</strong> productos únicos (de <code className="font-mono">{String(0).padStart(refDigits, '0')}</code> a <code className="font-mono">{String(maxRef).padStart(refDigits, '0')}</code>).
              </p>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              {validation.error}
            </p>
          )}
        </div>

        {/* Start Reference Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label htmlFor="ini-ref-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Primera referencia consecutiva
            </label>
            <div className="relative">
              <input
                id="ini-ref-input"
                type="number"
                min={0}
                max={maxRef || 99999}
                value={startRef}
                onChange={(e) => setStartRef(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full font-mono text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <div className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                REF #{startRef}
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-slate-500">
                Se autocompleta con ceros: <strong className="font-mono text-slate-700">{samplePaddedRef}</strong>
              </p>
              {nextSafeRef !== undefined && nextSafeRef > startRef && (
                <button
                  type="button"
                  onClick={() => setStartRef(nextSafeRef)}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-teal-400"
                  title="Avanza al siguiente número que nunca se ha usado en el historial"
                >
                  Usar #{nextSafeRef} (libre en historial)
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Productos a procesar
            </label>
            <div className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">En cola de generación:</span>
              <span className="font-mono text-sm font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded">
                {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Compatible con TiendaTek y lectores láser/CCD.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
