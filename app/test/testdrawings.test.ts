import { describe, expect, it } from 'vitest';
import { boundsOf, importSvg, TEST_DRAWINGS } from '../src/core/index.ts';
import { TEST_DRAWINGS as T } from '../src/core/testdrawings.ts';

describe('testtekeningen', () => {
  const paper = { widthMm: 297, heightMm: 420 };
  it('zijn allemaal geldige tekeningen binnen het papier', () => {
    for (const t of T) {
      const r = importSvg(t.svg(paper));
      expect(r.lines.length, t.id).toBeGreaterThan(0);
      const b = boundsOf(r.lines)!;
      expect(b.minX, t.id).toBeGreaterThanOrEqual(0);
      expect(b.minY, t.id).toBeGreaterThanOrEqual(0);
      expect(b.maxX, t.id).toBeLessThanOrEqual(paper.widthMm);
      expect(b.maxY, t.id).toBeLessThanOrEqual(paper.heightMm);
    }
  });
  it('het maatvierkant is precies 100 mm', () => {
    const sq = importSvg(T.find((t) => t.id === 'vierkant')!.svg(paper)).lines[0];
    const b = boundsOf([sq])!;
    expect(b.maxX - b.minX).toBeCloseTo(100, 6);
    expect(b.maxY - b.minY).toBeCloseTo(100, 6);
  });
  it('het bootje heeft een liniaal van precies 100 mm', () => {
    const lines = importSvg(T.find((t) => t.id === 'bootje')!.svg(paper)).lines;
    const ruler = lines.find((l) => l.length === 2 && Math.abs(l[1].x - l[0].x - 100) < 1e-6);
    expect(ruler).toBeDefined();
  });
  void TEST_DRAWINGS;
});
