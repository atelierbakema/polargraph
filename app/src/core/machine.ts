/**
 * De meetkunde van een polargraph.
 *
 * Machinecoördinaten: de oorsprong ligt bij het tandwiel van motor A (links),
 * x loopt naar rechts, y loopt omlaag. Motor B zit op (breedte, 0).
 * Papiercoördinaten: de oorsprong ligt in de linkerbovenhoek van het papier,
 * x naar rechts, y omlaag. Alles in millimeters.
 */

import type { Point } from './geometry.ts';

export interface MachineConfig {
  /** Afstand tussen de twee tandwielen (motor A en motor B), in mm. */
  widthMm: number;
  /** Hoogte van de motoren boven de vloer (of onderkant van het tekenvlak), in mm. */
  heightMm: number;
  /** Hoeveel koord één omwenteling van het tandwiel opwindt, in mm. PolargraphSD: 95. */
  mmPerRev: number;
  /** Volle stappen per omwenteling van de motor. Meestal 200. */
  stepsPerRev: number;
  /** Microstappen per volle stap, ingesteld in de firmware. PolargraphSD: 8. */
  stepMultiplier: number;
}

export interface PaperConfig {
  widthMm: number;
  heightMm: number;
  /** Afstand van de lijn tussen de motoren tot de bovenrand van het papier. */
  topMm: number;
  /** Afstand van motor A (links) tot de linkerrand van het papier. */
  leftMm: number;
}

/** Standaardwaarden van de PolargraphSD (uit de firmware van Sandy Noble). */
export const POLARGRAPH_SD_DEFAULTS = {
  mmPerRev: 95,
  stepsPerRev: 200,
  stepMultiplier: 8,
} as const;

export const PAPER_SIZES: Record<string, { widthMm: number; heightMm: number }> = {
  A5: { widthMm: 148, heightMm: 210 },
  A4: { widthMm: 210, heightMm: 297 },
  A3: { widthMm: 297, heightMm: 420 },
  A2: { widthMm: 420, heightMm: 594 },
  A1: { widthMm: 594, heightMm: 841 },
  A0: { widthMm: 841, heightMm: 1189 },
};

/** Papier horizontaal gecentreerd tussen de motoren. */
export function centeredPaper(
  machine: MachineConfig,
  size: { widthMm: number; heightMm: number },
  topMm: number,
): PaperConfig {
  return {
    widthMm: size.widthMm,
    heightMm: size.heightMm,
    topMm,
    leftMm: (machine.widthMm - size.widthMm) / 2,
  };
}

export function paperToMachine(paper: PaperConfig, p: Point): Point {
  return { x: p.x + paper.leftMm, y: p.y + paper.topMm };
}

export function machineToPaper(paper: PaperConfig, p: Point): Point {
  return { x: p.x - paper.leftMm, y: p.y - paper.topMm };
}

/** Koordlengtes (mm) van motor A en motor B naar een punt in machinecoördinaten. */
export function cordLengths(machine: MachineConfig, p: Point): { a: number; b: number } {
  return {
    a: Math.hypot(p.x, p.y),
    b: Math.hypot(machine.widthMm - p.x, p.y),
  };
}

/** Het omgekeerde: van koordlengtes terug naar een punt in machinecoördinaten. */
export function positionFromCords(machine: MachineConfig, a: number, b: number): Point {
  const w = machine.widthMm;
  const x = (w * w - b * b + a * a) / (2 * w);
  const y = Math.sqrt(Math.max(0, a * a - x * x));
  return { x, y };
}

/**
 * Omrekenen van mm koord naar de stappen die Sandy's firmware verwacht.
 * Die rekent in volle stappen; de firmware vermenigvuldigt zelf met de stepMultiplier.
 */
export function mmToLegacySteps(machine: MachineConfig, mm: number): number {
  return (mm * machine.stepsPerRev) / machine.mmPerRev;
}

export interface ConfigProblem {
  level: 'error' | 'warning';
  message: string;
}

/** Controleert of machine en papier bij elkaar passen. Teksten zijn bedoeld voor de gebruiker. */
export function checkSetup(machine: MachineConfig, paper: PaperConfig): ConfigProblem[] {
  const problems: ConfigProblem[] = [];
  if (!(machine.widthMm > 100)) problems.push({ level: 'error', message: 'De machinebreedte moet groter zijn dan 100 mm.' });
  if (!(machine.heightMm > 100)) problems.push({ level: 'error', message: 'De machinehoogte moet groter zijn dan 100 mm.' });
  if (!(paper.widthMm > 0 && paper.heightMm > 0)) problems.push({ level: 'error', message: 'Het papierformaat is ongeldig.' });
  if (paper.leftMm < 0 || paper.leftMm + paper.widthMm > machine.widthMm) {
    problems.push({ level: 'error', message: 'Het papier valt (deels) buiten de breedte tussen de motoren.' });
  }
  if (paper.topMm + paper.heightMm > machine.heightMm) {
    problems.push({ level: 'error', message: 'Het papier hangt lager dan de opgegeven machinehoogte.' });
  }
  if (paper.topMm < machine.widthMm * 0.1) {
    problems.push({
      level: 'warning',
      message:
        'Het papier hangt erg hoog. Vlak onder de motoren lopen de koorden bijna horizontaal en tekent de machine onnauwkeurig. Hang het papier lager.',
    });
  }
  const margin = 0.05 * machine.widthMm;
  if (paper.leftMm < margin || machine.widthMm - (paper.leftMm + paper.widthMm) < margin) {
    problems.push({
      level: 'warning',
      message: 'Het papier komt dicht bij een van de motoren. Aan de zijkanten tekent de machine minder nauwkeurig.',
    });
  }
  return problems;
}
