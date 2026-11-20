import { describe, expect, it } from 'vitest';
import {
  buildPlan,
  centeredPaper,
  clipPolylines,
  computeStats,
  fitToPaper,
  place,
  PAPER_SIZES,
  POLARGRAPH_SD_DEFAULTS,
  type Polyline,
} from '../src/core/index.ts';

const machine = { widthMm: 1000, heightMm: 1500, ...POLARGRAPH_SD_DEFAULTS };
const paper = centeredPaper(machine, PAPER_SIZES.A4, 300);

describe('tekenplan', () => {
  it('tekent lijnen die bij elkaar liggen na elkaar, en draait lijnen om als dat korter is', () => {
    // Zoals Mark beschreef: lijnen in een "onhandige" volgorde getekend.
    // Rechtsonder, linksboven, rechtsonder, linksboven ...
    const lines: Polyline[] = [
      [{ x: 200, y: 280 }, { x: 150, y: 280 }],
      [{ x: 10, y: 10 }, { x: 40, y: 10 }],
      [{ x: 200, y: 270 }, { x: 150, y: 270 }],
      [{ x: 10, y: 20 }, { x: 40, y: 20 }],
    ];
    const original = computeStats(lines, { x: 0, y: 0 });
    const plan = buildPlan(lines, paper);
    expect(plan.stats.travelLengthMm).toBeLessThan(original.travelLengthMm * 0.6);
    // Eerst de twee lijnen linksboven, dan de twee rechtsonder.
    expect(plan.strokes[0][0].y).toBeLessThan(50);
    expect(plan.strokes[1][0].y).toBeLessThan(50);
    expect(plan.strokes[2][0].y).toBeGreaterThan(200);
    // De tweede lijn wordt omgedraaid zodat de pen niet terug hoeft.
    expect(plan.strokes[1][0].x).toBeCloseTo(40);
  });

  it('plakt aansluitende lijnen aan elkaar zonder de pen op te tillen', () => {
    const lines: Polyline[] = [
      [{ x: 10, y: 10 }, { x: 20, y: 10 }],
      [{ x: 20, y: 10 }, { x: 20, y: 20 }],
    ];
    const plan = buildPlan(lines, paper);
    expect(plan.strokes).toHaveLength(1);
    expect(plan.stats.penLifts).toBe(1);
  });

  it('knipt af op de papierrand en waarschuwt', () => {
    const lines: Polyline[] = [[{ x: -50, y: 100 }, { x: 100, y: 100 }]];
    const plan = buildPlan(lines, paper);
    expect(plan.strokes[0][0].x).toBeCloseTo(0);
    expect(plan.warnings.join(' ')).toMatch(/buiten het papier/);
  });

  it('splitst een lijn die het papier verlaat en weer binnenkomt', () => {
    const rect = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const clipped = clipPolylines([[{ x: 50, y: 50 }, { x: 150, y: 50 }, { x: 150, y: 60 }, { x: 50, y: 60 }]], rect);
    expect(clipped).toHaveLength(2);
  });

  it('past een tekening passend en gecentreerd op het papier', () => {
    const lines: Polyline[] = [[{ x: 0, y: 0 }, { x: 100, y: 50 }]];
    const placement = fitToPaper(lines, paper, 10);
    const placed = place(lines, placement);
    expect(placed[0][0].x).toBeCloseTo(10);
    expect(placed[0][1].x).toBeCloseTo(PAPER_SIZES.A4.widthMm - 10);
    const midY = (placed[0][0].y + placed[0][1].y) / 2;
    expect(midY).toBeCloseTo(PAPER_SIZES.A4.heightMm / 2);
  });

  it('draait een tekening een kwartslag', () => {
    const lines: Polyline[] = [[{ x: 0, y: 0 }, { x: 100, y: 0 }]];
    const placed = place(lines, { scale: 1, offsetX: 0, offsetY: 0, rotation: 90 }, { widthMm: 100, heightMm: 50 });
    expect(placed[0][0]).toMatchObject({ x: 50, y: 0 });
    expect(placed[0][1]).toMatchObject({ x: 50, y: 100 });
  });
});
