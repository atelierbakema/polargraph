/**
 * Van losse lijnen naar een tekenplan: plaatsen op het papier, afknippen op de
 * papierrand, een slimme volgorde kiezen en uitrekenen hoeveel er getekend en
 * bewogen wordt.
 */

import {
  boundsOf,
  cleanPolylines,
  clipPolylines,
  distance,
  polylineLength,
  type Bounds,
  type Point,
  type Polyline,
} from './geometry.ts';
import type { PaperConfig } from './machine.ts';

export interface Placement {
  /** Schaal (1 = ware grootte zoals in het SVG-bestand). */
  scale: number;
  /** Verschuiving van de linkerbovenhoek van de tekening op het papier, in mm. */
  offsetX: number;
  offsetY: number;
  /** Draaiing in stappen van 90 graden, met de klok mee. */
  rotation: 0 | 90 | 180 | 270;
}

/** Een tekenopdracht: lijnen in papiercoördinaten (mm), in de volgorde waarin ze getekend worden. */
export interface DrawingPlan {
  strokes: Polyline[];
  /** Wachttijd in seconden vóór elke lijn (inktdroogtijd). Even lang als `strokes`. */
  pauses: number[];
  stats: PlanStats;
  warnings: string[];
}

export interface PlanStats {
  strokeCount: number;
  /** Totale lengte met de pen omlaag (mm). */
  drawLengthMm: number;
  /** Totale lengte met de pen omhoog (mm), inclusief heen en terug naar het startpunt. */
  travelLengthMm: number;
  penLifts: number;
  bounds: Bounds | null;
  /** Totale wachttijd voor het drogen van de inkt, in seconden. */
  pauseSec: number;
}

/**
 * - nearest: kortste weg, steeds de dichtstbijzijnde volgende lijn, van boven naar beneden;
 * - right-handed: zoals een rechtshandige tekent, van linksboven naar rechtsonder;
 * - left-handed: zoals een linkshandige tekent, van rechtsboven naar linksonder;
 * - original: de volgorde uit het bestand.
 */
export type OrderStrategy = 'nearest' | 'right-handed' | 'left-handed' | 'original';

export interface PlanOptions {
  /** Startpunt van de pen op het papier (mm). Standaard linksboven: (0, 0). */
  start?: Point;
  order?: OrderStrategy;
  /**
   * Bij de kortste-wegvolgorde de tekening van boven naar beneden afwerken (standaard aan),
   * zodat de penlift niet over net getekende lijnen schuurt.
   */
  topToBottom?: boolean;
  /**
   * Hoogte van de stroken bij rechts- of linkshandig tekenen (mm). Standaard een tiende
   * van de hoogte van de tekening, minimaal 10 mm.
   */
  bandHeightMm?: number;
  /** Lijnen die op minder dan deze afstand op elkaar aansluiten, worden zonder pen op te tillen getekend. */
  joinToleranceMm?: number;
  /**
   * Inktdroogtijd: een lijn die een net getekende lijn kruist, wordt pas getekend als die
   * lijn minstens zoveel seconden droog is. De app tekent eerst ergens anders verder en
   * wacht alleen als het niet anders kan. 0 of weglaten = uit.
   */
  inkDryingSec?: number;
  /** Snelheden voor de tijdsinschatting (en dus voor de inktdroogtijd). */
  speeds?: SpeedSettings;
  /** Stukjes korter dan dit worden weggelaten (mm). */
  minSegmentMm?: number;
  /** Lijnen afknippen op de papierrand min deze marge (mm). Standaard 0. */
  clipMarginMm?: number;
}

/** Past schaal, draaiing en verschuiving toe op een tekening. */
export function place(lines: Polyline[], placement: Placement, sourceSize?: { widthMm: number; heightMm: number }): Polyline[] {
  const b = boundsOf(lines);
  if (!b) return [];
  // Draaien rond de linkerbovenhoek van het document (of van de tekening zelf als er geen documentmaat is).
  const w = sourceSize && sourceSize.widthMm > 0 ? sourceSize.widthMm : b.maxX;
  const h = sourceSize && sourceSize.heightMm > 0 ? sourceSize.heightMm : b.maxY;
  const rotate = (p: Point): Point => {
    switch (placement.rotation) {
      case 90:
        return { x: h - p.y, y: p.x };
      case 180:
        return { x: w - p.x, y: h - p.y };
      case 270:
        return { x: p.y, y: w - p.x };
      default:
        return p;
    }
  };
  return lines.map((line) =>
    line.map((p) => {
      const r = rotate(p);
      return { x: r.x * placement.scale + placement.offsetX, y: r.y * placement.scale + placement.offsetY };
    }),
  );
}

/** Schaal en positie zodat de tekening zo groot mogelijk, gecentreerd, binnen de marges op het papier past. */
export function fitToPaper(lines: Polyline[], paper: PaperConfig, marginMm = 10, rotation: Placement['rotation'] = 0): Placement {
  const rotated = place(lines, { scale: 1, offsetX: 0, offsetY: 0, rotation });
  const b = boundsOf(rotated);
  if (!b) return { scale: 1, offsetX: 0, offsetY: 0, rotation };
  const bw = Math.max(b.maxX - b.minX, 1e-9);
  const bh = Math.max(b.maxY - b.minY, 1e-9);
  const availW = Math.max(paper.widthMm - 2 * marginMm, 1);
  const availH = Math.max(paper.heightMm - 2 * marginMm, 1);
  const scale = Math.min(availW / bw, availH / bh);
  return {
    scale,
    rotation,
    offsetX: (paper.widthMm - bw * scale) / 2 - b.minX * scale,
    offsetY: (paper.heightMm - bh * scale) / 2 - b.minY * scale,
  };
}

/**
 * Kiest de volgorde: steeds de dichtstbijzijnde volgende lijn, eventueel achterstevoren.
 * Met `upwardPenalty` > 0 telt terug omhoog gaan zwaarder, zodat de tekening van boven
 * naar beneden wordt afgewerkt. Dat is nodig omdat de penlift van de PolargraphSD onder de
 * pen zit en over vers getekende lijnen eronder zou kunnen schuren.
 */
export function orderNearest(lines: Polyline[], start: Point, upwardPenalty = 0): Polyline[] {
  const remaining = lines.slice();
  const result: Polyline[] = [];
  let pos = start;
  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestReverse = false;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const line = remaining[i];
      const cost = (p: Point) => distance(pos, p) + upwardPenalty * Math.max(0, pos.y - p.y);
      const dStart = cost(line[0]);
      if (dStart < bestDist) {
        bestDist = dStart;
        bestIndex = i;
        bestReverse = false;
      }
      const dEnd = cost(line[line.length - 1]);
      if (dEnd < bestDist) {
        bestDist = dEnd;
        bestIndex = i;
        bestReverse = true;
      }
      if (bestDist === 0) break;
    }
    const [chosen] = remaining.splice(bestIndex, 1);
    const oriented = bestReverse ? chosen.slice().reverse() : chosen;
    result.push(oriented);
    pos = oriented[oriented.length - 1];
  }
  return result;
}

/**
 * Tekenen zoals met de hand: de tekening wordt in horizontale stroken van boven naar
 * beneden afgewerkt. Binnen een strook gaat het van links naar rechts (rechtshandig) of
 * van rechts naar links (linkshandig), zodat de pen en de gondel niet terug over vers
 * getekende lijnen gaan. Binnen die richting wordt steeds de dichtstbijzijnde lijn gekozen,
 * maar teruggaan tegen de tekenrichting in telt zwaarder.
 */
export function orderByHand(lines: Polyline[], hand: 'right' | 'left', bandHeightMm: number): Polyline[] {
  const dir: 1 | -1 = hand === 'right' ? 1 : -1;
  const band = (line: Polyline) => Math.floor(Math.min(...line.map((p) => p.y)) / bandHeightMm);
  const bands = new Map<number, Polyline[]>();
  for (const line of lines) {
    const key = band(line);
    const list = bands.get(key);
    if (list) list.push(line);
    else bands.set(key, [line]);
  }
  const result: Polyline[] = [];
  const allBounds = boundsOf(lines);
  if (!allBounds) return result;
  let pos: Point = { x: dir === 1 ? allBounds.minX : allBounds.maxX, y: allBounds.minY };
  for (const key of [...bands.keys()].sort((a, b) => a - b)) {
    const remaining = bands.get(key)!.slice();
    // Elke strook begint weer aan de "begin"-kant, net als een nieuwe regel bij schrijven.
    const top = key * bandHeightMm;
    pos = { x: dir === 1 ? allBounds.minX : allBounds.maxX, y: Math.max(top, pos.y - bandHeightMm) };
    while (remaining.length > 0) {
      let best = 0;
      let bestReverse = false;
      let bestCost = Infinity;
      remaining.forEach((line, i) => {
        // Elke lijn gaat in de richting van de hand: geen zigzag.
        const reverse = shouldReverseForHand(line, dir);
        const start = reverse ? line[line.length - 1] : line[0];
        const backwards = Math.max(0, (pos.x - start.x) * dir);
        const cost = distance(pos, start) + 2 * backwards;
        if (cost < bestCost) {
          bestCost = cost;
          best = i;
          bestReverse = reverse;
        }
      });
      const [chosen] = remaining.splice(best, 1);
      const oriented = bestReverse ? chosen.slice().reverse() : chosen;
      result.push(oriented);
      pos = oriented[oriented.length - 1];
    }
  }
  return result;
}

/**
 * Moet deze lijn achterstevoren om in de richting van de hand te lopen?
 * Rechtshandig (dir 1): van links naar rechts. Linkshandig (dir -1): van rechts naar links.
 * (Bijna) verticale lijnen: van boven naar beneden. Gesloten vormen blijven zoals ze zijn.
 */
function shouldReverseForHand(line: Polyline, dir: 1 | -1): boolean {
  const a = line[0];
  const b = line[line.length - 1];
  if (distance(a, b) < 0.05) return false;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) < Math.abs(dy) * 0.25) return dy < 0;
  return dx * dir < 0;
}

/** Plakt lijnen aan elkaar als de volgende begint waar de vorige eindigt. */
export function joinStrokes(lines: Polyline[], toleranceMm: number): Polyline[] {
  const result: Polyline[] = [];
  for (const line of lines) {
    const prev = result[result.length - 1];
    if (prev && distance(prev[prev.length - 1], line[0]) <= toleranceMm) {
      prev.push(...line.slice(1));
    } else {
      result.push(line.slice());
    }
  }
  return result;
}

export function computeStats(strokes: Polyline[], start: Point, pauses: number[] = []): PlanStats {
  let drawLengthMm = 0;
  let travelLengthMm = 0;
  let pos = start;
  for (const s of strokes) {
    travelLengthMm += distance(pos, s[0]);
    drawLengthMm += polylineLength(s);
    pos = s[s.length - 1];
  }
  travelLengthMm += distance(pos, start);
  const pauseSec = pauses.reduce((a, b) => a + b, 0);
  return { strokeCount: strokes.length, drawLengthMm, travelLengthMm, penLifts: strokes.length, bounds: boundsOf(strokes), pauseSec };
}

/** Maakt een tekenplan van geplaatste lijnen (in papiercoördinaten). */
export function buildPlan(placedLines: Polyline[], paper: PaperConfig, options: PlanOptions = {}): DrawingPlan {
  const start = options.start ?? { x: 0, y: 0 };
  const warnings: string[] = [];
  const margin = options.clipMarginMm ?? 0;
  const rect = { minX: margin, minY: margin, maxX: paper.widthMm - margin, maxY: paper.heightMm - margin };

  const before = boundsOf(placedLines);
  let lines = cleanPolylines(placedLines, options.minSegmentMm ?? 0.05);
  if (before && (before.minX < rect.minX - 1e-6 || before.minY < rect.minY - 1e-6 || before.maxX > rect.maxX + 1e-6 || before.maxY > rect.maxY + 1e-6)) {
    lines = clipPolylines(lines, rect);
    warnings.push('Een deel van de tekening valt buiten het papier. Dat deel wordt niet getekend.');
  }
  lines = cleanPolylines(lines, options.minSegmentMm ?? 0.05);
  if (lines.length === 0) warnings.push('Er blijft niets over om te tekenen.');

  const order = options.order ?? 'nearest';
  let ordered: Polyline[];
  if (order === 'nearest') ordered = orderNearest(lines, start, options.topToBottom === false ? 0 : 3);
  else if (order === 'right-handed' || order === 'left-handed') {
    const b = boundsOf(lines);
    const band = options.bandHeightMm ?? Math.max(10, b ? (b.maxY - b.minY) / 10 : 10);
    ordered = orderByHand(lines, order === 'right-handed' ? 'right' : 'left', band);
  } else ordered = lines;
  let strokes = joinStrokes(ordered, options.joinToleranceMm ?? 0.05);
  let pauses = strokes.map(() => 0);
  if (options.inkDryingSec && options.inkDryingSec > 0) {
    ({ strokes, pauses } = applyInkDrying(strokes, start, options.inkDryingSec, options.speeds ?? DEFAULT_SPEEDS));
  }
  return { strokes, pauses, stats: computeStats(strokes, start, pauses), warnings };
}

export interface SpeedSettings {
  /** Tekensnelheid in mm per seconde. */
  drawMmPerSec: number;
  /** Verplaatssnelheid met de pen omhoog in mm per seconde. */
  travelMmPerSec: number;
  /** Tijd voor pen omhoog en weer omlaag, in seconden. */
  penLiftSec: number;
}

/** Voorlopige snelheden; moeten nog worden afgesteld op de echte machine. */
export const DEFAULT_SPEEDS: SpeedSettings = { drawMmPerSec: 30, travelMmPerSec: 60, penLiftSec: 1 };

/** Ruwe schatting van de tekentijd in seconden, inclusief wachten op droge inkt. */
export function estimateSeconds(stats: PlanStats, speeds: SpeedSettings): number {
  return (
    stats.drawLengthMm / speeds.drawMmPerSec +
    stats.travelLengthMm / speeds.travelMmPerSec +
    stats.penLifts * speeds.penLiftSec +
    stats.pauseSec
  );
}

// ---------- Inktdroogtijd ----------

interface DrawnStroke {
  line: Polyline;
  bounds: Bounds;
  /** Tijdstip (s) waarop deze lijn klaar was. */
  doneAt: number;
}

function boundsOverlap(a: Bounds, b: Bounds, margin: number): boolean {
  return a.minX - margin <= b.maxX && b.minX - margin <= a.maxX && a.minY - margin <= b.maxY && b.minY - margin <= a.maxY;
}

/** Snijpunt van twee lijnstukken, of null. Raken telt ook als snijden. */
function segmentIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-12) return null; // evenwijdig; overlappende lijnen vangen we via de eindpunten niet op, dat is acceptabel
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
  if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) return null;
  return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
}

/** Kruist lijn `a` lijn `b`? Doorlopen vanaf het eindpunt van `b` telt niet als kruisen. */
function strokesCross(a: Polyline, b: Polyline): boolean {
  const bEnd = b[b.length - 1];
  for (let i = 1; i < a.length; i++) {
    for (let j = 1; j < b.length; j++) {
      const hit = segmentIntersection(a[i - 1], a[i], b[j - 1], b[j]);
      if (hit && !(distance(hit, a[0]) < 0.01 && distance(hit, bEnd) < 0.01)) return true;
    }
  }
  return false;
}

/**
 * Zorgt dat een lijn die een natte lijn kruist, later getekend wordt. Kijkt een stukje
 * vooruit in de volgorde naar een lijn die wel kan; lukt dat niet, dan wordt er gewacht.
 */
export function applyInkDrying(
  strokes: Polyline[],
  start: Point,
  dryingSec: number,
  speeds: SpeedSettings,
  lookahead = 40,
): { strokes: Polyline[]; pauses: number[] } {
  const remaining = strokes.slice();
  const result: Polyline[] = [];
  const pauses: number[] = [];
  const recent: DrawnStroke[] = [];
  let t = 0;
  let pos = start;

  const waitNeeded = (line: Polyline, arrival: number): number => {
    const b = boundsOf([line])!;
    let wait = 0;
    for (const d of recent) {
      const age = arrival - d.doneAt;
      if (age >= dryingSec) continue;
      if (!boundsOverlap(b, d.bounds, 0.01)) continue;
      if (strokesCross(line, d.line)) wait = Math.max(wait, dryingSec - age);
    }
    return wait;
  };

  while (remaining.length > 0) {
    // Lijnen die al lang genoeg droog zijn, hoeven we niet meer te bekijken.
    for (let i = recent.length - 1; i >= 0; i--) if (t - recent[i].doneAt >= dryingSec) recent.splice(i, 1);

    let chosen = -1;
    let pause = 0;
    const limit = Math.min(remaining.length, lookahead);
    let firstWait = 0;
    for (let i = 0; i < limit; i++) {
      const line = remaining[i];
      const arrival = t + distance(pos, line[0]) / speeds.travelMmPerSec + speeds.penLiftSec;
      const wait = waitNeeded(line, arrival);
      if (i === 0) firstWait = wait;
      if (wait === 0) {
        chosen = i;
        break;
      }
    }
    if (chosen === -1) {
      chosen = 0;
      pause = firstWait;
    }
    const [line] = remaining.splice(chosen, 1);
    t += distance(pos, line[0]) / speeds.travelMmPerSec + speeds.penLiftSec + pause;
    t += polylineLength(line) / speeds.drawMmPerSec;
    result.push(line);
    pauses.push(Math.round(pause * 10) / 10);
    recent.push({ line, bounds: boundsOf([line])!, doneAt: t });
    pos = line[line.length - 1];
  }
  return { strokes: result, pauses };
}
