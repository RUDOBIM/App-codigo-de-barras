export interface ProductItem {
  id: string;
  name: string;
  price: string;
  cost?: string;
  category?: string;
  ref: number;
  refString: string;
  code12: string;
  checkDigit: number;
  fullCode: string; // 13 digits
  isCustomRef: boolean;
  isInHistory?: boolean;
  historicalItem?: HistoricalBarcodeItem;
}

export interface HistoricalBarcodeItem {
  id: string;
  fullCode: string; // 13 digits
  code12: string; // 12 digits
  name: string;
  price: string;
  ref: number;
  refString: string;
  prefix: string;
  storeTitle: string;
  generatedAt: string; // Formatted date string
  timestamp: number; // Unix timestamp
}

export type BarcodeDisplayMode = 'np' | 'n' | 'x' | 'npc';

export interface BarcodeAppearanceOptions {
  moduleWidth: number; // 1 to 4
  barHeight: number; // 40 to 140
  barColor: string;
  bgColor: string;
  storeTitle: string; // Default: 'Miscelánea Ternuritas'
  showStoreTitle: boolean; // Default: true
  displayMode: BarcodeDisplayMode;
  showCurrency: boolean;
  currencyPrefix: string;
  includeBorder: boolean;
  fontSize: number;
}

export type SheetTemplate = 'avery_3x10' | 'gondola_2x5' | 'compact_4x10' | 'thermal_58mm' | 'thermal_80mm' | 'custom';

export interface PrintSheetConfig {
  template: SheetTemplate;
  columns: number;
  rowsPerPage: number;
  labelWidthMm: number;
  labelHeightMm: number;
  pageMarginMm: number;
  gapMm: number;
  showProductPrice: boolean;
  showProductName: boolean;
  showBarcodeNumber: boolean;
  copiesPerProduct: number;
}

export interface ParseValidationWarning {
  line: number;
  type: 'duplicate' | 'overflow' | 'invalid_price' | 'format';
  message: string;
}

export interface ParseResult {
  items: ProductItem[];
  warnings: ParseValidationWarning[];
  error?: string;
  prefix: string;
  refDigitCount: number;
  maxRefNumber: number;
}

export interface GS1StepByStep {
  digits: number[];
  weights: number[];
  products: number[];
  sumOdd: number; // weight 1
  sumEven: number; // weight 3
  totalSum: number;
  remainder: number;
  checkDigit: number;
  explanationText: string;
}
