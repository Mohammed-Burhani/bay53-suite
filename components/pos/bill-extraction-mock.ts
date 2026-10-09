// Prototype-only stand-in for the bill OCR/extraction service.
// Each uploaded photo is mapped to one of these templates by its sequence number,
// so the demo is deterministic and repeated items merge across bills.

export interface ExtractedLine {
  name: string;
  qty: number;
  unit: string;
  rate: number;
  gst: number;
  /** The reader was unsure about qty or rate on this line. */
  lowConfidence?: boolean;
}

export interface ExtractedBill {
  billNo: string;
  date: string; // yyyy-mm-dd
  lines: ExtractedLine[];
}

type Row = [name: string, qty: number, unit: string, rate: number, gst: number, lowConfidence?: boolean];

const TEMPLATES: { daysAgo: number; rows: Row[] }[] = [
  {
    daysAgo: 4,
    rows: [
      ['Aashirvaad Atta 10 kg', 1, 'bag', 485, 5],
      ['Fortune Sunflower Oil 1 L', 6, 'pouch', 142, 5],
      ['Tata Salt 1 kg', 10, 'pkt', 28, 0],
      ['Toor Dal 1 kg', 5, 'kg', 168, 5],
      ['Sona Masoori Rice 25 kg', 2, 'bag', 1340, 5],
      ['Red Chilli Powder 500 g', 3, 'pkt', 118, 5],
      ['Surf Excel Matic 2 kg', 1, 'pkt', 455, 18],
      ['Parle-G 800 g', 4, 'pkt', 92, 18, true],
    ],
  },
  {
    daysAgo: 3,
    rows: [
      ['Tata Salt 1 kg', 6, 'pkt', 28, 0],
      ['Fortune Sunflower Oil 1 L', 4, 'pouch', 142, 5],
      ['Moong Dal 1 kg', 4, 'kg', 132, 5],
      ['Tata Tea Gold 1 kg', 2, 'pkt', 560, 5],
      ['Sugar 5 kg', 2, 'bag', 235, 5],
      ['Vim Bar 300 g', 12, 'pc', 30, 18],
      ['Amul Butter 500 g', 3, 'pc', 285, 12],
    ],
  },
  {
    daysAgo: 1,
    rows: [
      ['Toor Dal 1 kg', 3, 'kg', 168, 5],
      ['Turmeric Powder 200 g', 4, 'pkt', 64, 5],
      ['MDH Garam Masala 100 g', 5, 'pkt', 86, 5],
      ['Groundnut Oil 1 L', 5, 'pouch', 198, 5, true],
      ['Colgate Strong Teeth 200 g', 6, 'pc', 108, 18],
      ['India Gate Basmati 5 kg', 1, 'bag', 720, 5],
    ],
  },
  {
    daysAgo: 0,
    rows: [
      ['Sugar 5 kg', 1, 'bag', 235, 5],
      ['Maggi Noodles 12-pack', 3, 'pkt', 168, 18],
      ['Lizol Floor Cleaner 975 ml', 2, 'btl', 199, 18],
      ['Good Day Cashew 600 g', 2, 'pkt', 120, 18],
      ['Urad Dal 1 kg', 2, 'kg', 145, 5],
    ],
  },
];

export const EXTRACT_DELAY_MS = 1800;

export function toISODate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function mockExtract(seq: number): ExtractedBill {
  const t = TEMPLATES[(seq - 1) % TEMPLATES.length];
  const date = new Date();
  date.setDate(date.getDate() - t.daysAgo);

  return {
    billNo: `B-${2283 + seq * 7}`,
    date: toISODate(date),
    lines: t.rows.map(([name, qty, unit, rate, gst, lowConfidence]) => ({
      name,
      qty,
      unit,
      rate,
      gst,
      lowConfidence,
    })),
  };
}
