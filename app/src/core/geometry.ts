/** Basisgeometrie. Alle maten in millimeters, tenzij anders vermeld. */

export interface Point {
  x: number;
  y: number;
}

/** Een aaneengesloten lijn: de pen gaat omlaag op het eerste punt en tekent door tot het laatste. */
export type Polyline = Point[];

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function polylineLength(line: Polyline): number {
  let total = 0;
  for (let i = 1; i < line.length; i++) total += distance(line[i - 1], line[i]);
  return total;
}

export function boundsOf(lines: Polyline[]): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const line of lines) {
    for (const p of line) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

/**
 * Verwijdert punten die (bijna) op dezelfde plek liggen als het vorige punt.
 * Lijnen die daarna minder dan twee punten over hebben, vallen weg.
 */
export function cleanPolylines(lines: Polyline[], minSegmentMm = 0.05): Polyline[] {
  const result: Polyline[] = [];
  for (const line of lines) {
    const points = line.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    const cleaned: Polyline = [];
    points.forEach((p, i) => {
      const last = cleaned[cleaned.length - 1];
      const isEnd = i === points.length - 1;
      if (!last || distance(last, p) >= minSegmentMm) {
        cleaned.push({ x: p.x, y: p.y });
      } else if (isEnd && cleaned.length >= 2) {
        // Het eindpunt altijd bewaren, zodat gesloten vormen gesloten blijven.
        cleaned[cleaned.length - 1] = { x: p.x, y: p.y };
      }
    });
    if (cleaned.length >= 2) result.push(cleaned);
  }
  return result;
}

/**
 * Knipt lijnen af op een rechthoek (bijv. het papier). Stukken buiten de rechthoek
 * vallen weg; een lijn die de rand kruist, wordt op de rand afgekapt en eventueel
 * in meerdere stukken gesplitst.
 */
export function clipPolylines(lines: Polyline[], rect: Bounds): Polyline[] {
  const result: Polyline[] = [];
  for (const line of lines) {
    let current: Polyline = [];
    for (let i = 1; i < line.length; i++) {
      const clipped = clipSegment(line[i - 1], line[i], rect);
      if (!clipped) {
        if (current.length >= 2) result.push(current);
        current = [];
        continue;
      }
      const [a, b] = clipped;
      const last = current[current.length - 1];
      if (last && distance(last, a) < 1e-9) {
        current.push(b);
      } else {
        if (current.length >= 2) result.push(current);
        current = [a, b];
      }
      // Als het segment aan het eind is afgekapt, begint het volgende stuk opnieuw.
      if (distance(b, line[i]) > 1e-9) {
        if (current.length >= 2) result.push(current);
        current = [];
      }
    }
    if (current.length >= 2) result.push(current);
  }
  return result;
}

/** Liang-Barsky lijnclipping. Geeft null als het segment volledig buiten de rechthoek valt. */
function clipSegment(a: Point, b: Point, r: Bounds): [Point, Point] | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let t0 = 0;
  let t1 = 1;
  const checks: Array<[number, number]> = [
    [-dx, a.x - r.minX],
    [dx, r.maxX - a.x],
    [-dy, a.y - r.minY],
    [dy, r.maxY - a.y],
  ];
  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return null;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return null;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return null;
        if (t < t1) t1 = t;
      }
    }
  }
  return [
    { x: a.x + t0 * dx, y: a.y + t0 * dy },
    { x: a.x + t1 * dx, y: a.y + t1 * dy },
  ];
}
