import { describe, expect, it } from 'vitest';
import {
  buildPlan,
  centeredPaper,
  exportLegacy,
  PAPER_SIZES,
  paperToMachine,
  POLARGRAPH_SD_DEFAULTS,
  simulateLegacy,
  type Polyline,
} from '../src/core/index.ts';

const machine = { widthMm: 1000, heightMm: 1500, ...POLARGRAPH_SD_DEFAULTS };
const paper = centeredPaper(machine, PAPER_SIZES.A4, 300);
const square: Polyline[] = [[{ x: 20, y: 20 }, { x: 120, y: 20 }, { x: 120, y: 120 }, { x: 20, y: 120 }, { x: 20, y: 20 }]];

describe('proefdraaien', () => {
  it('tekent precies wat de app bedoelde (binnen een stap nauwkeurig)', () => {
    const text = exportLegacy(buildPlan(square, paper), machine, paper);
    const sim = simulateLegacy(text, machine, 'original');
    expect(sim.messages.filter((m) => m.level !== 'info')).toEqual([]);
    const drawn = sim.segments.filter((s) => s.penDown);
    expect(drawn).toHaveLength(4);
    const corner = paperToMachine(paper, { x: 120, y: 120 });
    expect(Math.hypot(drawn[1].to.x - corner.x, drawn[1].to.y - corner.y)).toBeLessThan(0.5);
    expect(sim.stats.drawLengthMm).toBeCloseTo(400, 0);
    // Start op de linkerbovenhoek van het papier.
    const home = paperToMachine(paper, { x: 0, y: 0 });
    expect(Math.hypot(sim.start.x - home.x, sim.start.y - home.y)).toBeLessThan(0.5);
  });

  it('waarschuwt voor lege regels bij de originele firmware, en slaat ze over bij -ab1', () => {
    const text = 'C14,END\n\nC09,908,1463,END\nC17,1000,1400,2\n';
    const orig = simulateLegacy(text, machine, 'original');
    expect(orig.messages.filter((m) => m.level === 'error')).toHaveLength(2);
    const ab = simulateLegacy(text, machine, 'ab1');
    expect(ab.messages.filter((m) => m.level === 'error')).toHaveLength(0);
  });

  it('waarschuwt als er bewogen wordt zonder dat de positie is vastgelegd', () => {
    const sim = simulateLegacy('C13,END\nC17,1100,1100,2,END\n', machine);
    expect(sim.messages.some((m) => m.text.includes('C09'))).toBe(true);
  });

  it('telt pauzes alleen bij de Atelier Bakema-firmware', () => {
    const text = 'C09,908,1463,END\nC51,5000,END\n';
    expect(simulateLegacy(text, machine, 'ab1').stats.pauseMs).toBe(5000);
    expect(simulateLegacy(text, machine, 'original').stats.pauseMs).toBe(0);
  });

  it('zet C51-pauzes in het SD-bestand als de firmware dat kan', () => {
    const crossing = buildPlan(
      [[{ x: 10, y: 50 }, { x: 110, y: 50 }], [{ x: 60, y: 20 }, { x: 60, y: 80 }]],
      paper,
      { order: 'original', inkDryingSec: 15 },
    );
    expect(exportLegacy(crossing, machine, paper)).not.toContain('C51');
    const withPause = exportLegacy(crossing, machine, paper, { pauseCommand: true });
    const rows = withPause.trimEnd().split('\n');
    const i = rows.findIndex((r) => r.startsWith('C51,'));
    expect(i).toBeGreaterThan(0);
    expect(rows[i + 1]).toBe('C13,END');
  });
});
