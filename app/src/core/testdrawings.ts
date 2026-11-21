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

export const TEST_DRAWINGS: TestDrawing[] = [
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
