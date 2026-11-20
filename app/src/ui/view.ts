/**
 * De tekentafel: toont machine, papier, tekening, beweeglijnen en koorden.
 * Zoomen en schuiven met muis, trackpad en touch, met grenzen zodat je nooit de weg kwijtraakt.
 *
 * Wereldcoördinaten zijn machinecoördinaten in mm (oorsprong bij motor A).
 */

import type { Point, Polyline } from '../core/geometry.ts';
import { cordLengths, type MachineConfig, type PaperConfig } from '../core/machine.ts';

export interface Scene {
  machine: MachineConfig;
  paper: PaperConfig;
  /** Lijnen in papiercoördinaten, in tekenvolgorde. */
  strokes: Polyline[];
}

export interface ViewOptions {
  showDraw: boolean;
  showTravel: boolean;
  showCords: boolean;
  /** 0..1: hoeveel van de tekening al "getekend" is in de voorbeeldweergave. */
  progress: number;
}

interface Segment {
  from: Point;
  to: Point;
  penDown: boolean;
  /** Afgelegde afstand aan het eind van dit segment. */
  end: number;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export class Viewer {
  private ctx: CanvasRenderingContext2D;
  private scene: Scene | null = null;
  private segments: Segment[] = [];
  private totalLength = 0;
  private drawPath = new Path2D();
  private travelPath = new Path2D();
  private scale = 1; // pixels per mm
  private tx = 0;
  private ty = 0;
  private fitScale = 1;
  private pending = false;
  private pointers = new Map<number, { x: number; y: number }>();
  private pinchStart: { dist: number; scale: number; mid: Point; world: Point } | null = null;
  private hasView = false;
  options: ViewOptions = { showDraw: true, showTravel: true, showCords: true, progress: 1 };

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas wordt niet ondersteund door deze browser.');
    this.ctx = ctx;
    new ResizeObserver(() => {
      const first = !this.hasView;
      this.resize();
      if (first && this.scene) this.fitAll();
      this.requestRender();
    }).observe(canvas);
    this.bindInput();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.requestRender());
  }

  setScene(scene: Scene): void {
    const machineChanged =
      !this.scene || this.scene.machine.widthMm !== scene.machine.widthMm || this.scene.machine.heightMm !== scene.machine.heightMm;
    this.scene = scene;
    this.buildPaths();
    if (machineChanged || !this.hasView) this.fitAll();
    this.requestRender();
  }

  setOptions(patch: Partial<ViewOptions>): void {
    Object.assign(this.options, patch);
    this.requestRender();
  }

  /** Positie van de pen bij de huidige voortgang, in machinecoördinaten. */
  penPosition(): Point {
    if (!this.scene) return { x: 0, y: 0 };
    const home = this.toMachine({ x: 0, y: 0 });
    if (this.segments.length === 0) return home;
    const target = this.options.progress * this.totalLength;
    for (const s of this.segments) {
      if (s.end >= target) {
        const len = Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y);
        const t = len === 0 ? 1 : 1 - (s.end - target) / len;
        return { x: s.from.x + (s.to.x - s.from.x) * t, y: s.from.y + (s.to.y - s.from.y) * t };
      }
    }
    return home;
  }

  fitAll(): void {
    if (!this.scene) return;
    const { machine } = this.scene;
    // Motoren, papier en vloer in beeld, met wat ruimte eromheen.
    this.fitRect(-machine.widthMm * 0.06, -machine.widthMm * 0.06, machine.widthMm * 1.12, machine.heightMm + machine.widthMm * 0.12);
    this.fitScale = this.scale;
  }

  fitPaper(): void {
    if (!this.scene) return;
    const { paper } = this.scene;
    const m = Math.max(paper.widthMm, paper.heightMm) * 0.06;
    this.fitRect(paper.leftMm - m, paper.topMm - m, paper.widthMm + 2 * m, paper.heightMm + 2 * m);
  }

  private fitRect(x: number, y: number, w: number, h: number): void {
    const { width, height } = this.cssSize();
    if (width === 0 || height === 0) return;
    // Ruimte laten voor de knoppenbalk boven en de speler onder.
    const top = this.cssSize().width < 760 ? 48 : 56;
    const bottom = 64;
    const availH = Math.max(height - top - bottom, 50);
    this.scale = Math.min(width / w, availH / h);
    this.tx = (width - w * this.scale) / 2 - x * this.scale;
    this.ty = top + (availH - h * this.scale) / 2 - y * this.scale;
    this.hasView = true;
    this.requestRender();
  }

  private cssSize(): { width: number; height: number } {
    return { width: this.canvas.clientWidth, height: this.canvas.clientHeight };
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = this.cssSize();
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
  }

  private toMachine(p: Point): Point {
    const paper = this.scene!.paper;
    return { x: p.x + paper.leftMm, y: p.y + paper.topMm };
  }

  private buildPaths(): void {
    this.drawPath = new Path2D();
    this.travelPath = new Path2D();
    this.segments = [];
    let total = 0;
    if (!this.scene) return;
    const home = this.toMachine({ x: 0, y: 0 });
    let pos = home;
    const add = (from: Point, to: Point, penDown: boolean) => {
      total += Math.hypot(to.x - from.x, to.y - from.y);
      this.segments.push({ from, to, penDown, end: total });
    };
    for (const stroke of this.scene.strokes) {
      const pts = stroke.map((p) => this.toMachine(p));
      this.travelPath.moveTo(pos.x, pos.y);
      this.travelPath.lineTo(pts[0].x, pts[0].y);
      add(pos, pts[0], false);
      this.drawPath.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        this.drawPath.lineTo(pts[i].x, pts[i].y);
        add(pts[i - 1], pts[i], true);
      }
      pos = pts[pts.length - 1];
    }
    if (this.scene.strokes.length > 0) {
      this.travelPath.moveTo(pos.x, pos.y);
      this.travelPath.lineTo(home.x, home.y);
      add(pos, home, false);
    }
    this.totalLength = total;
  }

  requestRender(): void {
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame(() => {
      this.pending = false;
      this.render();
    });
  }

  private render(): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = cssVar('--bg');
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.scene) return;
    const { machine, paper } = this.scene;
    const s = this.scale;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * this.tx, dpr * this.ty);
    const px = (n: number) => n / s; // n schermpixels uitgedrukt in mm

    // Vloer en het bereik van de machine.
    ctx.strokeStyle = cssVar('--machine');
    ctx.lineWidth = px(1);
    ctx.setLineDash([px(6), px(6)]);
    ctx.beginPath();
    ctx.moveTo(-machine.widthMm * 0.04, machine.heightMm);
    ctx.lineTo(machine.widthMm * 1.04, machine.heightMm);
    ctx.stroke();
    ctx.setLineDash([]);

    // Papier.
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 12 * dpr;
    ctx.shadowOffsetY = 2 * dpr;
    ctx.fillStyle = cssVar('--paper');
    ctx.fillRect(paper.leftMm, paper.topMm, paper.widthMm, paper.heightMm);
    ctx.restore();
    ctx.strokeStyle = cssVar('--paper-edge');
    ctx.lineWidth = px(1);
    ctx.strokeRect(paper.leftMm, paper.topMm, paper.widthMm, paper.heightMm);

    const target = this.options.progress * this.totalLength;
    const complete = this.options.progress >= 0.9999;

    // Tekenlijnen.
    if (this.options.showDraw) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = cssVar('--draw');
      if (complete) {
        ctx.lineWidth = px(1.4);
        ctx.stroke(this.drawPath);
      } else {
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = px(1.2);
        ctx.stroke(this.drawPath);
        ctx.globalAlpha = 1;
        ctx.lineWidth = px(1.6);
        const done = new Path2D();
        for (const seg of this.segments) {
          if (!seg.penDown) continue;
          if (seg.end - Math.hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y) > target) break;
          const end = seg.end <= target ? seg.to : this.pointOn(seg, target);
          done.moveTo(seg.from.x, seg.from.y);
          done.lineTo(end.x, end.y);
        }
        ctx.stroke(done);
      }
    }

    // Beweeglijnen (pen omhoog).
    if (this.options.showTravel) {
      ctx.strokeStyle = cssVar('--travel');
      ctx.lineWidth = px(1);
      ctx.setLineDash([px(4), px(4)]);
      ctx.globalAlpha = 0.85;
      ctx.stroke(this.travelPath);
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    // Startpunt: linkerbovenhoek van het papier.
    const home = this.toMachine({ x: 0, y: 0 });
    ctx.strokeStyle = cssVar('--accent');
    ctx.lineWidth = px(2);
    ctx.beginPath();
    ctx.moveTo(home.x - px(10), home.y);
    ctx.lineTo(home.x + px(10), home.y);
    ctx.moveTo(home.x, home.y - px(10));
    ctx.lineTo(home.x, home.y + px(10));
    ctx.stroke();

    // Koorden en pen.
    const pen = this.penPosition();
    if (this.options.showCords) {
      ctx.strokeStyle = cssVar('--cords');
      ctx.lineWidth = px(1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(pen.x, pen.y);
      ctx.lineTo(machine.widthMm, 0);
      ctx.stroke();
    }
    ctx.fillStyle = cssVar('--accent');
    ctx.beginPath();
    ctx.arc(pen.x, pen.y, px(5), 0, Math.PI * 2);
    ctx.fill();

    // Motoren.
    ctx.fillStyle = cssVar('--machine');
    for (const x of [0, machine.widthMm]) {
      ctx.beginPath();
      ctx.arc(x, 0, Math.max(px(7), 12), 0, Math.PI * 2);
      ctx.fill();
    }

    // Labels in schermpixels.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = cssVar('--muted');
    ctx.font = `12px ${cssVar('--font')}`;
    const toScreen = (p: Point) => ({ x: p.x * s + this.tx, y: p.y * s + this.ty });
    const a = toScreen({ x: 0, y: 0 });
    const b = toScreen({ x: machine.widthMm, y: 0 });
    ctx.textAlign = 'center';
    ctx.fillText('A', a.x, a.y - 16);
    ctx.fillText('B', b.x, b.y - 16);
    ctx.fillText(`${Math.round(machine.widthMm)} mm`, (a.x + b.x) / 2, a.y - 8);
    const floor = toScreen({ x: machine.widthMm / 2, y: machine.heightMm });
    ctx.fillText('vloer', floor.x, floor.y - 6);
    const h = toScreen(home);
    ctx.textAlign = 'left';
    ctx.fillStyle = cssVar('--accent');
    ctx.fillText('start: pen hier', h.x + 8, h.y - 8);
    if (this.options.showCords && !complete) {
      const c = cordLengths(machine, pen);
      ctx.fillStyle = cssVar('--muted');
      ctx.fillText(`A ${c.a.toFixed(0)} mm · B ${c.b.toFixed(0)} mm`, toScreen(pen).x + 10, toScreen(pen).y + 18);
    }
  }

  private pointOn(seg: Segment, target: number): Point {
    const len = Math.hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y);
    const t = len === 0 ? 1 : 1 - (seg.end - target) / len;
    return { x: seg.from.x + (seg.to.x - seg.from.x) * t, y: seg.from.y + (seg.to.y - seg.from.y) * t };
  }

  // ---------- Invoer: schuiven en zoomen ----------

  private screenToWorld(x: number, y: number): Point {
    return { x: (x - this.tx) / this.scale, y: (y - this.ty) / this.scale };
  }

  private zoomAt(sx: number, sy: number, newScale: number): void {
    const min = this.fitScale * 0.3;
    const max = this.fitScale * 60;
    newScale = Math.min(max, Math.max(min, newScale));
    const w = this.screenToWorld(sx, sy);
    this.scale = newScale;
    this.tx = sx - w.x * newScale;
    this.ty = sy - w.y * newScale;
    this.keepInView();
    this.requestRender();
  }

  /** Voorkomt dat de machine helemaal uit beeld schuift. */
  private keepInView(): void {
    if (!this.scene) return;
    const { width, height } = this.cssSize();
    const m = this.scene.machine;
    const left = -m.widthMm * 0.1 * this.scale + this.tx;
    const right = m.widthMm * 1.1 * this.scale + this.tx;
    const top = -m.widthMm * 0.1 * this.scale + this.ty;
    const bottom = (m.heightMm + m.widthMm * 0.1) * this.scale + this.ty;
    const pad = 60;
    if (right < pad) this.tx += pad - right;
    if (left > width - pad) this.tx -= left - (width - pad);
    if (bottom < pad) this.ty += pad - bottom;
    if (top > height - pad) this.ty -= top - (height - pad);
  }

  private bindInput(): void {
    const c = this.canvas;
    const local = (e: PointerEvent | WheelEvent | MouseEvent) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    c.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const p = local(e);
        const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        // Rustig zoomen: begrensd per gebeurtenis, zodat een trackpad niet doorschiet.
        const factor = Math.min(1.25, Math.max(0.8, Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0015))));
        this.zoomAt(p.x, p.y, this.scale * factor);
      },
      { passive: false },
    );

    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, local(e));
      c.classList.add('panning');
      if (this.pointers.size === 2) this.startPinch();
    });
    c.addEventListener('pointermove', (e) => {
      const prev = this.pointers.get(e.pointerId);
      if (!prev) return;
      const p = local(e);
      this.pointers.set(e.pointerId, p);
      if (this.pointers.size === 1) {
        this.tx += p.x - prev.x;
        this.ty += p.y - prev.y;
        this.keepInView();
        this.requestRender();
      } else if (this.pointers.size === 2 && this.pinchStart) {
        const [p1, p2] = [...this.pointers.values()];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const newScale = Math.min(this.fitScale * 60, Math.max(this.fitScale * 0.3, (this.pinchStart.scale * dist) / this.pinchStart.dist));
        this.scale = newScale;
        this.tx = mid.x - this.pinchStart.world.x * newScale;
        this.ty = mid.y - this.pinchStart.world.y * newScale;
        this.keepInView();
        this.requestRender();
      }
    });
    const end = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinchStart = null;
      if (this.pointers.size === 0) c.classList.remove('panning');
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('dblclick', () => this.fitPaper());
  }

  private startPinch(): void {
    const [p1, p2] = [...this.pointers.values()];
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    this.pinchStart = {
      dist: Math.max(Math.hypot(p2.x - p1.x, p2.y - p1.y), 1),
      scale: this.scale,
      mid,
      world: this.screenToWorld(mid.x, mid.y),
    };
  }
}
