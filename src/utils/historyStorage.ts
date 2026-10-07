import { HistoricalBarcodeItem, ProductItem } from '../types/barcode';

const STORAGE_KEY = 'tiendatek_gs1_barcode_history';

/**
 * Loads all saved historical barcodes from localStorage
 */
export function getBarcodeHistory(): HistoricalBarcodeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('Error loading barcode history:', err);
    return [];
  }
}

/**
 * Saves a list of ProductItems to the historical registry
 * Returns how many were new vs how many were already in history
 */
export function saveBarcodesToHistory(
  items: ProductItem[],
  prefix: string,
  storeTitle: string
): { addedCount: number; duplicateCount: number; totalCount: number } {
  try {
    const currentHistory = getBarcodeHistory();
    const existingCodeSet = new Map<string, HistoricalBarcodeItem>();
    currentHistory.forEach((h) => existingCodeSet.set(h.fullCode, h));

    let addedCount = 0;
    let duplicateCount = 0;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const nowTs = Date.now();

    const newEntries: HistoricalBarcodeItem[] = [];

    items.forEach((it) => {
      if (existingCodeSet.has(it.fullCode)) {
        duplicateCount++;
      } else {
        const historyItem: HistoricalBarcodeItem = {
          id: `hist-${nowTs}-${it.fullCode}`,
          fullCode: it.fullCode,
          code12: it.code12,
          name: it.name,
          price: it.price,
          ref: it.ref,
          refString: it.refString,
          prefix,
          storeTitle: storeTitle || 'Miscelánea Ternuritas',
          generatedAt: formattedDate,
          timestamp: nowTs,
        };
        existingCodeSet.set(it.fullCode, historyItem);
        newEntries.push(historyItem);
        addedCount++;
      }
    });

    const updatedHistory = [...newEntries, ...currentHistory];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

    return {
      addedCount,
      duplicateCount,
      totalCount: updatedHistory.length,
    };
  } catch (err) {
    console.error('Error saving to barcode history:', err);
    return { addedCount: 0, duplicateCount: 0, totalCount: 0 };
  }
}

/**
 * Deletes a single item from history by ID
 */
export function deleteHistoricalItem(id: string): HistoricalBarcodeItem[] {
  try {
    const currentHistory = getBarcodeHistory();
    const filtered = currentHistory.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Error deleting from barcode history:', err);
    return [];
  }
}

/**
 * Completely clears the historical barcode registry
 */
export function clearBarcodeHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing barcode history:', err);
  }
}

/**
 * Checks if a specific 13-digit code exists in history
 */
export function findHistoricalCode(code: string): HistoricalBarcodeItem | undefined {
  const history = getBarcodeHistory();
  return history.find((h) => h.fullCode === code);
}

/**
 * Checks if a reference is already used under a specific prefix
 */
export function findHistoricalReference(prefix: string, ref: number): HistoricalBarcodeItem | undefined {
  const history = getBarcodeHistory();
  return history.find((h) => h.prefix === prefix && h.ref === ref);
}

/**
 * Finds the highest reference number used under this prefix in history
 * to suggest the next safe starting reference number
 */
export function getNextSafeReferenceNumber(prefix: string, defaultStart = 1): number {
  const history = getBarcodeHistory();
  const matchingRefs = history
    .filter((h) => h.prefix === prefix)
    .map((h) => h.ref);

  if (matchingRefs.length === 0) {
    return defaultStart;
  }

  const maxUsed = Math.max(...matchingRefs);
  return maxUsed + 1;
}

/**
 * Exports historical registry as TiendaTek CSV
 */
export function exportHistoryToCsv(historyItems: HistoricalBarcodeItem[]): string {
  const quote = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
  const headers = ['codigo_barras', 'nombre', 'precio', 'referencia_gs1', 'negocio', 'fecha_registro'];
  const rows = historyItems.map((h) => [
    h.fullCode,
    quote(h.name),
    h.price || '0.00',
    h.refString,
    quote(h.storeTitle),
    quote(h.generatedAt),
  ]);
  return '\ufeff' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}
