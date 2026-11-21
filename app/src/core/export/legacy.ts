/**
 * Tekenbestand voor de bestaande firmware van Sandy Noble (PolargraphSD, Polarshield).
 * Hetzelfde formaat werkt voor de SD-kaart en voor USB.
 *
 * Regels van de firmware (zie firmware/polarshield/comms.ino en impl_ps.ino):
 * - één commando per regel, altijd eindigend op ",END";
 * - geen lege regels en geen commentaar: die laten de firmware crashen (bug F2);
 * - maximaal 50 tekens per regel;
 * - koordlengtes in volle stappen; de firmware vermenigvuldigt zelf met de stepMultiplier.
 *
 * Het bestand begint met "start vanaf linksboven": de gebruiker zet de pen met de hand
 * op de linkerbovenhoek van het papier, en het commando C09 vertelt de machine dat hij
 * daar staat. Aan het eind gaat de pen terug naar linksboven.
 */

import type { Point } from '../geometry.ts';
import { cordLengths, mmToLegacySteps, paperToMachine, type MachineConfig, type PaperConfig } from '../machine.ts';
import type { DrawingPlan } from '../plan.ts';

export const LEGACY_MAX_LINE_LENGTH = 50;

export interface LegacyExportOptions {
  /**
   * Maximale lengte van een recht stukje dat de firmware zelf nog onderverdeelt (C17),
   * in volle stappen. De oude app gebruikte standaard 2.
   */
  maxSegmentSteps?: number;
  /** Machinematen meesturen (C24, C29, C30, C37). Standaard aan. */
  includeMachineSpec?: boolean;
  /** Aan het eind terug naar de linkerbovenhoek. Standaard aan. */
  returnToStart?: boolean;
  /**
   * Wachten op droge inkt met C51. Alleen voor de Atelier Bakema-firmware (1.4.3-ab1 en
   * nieuwer); de originele firmware kent dit commando niet. Standaard uit.
   */
  pauseCommand?: boolean;
}

export const CMD = {
  setPosition: 'C09',
  penDown: 'C13',
  penUp: 'C14',
  changeLengthDirect: 'C17',
  setMachineSize: 'C24',
  setMmPerRev: 'C29',
  setStepsPerRev: 'C30',
  setStepMultiplier: 'C37',
  pause: 'C51',
} as const;

function cmd(name: string, ...params: Array<number | string>): string {
  return [name, ...params, 'END'].join(',');
}

export function nativeSteps(machine: MachineConfig, paper: PaperConfig, p: Point): { a: number; b: number } {
  const cords = cordLengths(machine, paperToMachine(paper, p));
  return { a: Math.round(mmToLegacySteps(machine, cords.a)), b: Math.round(mmToLegacySteps(machine, cords.b)) };
}

export function exportLegacy(plan: DrawingPlan, machine: MachineConfig, paper: PaperConfig, options: LegacyExportOptions = {}): string {
  const seg = Math.max(1, Math.round(options.maxSegmentSteps ?? 2));
  const lines: string[] = [];
  const startPoint = { x: 0, y: 0 };
  const home = nativeSteps(machine, paper, startPoint);

  lines.push(cmd(CMD.penUp));
  if (options.includeMachineSpec ?? true) {
    lines.push(cmd(CMD.setMachineSize, Math.round(machine.widthMm), Math.round(machine.heightMm)));
    lines.push(cmd(CMD.setMmPerRev, formatNumber(machine.mmPerRev)));
    lines.push(cmd(CMD.setStepsPerRev, Math.round(machine.stepsPerRev)));
    lines.push(cmd(CMD.setStepMultiplier, Math.round(machine.stepMultiplier)));
  }
  // De pen staat nu met de hand op linksboven: vertel dat de machine.
  lines.push(cmd(CMD.setPosition, home.a, home.b));
  lines.push(cmd(CMD.penUp));

  let last = home;
  const moveTo = (p: Point) => {
    const s = nativeSteps(machine, paper, p);
    if (s.a === last.a && s.b === last.b) return;
    lines.push(cmd(CMD.changeLengthDirect, s.a, s.b, seg));
    last = s;
  };

  plan.strokes.forEach((stroke, index) => {
    lines.push(cmd(CMD.penUp));
    moveTo(stroke[0]);
    const pause = plan.pauses[index] ?? 0;
    if (options.pauseCommand && pause > 0) lines.push(cmd(CMD.pause, Math.round(pause * 1000)));
    lines.push(cmd(CMD.penDown));
    for (let i = 1; i < stroke.length; i++) moveTo(stroke[i]);
  });
  lines.push(cmd(CMD.penUp));
  if (options.returnToStart ?? true) moveTo(startPoint);

  // Dubbele pen-omhoog direct na elkaar weghalen (komt voor bij de eerste lijn).
  const compact = lines.filter((l, i) => !(l === lines[i - 1] && l === cmd(CMD.penUp)));
  return compact.join('\n') + '\n';
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export interface LegacyValidationIssue {
  line: number;
  message: string;
}

/** Controleert een bestand op alles waar de oude firmware over struikelt. */
export function validateLegacy(text: string): LegacyValidationIssue[] {
  const issues: LegacyValidationIssue[] = [];
  const rows = text.split('\n');
  if (rows[rows.length - 1] === '') rows.pop();
  rows.forEach((row, i) => {
    const n = i + 1;
    if (row.trim() === '') issues.push({ line: n, message: 'Lege regel' });
    else if (!row.endsWith(',END')) issues.push({ line: n, message: 'Regel eindigt niet op ,END' });
    if (row.length > LEGACY_MAX_LINE_LENGTH) issues.push({ line: n, message: `Regel is langer dan ${LEGACY_MAX_LINE_LENGTH} tekens` });
    if (/[^\x20-\x7e]/.test(row)) issues.push({ line: n, message: 'Regel bevat ongeldige tekens' });
    if (row.includes(';')) issues.push({ line: n, message: 'Puntkomma is een scheidingsteken voor de firmware' });
  });
  return issues;
}

/**
 * Een bestandsnaam die de firmware kan tonen: 8 tekens, hoofdletters, extensie .TXT.
 * Vermijdt AUTORUN.TXT, dat start automatisch.
 */
export function sdFileName(base: string): string {
  let name = base
    .replace(/\.[^.]*$/, '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
  if (name === '' ) name = 'TEKENING';
  if (name === 'AUTORUN') name = 'AUTORUN1';
  return `${name}.TXT`;
}
