/**
 * G-code voor de nieuwe firmware (in ontwikkeling) en voor andere plotters.
 *
 * Voorlopige afspraken (te bevestigen bij het ontwerp van de nieuwe firmware):
 * - millimeters (G21), absolute coördinaten (G90);
 * - coördinaten op het papier: oorsprong linksboven, X naar rechts, Y omlaag.
 *   Met `flipY` wordt Y omhoog gerekend vanaf de onderrand, voor gereedschap dat dat verwacht;
 * - pen omhoog en omlaag via de Z-as: Z > 0 is pen omhoog, Z = 0 is pen omlaag.
 *   Dat is wat de meeste tekenprogramma's en vpype al maken;
 * - G0 is verplaatsen met de pen omhoog, G1 is tekenen.
 */

import type { Point } from '../geometry.ts';
import type { PaperConfig } from '../machine.ts';
import type { DrawingPlan } from '../plan.ts';

export interface GcodeOptions {
  flipY?: boolean;
  penUp?: string;
  penDown?: string;
  /** Tekensnelheid in mm per minuut (F). */
  drawFeed?: number;
  decimals?: number;
  /** Naam van de tekening, voor in het commentaar bovenaan. */
  title?: string;
}

export function exportGcode(plan: DrawingPlan, paper: PaperConfig, options: GcodeOptions = {}): string {
  const dec = options.decimals ?? 2;
  const penUp = options.penUp ?? 'G0 Z1';
  const penDown = options.penDown ?? 'G1 Z0';
  const fmt = (n: number) => {
    const s = n.toFixed(dec);
    return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  };
  const xy = (p: Point) => `X${fmt(p.x)} Y${fmt(options.flipY ? paper.heightMm - p.y : p.y)}`;
  const out: string[] = [];
  out.push(`; ${options.title ?? 'Tekening'}`);
  out.push(`; Papier ${fmt(paper.widthMm)} x ${fmt(paper.heightMm)} mm, oorsprong ${options.flipY ? 'linksonder' : 'linksboven'}`);
  out.push(`; Lijnen: ${plan.stats.strokeCount}, tekenlengte ${fmt(plan.stats.drawLengthMm / 1000)} m`);
  out.push('G21');
  out.push('G90');
  out.push(penUp);
  plan.strokes.forEach((stroke, index) => {
    out.push(`G0 ${xy(stroke[0])}`);
    const pause = plan.pauses[index] ?? 0;
    if (pause > 0) out.push(`G4 P${Math.round(pause * 1000)} ; inkt laten drogen`);
    out.push(penDown);
    const feed = options.drawFeed ? ` F${Math.round(options.drawFeed)}` : '';
    for (let i = 1; i < stroke.length; i++) out.push(`G1 ${xy(stroke[i])}${i === 1 ? feed : ''}`);
    out.push(penUp);
  });
  out.push(`G0 ${xy({ x: 0, y: 0 })}`);
  return out.join('\n') + '\n';
}
