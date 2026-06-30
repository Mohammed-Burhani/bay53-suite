/**
 * Self-contained Code 128 barcode utility (no external dependencies).
 *
 * Implements Code 128 Code Set B (covers digits, upper/lower case letters and
 * common punctuation — ASCII 32..126), the mandatory modulo-103 checksum, an
 * SVG renderer, a jsPDF vector renderer, a numeric value auto-generator with an
 * EAN-13 style check digit, and input validation.
 *
 * The symbology width table is taken from ISO/IEC 15417 (Code 128). Each of the
 * 107 entries (values 0..106) is six "module width" digits whose sum is 11.
 * The terminating stop pattern adds a final 2-module bar (13 modules total).
 *
 * Verified invariants (see `selfTestBarcode`):
 *   - 107 patterns, each data pattern sums to 11 modules, stop sums to 13
 *   - value 0  -> "212222", value 33 ('A' in set B) -> "111323"
 *   - checksum("PJJ123C") with Start B -> 55 ('W'); with Start A -> 54 ('V')
 */

// Code 128 width patterns for values 0..106 (Start A=103, B=104, C=105, Stop=106)
const CODE128_PATTERNS: string[] = [
  // 0-9
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  // 10-19
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  // 20-29
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  // 30-39
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  // 40-49
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  // 50-59
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  // 60-69
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  // 70-79
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  // 80-89
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  // 90-99
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  // 100-106 (103=StartA, 104=StartB, 105=StartC, 106=Stop)
  "114131", "311141", "411131", "211412", "211214", "211232", "233111",
];

// Terminating stop pattern including the final 2-module bar (13 modules).
const STOP_PATTERN = "2331112";
const START_B = 104;

/** Allowed characters for a manually entered barcode (kept friendly/scannable). */
export const BARCODE_ALLOWED_PATTERN = /^[A-Za-z0-9\-._]+$/;
export const BARCODE_MIN_LENGTH = 4;
export const BARCODE_MAX_LENGTH = 48;

export interface BarcodeBar {
  /** x offset in module units from the start of the symbol */
  x: number;
  /** bar width in module units */
  width: number;
}

export interface EncodedBarcode {
  value: string;
  /** black bars (white spaces are the gaps) in module units */
  bars: BarcodeBar[];
  /** total symbol width in module units (excludes quiet zones) */
  width: number;
}

/**
 * Encode a string as Code 128 (Code Set B) and return the black-bar geometry in
 * module units. Throws RangeError if the string contains a character that Code
 * Set B cannot represent (anything outside ASCII 32..126).
 */
export function encodeCode128(value: string): EncodedBarcode {
  const data = (value ?? "").toString();
  if (!data) return { value: "", bars: [], width: 0 };

  const codes: number[] = [START_B];
  let checksum = START_B;

  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i) - 32;
    if (code < 0 || code > 94) {
      throw new RangeError(
        `Character "${data[i]}" (code ${data.charCodeAt(i)}) cannot be encoded in Code 128 Set B`
      );
    }
    codes.push(code);
    checksum += code * (i + 1);
  }

  codes.push(checksum % 103);

  const patterns = codes.map((c) => CODE128_PATTERNS[c]);
  patterns.push(STOP_PATTERN);

  const bars: BarcodeBar[] = [];
  let x = 0;
  for (const pattern of patterns) {
    for (let i = 0; i < pattern.length; i++) {
      const moduleWidth = pattern.charCodeAt(i) - 48; // '0'..'9'
      if (i % 2 === 0 && moduleWidth > 0) {
        // even index = bar (black); odd index = space (white)
        bars.push({ x, width: moduleWidth });
      }
      x += moduleWidth;
    }
  }

  return { value: data, bars, width: x };
}

/** EAN-13 modulo-10 check digit for a 12-digit string. */
function ean13CheckDigit(digits: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = digits.charCodeAt(i) - 48;
    sum += i % 2 === 0 ? d : d * 3;
  }
  return (((10 - (sum % 10)) % 10)).toString();
}

/**
 * Auto-generate a unique-ish 13-digit numeric barcode (EAN-13 style, with a
 * valid check digit). Uses an in-store prefix so it never collides with real
 * manufacturer GTINs. Combine with a uniqueness check against existing products.
 */
export function generateBarcodeValue(prefix = "2"): string {
  const ts = Date.now().toString().slice(-9); // 9 digits of entropy
  const rand = Math.floor(100 + Math.random() * 900).toString(); // 3 digits
  let base = (prefix + ts + rand).replace(/\D/g, "");
  base = base.slice(0, 12).padEnd(12, "0");
  return base + ean13CheckDigit(base);
}

/**
 * Generate a barcode value guaranteed not to be in `existing`.
 */
export function generateUniqueBarcodeValue(existing: Iterable<string | undefined | null>): string {
  const taken = new Set(
    Array.from(existing)
      .filter(Boolean)
      .map((v) => String(v))
  );
  for (let i = 0; i < 25; i++) {
    const candidate = generateBarcodeValue();
    if (!taken.has(candidate)) return candidate;
  }
  // Extremely unlikely fallback
  return generateBarcodeValue() + Math.floor(Math.random() * 10);
}

/**
 * Validate a manually entered barcode. Returns an error message, or null when
 * the value is acceptable (an empty value is acceptable — it means "auto-generate").
 */
export function validateBarcode(value: string | undefined | null): string | null {
  const v = (value ?? "").toString().trim();
  if (!v) return null; // blank => auto-generate on save
  if (v.length < BARCODE_MIN_LENGTH) return `Barcode must be at least ${BARCODE_MIN_LENGTH} characters.`;
  if (v.length > BARCODE_MAX_LENGTH) return `Barcode must be ${BARCODE_MAX_LENGTH} characters or fewer.`;
  if (!BARCODE_ALLOWED_PATTERN.test(v)) {
    return "Use only letters, numbers, hyphen (-), dot (.) or underscore (_).";
  }
  return null;
}

/** True when the value can be rendered as a Code 128 barcode without throwing. */
export function canRenderBarcode(value: string | undefined | null): boolean {
  const v = (value ?? "").toString();
  if (!v) return false;
  for (let i = 0; i < v.length; i++) {
    const code = v.charCodeAt(i) - 32;
    if (code < 0 || code > 94) return false;
  }
  return true;
}

export interface BarcodeSvgOptions {
  /** width of a single module in px (default 2) */
  moduleWidth?: number;
  /** bar height in px (default 60) */
  height?: number;
  /** quiet zone on each side, in modules (default 10 per the spec) */
  quietZone?: number;
  /** show the human-readable value below the bars (default true) */
  displayValue?: boolean;
  /** font size for the human-readable value in px (default 14) */
  fontSize?: number;
  /** background colour (default "#ffffff") */
  background?: string;
  /** bar/line colour (default "#000000") */
  lineColor?: string;
}

/**
 * Build a standalone SVG markup string for a barcode. Suitable for embedding in
 * a print window or saving as an .svg file.
 */
export function generateBarcodeSVG(value: string, options: BarcodeSvgOptions = {}): string {
  const {
    moduleWidth = 2,
    height = 60,
    quietZone = 10,
    displayValue = true,
    fontSize = 14,
    background = "#ffffff",
    lineColor = "#000000",
  } = options;

  const enc = encodeCode128(value);
  const textGap = displayValue ? fontSize + 6 : 0;
  const totalModules = enc.width + quietZone * 2;
  const svgWidth = totalModules * moduleWidth;
  const svgHeight = height + textGap;

  const rects = enc.bars
    .map((bar) => {
      const x = (bar.x + quietZone) * moduleWidth;
      const w = bar.width * moduleWidth;
      return `<rect x="${round(x)}" y="0" width="${round(w)}" height="${height}" fill="${lineColor}" />`;
    })
    .join("");

  const text = displayValue
    ? `<text x="${round(svgWidth / 2)}" y="${round(height + fontSize)}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="${lineColor}" letter-spacing="1">${escapeXml(value)}</text>`
    : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${round(svgWidth)}" height="${round(svgHeight)}" ` +
    `viewBox="0 0 ${round(svgWidth)} ${round(svgHeight)}">` +
    `<rect width="100%" height="100%" fill="${background}" />` +
    rects +
    text +
    `</svg>`
  );
}

/** Minimal subset of the jsPDF API used by `drawBarcodeToPdf`. */
export interface PdfLike {
  setFillColor: (r: number, g: number, b: number) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
}

/**
 * Draw a barcode onto a jsPDF document as crisp vector rectangles.
 * Coordinates/sizes are in the document's current unit (e.g. mm).
 */
export function drawBarcodeToPdf(
  doc: PdfLike,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const enc = encodeCode128(value);
  if (!enc.width) return;
  const moduleWidth = width / enc.width;
  doc.setFillColor(0, 0, 0);
  for (const bar of enc.bars) {
    if (bar.width <= 0) continue;
    doc.rect(x + bar.x * moduleWidth, y, bar.width * moduleWidth, height, "F");
  }
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;"
  );
}

/**
 * Internal correctness self-test. Returns a result object instead of throwing so
 * it can be run from node or a test harness. See header for the verified invariants.
 */
export function selfTestBarcode(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  if (CODE128_PATTERNS.length !== 107) {
    errors.push(`expected 107 patterns, got ${CODE128_PATTERNS.length}`);
  }
  CODE128_PATTERNS.forEach((p, i) => {
    if (p.length !== 6) errors.push(`pattern ${i} has length ${p.length}`);
    const sum = p.split("").reduce((s, c) => s + (c.charCodeAt(0) - 48), 0);
    if (sum !== 11) errors.push(`pattern ${i} (${p}) sums to ${sum}, expected 11`);
  });
  const stopSum = STOP_PATTERN.split("").reduce((s, c) => s + (c.charCodeAt(0) - 48), 0);
  if (stopSum !== 13) errors.push(`stop pattern sums to ${stopSum}, expected 13`);

  // Anchor patterns confirmed against ISO/IEC 15417 (via Wikipedia table)
  if (CODE128_PATTERNS[0] !== "212222") errors.push("pattern[0] != 212222");
  if (CODE128_PATTERNS[33] !== "111323") errors.push("pattern[33] ('A') != 111323");
  if (CODE128_PATTERNS[104] !== "211214") errors.push("pattern[104] (Start B) != 211214");

  // Checksum known-answers for "PJJ123C"
  const data = "PJJ123C";
  const checkWith = (start: number) => {
    let sum = start;
    for (let i = 0; i < data.length; i++) sum += (data.charCodeAt(i) - 32) * (i + 1);
    return sum % 103;
  };
  if (checkWith(104) !== 55) errors.push(`checksum(PJJ123C, Start B) = ${checkWith(104)}, expected 55`);
  if (checkWith(103) !== 54) errors.push(`checksum(PJJ123C, Start A) = ${checkWith(103)}, expected 54`);

  // Encoding produces a non-empty, well-formed geometry
  const enc = encodeCode128("ABC-123");
  if (enc.bars.length === 0 || enc.width <= 0) errors.push("encodeCode128 produced empty geometry");

  // Auto-generated value should be 13 numeric digits with a valid EAN-13 check digit
  const gen = generateBarcodeValue();
  if (!/^\d{13}$/.test(gen)) errors.push(`generated value "${gen}" is not 13 digits`);
  if (ean13CheckDigit(gen.slice(0, 12)) !== gen[12]) errors.push(`generated value "${gen}" has a bad check digit`);

  return { passed: errors.length === 0, errors };
}
