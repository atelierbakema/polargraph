import { describe, expect, it } from 'vitest';
import {
  buildPlan,
  centeredPaper,
  exportGcode,
  exportLegacy,
  nativeSteps,
  PAPER_SIZES,
  POLARGRAPH_SD_DEFAULTS,
  sdFileName,
  validateLegacy,
  type Polyline,
} from '../src/core/index.ts';

const machine = { widthMm: 1000, heightMm: 1500, ...POLARGRAPH_SD_DEFAULTS };
const paper = centeredPaper(machine, PAPER_SIZES.A4, 300);
const lines: Polyline[] = [
  [{ x: 20, y: 20 }, { x: 100, y: 20 }, { x: 100, y: 100 }],
  [{ x: 150, y: 200 }, { x: 180, y: 250 }],
];
const plan = buildPlan(lines, paper);

describe('bestand voor de oude firmware (SD-kaart)', () => {
  const text = exportLegacy(plan, machine, paper);
  const rows = text.trimEnd().split('\n');

  it('voldoet aan alle regels van de firmware', () => {
    expect(validateLegacy(text)).toEqual([]);
  });

  it('begint met pen omhoog, machinematen en "de pen staat linksboven"', () => {
    expect(rows[0]).toBe('C14,END');
    expect(rows[1]).toBe('C24,1000,1500,END');
    const home = nativeSteps(machine, paper, { x: 0, y: 0 });
    expect(rows).toContain(`C09,${home.a},${home.b},END`);
    expect(rows.indexOf(`C09,${home.a},${home.b},END`)).toBeLessThan(rows.findIndex((r) => r.startsWith('C17')));
  });

  it('tilt de pen op voor elke verplaatsing en zet hem neer voor het tekenen', () => {
    const firstMove = rows.findIndex((r) => r.startsWith('C17'));
    expect(rows[firstMove - 1]).toBe('C14,END');
    expect(rows[firstMove + 1]).toBe('C13,END');
    expect(rows.filter((r) => r === 'C13,END')).toHaveLength(plan.strokes.length);
  });

  it('eindigt met pen omhoog terug op linksboven', () => {
    const home = nativeSteps(machine, paper, { x: 0, y: 0 });
    expect(rows[rows.length - 1]).toBe(`C17,${home.a},${home.b},2,END`);
    expect(rows[rows.length - 2]).toBe('C14,END');
  });

  it('heeft symmetrische koordlengtes in het midden van het papier', () => {
    const mid = nativeSteps(machine, paper, { x: PAPER_SIZES.A4.widthMm / 2, y: 100 });
    expect(mid.a).toBe(mid.b);
  });

  it('vindt fouten die de firmware laten crashen', () => {
    const issues = validateLegacy('C14,END\n\nC17,1,2,2\n');
    expect(issues.map((i) => i.message)).toEqual(['Lege regel', 'Regel eindigt niet op ,END']);
  });
});

describe('bestandsnaam voor de SD-kaart', () => {
  it('maakt korte namen in hoofdletters', () => {
    expect(sdFileName('Mijn vogel tekening.svg')).toBe('MIJNVOGE.TXT');
    expect(sdFileName('café.svg')).toBe('CAFE.TXT');
  });
  it('vermijdt de automatische startnaam', () => {
    expect(sdFileName('autorun.svg')).toBe('AUTORUN1.TXT');
  });
});

describe('G-code', () => {
  it('maakt een leesbaar G-codebestand in millimeters', () => {
    const g = exportGcode(plan, paper, { title: 'test' });
    expect(g).toContain('G21');
    expect(g).toContain('G90');
    expect(g).toContain('G0 X20 Y20');
    expect(g).toContain('G1 X100 Y100');
    expect(g.trimEnd().split('\n').at(-1)).toBe('G0 X0 Y0');
  });
  it('kan Y omdraaien voor gereedschap met oorsprong linksonder', () => {
    const g = exportGcode(plan, paper, { flipY: true });
    expect(g).toContain(`G0 X20 Y${PAPER_SIZES.A4.heightMm - 20}`);
  });
});

describe('G-code met inktdroogtijd', () => {
  it('zet een pauze (G4) vóór het neerzetten van de pen', () => {
    const crossing = buildPlan(
      [[{ x: 10, y: 50 }, { x: 110, y: 50 }], [{ x: 60, y: 20 }, { x: 60, y: 80 }]],
      paper,
      { order: 'original', inkDryingSec: 15 },
    );
    const g = exportGcode(crossing, paper).split('\n');
    const i = g.findIndex((l) => l.startsWith('G4 P'));
    expect(i).toBeGreaterThan(0);
    expect(g[i - 1]).toBe('G0 X60 Y20');
    expect(g[i + 1]).toBe('G1 Z0');
  });
});
