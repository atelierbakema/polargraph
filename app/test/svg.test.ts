import { describe, expect, it } from 'vitest';
import { boundsOf, importSvg } from '../src/core/index.ts';

const svg = (body: string, attrs = 'width="100mm" height="50mm" viewBox="0 0 100 50"') =>
  `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${body}</svg>`;

describe('SVG inlezen', () => {
  it('leest een lijn in millimeters', () => {
    const r = importSvg(svg('<line x1="10" y1="10" x2="90" y2="40"/>'));
    expect(r.widthMm).toBeCloseTo(100);
    expect(r.heightMm).toBeCloseTo(50);
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0][0].x).toBeCloseTo(10);
    expect(r.lines[0][1].y).toBeCloseTo(40);
  });

  it('rekent de viewBox om naar mm', () => {
    // 200 gebruikerseenheden over 100 mm: alles wordt gehalveerd.
    const r = importSvg(svg('<line x1="0" y1="0" x2="200" y2="0"/>', 'width="100mm" height="50mm" viewBox="0 0 200 100"'));
    expect(r.lines[0][1].x).toBeCloseTo(100);
  });

  it('neemt pixels aan als er geen eenheid is (96 per inch)', () => {
    const r = importSvg(svg('<line x1="0" y1="0" x2="96" y2="0"/>', 'width="96" height="96"'));
    expect(r.lines[0][1].x).toBeCloseTo(25.4);
  });

  it('past transformaties van groepen en elementen toe', () => {
    const r = importSvg(svg('<g transform="translate(10,5)"><line x1="0" y1="0" x2="10" y2="0" transform="scale(2)"/></g>'));
    expect(r.lines[0][0]).toMatchObject({ x: 10, y: 5 });
    expect(r.lines[0][1].x).toBeCloseTo(30);
  });

  it('maakt van een rechthoek een gesloten vorm', () => {
    const r = importSvg(svg('<rect x="10" y="10" width="20" height="10"/>'));
    const line = r.lines[0];
    expect(line[0]).toEqual(line[line.length - 1]);
    expect(line).toHaveLength(5);
  });

  it('benadert een cirkel met genoeg punten op de juiste plek', () => {
    const r = importSvg(svg('<circle cx="50" cy="25" r="20"/>'));
    const pts = r.lines.flat();
    expect(pts.length).toBeGreaterThan(20);
    for (const p of pts) expect(Math.hypot(p.x - 50, p.y - 25)).toBeCloseTo(20, 0);
    const b = boundsOf(r.lines)!;
    expect(b.minX).toBeCloseTo(30, 0);
    expect(b.maxX).toBeCloseTo(70, 0);
  });

  it('leest paden met bochten en meerdere deelpaden', () => {
    const r = importSvg(svg('<path d="M10 10 C 20 0, 30 20, 40 10 M 50 10 l 10 0 l 0 10 z"/>'));
    expect(r.lines).toHaveLength(2);
    const second = r.lines[1];
    expect(second[0]).toEqual(second[second.length - 1]);
  });

  it('slaat verborgen lagen en defs over', () => {
    const r = importSvg(svg('<g style="display:none"><line x1="0" y1="0" x2="10" y2="0"/></g><defs><line x1="0" y1="0" x2="10" y2="0"/></defs><line x1="1" y1="1" x2="2" y2="2"/>'));
    expect(r.lines).toHaveLength(1);
  });

  it('meldt tekst en afbeeldingen', () => {
    const r = importSvg(svg('<text x="0" y="10">Hallo</text><line x1="0" y1="0" x2="10" y2="0"/>'));
    expect(r.warnings.join(' ')).toMatch(/Tekst/);
    expect(r.lines).toHaveLength(1);
  });

  it('weigert iets dat geen SVG is', () => {
    expect(() => importSvg('<html><body/></html>')).toThrow();
  });
});
