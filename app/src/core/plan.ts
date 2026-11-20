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
}

export type OrderStrategy = 'nearest' | 'original';

export interface PlanOptions {
  /** Startpunt van de pen op het papier (mm). Standaard linksboven: (0, 0). */
  start?: Point;
  order?: OrderStrategy;
  /** Lijnen die op minder dan deze afstand op elkaar aansluiten, worden zonder pen op te tillen getekend. */
  joinToleranceMm?: number;
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

/** Kiest de volgorde: steeds de dichtstbijzijnde volgende lijn, eventueel achterstevoren. */
export function orderNearest(lines: Polyline[], start: Point): Polyline[] {
  const remaining = lines.slice();
  const result: Polyline[] = [];
  let pos = start;
  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestReverse = false;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const line = remaining[i];
      const dStart = distance(pos, line[0]);
      if (dStart < bestDist) {
        bestDist = dStart;
        bestIndex = i;
        bestReverse = false;
      }
      const dEnd = distance(pos, line[line.length - 1]);
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

export function computeStats(strokes: Polyline[], start: Point): PlanStats {
  let drawLengthMm = 0;
  let travelLengthMm = 0;
  let pos = start;
  for (const s of strokes) {
    travelLengthMm += distance(pos, s[0]);
    drawLengthMm += polylineLength(s);
    pos = s[s.length - 1];
  }
  travelLengthMm += distance(pos, start);
  return { strokeCount: strokes.length, drawLengthMm, travelLengthMm, penLifts: strokes.length, bounds: boundsOf(strokes) };
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

  const ordered = (options.order ?? 'nearest') === 'nearest' ? orderNearest(lines, start) : lines;
  const strokes = joinStrokes(ordered, options.joinToleranceMm ?? 0.05);
  return { strokes, stats: computeStats(strokes, start), warnings };
}

export interface SpeedSettings {
  /** Tekensnelheid in mm per seconde. */
  drawMmPerSec: number;
  /** Verplaatssnelheid met de pen omhoog in mm per seconde. */
  travelMmPerSec: number;
  /** Tijd voor pen omhoog en weer omlaag, in seconden. */
  penLiftSec: number;
}

/** Ruwe schatting van de tekentijd in seconden. Moet nog worden afgesteld op de echte machine. */
export function estimateSeconds(stats: PlanStats, speeds: SpeedSettings): number {
  return stats.drawLengthMm / speeds.drawMmPerSec + stats.travelLengthMm / speeds.travelMmPerSec + stats.penLifts * speeds.penLiftSec;
}
