/**
 * Proefdraaien: voert een SD-bestand (of USB-commando's) uit zoals Sandy's firmware dat
 * doet, en laat zien wat de machine zou tekenen. Zo kun je een bestand controleren
 * zonder de machine, en ook oude bestanden van je SD-kaart bekijken.
 *
 * Nagebootst gedrag (zie firmware/polarshield/): regels gescheiden door een regeleinde of
 * ';', afgekapt op 50 tekens, commando's met ",END"; koordlengtes in volle stappen;
 * C17 tekent een rechte lijn als begin en eind binnen het machinevlak liggen, en anders
 * een "kromme" beweging waarbij beide motoren tegelijk draaien.
 */

import type { Point } from '../geometry.ts';
import { positionFromCords, type MachineConfig } from '../machine.ts';

export type FirmwareVariant = 'original' | 'ab1';

export interface SimSegment {
  from: Point;
  to: Point;
  penDown: boolean;
}

export interface SimMessage {
  line: number;
  level: 'info' | 'warning' | 'error';
  text: string;
}

export interface SimResult {
  machine: MachineConfig;
  /** Bewegingen in machinecoördinaten (mm), in volgorde. */
  segments: SimSegment[];
  /** Waar de machine dacht te beginnen (machinecoördinaten). */
  start: Point;
  messages: SimMessage[];
  stats: {
    commands: number;
    drawLengthMm: number;
    travelLengthMm: number;
    pauseMs: number;
  };
}

const INLENGTH = 50;
/** Standaard startpositie van de firmware na "MOTORS ON": 8000 microstappen = 1000 volle stappen. */
const DEFAULT_START_STEPS = 1000;

export function simulateLegacy(text: string, machineIn: MachineConfig, firmware: FirmwareVariant = 'original'): SimResult {
  const machine = { ...machineIn };
  const messages: SimMessage[] = [];
  const segments: SimSegment[] = [];
  const stats = { commands: 0, drawLengthMm: 0, travelLengthMm: 0, pauseMs: 0 };
  const stepsToMm = (steps: number) => (steps * machine.mmPerRev) / machine.stepsPerRev;
  const add = (line: number, level: SimMessage['level'], msg: string) => {
    // Niet duizend keer dezelfde melding.
    const same = messages.filter((m) => m.text === msg).length;
    if (same < 3) messages.push({ line, level, text: msg });
    else if (same === 3) messages.push({ line, level, text: `${msg} (en vaker)` });
  };

  let a = DEFAULT_START_STEPS;
  let b = DEFAULT_START_STEPS;
  let positionSet = false;
  let penDown = false;
  let start = positionFromCords(machine, stepsToMm(a), stepsToMm(b));
  let warnedUnknownPosition = false;

  const pos = () => positionFromCords(machine, stepsToMm(a), stepsToMm(b));

  const move = (lineNo: number, newA: number, newB: number, straight: boolean) => {
    // Grenzen zoals in exec_changeLengthDirect (in microstappen in de firmware).
    const micro = machine.stepMultiplier;
    const maxLen = Math.hypot(machine.widthMm, machine.heightMm) * (machine.stepsPerRev / machine.mmPerRev);
    if (newA * micro < 20 || newB * micro < 20 || newA > maxLen || newB > maxLen) {
      add(lineNo, 'warning', 'Een punt valt buiten het bereik van de machine en wordt overgeslagen.');
      return;
    }
    if (!positionSet && !warnedUnknownPosition) {
      warnedUnknownPosition = true;
      add(
        lineNo,
        'warning',
        'Er wordt bewogen voordat het bestand de positie vastlegt (C09). De machine tekent dan vanaf waar hij denkt te zijn; dat klopt alleen als de pen op het oude home-punt hing toen je MOTORS ON drukte.',
      );
    }
    const from = pos();
    const toA = newA;
    const toB = newB;
    const to = positionFromCords(machine, stepsToMm(toA), stepsToMm(toB));
    const inside = (p: Point) => {
      const m = 20 / micro / (machine.stepsPerRev / machine.mmPerRev);
      return p.x > m && p.x < machine.widthMm - m && p.y > m && p.y < machine.heightMm - m;
    };
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    if (straight && inside(from) && inside(to)) {
      segments.push({ from, to, penDown });
    } else {
      // Beide motoren tegelijk naar hun nieuwe lengte: in het platte vlak een licht gebogen baan.
      const n = Math.max(1, Math.min(50, Math.ceil(length / 5)));
      let prev = from;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const p = positionFromCords(machine, stepsToMm(a + (toA - a) * t), stepsToMm(b + (toB - b) * t));
        segments.push({ from: prev, to: p, penDown });
        prev = p;
      }
    }
    if (penDown) stats.drawLengthMm += length;
    else stats.travelLengthMm += length;
    a = toA;
    b = toB;
  };

  // Regels opsplitsen zoals de firmware: op regeleinde of puntkomma.
  const raw = text.replace(/\r/g, '').split(/[\n;]/);
  // Een laatste lege "regel" na het laatste regeleinde bestaat voor de firmware niet.
  if (raw.length > 0 && raw[raw.length - 1] === '') raw.pop();

  raw.forEach((rawLine, index) => {
    const lineNo = index + 1;
    let line = rawLine.trim();
    if (line.length > INLENGTH) {
      add(lineNo, 'warning', `Regel is langer dan ${INLENGTH} tekens en wordt door de firmware afgekapt.`);
      line = line.slice(0, INLENGTH);
    }
    const end = line.indexOf(',END');
    if (end < 0) {
      if (firmware === 'original') {
        add(
          lineNo,
          'error',
          line === ''
            ? 'Lege regel: hierop kan de originele firmware vastlopen of vreemd gaan doen.'
            : 'Regel zonder ,END: hierop kan de originele firmware vastlopen of vreemd gaan doen.',
        );
      } else {
        add(lineNo, 'info', line === '' ? 'Lege regel overgeslagen.' : 'Regel zonder ,END overgeslagen.');
      }
      return;
    }
    const parts = line.slice(0, end).split(',');
    const cmd = parts[0];
    const num = (i: number) => Number(parts[i]);
    stats.commands++;
    switch (cmd) {
      case 'C09':
        a = num(1);
        b = num(2);
        positionSet = true;
        start = pos();
        break;
      case 'C13':
        penDown = true;
        break;
      case 'C14':
        penDown = false;
        break;
      case 'C17':
        move(lineNo, num(1), num(2), true);
        break;
      case 'C01':
        move(lineNo, num(1), num(2), false);
        break;
      case 'C24':
        if (num(1) > 10) machine.widthMm = num(1);
        if (num(2) > 10) machine.heightMm = num(2);
        break;
      case 'C29':
        if (num(1) > 0) machine.mmPerRev = num(1);
        break;
      case 'C30':
        if (num(1) > 0) machine.stepsPerRev = num(1);
        break;
      case 'C37':
        if (num(1) > 0) machine.stepMultiplier = num(1);
        break;
      case 'C51':
        if (firmware === 'ab1') stats.pauseMs += Math.min(600000, Math.max(0, num(1)));
        else add(lineNo, 'info', 'Wachten (C51) kent de originele firmware niet; die slaat het over.');
        break;
      default:
        add(lineNo, 'info', `Commando ${cmd} wordt in de proefdraai niet nagebootst.`);
    }
  });

  if (!positionSet && segments.length > 0) start = positionFromCords(machine, stepsToMm(DEFAULT_START_STEPS), stepsToMm(DEFAULT_START_STEPS));
  if (stats.commands === 0) add(0, 'error', 'Er zijn geen commando\'s gevonden. Is dit wel een tekenbestand voor de PolargraphSD?');
  return { machine, segments, start, messages, stats };
}
