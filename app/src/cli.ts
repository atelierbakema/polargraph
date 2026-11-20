/**
 * Commandoregel: zet een SVG om naar een tekenbestand.
 *
 *   node src/cli.ts tekening.svg --breedte 1000 --hoogte 1500 --papier A3 --boven 250
 *
 * Opties:
 *   --breedte <mm>       afstand tussen de motoren (verplicht)
 *   --hoogte <mm>        hoogte van de motoren boven de vloer (verplicht)
 *   --papier <A4|A3|..>  papierformaat (standaard A3), of --papier 500x700
 *   --liggend            papier liggend in plaats van staand
 *   --boven <mm>         afstand van de motoren tot de bovenrand van het papier (verplicht)
 *   --links <mm>         afstand van motor A tot de linkerrand (standaard: gecentreerd)
 *   --marge <mm>         marge bij passend maken (standaard 10)
 *   --ware-grootte       niet passend maken, maar de maten uit de SVG gebruiken
 *   --draai <0|90|180|270>
 *   --formaat <sd|gcode> sd = bestand voor Sandy's firmware (standaard), gcode = G-code
 *   --volgorde <slim|origineel>
 *   -o <bestand>         uitvoerbestand (standaard: naam voor de SD-kaart)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import {
  buildPlan,
  centeredPaper,
  checkSetup,
  estimateSeconds,
  exportGcode,
  exportLegacy,
  fitToPaper,
  importSvg,
  PAPER_SIZES,
  place,
  POLARGRAPH_SD_DEFAULTS,
  sdFileName,
  validateLegacy,
  type MachineConfig,
  type Placement,
} from './core/index.ts';

function fail(message: string): never {
  console.error(`Fout: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const flags = new Map<string, string | true>();
const positional: string[] = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('-')) {
    const next = args[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(a, next);
      i++;
    } else flags.set(a, true);
  } else positional.push(a);
}
const getNum = (name: string, required: boolean, fallback?: number): number => {
  const v = flags.get(name);
  if (v === undefined || v === true) {
    if (required) fail(`${name} ontbreekt.`);
    return fallback as number;
  }
  const n = Number(v);
  if (!Number.isFinite(n)) fail(`${name} moet een getal zijn.`);
  return n;
};

const input = positional[0];
if (!input || flags.has('--help') || flags.has('-h')) {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0].replace(/^\/\*\*?\n?/, '').replace(/^ \* ?/gm, ''));
  process.exit(input ? 0 : 1);
}

const machine: MachineConfig = {
  widthMm: getNum('--breedte', true),
  heightMm: getNum('--hoogte', true),
  ...POLARGRAPH_SD_DEFAULTS,
};

const paperArg = String(flags.get('--papier') ?? 'A3').toUpperCase();
let size = PAPER_SIZES[paperArg];
const custom = /^(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)$/.exec(paperArg);
if (!size && custom) size = { widthMm: Number(custom[1]), heightMm: Number(custom[2]) };
if (!size) fail(`Onbekend papierformaat "${paperArg}". Gebruik A5 t/m A0 of bijvoorbeeld 500x700.`);
if (flags.has('--liggend')) size = { widthMm: size.heightMm, heightMm: size.widthMm };

const paper = centeredPaper(machine, size, getNum('--boven', true));
if (flags.has('--links')) paper.leftMm = getNum('--links', true);

const problems = checkSetup(machine, paper);
for (const p of problems) console.log(`${p.level === 'error' ? 'Fout' : 'Let op'}: ${p.message}`);
if (problems.some((p) => p.level === 'error')) process.exit(1);

const svg = importSvg(readFileSync(input, 'utf8'));
for (const w of svg.warnings) console.log(`Let op: ${w}`);

const rotation = Number(flags.get('--draai') ?? 0) as Placement['rotation'];
if (![0, 90, 180, 270].includes(rotation)) fail('--draai moet 0, 90, 180 of 270 zijn.');
const placement: Placement = flags.has('--ware-grootte')
  ? { scale: 1, offsetX: 0, offsetY: 0, rotation }
  : fitToPaper(svg.lines, paper, getNum('--marge', false, 10), rotation);
const placed = place(svg.lines, placement, flags.has('--ware-grootte') ? { widthMm: svg.widthMm, heightMm: svg.heightMm } : undefined);

const order = flags.get('--volgorde') === 'origineel' ? 'original' : 'nearest';
const plan = buildPlan(placed, paper, { order });
for (const w of plan.warnings) console.log(`Let op: ${w}`);

const format = String(flags.get('--formaat') ?? 'sd');
let text: string;
let outName: string;
if (format === 'gcode') {
  text = exportGcode(plan, paper, { title: basename(input) });
  outName = basename(input).replace(/\.svg$/i, '') + '.gcode';
} else if (format === 'sd') {
  text = exportLegacy(plan, machine, paper);
  const issues = validateLegacy(text);
  if (issues.length) fail(`Intern probleem met het bestand (regel ${issues[0].line}: ${issues[0].message}).`);
  outName = sdFileName(basename(input));
} else fail('--formaat moet sd of gcode zijn.');
const out = String(flags.get('-o') ?? outName);
writeFileSync(out, text);

const s = plan.stats;
const minutes = Math.round(estimateSeconds(s, { drawMmPerSec: 30, travelMmPerSec: 60, penLiftSec: 1 }) / 60);
console.log(`Opgeslagen: ${out}`);
console.log(`Schaal: ${(placement.scale * 100).toFixed(0)}%`);
console.log(`Lijnen: ${s.strokeCount} (pen ${s.penLifts}x omhoog)`);
console.log(`Tekenen: ${(s.drawLengthMm / 1000).toFixed(1)} m, verplaatsen: ${(s.travelLengthMm / 1000).toFixed(1)} m`);
console.log(`Geschatte tijd: ongeveer ${Math.max(1, minutes)} ${minutes <= 1 ? 'minuut' : 'minuten'} (ruwe schatting)`);
if (format === 'sd') {
  console.log('');
  console.log('Zo teken je het:');
  console.log(`1. Zet ${out} in de hoofdmap van de SD-kaart.`);
  console.log('2. Zet de motoren uit en zet de pen met de hand precies op de linkerbovenhoek van het papier.');
  console.log(`3. Kies ${out} op het touchscreen en start. De machine weet dan waar hij is.`);
}
