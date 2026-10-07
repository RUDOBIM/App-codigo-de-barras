import React from 'react';
import { X, CheckCircle, Calculator, ShieldCheck, Copy, Check } from 'lucide-react';
import { ProductItem } from '../types/barcode';
import { explainCheckDigitStepByStep, PARITY_TABLE } from '../utils/ean13';

interface GS1InspectorModalProps {
  item: ProductItem | null;
  onClose: () => void;
}

export const GS1InspectorModal: React.FC<GS1InspectorModalProps> = ({ item, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!item) return null;

  const analysis = explainCheckDigitStepByStep(item.code12);
  const firstDigit = Number(item.fullCode[0]);
  const parityScheme = PARITY_TABLE[firstDigit];

  const handleCopyExplanation = async () => {
    try {
      await navigator.clipboard.writeText(
        `Código EAN-13 GS1 México: ${item.fullCode}\nProducto: ${item.name}\n${analysis.explanationText}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Auditoría GS1 México: Módulo 10
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {item.fullCode} · {item.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Structure Breakdown */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Desglose de Estructura GS1 General Specifications
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200">
                <span className="block text-teal-900 font-bold text-base">750</span>
                <span className="text-[11px] text-teal-700">Prefijo País (México)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                <span className="block text-slate-900 font-bold text-base">{item.code12.slice(3, item.code12.length - item.refString.length)}</span>
                <span className="text-[11px] text-slate-600">Empresa GS1</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <span className="block text-amber-900 font-bold text-base">{item.refString}</span>
                <span className="text-[11px] text-amber-700">Ref. Artículo</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="block text-rose-900 font-bold text-base">{item.checkDigit}</span>
                <span className="text-[11px] text-rose-700">Dígito Control (CD)</span>
              </div>
            </div>
          </div>

          {/* Table of Modulo 10 Calculation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Paso a Paso Matemático (Algoritmo Oficial Módulo 10)
              </h4>
              <button
                type="button"
                onClick={handleCopyExplanation}
                className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-800 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar cálculo'}
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-center text-xs font-mono">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="py-2 px-1 text-slate-400 font-normal">Posición</th>
                    {analysis.digits.map((_, i) => (
                      <th key={i} className="py-2 px-1">{i + 1}</th>
                    ))}
                    <th className="py-2 px-2 bg-slate-200 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-1 text-slate-500 font-sans text-left pl-3">Dígito</td>
                    {analysis.digits.map((d, i) => (
                      <td key={i} className="py-2 px-1 font-bold text-slate-800">{d}</td>
                    ))}
                    <td className="py-2 px-2 bg-slate-50 font-bold text-slate-400">—</td>
                  </tr>
                  <tr className="bg-slate-50/70">
                    <td className="py-2 px-1 text-slate-500 font-sans text-left pl-3">Factor</td>
                    {analysis.weights.map((w, i) => (
                      <td key={i} className={`py-2 px-1 font-semibold ${w === 3 ? 'text-teal-700 font-bold' : 'text-slate-600'}`}>
                        ×{w}
                      </td>
                    ))}
                    <td className="py-2 px-2 bg-slate-100 font-bold text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-1 text-slate-500 font-sans text-left pl-3">Subtotal</td>
                    {analysis.products.map((p, i) => (
                      <td key={i} className="py-2 px-1 text-slate-700">{p}</td>
                    ))}
                    <td className="py-2 px-2 bg-teal-50 font-bold text-teal-800">{analysis.totalSum}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mathematical Resolution Details */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2 font-mono">
            <div className="flex justify-between text-slate-700">
              <span>Suma de posiciones impares (ponderación × 1):</span>
              <strong className="text-slate-900">{analysis.sumOdd}</strong>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Suma de posiciones pares (ponderación × 3):</span>
              <strong className="text-teal-700">{analysis.sumEven}</strong>
            </div>
            <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
              <span>Suma Ponderada Total:</span>
              <strong className="text-slate-900">{analysis.totalSum}</strong>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Residuo Módulo 10 ({analysis.totalSum} % 10):</span>
              <strong className="text-slate-900">{analysis.remainder}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-300">
              <span className="font-sans font-bold">Dígito Verificador Oficial = (10 - {analysis.remainder}) % 10:</span>
              <span className="text-base font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-0.5 rounded">
                {analysis.checkDigit}
              </span>
            </div>
          </div>

          {/* Optical Parity Table info */}
          <div className="p-3 bg-teal-50/70 border border-teal-200/60 rounded-xl text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-teal-900">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Esquema de Paridad Óptica EAN-13: {parityScheme}</span>
            </div>
            <p className="text-[11px] text-slate-600">
              El primer dígito (<strong className="font-mono">{firstDigit}</strong>) determina el patrón de paridad ({parityScheme}) usado para codificar los primeros 6 dígitos (izquierda) alternando entre tablas L y G. Los 6 dígitos de la derecha siempre usan paridad R. Esto previene lecturas invertidas en lectores omnidireccionales láser.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
