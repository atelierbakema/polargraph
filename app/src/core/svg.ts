/**
 * SVG inlezen en omzetten naar lijnen in millimeters.
 *
 * Ondersteund: path, line, polyline, polygon, rect, circle, ellipse, groepen (g),
 * geneste svg-elementen, transform-attributen, viewBox en eenheden (mm, cm, in, pt, px).
 * Niet ondersteund (met een melding): text, image, use. Zet tekst in je
 * tekenprogramma eerst om naar paden ("Object naar pad" in Inkscape, "Contouren maken" in Illustrator).
 */

import { DOMParser as XmlDomParser } from '@xmldom/xmldom';
import svgpath from 'svgpath';
import type { Point, Polyline } from './geometry.ts';

export interface SvgImportOptions {
  /** Maximale afwijking bij het benaderen van bochten, in mm. Kleiner is gladder maar meer punten. */
  curveToleranceMm?: number;
}

export interface SvgImportResult {
  lines: Polyline[];
  /** Afmetingen van het document in mm (uit width/height of viewBox). */
  widthMm: number;
  heightMm: number;
  /** Meldingen voor de gebruiker, bijvoorbeeld over onderdelen die zijn overgeslagen. */
  warnings: string[];
}

const MM_PER_UNIT: Record<string, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
  pt: 25.4 / 72,
  pc: 25.4 / 6,
  px: 25.4 / 96,
  '': 25.4 / 96,
};

const SKIPPED_CONTAINERS = new Set(['defs', 'clipPath', 'mask', 'symbol', 'marker', 'pattern', 'metadata', 'title', 'desc', 'style', 'script', 'linearGradient', 'radialGradient', 'filter']);
const UNSUPPORTED: Record<string, string> = {
  text: 'Tekst wordt niet getekend. Zet tekst in je tekenprogramma eerst om naar paden.',
  image: 'Afbeeldingen in de SVG worden overgeslagen. Alleen lijnen worden getekend.',
  use: 'Gekloonde objecten (<use>) worden nog niet ondersteund. Ontkoppel de kloon in je tekenprogramma.',
};

interface SvgElementLike {
  nodeType: number;
  localName?: string | null;
  nodeName: string;
  childNodes: ArrayLike<SvgElementLike>;
  getAttribute(name: string): string | null;
}

function parseLength(value: string | null): { value: number; unit: string } | null {
  if (!value) return null;
  const m = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*([a-z%]*)\s*$/i.exec(value);
  if (!m) return null;
  return { value: parseFloat(m[1]), unit: m[2].toLowerCase() };
}

function num(el: SvgElementLike, name: string, fallback = 0): number {
  const v = parseFloat(el.getAttribute(name) ?? '');
  return Number.isFinite(v) ? v : fallback;
}

function parseStyle(el: SvgElementLike): Record<string, string> {
  const result: Record<string, string> = {};
  const style = el.getAttribute('style');
  if (style) {
    for (const part of style.split(';')) {
      const [k, v] = part.split(':');
      if (k && v) result[k.trim()] = v.trim();
    }
  }
  return result;
}

function isHidden(el: SvgElementLike): boolean {
  const style = parseStyle(el);
  const display = el.getAttribute('display') ?? style['display'];
  const visibility = el.getAttribute('visibility') ?? style['visibility'];
  return display === 'none' || visibility === 'hidden';
}

function pointsAttr(el: SvgElementLike): number[] {
  return (el.getAttribute('points') ?? '')
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);
}

/** Zet een vorm om naar een SVG-padbeschrijving (d-attribuut). */
function shapeToPath(el: SvgElementLike, name: string): string | null {
  switch (name) {
    case 'path':
      return el.getAttribute('d');
    case 'line':
      return `M${num(el, 'x1')},${num(el, 'y1')} L${num(el, 'x2')},${num(el, 'y2')}`;
    case 'polyline':
    case 'polygon': {
      const pts = pointsAttr(el);
      if (pts.length < 4) return null;
      let d = `M${pts[0]},${pts[1]}`;
      for (let i = 2; i + 1 < pts.length; i += 2) d += ` L${pts[i]},${pts[i + 1]}`;
      return name === 'polygon' ? d + ' Z' : d;
    }
    case 'rect': {
      const x = num(el, 'x');
      const y = num(el, 'y');
      const w = num(el, 'width');
      const h = num(el, 'height');
      if (w <= 0 || h <= 0) return null;
      let rx = num(el, 'rx', NaN);
      let ry = num(el, 'ry', NaN);
      if (!Number.isFinite(rx)) rx = Number.isFinite(ry) ? ry : 0;
      if (!Number.isFinite(ry)) ry = rx;
      rx = Math.min(rx, w / 2);
      ry = Math.min(ry, h / 2);
      if (rx <= 0 || ry <= 0) return `M${x},${y} H${x + w} V${y + h} H${x} Z`;
      return (
        `M${x + rx},${y} H${x + w - rx} A${rx},${ry} 0 0 1 ${x + w},${y + ry}` +
        ` V${y + h - ry} A${rx},${ry} 0 0 1 ${x + w - rx},${y + h}` +
        ` H${x + rx} A${rx},${ry} 0 0 1 ${x},${y + h - ry}` +
        ` V${y + ry} A${rx},${ry} 0 0 1 ${x + rx},${y} Z`
      );
    }
    case 'circle':
    case 'ellipse': {
      const cx = num(el, 'cx');
      const cy = num(el, 'cy');
      const rx = name === 'circle' ? num(el, 'r') : num(el, 'rx');
      const ry = name === 'circle' ? rx : num(el, 'ry');
      if (rx <= 0 || ry <= 0) return null;
      return `M${cx - rx},${cy} A${rx},${ry} 0 1 0 ${cx + rx},${cy} A${rx},${ry} 0 1 0 ${cx - rx},${cy} Z`;
    }
    default:
      return null;
  }
}

/** Benadert een kubische of kwadratische bocht met rechte stukjes. */
function flattenCurve(points: Point[], toleranceMm: number, out: Polyline): void {
  // Lengte van het controlepolygoon is een bovengrens voor de booglengte.
  let controlLength = 0;
  for (let i = 1; i < points.length; i++) {
    controlLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  const steps = Math.min(1000, Math.max(1, Math.ceil(Math.sqrt(controlLength / toleranceMm) * 2)));
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    out.push(points.length === 4 ? cubicAt(points, t) : quadAt(points, t));
  }
}

function cubicAt(p: Point[], t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x, y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y };
}

function quadAt(p: Point[], t: number): Point {
  const u = 1 - t;
  return { x: u * u * p[0].x + 2 * u * t * p[1].x + t * t * p[2].x, y: u * u * p[0].y + 2 * u * t * p[1].y + t * t * p[2].y };
}

/** Zet een padbeschrijving (al getransformeerd naar mm) om naar lijnen. */
export function pathToPolylines(d: string, toleranceMm: number): Polyline[] {
  const lines: Polyline[] = [];
  let current: Polyline = [];
  let start: Point = { x: 0, y: 0 };
  let pos: Point = { x: 0, y: 0 };
  const flush = () => {
    if (current.length >= 2) lines.push(current);
    current = [];
  };
  svgpath(d)
    .abs()
    .unarc()
    .unshort()
    .iterate((seg) => {
      const cmd = seg[0] as string;
      const args = seg.slice(1) as number[];
      switch (cmd) {
        case 'M':
          flush();
          pos = { x: args[0], y: args[1] };
          start = pos;
          current = [pos];
          break;
        case 'L':
          pos = { x: args[0], y: args[1] };
          current.push(pos);
          break;
        case 'H':
          pos = { x: args[0], y: pos.y };
          current.push(pos);
          break;
        case 'V':
          pos = { x: pos.x, y: args[0] };
          current.push(pos);
          break;
        case 'C': {
          const end = { x: args[4], y: args[5] };
          flattenCurve([pos, { x: args[0], y: args[1] }, { x: args[2], y: args[3] }, end], toleranceMm, current);
          pos = end;
          break;
        }
        case 'Q': {
          const end = { x: args[2], y: args[3] };
          flattenCurve([pos, { x: args[0], y: args[1] }, end], toleranceMm, current);
          pos = end;
          break;
        }
        case 'Z':
        case 'z':
          if (current.length > 0) current.push(start);
          pos = start;
          flush();
          // Na Z begint een eventueel volgend stuk op het startpunt.
          current = [start];
          break;
      }
      if (current.length === 0) current = [pos];
    });
  flush();
  return lines;
}

/**
 * Leest een SVG-bestand (als tekst) en geeft alle lijnen terug in mm,
 * in het coördinatenstelsel van het document (oorsprong linksboven).
 */
export function importSvg(svgText: string, options: SvgImportOptions = {}): SvgImportResult {
  const tolerance = options.curveToleranceMm ?? 0.1;
  const warnings = new Set<string>();
  // In de browser de ingebouwde parser gebruiken, in Node (tests, CLI) xmldom.
  type AnyParser = new () => { parseFromString(text: string, type: string): unknown };
  const Parser = ((globalThis as unknown as { DOMParser?: AnyParser }).DOMParser ?? XmlDomParser) as AnyParser;
  let doc: { documentElement: SvgElementLike | null };
  try {
    doc = new Parser().parseFromString(svgText, 'image/svg+xml') as { documentElement: SvgElementLike | null };
  } catch {
    throw new Error('Dit bestand kon niet gelezen worden als SVG.');
  }
  const root = doc.documentElement;
  if (!root || (root.localName ?? root.nodeName) !== 'svg') {
    throw new Error('Dit bestand is geen SVG.');
  }

  const { transform: rootTransform, widthMm, heightMm } = documentTransform(root, warnings);
  const lines: Polyline[] = [];

  const walk = (el: SvgElementLike, parentTransform: string) => {
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType !== 1) continue;
      const name = child.localName ?? child.nodeName;
      if (SKIPPED_CONTAINERS.has(name)) continue;
      if (isHidden(child)) continue;
      if (UNSUPPORTED[name]) {
        warnings.add(UNSUPPORTED[name]);
        continue;
      }
      const own = child.getAttribute('transform') ?? '';
      let transform = `${parentTransform} ${own}`.trim();
      if (name === 'g' || name === 'a' || name === 'switch') {
        walk(child, transform);
        continue;
      }
      if (name === 'svg') {
        // Genest svg-element: x/y verschuiving plus eventueel eigen viewBox.
        transform = `${transform} translate(${num(child, 'x')},${num(child, 'y')})`;
        const vb = (child.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
        const w = parseLength(child.getAttribute('width'));
        const h = parseLength(child.getAttribute('height'));
        if (vb.length === 4 && vb.every(Number.isFinite) && w && h && vb[2] > 0 && vb[3] > 0) {
          transform += ` scale(${w.value / vb[2]},${h.value / vb[3]}) translate(${-vb[0]},${-vb[1]})`;
        }
        walk(child, transform);
        continue;
      }
      const d = shapeToPath(child, name);
      if (!d) continue;
      const transformed = svgpath(d).transform(transform).toString();
      lines.push(...pathToPolylines(transformed, tolerance));
    }
  };
  walk(root, rootTransform);

  if (lines.length === 0) warnings.add('Er zijn geen lijnen gevonden in dit bestand.');
  return { lines, widthMm, heightMm, warnings: [...warnings] };
}

/** Bepaalt de omrekening van SVG-eenheden naar mm op basis van width, height en viewBox. */
function documentTransform(root: SvgElementLike, warnings: Set<string>): { transform: string; widthMm: number; heightMm: number } {
  const vbRaw = (root.getAttribute('viewBox') ?? '').trim();
  const vb = vbRaw ? vbRaw.split(/[\s,]+/).map(Number) : [];
  const hasViewBox = vb.length === 4 && vb.every(Number.isFinite) && vb[2] > 0 && vb[3] > 0;
  const w = parseLength(root.getAttribute('width'));
  const h = parseLength(root.getAttribute('height'));
  const toMm = (len: { value: number; unit: string } | null): number | null => {
    if (!len || len.unit === '%') return null;
    const f = MM_PER_UNIT[len.unit];
    if (f === undefined) {
      warnings.add(`Onbekende eenheid "${len.unit}" in de SVG; aangenomen dat het pixels zijn.`);
      return len.value * MM_PER_UNIT.px;
    }
    return len.value * f;
  };
  const wMm = toMm(w);
  const hMm = toMm(h);

  if (hasViewBox) {
    const [vx, vy, vw, vh] = vb;
    // Zonder width/height: één viewBox-eenheid is één pixel (96 per inch).
    const sx = wMm !== null ? wMm / vw : hMm !== null ? hMm / vh : MM_PER_UNIT.px;
    const sy = hMm !== null ? hMm / vh : sx;
    // preserveAspectRatio negeren we: we gebruiken dezelfde schaal in beide richtingen
    // als width en height niet dezelfde verhouding hebben als de viewBox.
    const s = Math.abs(sx - sy) / Math.max(sx, sy) < 1e-6 ? sx : Math.min(sx, sy);
    return { transform: `scale(${s}) translate(${-vx},${-vy})`, widthMm: vw * s, heightMm: vh * s };
  }
  const s = MM_PER_UNIT.px;
  return {
    transform: `scale(${s})`,
    widthMm: wMm ?? 0,
    heightMm: hMm ?? 0,
  };
}
