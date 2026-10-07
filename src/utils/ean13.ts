import {
  BarcodeAppearanceOptions,
  GS1StepByStep,
  ParseResult,
  ParseValidationWarning,
  ProductItem,
} from '../types/barcode';

// EAN-13 Encoding Tables
export const L_CODE = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];

export const G_CODE = [
  '0100111', '0110011', '0011011', '0100001', '0011101',
  '0111001', '0000101', '0010001', '0001001', '0010111',
];

export const R_CODE = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100',
];

export const PARITY_TABLE = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL',
];

/**
 * Calculates official GS1 Modulo 10 check digit for a 12-digit string
 */
export function calculateCheckDigit(d12: string): number {
  if (d12.length !== 12 || !/^\d{12}$/.test(d12)) {
    throw new Error('Se requieren exactamente 12 dígitos numéricos.');
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(d12[i]);
    const weight = i % 2 === 1 ? 3 : 1;
    sum += digit * weight;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Provides step-by-step mathematical explanation for GS1 Mexico verification
 */
export function explainCheckDigitStepByStep(d12: string): GS1StepByStep {
  const digits = d12.split('').map(Number);
  const weights = digits.map((_, i) => (i % 2 === 1 ? 3 : 1));
  const products = digits.map((d, i) => d * weights[i]);

  let sumOdd = 0;
  let sumEven = 0;

  for (let i = 0; i < 12; i++) {
    if (weights[i] === 1) {
      sumOdd += products[i];
    } else {
      sumEven += products[i];
    }
  }

  const totalSum = sumOdd + sumEven;
  const remainder = totalSum % 10;
  const checkDigit = (10 - remainder) % 10;

  const explanationText = `1) Se ponderan las posiciones pares e impares: 
Impares (×1) suman ${sumOdd}. Pares (×3) suman ${sumEven}.
2) Suma total ponderada = ${totalSum}.
3) Residuo módulo 10: ${totalSum} mod 10 = ${remainder}.
4) Dígito verificador: (10 - ${remainder}) mod 10 = ${checkDigit}.`;

  return {
    digits,
    weights,
    products,
    sumOdd,
    sumEven,
    totalSum,
    remainder,
    checkDigit,
    explanationText,
  };
}

/**
 * Generates the 95 bits string representation of EAN-13 code
 */
export function generateEan13Bits(code13: string): { bits: string; isGuard: (idx: number) => boolean } {
  if (code13.length !== 13 || !/^\d{13}$/.test(code13)) {
    throw new Error('El código debe tener exactamente 13 dígitos numéricos.');
  }

  const firstDigit = Number(code13[0]);
  const parity = PARITY_TABLE[firstDigit];

  // Start Guard 101
  let bitString = '101';

  // Left 6 digits (indices 1 to 6)
  for (let i = 0; i < 6; i++) {
    const digit = Number(code13[i + 1]);
    const pattern = parity[i] === 'L' ? L_CODE[digit] : G_CODE[digit];
    bitString += pattern;
  }

  // Center Guard 01010
  bitString += '01010';

  // Right 6 digits (indices 7 to 12)
  for (let i = 7; i < 13; i++) {
    const digit = Number(code13[i]);
    bitString += R_CODE[digit];
  }

  // End Guard 101
  bitString += '101';

  const isGuard = (idx: number): boolean => {
    return idx < 3 || (idx >= 45 && idx < 50) || idx >= 92;
  };

  return { bits: bitString, isGuard };
}

/**
 * Escapes text for XML/SVG safety
 */
export function escapeXml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return m;
    }
  });
}

/**
 * Builds standalone standard compliant SVG for EAN-13 barcode
 */
export function buildEan13Svg(
  item: ProductItem,
  options: BarcodeAppearanceOptions,
  customWidth?: number,
  customHeight?: number
): string {
  const mw = options.moduleWidth;
  const h = options.barHeight;
  const c = item.fullCode;
  const { bits, isGuard } = generateEan13Bits(c);

  const QL = 11; // Quiet Zone Left (in modules)
  const QR = 7;  // Quiet Zone Right (in modules)
  const coreModules = 95;
  const totalModules = QL + coreModules + QR; // 113 modules

  const storeTitleText = options.storeTitle !== undefined ? options.storeTitle : 'Miscelánea Ternuritas';
  const hasStoreTitle = options.showStoreTitle !== false && storeTitleText.trim().length > 0;
  const hasName = options.displayMode === 'np' || options.displayMode === 'n' || options.displayMode === 'npc';
  const hasPrice = (options.displayMode === 'np' || options.displayMode === 'npc') && item.price !== '';

  // Calculate header spacing based on store title and product name presence
  let headerPadding = 6;
  if (hasStoreTitle && hasName) {
    headerPadding = 36;
  } else if (hasStoreTitle || hasName) {
    headerPadding = 22;
  }

  const fs = Math.max(10, Math.round(5.5 * mw));
  const guardExtraHeight = Math.round(fs * 0.55);
  const footerPadding = hasPrice ? 24 : 8;

  const calculatedWidth = totalModules * mw;
  const calculatedHeight = headerPadding + h + fs + 4 + footerPadding;

  const width = customWidth || calculatedWidth;
  const height = customHeight || calculatedHeight;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${calculatedWidth} ${calculatedHeight}" width="${width}" height="${height}" style="background-color: ${options.bgColor}; display: block; font-family: 'JetBrains Mono', 'Segoe UI', Arial, sans-serif;">`;

  if (options.bgColor !== 'transparent') {
    svg += `<rect width="100%" height="100%" fill="${options.bgColor}" />`;
  }

  // Border if requested
  if (options.includeBorder) {
    svg += `<rect x="0.5" y="0.5" width="${calculatedWidth - 1}" height="${calculatedHeight - 1}" fill="none" stroke="#cbd5e1" stroke-width="1" rx="4" />`;
  }

  // Top Store Title and/or Product Name
  if (hasStoreTitle && hasName) {
    // 2-row header: Business title on top, product name underneath
    const cleanStoreTitle = escapeXml(storeTitleText.length > 32 ? storeTitleText.slice(0, 31) + '…' : storeTitleText);
    const trimmedName = escapeXml(item.name.length > 34 ? item.name.slice(0, 33) + '…' : item.name);

    svg += `<text x="${calculatedWidth / 2}" y="13" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a" letter-spacing="0.5" font-family="'Plus Jakarta Sans', system-ui, sans-serif">${cleanStoreTitle}</text>`;
    svg += `<text x="${calculatedWidth / 2}" y="28" text-anchor="middle" font-size="11" font-weight="500" fill="#475569" font-family="'Plus Jakarta Sans', system-ui, sans-serif">${trimmedName}</text>`;
  } else if (hasStoreTitle) {
    // Only Store Title
    const cleanStoreTitle = escapeXml(storeTitleText.length > 32 ? storeTitleText.slice(0, 31) + '…' : storeTitleText);
    svg += `<text x="${calculatedWidth / 2}" y="15" text-anchor="middle" font-size="12" font-weight="700" fill="#0f172a" letter-spacing="0.5" font-family="'Plus Jakarta Sans', system-ui, sans-serif">${cleanStoreTitle}</text>`;
  } else if (hasName) {
    // Only Product Name
    const trimmedName = escapeXml(item.name.length > 36 ? item.name.slice(0, 35) + '…' : item.name);
    svg += `<text x="${calculatedWidth / 2}" y="${headerPadding - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#0f172a" font-family="'Plus Jakarta Sans', system-ui, sans-serif">${trimmedName}</text>`;
  }

  // Barcode Bars
  let i = 0;
  while (i < 95) {
    if (bits[i] === '1') {
      const isCurrentGuard = isGuard(i);
      let j = i;
      while (j < 95 && bits[j] === '1' && isGuard(j) === isCurrentGuard) {
        j++;
      }
      const barHeight = isCurrentGuard ? h + guardExtraHeight : h;
      const x = (QL + i) * mw;
      const barWidth = (j - i) * mw;
      svg += `<rect x="${x}" y="${headerPadding}" width="${barWidth}" height="${barHeight}" fill="${options.barColor}" />`;
      i = j;
    } else {
      i++;
    }
  }

  // Human Readable Interpretation (HRI) Numbers
  const textY = headerPadding + h + fs;

  // First digit (Outside to the left)
  svg += `<text x="${(QL - 5) * mw}" y="${textY}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#0f172a">${c[0]}</text>`;

  // Left group (Digits 1 to 6)
  svg += `<text x="${(QL + 3.5) * mw}" y="${textY}" font-size="${fs}" font-weight="700" fill="#0f172a" textLength="${42 * mw}" lengthAdjust="spacing">${c.slice(1, 7)}</text>`;

  // Right group (Digits 7 to 12)
  svg += `<text x="${(QL + 49.5) * mw}" y="${textY}" font-size="${fs}" font-weight="700" fill="#0f172a" textLength="${42 * mw}" lengthAdjust="spacing">${c.slice(7)}</text>`;

  // Optional Quiet Zone Symbol (standard GS1 right margin indicator ">")
  svg += `<text x="${calculatedWidth - 2 * mw}" y="${textY}" font-size="${fs * 0.8}" font-weight="700" fill="#64748b" text-anchor="end">&gt;</text>`;

  // Bottom Price & Tag
  if (hasPrice) {
    const formattedPrice = options.showCurrency ? `$${Number(item.price).toFixed(2)} ${options.currencyPrefix}` : `$${item.price}`;
    svg += `<text x="${calculatedWidth / 2}" y="${calculatedHeight - 8}" text-anchor="middle" font-size="14" font-weight="700" fill="#0f172a" font-family="'Plus Jakarta Sans', system-ui, sans-serif">${escapeXml(formattedPrice)}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

/**
 * Validates GS1 Mexico Prefix
 */
export function validateGs1Prefix(prefix: string): { isValid: boolean; error?: string; refDigits: number; maxRef: number } {
  const clean = prefix.trim();
  if (!clean) {
    return { isValid: false, error: 'Ingresa un prefijo de empresa GS1.', refDigits: 0, maxRef: 0 };
  }
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, error: 'El prefijo solo debe contener dígitos numéricos.', refDigits: 0, maxRef: 0 };
  }
  if (!clean.startsWith('750')) {
    return { isValid: false, error: 'Los prefijos de GS1 México deben iniciar obligatoriamente con 750.', refDigits: 0, maxRef: 0 };
  }
  if (clean.length < 7 || clean.length > 10) {
    return { isValid: false, error: 'El prefijo de empresa GS1 México debe tener entre 7 y 10 dígitos (750 + 4 a 7 dígitos).', refDigits: 0, maxRef: 0 };
  }

  const refDigits = 12 - clean.length;
  const maxRef = Math.pow(10, refDigits) - 1;

  return { isValid: true, refDigits, maxRef };
}

/**
 * Parses raw text input into validated product items
 */
export function parseProductListText(
  text: string,
  prefix: string,
  startRef: number,
  historyItems?: import('../types/barcode').HistoricalBarcodeItem[]
): ParseResult {
  const prefixValidation = validateGs1Prefix(prefix);
  if (!prefixValidation.isValid) {
    return {
      items: [],
      warnings: [],
      error: prefixValidation.error,
      prefix,
      refDigitCount: 0,
      maxRefNumber: 0,
    };
  }

  const refDigits = prefixValidation.refDigits;
  const maxRef = prefixValidation.maxRef;
  const lines = text.split('\n');

  const items: ProductItem[] = [];
  const warnings: ParseValidationWarning[] = [];
  const seenCodes = new Set<string>();
  const seenRefs = new Set<number>();

  // Map history for fast O(1) lookup
  const historyMap = new Map<string, import('../types/barcode').HistoricalBarcodeItem>();
  if (historyItems) {
    historyItems.forEach((h) => historyMap.set(h.fullCode, h));
  }

  let nextRef = Math.max(0, startRef);

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx].trim();
    if (!rawLine) continue;

    const parts = rawLine.split(';').map((p) => p.trim());
    const name = parts[0] || `Artículo ${idx + 1}`;
    const rawPrice = parts[1] || '';
    const cleanPrice = rawPrice.replace(/[^0-9.]/g, '');

    const explicitRefStr = parts[2] !== undefined && parts[2] !== '' ? parts[2].trim() : null;
    let targetRef: number;
    let isCustom = false;

    if (explicitRefStr !== null) {
      const parsedRef = parseInt(explicitRefStr, 10);
      if (isNaN(parsedRef)) {
        warnings.push({
          line: idx + 1,
          type: 'format',
          message: `Línea ${idx + 1}: Referencia "${explicitRefStr}" no es numérica. Se asignó referencia automática.`,
        });
        targetRef = nextRef;
      } else {
        targetRef = parsedRef;
        isCustom = true;
      }
    } else {
      targetRef = nextRef;
    }

    // Overflow check
    if (targetRef < 0 || targetRef > maxRef) {
      warnings.push({
        line: idx + 1,
        type: 'overflow',
        message: `Línea ${idx + 1}: La referencia ${targetRef} excede el límite de ${refDigits} dígitos (máx: ${maxRef}).`,
      });
      return {
        items: [],
        warnings,
        error: `Línea ${idx + 1}: La referencia ${targetRef} no cabe en los ${refDigits} dígitos disponibles para tu prefijo GS1 (${prefix}). El máximo permitido es ${maxRef}.`,
        prefix,
        refDigitCount: refDigits,
        maxRefNumber: maxRef,
      };
    }

    // Duplicate check in current batch
    if (seenRefs.has(targetRef)) {
      warnings.push({
        line: idx + 1,
        type: 'duplicate',
        message: `Línea ${idx + 1}: La referencia ${targetRef} ya fue asignada previamente en esta lista.`,
      });
      return {
        items: [],
        warnings,
        error: `Línea ${idx + 1}: La referencia de artículo ${targetRef} está repetida en la lista. Cada código GS1 debe ser estrictamente único.`,
        prefix,
        refDigitCount: refDigits,
        maxRefNumber: maxRef,
      };
    }

    seenRefs.add(targetRef);

    const refString = String(targetRef).padStart(refDigits, '0');
    const code12 = prefix + refString;

    if (code12.length !== 12) {
      return {
        items: [],
        warnings,
        error: `Error interno de longitud: ${code12} no tiene 12 dígitos.`,
        prefix,
        refDigitCount: refDigits,
        maxRefNumber: maxRef,
      };
    }

    const checkDigit = calculateCheckDigit(code12);
    const fullCode = code12 + checkDigit;

    if (seenCodes.has(fullCode)) {
      return {
        items: [],
        warnings,
        error: `Código de barras duplicado detectado: ${fullCode}.`,
        prefix,
        refDigitCount: refDigits,
        maxRefNumber: maxRef,
      };
    }
    seenCodes.add(fullCode);

    // Check collision with persistent historical registry
    const histConflict = historyMap.get(fullCode);
    if (histConflict) {
      warnings.push({
        line: idx + 1,
        type: 'duplicate',
        message: `Aviso: El código ${fullCode} ya existe en el historial previo como "${histConflict.name}" ($${histConflict.price}) guardado el ${histConflict.generatedAt}.`,
      });
    }

    items.push({
      id: `item-${idx}-${targetRef}`,
      name,
      price: cleanPrice,
      ref: targetRef,
      refString,
      code12,
      checkDigit,
      fullCode,
      isCustomRef: isCustom,
      isInHistory: !!histConflict,
      historicalItem: histConflict,
    });

    if (isCustom) {
      nextRef = Math.max(nextRef, targetRef + 1);
    } else {
      nextRef = targetRef + 1;
    }
  }

  if (items.length === 0) {
    return {
      items: [],
      warnings: [],
      error: 'Ingresa al menos un producto para generar los códigos de barras.',
      prefix,
      refDigitCount: refDigits,
      maxRefNumber: maxRef,
    };
  }

  return {
    items,
    warnings,
    prefix,
    refDigitCount: refDigits,
    maxRefNumber: maxRef,
  };
}

/**
 * Exports TiendaTek compatible CSV file
 */
export function exportTiendaTekCsv(
  items: ProductItem[],
  format: 'tiendatek_standard' | 'tiendatek_inventory' = 'tiendatek_standard'
): string {
  const quote = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

  if (format === 'tiendatek_standard') {
    // Formato estándar para catálogo TiendaTek
    const headers = ['codigo_barras', 'nombre', 'precio', 'referencia_gs1'];
    const rows = items.map((it) => [
      it.fullCode,
      quote(it.name),
      it.price || '0.00',
      it.refString,
    ]);
    return '\ufeff' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  } else {
    // Formato extendido de importación masiva TiendaTek (con inventario, costo y departamento)
    const headers = ['codigo_barras', 'nombre', 'precio_venta', 'precio_costo', 'departamento', 'existencias', 'referencia'];
    const rows = items.map((it) => [
      it.fullCode,
      quote(it.name),
      it.price || '0.00',
      it.cost || '0.00',
      quote(it.category || 'General'),
      '10',
      it.refString,
    ]);
    return '\ufeff' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }
}

/**
 * Downloads a Blob as a file in the browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Converts an SVG string to a high-resolution PNG Blob using Canvas
 */
export function svgToPngBlob(svgString: string, scaleFactor = 3): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const viewBoxMatch = svgString.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    let origWidth = 300;
    let origHeight = 150;

    if (viewBoxMatch) {
      origWidth = parseFloat(viewBoxMatch[1]);
      origHeight = parseFloat(viewBoxMatch[2]);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(origWidth * scaleFactor);
      canvas.height = Math.round(origHeight * scaleFactor);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No se pudo inicializar el contexto 2D de Canvas.'));
        return;
      }

      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Fallo al exportar Canvas como PNG.'));
        }
      }, 'image/png');
    };

    img.onerror = (err) => {
      reject(err);
    };

    const encodedSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    img.src = encodedSvg;
  });
}

/**
 * Popular Mexican Retail Catalog samples for TiendaTek (Abarrotes y Miscelánea)
 */
export const SAMPLE_MEXICAN_PRODUCTS = [
  'Refresco Cola 600 ml ; 19.50 ; 1',
  'Papas Fritas Clásicas 45 g ; 18.00 ; 2',
  'Galletas Marías 170 g ; 16.50 ; 3',
  'Leche Entera 1 Litro ; 27.00 ; 4',
  'Atún en Agua 140 g ; 21.50 ; 5',
  'Frijoles Refritos Negros 430 g ; 15.50 ; 6',
  'Jabón de Lavandería Rosa 400 g ; 24.00 ; 7',
  'Detergente Multiusos 1 kg ; 38.00 ; 8',
  'Aceite Vegetal Comestible 800 ml ; 39.50 ; 9',
  'Agua Purificada 1.5 L ; 14.00 ; 10',
].join('\n');
