import { describe, expect, it } from 'vitest';
import {
  centeredPaper,
  checkSetup,
  cordLengths,
  mmToLegacySteps,
  PAPER_SIZES,
  paperToMachine,
  POLARGRAPH_SD_DEFAULTS,
  positionFromCords,
  type MachineConfig,
} from '../src/core/index.ts';

const machine: MachineConfig = { widthMm: 1000, heightMm: 1500, ...POLARGRAPH_SD_DEFAULTS };

describe('machine', () => {
  it('rekent koordlengtes uit en weer terug', () => {
    for (const p of [{ x: 500, y: 400 }, { x: 120, y: 900 }, { x: 870, y: 250 }]) {
      const { a, b } = cordLengths(machine, p);
      const back = positionFromCords(machine, a, b);
      expect(back.x).toBeCloseTo(p.x, 6);
      expect(back.y).toBeCloseTo(p.y, 6);
    }
  });

  it('heeft gelijke koorden in het midden', () => {
    const { a, b } = cordLengths(machine, { x: 500, y: 600 });
    expect(a).toBeCloseTo(b, 9);
  });

  it('rekent mm om naar volle stappen zoals Sandy\'s firmware (200 stappen per 95 mm)', () => {
    expect(mmToLegacySteps(machine, 95)).toBeCloseTo(200, 9);
    expect(mmToLegacySteps(machine, 1000)).toBeCloseTo(2105.263, 3);
  });

  it('centreert papier tussen de motoren', () => {
    const paper = centeredPaper(machine, PAPER_SIZES.A3, 250);
    expect(paper.leftMm).toBeCloseTo((1000 - 297) / 2);
    expect(paperToMachine(paper, { x: 0, y: 0 })).toEqual({ x: paper.leftMm, y: 250 });
  });

  it('waarschuwt als het papier niet past', () => {
    const paper = centeredPaper(machine, PAPER_SIZES.A0, 400);
    const problems = checkSetup(machine, paper);
    expect(problems.some((p) => p.level === 'error')).toBe(true);
  });

  it('keurt een normale opstelling goed', () => {
    const paper = centeredPaper(machine, PAPER_SIZES.A3, 250);
    expect(checkSetup(machine, paper).filter((p) => p.level === 'error')).toEqual([]);
  });
});
