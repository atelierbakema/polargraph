/**
 * Testtekeningen om de machine te controleren en af te stellen.
 * Elke tekening is een SVG in millimeters, zodat hij door dezelfde route gaat als
 * een gewone tekening (inlezen, plaatsen, volgorde, SD-bestand).
 */

export interface TestDrawing {
  id: string;
  name: string;
  /** Wat je ermee controleert en hoe je meet. */
  howTo: string;
  svg: (paper: { widthMm: number; heightMm: number }) => string;
}

const svgDoc = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">` +
  `<g fill="none" stroke="black" stroke-width="0.4">${body}</g></svg>`;

const square = (x: number, y: number, s: number) =>
  `<rect x="${x}" y="${y}" width="${s}" height="${s}"/>`;

/** Arcering: evenwijdige lijnen in een driehoek, om stapverlies en penlift te zien. */
function hatchTriangle(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, spacing: number): string {
  // horizontale lijnen tussen de schuine zijden a-c en b-c (a en b onderaan, c bovenaan)
  let out = '';
  for (let y = Math.min(ay, by) - spacing; y > cy + spacing / 2; y -= spacing) {
    const t1 = (y - ay) / (cy - ay);
    const t2 = (y - by) / (cy - by);
    const x1 = ax + (cx - ax) * t1;
    const x2 = bx + (cx - bx) * t2;
    out += `<line x1="${x1.toFixed(2)}" y1="${y.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y.toFixed(2)}"/>`;
  }
  return out;
}

export const TEST_DRAWINGS: TestDrawing[] = [
  {
    id: 'bootje',
    name: 'Bakema-bootje (alles-in-één test)',
    howTo:
      'Een eigen testbootje, zoals de "Benchy" bij 3D-printers. Meet na het tekenen: de liniaal onderaan hoort 100 mm te zijn; de kajuit 50 × 30 mm; de patrijspoorten 20 en 10 mm rond (niet ovaal); de mast loodrecht op de romp. In het zeil liggen de arceringslijnen om de 2 mm: schuiven ze op of zitten er sleepsporen tussen, dan verliest de machine stappen of komt de pen niet goed omhoog. Het vlaggetje en de golfjes laten zien hoe fijn de machine kleine details tekent.',
    svg: (p) => {
      const cx = p.widthMm / 2;
      const base = Math.min(p.heightMm - 60, 200); // waterlijn
      const x0 = cx - 75; // romp 150 mm breed
      let b = '';
      // romp: rechte dek-lijn, schuine voor- en achterkant, ronde onderkant
      b += `<path d="M ${x0} ${base - 30} L ${x0 + 150} ${base - 30} L ${x0 + 135} ${base} Q ${cx} ${base + 18} ${x0 + 15} ${base} Z"/>`;
      // patrijspoorten 20 mm en 10 mm
      b += `<circle cx="${cx - 35}" cy="${base - 15}" r="10"/><circle cx="${cx + 35}" cy="${base - 15}" r="5"/>`;
      // kajuit 50 x 30 mm op het dek, met raampjes
      b += `<rect x="${cx - 25}" y="${base - 60}" width="50" height="30"/>`;
      b += `<rect x="${cx - 18}" y="${base - 53}" width="12" height="10"/><rect x="${cx + 6}" y="${base - 53}" width="12" height="10"/>`;
      // mast 110 mm
      const mastTop = base - 170;
      b += `<line x1="${cx + 30}" y1="${base - 30}" x2="${cx + 30}" y2="${mastTop}"/>`;
      // zeil met arcering om de 2 mm
      const sa = [cx + 30, base - 42];
      const sb = [cx + 95, base - 42];
      const sc = [cx + 30, mastTop + 8];
      b += `<path d="M ${sa[0]} ${sa[1]} L ${sb[0]} ${sb[1]} L ${sc[0]} ${sc[1]} Z"/>`;
      b += hatchTriangle(sa[0], sa[1], sb[0], sb[1], sc[0], sc[1], 2);
      // vlaggetje met fijne details
      b += `<path d="M ${cx + 30} ${mastTop} L ${cx + 18} ${mastTop + 4} L ${cx + 30} ${mastTop + 8}"/>`;
      b += `<line x1="${cx + 22}" y1="${mastTop + 4}" x2="${cx + 26}" y2="${mastTop + 4}"/>`;
      // golfjes
      for (let row = 0; row < 3; row++) {
        const y = base + 22 + row * 8;
        let d = `M ${x0 - 20 + row * 6} ${y}`;
        for (let i = 0; i < 9; i++) d += ` q 5 -4 10 0 q 5 4 10 0`;
        b += `<path d="${d}"/>`;
      }
      // liniaal 100 mm met streepjes om de 10 mm
      const ry = base + 52;
      b += `<line x1="${cx - 50}" y1="${ry}" x2="${cx + 50}" y2="${ry}"/>`;
      for (let i = 0; i <= 10; i++) b += `<line x1="${cx - 50 + i * 10}" y1="${ry}" x2="${cx - 50 + i * 10}" y2="${ry + (i % 5 === 0 ? 6 : 3)}"/>`;
      return svgDoc(p.widthMm, p.heightMm, b);
    },
  },
  {
    id: 'vierkant',
    name: 'Maatvierkant 100 mm',
    howTo:
      'Een vierkant van precies 100 × 100 mm met diagonalen en een liniaal met streepjes om de 10 mm. Meet de zijden en de diagonalen (die horen 141,4 mm te zijn). Zijn de zijden te kort of te lang, dan klopt de machinebreedte of de stand van de motoren niet. Zijn de diagonalen ongelijk, dan staat het vierkant scheef en klopt de breedte niet.',
    svg: (p) => {
      const s = 100;
      const x = Math.round((p.widthMm - s) / 2);
      const y = 40;
      let ticks = '';
      for (let i = 0; i <= 10; i++) ticks += `<line x1="${x + i * 10}" y1="${y - 12}" x2="${x + i * 10}" y2="${y - (i % 5 === 0 ? 20 : 16)}"/>`;
      return svgDoc(
        p.widthMm,
        p.heightMm,
        square(x, y, s) +
          `<line x1="${x}" y1="${y}" x2="${x + s}" y2="${y + s}"/><line x1="${x + s}" y1="${y}" x2="${x}" y2="${y + s}"/>` +
          `<line x1="${x}" y1="${y - 12}" x2="${x + s}" y2="${y - 12}"/>` +
          ticks,
      );
    },
  },
  {
    id: 'herhaling',
    name: 'Herhaaltest (5× hetzelfde vierkant)',
    howTo:
      'Hetzelfde vierkant van 60 mm wordt vijf keer over elkaar getekend, met steeds een verplaatsing naar een hoek van het papier ertussen. Ligt alles precies op één lijn, dan verliest de machine geen stappen. Schuiven de vierkanten langzaam op, dan slippen de koorden of verliezen de motoren stappen (te snel, te zwaar of te weinig stroom).',
    svg: (p) => {
      const s = 60;
      const x = Math.round((p.widthMm - s) / 2);
      const y = Math.round((p.heightMm - s) / 2);
      // Vijf losse vierkanten met telkens een "uitstapje" naar een hoek ertussen.
      const corners = [
        [10, 10],
        [p.widthMm - 10, 10],
        [p.widthMm - 10, p.heightMm - 10],
        [10, p.heightMm - 10],
        [10, 10],
      ];
      let body = '';
      corners.forEach(([cx, cy]) => {
        body += square(x, y, s);
        body += `<line x1="${cx}" y1="${cy}" x2="${cx + 0.5}" y2="${cy}"/>`;
      });
      return svgDoc(p.widthMm, p.heightMm, body);
    },
  },
  {
    id: 'raster',
    name: 'Raster over het hele papier',
    howTo:
      'Een raster van lijnen om de 50 mm over het hele papier, met een rand op 10 mm. Leg er een liniaal of geodriehoek langs: de lijnen horen recht en evenwijdig te zijn en de vakjes vierkant. Lopen de lijnen aan de zijkanten krom of uit elkaar, dan klopt de machinebreedte niet of hangt het papier niet waar de app denkt.',
    svg: (p) => {
      let body = `<rect x="10" y="10" width="${p.widthMm - 20}" height="${p.heightMm - 20}"/>`;
      for (let x = 50; x < p.widthMm - 10; x += 50) body += `<line x1="${x}" y1="10" x2="${x}" y2="${p.heightMm - 10}"/>`;
      for (let y = 50; y < p.heightMm - 10; y += 50) body += `<line x1="10" y1="${y}" x2="${p.widthMm - 10}" y2="${y}"/>`;
      return svgDoc(p.widthMm, p.heightMm, body);
    },
  },
  {
    id: 'penlift',
    name: 'Penlifttest (stippen en streepjes)',
    howTo:
      'Rijen korte streepjes van 10, 5, 2 en 1 mm. Elk streepje begint en eindigt met de pen omhoog. Zie je overal een begin en een eind, en geen sleepsporen ertussen, dan werkt de penlift goed. Ontbreken korte streepjes, dan gaat de pen te traag omlaag; zie je sleepsporen, dan komt hij niet hoog genoeg.',
    svg: (p) => {
      let body = '';
      const lengths = [10, 5, 2, 1];
      lengths.forEach((len, row) => {
        const y = 40 + row * 15;
        for (let i = 0; i < 10; i++) {
          const x = 30 + i * 20;
          body += `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}"/>`;
        }
      });
      return svgDoc(p.widthMm, p.heightMm, body);
    },
  },
  {
    id: 'droogtijd',
    name: 'Inktdroogtest (kruisende lijnen)',
    howTo:
      'Kruisende lijnen dicht op elkaar. Teken hem met en zonder inktdroogtijd en vergelijk de kruisingen: zonder droogtijd kan de pen natte inkt uitsmeren. Zo vind je de droogtijd die bij je pen en papier past.',
    svg: (p) => {
      let body = '';
      const x0 = Math.round((p.widthMm - 120) / 2);
      for (let i = 0; i < 7; i++) body += `<line x1="${x0}" y1="${60 + i * 15}" x2="${x0 + 120}" y2="${60 + i * 15}"/>`;
      for (let i = 0; i < 7; i++) body += `<line x1="${x0 + 15 + i * 15}" y1="45" x2="${x0 + 15 + i * 15}" y2="165"/>`;
      return svgDoc(p.widthMm, p.heightMm, body);
    },
  },
];
