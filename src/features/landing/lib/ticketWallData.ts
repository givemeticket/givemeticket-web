// TicketWallBg.tsx가 그리는 배경 티켓들의 원본 데이터 + 색상 계산 로직.
// templates/landing-ticket-intro/TicketWallBg.dc.html의 <script> 블록을
// 그대로 옮김 — 이 카드들은 읽히는 실제 콘텐츠가 아니라 장식용 텍스처라
// (스크롤 시퀀스 위에 스크림이 깔리고, 빽빽하게 반복돼서 어차피 하나하나
// 읽히지 않음) 한글화하지 않고 원본 예시 데이터를 그대로 유지함.

export type TicketWallThemeName = "light" | "dark";

interface TicketBase {
  category: string;
  event: string;
  venue: string;
  date: string;
  time: string;
  seat: string;
  price: string;
  accent: string;
  bg: string;
  tag: string;
  accentDark: string;
  bgDark: string;
}

const TICKETS: Omit<TicketBase, "accentDark" | "bgDark">[] = [
  {
    category: "OPERA",
    event: "La Traviata",
    venue: "Royal Opera House",
    date: "NOV 08, 2026",
    time: "19:30",
    seat: "BOX C · 4",
    price: "₩1,200",
    accent: "#A2802F",
    bg: "linear-gradient(135deg, #FFFCF2 0%, #F4EDD9 100%)",
    tag: "PREMIERE",
  },
  {
    category: "GALA",
    event: "Black & White Ball",
    venue: "The Savoy, London",
    date: "DEC 31, 2026",
    time: "21:00",
    seat: "TABLE 7 · 2",
    price: "₩2,400",
    accent: "#6E6A62",
    bg: "linear-gradient(135deg, #FFFFFF 0%, #F1F0EC 100%)",
    tag: "NYE",
  },
  {
    category: "CONCERT",
    event: "Nocturnes & Études",
    venue: "Wigmore Hall",
    date: "OCT 22, 2026",
    time: "20:00",
    seat: "STALL · G-11",
    price: "₩380",
    accent: "#A2802F",
    bg: "linear-gradient(135deg, #FFFBF0 0%, #F6EEDC 100%)",
    tag: "SOLO",
  },
  {
    category: "EXHIBITION",
    event: "Gilded Visions",
    venue: "Victoria & Albert Museum",
    date: "SEP 30, 2026",
    time: "18:00",
    seat: "PRIVATE PREVIEW",
    price: "₩750",
    accent: "#8C7A3C",
    bg: "linear-gradient(135deg, #FDFBF4 0%, #EFEADB 100%)",
    tag: "VIP",
  },
  {
    category: "RACING",
    event: "Royal Ascot Champion Day",
    venue: "Ascot Racecourse",
    date: "OCT 17, 2026",
    time: "14:00",
    seat: "ROYAL ENCLOSURE",
    price: "₩1,800",
    accent: "#5F6B5A",
    bg: "linear-gradient(135deg, #FBFCF8 0%, #EDF1E7 100%)",
    tag: "ENCLOSURE",
  },
  {
    category: "THEATRE",
    event: "Hamlet",
    venue: "Shakespeare's Globe",
    date: "NOV 19, 2026",
    time: "19:45",
    seat: "MEZZANINE · B-3",
    price: "₩620",
    accent: "#9B5B3C",
    bg: "linear-gradient(135deg, #FFF9F4 0%, #F6E9DF 100%)",
    tag: "REVIVAL",
  },
  {
    category: "SYMPHONY",
    event: "Mahler's Ninth",
    venue: "Royal Albert Hall",
    date: "DEC 05, 2026",
    time: "19:30",
    seat: "CIRCLE · E-17",
    price: "₩490",
    accent: "#4C5A73",
    bg: "linear-gradient(135deg, #FAFBFD 0%, #E9EDF4 100%)",
    tag: "FINAL SEASON",
  },
  {
    category: "FASHION",
    event: "Haute Couture Showcase",
    venue: "Palais Royal, Paris",
    date: "JAN 23, 2027",
    time: "20:00",
    seat: "FRONT ROW · 5",
    price: "₩3,600",
    accent: "#9C6472",
    bg: "linear-gradient(135deg, #FFFAFB 0%, #F6E9EC 100%)",
    tag: "EXCLUSIVE",
  },
];

// 다크 테마 전용 대응 색상(같은 순서). #0C0C0C 바닥에서도 카드가 질감으로
// 보이게 살짝 띄운 색이라, light 테마의 밝은 배경색과는 독립적으로 둠.
const DARK_STOCK: { accentDark: string; bgDark: string }[] = [
  {
    accentDark: "#D3B152",
    bgDark: "linear-gradient(135deg, #1f1f1f 0%, #2a2a1d 100%)",
  },
  {
    accentDark: "#DCDCE0",
    bgDark: "linear-gradient(135deg, #1c1c1c 0%, #262626 100%)",
  },
  {
    accentDark: "#D3B152",
    bgDark: "linear-gradient(135deg, #201a10 0%, #2d2719 100%)",
  },
  {
    accentDark: "#C3A345",
    bgDark: "linear-gradient(135deg, #1a1a1a 0%, #23211a 100%)",
  },
  {
    accentDark: "#DCDCE0",
    bgDark: "linear-gradient(135deg, #181818 0%, #222222 100%)",
  },
  {
    accentDark: "#D3B152",
    bgDark: "linear-gradient(135deg, #1e1910 0%, #2a2416 100%)",
  },
  {
    accentDark: "#D3B152",
    bgDark: "linear-gradient(135deg, #15151e 0%, #1f1f2c 100%)",
  },
  {
    accentDark: "#DCDCE0",
    bgDark: "linear-gradient(135deg, #1b1b1b 0%, #252525 100%)",
  },
];

export const TICKET_STOCK: TicketBase[] = TICKETS.map((t, i) => ({
  ...t,
  ...DARK_STOCK[i],
}));

export interface TicketWallPalette {
  paper: string;
  ink: string;
  ink2: string;
  ink3: string;
  ink4: string;
  edge: string;
  shadow: string;
}

export const TICKET_WALL_THEMES: Record<
  TicketWallThemeName,
  TicketWallPalette
> = {
  light: {
    paper: "#FCFBF7",
    ink: "#211F1B",
    ink2: "#3A3630",
    ink3: "#6F695D",
    ink4: "#8B8577",
    edge: "rgba(35,33,28,0.3)",
    shadow: "rgba(35,33,28,0.07)",
  },
  dark: {
    paper: "#0C0C0C",
    ink: "#F7F3EC",
    ink2: "#E3E1DC",
    ink3: "#9B978F",
    ink4: "#6E6A63",
    edge: "rgba(245,240,232,0.34)",
    shadow: "rgba(0,0,0,0.5)",
  },
};

// 카드 가로 340 x 세로 170, 카드 사이 간격 14 — clip-path의 노치 좌표와
// 아래 SVG 외곽선 path가 이 숫자에 맞춰 그려져 있어서 임의로 바꾸면 안 됨.
export const TICKET_W = 340;
export const TICKET_H = 170;
export const GAP = 14;
export const UNIT = TICKET_H + GAP; // 한 칸(카드+간격)의 세로 높이
export const SLOT_W = TICKET_W + GAP; // 한 칸의 가로 폭

// 장식용 바코드를 만드는 줄무늬 폭(px) — bar/space가 교대로 나옴, bar로 시작.
const BARCODE_WIDTHS = [1, 2, 2, 1, 1, 3, 3, 1, 1, 1, 2, 2, 1, 1, 2, 1, 1, 2];

export function buildBarcode(color: string): { image: string; tile: string } {
  const stops: string[] = [];
  let x = 0;
  BARCODE_WIDTHS.forEach((w, i) => {
    if (i % 2 === 0) {
      stops.push(`${color} ${x}px`, `${color} ${x + w}px`);
    } else {
      stops.push(`transparent ${x}px`, `transparent ${x + w}px`);
    }
    x += w;
  });
  return {
    image: `linear-gradient(to bottom, ${stops.join(", ")})`,
    tile: `${x}px`,
  };
}

// 카드 8종이 배치 순서상 서로 겹치지 않게 섞이도록 하는 간격 — 카드 개수(8)와
// 서로소라서 각 열(column)마다 다른 순서로 카드가 반복됨.
export const COLUMN_STRIDE = 3;
// 화면을 덮는 데 필요한 칸 수보다 한 칸 더 여유를 둠 — 회전된 벽의 끝자락이
// 딱 걸쳐서 카드가 반쪽만 보이는 채로 루프가 끝나는 걸 방지.
export const SLOT_MARGIN = 1;

const OPACITY = {
  edge: 0.36,
  perforation: 0.32,
  stubRule: 0.33,
  tag: 0.53,
  hairline: 0.27,
};

export function withAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export interface DecoratedTicket {
  category: string;
  event: string;
  venue: string;
  price: string;
  tag: string;
  accent: string;
  bg: string;
  edge: string;
  perfLine: string;
  rule: string;
  accentSoft: string;
  hairline: string;
  barcodeImage: string;
  barcodeTile: string;
  fields: { label: string; value: string }[];
}

export function decorateTicket(t: TicketBase, dark: boolean): DecoratedTicket {
  const accent = dark ? t.accentDark : t.accent;
  const barcode = buildBarcode(accent);
  return {
    category: t.category,
    event: t.event,
    venue: t.venue,
    price: t.price,
    tag: t.tag,
    accent,
    bg: dark ? t.bgDark : t.bg,
    edge: withAlpha(accent, OPACITY.edge),
    perfLine: `repeating-linear-gradient(to bottom, ${withAlpha(accent, OPACITY.perforation)} 0px, ${withAlpha(accent, OPACITY.perforation)} 6px, transparent 6px, transparent 12px)`,
    rule: withAlpha(accent, OPACITY.stubRule),
    accentSoft: withAlpha(accent, OPACITY.tag),
    hairline: `linear-gradient(to right, ${withAlpha(accent, OPACITY.hairline)}, transparent)`,
    barcodeImage: barcode.image,
    barcodeTile: barcode.tile,
    fields: [
      { label: "Date", value: t.date },
      { label: "Time", value: t.time },
      { label: "Seat", value: t.seat },
    ],
  };
}

// 카드 하나의 노치(양옆 화살표 모양 절취선) 외곽선 — clip-path와 그 위에 겹쳐
// 그리는 stroke용 SVG path가 반드시 같은 좌표를 써야 함(하나는 배경을
// 잘라내고, 하나는 그 잘린 경계선 위에 테두리만 그리는 방식이라 둘이
// 어긋나면 테두리가 카드 모양과 안 맞게 보임).
export const TICKET_CLIP_PATH =
  "path('M 6.5,0.5 L 77,0.5 L 84,7.5 L 91,0.5 L 333.5,0.5 A 6,6 0 0 1 339.5,6.5 L 339.5,78 L 332.5,85 L 339.5,92 L 339.5,163.5 A 6,6 0 0 1 333.5,169.5 L 91,169.5 L 84,162.5 L 77,169.5 L 6.5,169.5 A 6,6 0 0 1 0.5,163.5 L 0.5,92 L 7.5,85 L 0.5,78 L 0.5,6.5 A 6,6 0 0 1 6.5,0.5 Z')";
export const TICKET_OUTLINE_PATH =
  "M 6.5,0.5 L 77,0.5 L 84,7.5 L 91,0.5 L 333.5,0.5 A 6,6 0 0 1 339.5,6.5 L 339.5,78 L 332.5,85 L 339.5,92 L 339.5,163.5 A 6,6 0 0 1 333.5,169.5 L 91,169.5 L 84,162.5 L 77,169.5 L 6.5,169.5 A 6,6 0 0 1 0.5,163.5 L 0.5,92 L 7.5,85 L 0.5,78 L 0.5,6.5 A 6,6 0 0 1 6.5,0.5 Z";
