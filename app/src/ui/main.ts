/**
 * De webapp: alles aan elkaar knopen. Tekening laden, op papier zetten,
 * voorbeeld tonen en bestanden maken voor de machine.
 */

import { boundsOf, type Polyline } from '../core/geometry.ts';
import {
  checkSetup,
  PAPER_SIZES,
  POLARGRAPH_SD_DEFAULTS,
  type MachineConfig,
  type PaperConfig,
} from '../core/machine.ts';
import { buildPlan, estimateSeconds, fitToPaper, place, type DrawingPlan, type Placement } from '../core/plan.ts';
import { importSvg, type SvgImportResult } from '../core/svg.ts';
import { exportLegacy, sdFileName, validateLegacy } from '../core/export/legacy.ts';
import { exportGcode } from '../core/export/gcode.ts';
import { Viewer } from './view.ts';
import exampleSvg from './example.svg?raw';

// ---------- Instellingen (blijven bewaard in de browser) ----------

interface PaperSettings {
  size: string; // A5..A0 of 'custom'
  orientation: 'portrait' | 'landscape';
  customWidthMm: number;
  customHeightMm: number;
  topMm: number;
  /** null = horizontaal gecentreerd */
  leftMm: number | null;
}

interface Settings {
  version: 1;
  machine: MachineConfig;
  paper: PaperSettings;
}

const STORAGE_KEY = 'polargraph-studio:settings:v1';

const DEFAULT_SETTINGS: Settings = {
  version: 1,
  machine: { widthMm: 1000, heightMm: 1500, ...POLARGRAPH_SD_DEFAULTS },
  paper: { size: 'A3', orientation: 'portrait', customWidthMm: 500, customHeightMm: 700, topMm: 250, leftMm: null },
};

function loadSettings(): { settings: Settings; fromStorage: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { settings: mergeSettings(JSON.parse(raw)), fromStorage: true };
  } catch {
    // Geen opslag beschikbaar (privévenster); standaardwaarden gebruiken.
  }
  return { settings: structuredClone(DEFAULT_SETTINGS), fromStorage: false };
}

function mergeSettings(input: unknown): Settings {
  const d = structuredClone(DEFAULT_SETTINGS);
  if (!input || typeof input !== 'object') return d;
  const i = input as Partial<Settings>;
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  if (i.machine) {
    d.machine.widthMm = num(i.machine.widthMm, d.machine.widthMm);
    d.machine.heightMm = num(i.machine.heightMm, d.machine.heightMm);
    d.machine.mmPerRev = num(i.machine.mmPerRev, d.machine.mmPerRev);
    d.machine.stepsPerRev = num(i.machine.stepsPerRev, d.machine.stepsPerRev);
    d.machine.stepMultiplier = num(i.machine.stepMultiplier, d.machine.stepMultiplier);
  }
  if (i.paper) {
    if (typeof i.paper.size === 'string' && (PAPER_SIZES[i.paper.size] || i.paper.size === 'custom')) d.paper.size = i.paper.size;
    if (i.paper.orientation === 'landscape' || i.paper.orientation === 'portrait') d.paper.orientation = i.paper.orientation;
    d.paper.customWidthMm = num(i.paper.customWidthMm, d.paper.customWidthMm);
    d.paper.customHeightMm = num(i.paper.customHeightMm, d.paper.customHeightMm);
    d.paper.topMm = num(i.paper.topMm, d.paper.topMm);
    d.paper.leftMm = typeof i.paper.leftMm === 'number' && Number.isFinite(i.paper.leftMm) ? i.paper.leftMm : null;
  }
  return d;
}

function saveSettings(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  } catch {
    // Niet erg: dan onthoudt de browser het gewoon niet.
  }
}

// ---------- Toestand ----------

const loaded = loadSettings();
const state = {
  settings: loaded.settings,
  source: null as SvgImportResult | null,
  fileName: 'voorbeeld.svg',
  placement: { scale: 1, offsetX: 0, offsetY: 0, rotation: 0 } as Placement,
  optimize: true,
  plan: null as DrawingPlan | null,
  placedBounds: null as ReturnType<typeof boundsOf>,
};

function paperConfig(): PaperConfig {
  const p = state.settings.paper;
  let size = p.size === 'custom' ? { widthMm: p.customWidthMm, heightMm: p.customHeightMm } : PAPER_SIZES[p.size];
  if (p.size !== 'custom' && p.orientation === 'landscape') size = { widthMm: size.heightMm, heightMm: size.widthMm };
  const m = state.settings.machine;
  return {
    widthMm: size.widthMm,
    heightMm: size.heightMm,
    topMm: p.topMm,
    leftMm: p.leftMm ?? (m.widthMm - size.widthMm) / 2,
  };
}

// ---------- Elementen ----------

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} ontbreekt`);
  return el as T;
};
const inputs = {
  file: $<HTMLInputElement>('file'),
  margin: $<HTMLInputElement>('margin'),
  scale: $<HTMLInputElement>('scale'),
  rotation: $<HTMLSelectElement>('rotation'),
  offsetX: $<HTMLInputElement>('offsetX'),
  offsetY: $<HTMLInputElement>('offsetY'),
  optimize: $<HTMLInputElement>('optimize'),
  paperSize: $<HTMLSelectElement>('paperSize'),
  orientation: $<HTMLSelectElement>('orientation'),
  paperW: $<HTMLInputElement>('paperW'),
  paperH: $<HTMLInputElement>('paperH'),
  paperTop: $<HTMLInputElement>('paperTop'),
  paperLeft: $<HTMLInputElement>('paperLeft'),
  machineW: $<HTMLInputElement>('machineW'),
  machineH: $<HTMLInputElement>('machineH'),
  mmPerRev: $<HTMLInputElement>('mmPerRev'),
  stepsPerRev: $<HTMLInputElement>('stepsPerRev'),
  stepMultiplier: $<HTMLInputElement>('stepMultiplier'),
  showDraw: $<HTMLInputElement>('showDraw'),
  showTravel: $<HTMLInputElement>('showTravel'),
  showCords: $<HTMLInputElement>('showCords'),
  progress: $<HTMLInputElement>('progress'),
};

const viewer = new Viewer($<HTMLCanvasElement>('canvas'));

// ---------- Rekenen en tonen ----------

const fmtNum = (n: number, digits = 0) => n.toLocaleString('nl-NL', { maximumFractionDigits: digits, minimumFractionDigits: digits });

function placedLines(): Polyline[] {
  return state.source ? place(state.source.lines, state.placement) : [];
}

function recompute(): void {
  const machine = state.settings.machine;
  const paper = paperConfig();
  const placed = placedLines();
  state.placedBounds = boundsOf(placed);
  state.plan = buildPlan(placed, paper, { order: state.optimize ? 'nearest' : 'original' });
  viewer.setScene({ machine, paper, strokes: state.plan.strokes });
  renderStats();
  renderWarnings(paper);
  syncPlacementInputs();
  $('machineSummary').textContent = `${fmtNum(machine.widthMm)} × ${fmtNum(machine.heightMm)} mm`;
}

function renderStats(): void {
  const plan = state.plan;
  const el = $('stats');
  if (!plan || !state.placedBounds) {
    el.innerHTML = '';
    return;
  }
  const s = plan.stats;
  const b = state.placedBounds;
  const sec = estimateSeconds(s, { drawMmPerSec: 30, travelMmPerSec: 60, penLiftSec: 1 });
  const minutes = Math.max(1, Math.round(sec / 60));
  const rows: Array<[string, string]> = [
    ['Formaat tekening', `${fmtNum(b.maxX - b.minX)} × ${fmtNum(b.maxY - b.minY)} mm`],
    ['Lijnen', fmtNum(s.strokeCount)],
    ['Tekenen', `${fmtNum(s.drawLengthMm / 1000, 1)} m`],
    ['Verplaatsen', `${fmtNum(s.travelLengthMm / 1000, 1)} m`],
    ['Geschatte tijd', minutes < 60 ? `± ${minutes} min` : `± ${fmtNum(minutes / 60, 1)} uur`],
  ];
  el.innerHTML = '';
  for (const [k, v] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v;
    el.append(dt, dd);
  }
}

function renderWarnings(paper: PaperConfig): void {
  const list = $('warnings');
  list.innerHTML = '';
  const items: Array<{ text: string; error?: boolean }> = [];
  for (const p of checkSetup(state.settings.machine, paper)) items.push({ text: p.message, error: p.level === 'error' });
  for (const w of state.source?.warnings ?? []) items.push({ text: w });
  for (const w of state.plan?.warnings ?? []) items.push({ text: w });
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item.text;
    if (item.error) li.className = 'error';
    list.append(li);
  }
  const hasError = items.some((i) => i.error) || !state.plan || state.plan.strokes.length === 0;
  $<HTMLButtonElement>('exportSd').disabled = hasError;
  $<HTMLButtonElement>('exportGcode').disabled = hasError;
}

function syncPlacementInputs(): void {
  const b = state.placedBounds;
  setIfIdle(inputs.scale, fmtInput(state.placement.scale * 100, 1));
  setIfIdle(inputs.offsetX, b ? fmtInput(b.minX, 1) : '');
  setIfIdle(inputs.offsetY, b ? fmtInput(b.minY, 1) : '');
  inputs.rotation.value = String(state.placement.rotation);
}

function fmtInput(n: number, digits: number): string {
  return String(Math.round(n * 10 ** digits) / 10 ** digits);
}

/** Werk een invoerveld niet bij terwijl de gebruiker erin typt. */
function setIfIdle(input: HTMLInputElement, value: string): void {
  if (document.activeElement !== input) input.value = value;
}

function syncSettingsInputs(): void {
  const { machine, paper } = state.settings;
  inputs.machineW.value = String(machine.widthMm);
  inputs.machineH.value = String(machine.heightMm);
  inputs.mmPerRev.value = String(machine.mmPerRev);
  inputs.stepsPerRev.value = String(machine.stepsPerRev);
  inputs.stepMultiplier.value = String(machine.stepMultiplier);
  inputs.paperSize.value = paper.size;
  inputs.orientation.value = paper.orientation;
  inputs.paperW.value = String(paper.customWidthMm);
  inputs.paperH.value = String(paper.customHeightMm);
  inputs.paperTop.value = String(paper.topMm);
  inputs.paperLeft.value = paper.leftMm === null ? '' : String(paper.leftMm);
  document.querySelectorAll<HTMLElement>('.custom-size').forEach((el) => (el.hidden = paper.size !== 'custom'));
  inputs.orientation.disabled = paper.size === 'custom';
}

// ---------- Tekening laden en plaatsen ----------

function loadSvgText(text: string, name: string): void {
  try {
    state.source = importSvg(text);
    state.fileName = name;
    $('filename').textContent = name;
    fit();
  } catch (e) {
    alertMessage(e instanceof Error ? e.message : 'Dit bestand kon niet gelezen worden.');
  }
}

function fit(): void {
  if (!state.source) return;
  const margin = Number(inputs.margin.value);
  state.placement = fitToPaper(state.source.lines, paperConfig(), Number.isFinite(margin) ? margin : 15, state.placement.rotation);
  recompute();
  viewer.fitPaper();
}

/** Nieuwe schaal of draaiing, met de linkerbovenhoek van de tekening op dezelfde plek. */
function setPlacement(scale: number, rotation: Placement['rotation'], left?: number, top?: number): void {
  if (!state.source) return;
  const b = state.placedBounds;
  const keepLeft = left ?? b?.minX ?? 0;
  const keepTop = top ?? b?.minY ?? 0;
  const raw = boundsOf(place(state.source.lines, { scale, offsetX: 0, offsetY: 0, rotation }));
  state.placement = {
    scale,
    rotation,
    offsetX: keepLeft - (raw?.minX ?? 0),
    offsetY: keepTop - (raw?.minY ?? 0),
  };
  recompute();
}

function alertMessage(text: string): void {
  const list = $('warnings');
  const li = document.createElement('li');
  li.className = 'error';
  li.textContent = text;
  list.prepend(li);
}

// ---------- Bestanden opslaan ----------

function download(name: string, text: string, type: string): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportSd(): void {
  if (!state.plan) return;
  const text = exportLegacy(state.plan, state.settings.machine, paperConfig());
  const issues = validateLegacy(text);
  if (issues.length > 0) {
    alertMessage(`Er ging iets mis bij het maken van het bestand (regel ${issues[0].line}: ${issues[0].message}).`);
    return;
  }
  const name = sdFileName(state.fileName);
  download(name, text, 'text/plain');
  $('sdName').textContent = name;
  $<HTMLTextAreaElement>('fileText').value = text;
  $<HTMLDialogElement>('checklist').showModal();
}

function exportG(): void {
  if (!state.plan) return;
  const text = exportGcode(state.plan, paperConfig(), { title: state.fileName });
  const name = state.fileName.replace(/\.svg$/i, '') + '.gcode';
  download(name, text, 'text/plain');
  $('gcodeName').textContent = name;
  $<HTMLTextAreaElement>('gcodeText').value = text;
  $<HTMLDialogElement>('gcodeDone').showModal();
}

// ---------- Afspelen ----------

let playing = false;
let lastFrame = 0;
const PLAY_SECONDS = 10;

function setProgress(p: number): void {
  const v = Math.min(1, Math.max(0, p));
  inputs.progress.value = String(Math.round(v * 1000));
  $('progressLabel').textContent = `${Math.round(v * 100)}%`;
  viewer.setOptions({ progress: v });
}

function play(): void {
  if (playing) {
    playing = false;
    $('play').textContent = '▶';
    return;
  }
  if (Number(inputs.progress.value) >= 1000) setProgress(0);
  playing = true;
  $('play').textContent = '❚❚';
  lastFrame = performance.now();
  const step = (now: number) => {
    if (!playing) return;
    const dt = (now - lastFrame) / 1000;
    lastFrame = now;
    const next = Number(inputs.progress.value) / 1000 + dt / PLAY_SECONDS;
    setProgress(next);
    if (next >= 1) {
      playing = false;
      $('play').textContent = '▶';
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- Gebeurtenissen ----------

function onSettingsChanged(): void {
  saveSettings();
  syncSettingsInputs();
  recompute();
}

const numberValue = (input: HTMLInputElement): number | null => {
  const v = input.valueAsNumber;
  return Number.isFinite(v) ? v : null;
};

inputs.file.addEventListener('change', async () => {
  const f = inputs.file.files?.[0];
  if (f) loadSvgText(await f.text(), f.name);
  inputs.file.value = '';
});

const drop = $('drop');
drop.addEventListener('dragover', (e) => {
  e.preventDefault();
  drop.classList.add('over');
});
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
for (const target of [drop, $('canvas')]) {
  target.addEventListener('drop', async (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    const f = (e as DragEvent).dataTransfer?.files?.[0];
    if (f) loadSvgText(await f.text(), f.name);
  });
  target.addEventListener('dragover', (e) => e.preventDefault());
}

$('fit').addEventListener('click', fit);
inputs.scale.addEventListener('change', () => {
  const v = numberValue(inputs.scale);
  if (v && v > 0) setPlacement(v / 100, state.placement.rotation);
});
inputs.rotation.addEventListener('change', () => {
  setPlacement(state.placement.scale, Number(inputs.rotation.value) as Placement['rotation']);
});
for (const input of [inputs.offsetX, inputs.offsetY]) {
  input.addEventListener('change', () => {
    const x = numberValue(inputs.offsetX);
    const y = numberValue(inputs.offsetY);
    setPlacement(state.placement.scale, state.placement.rotation, x ?? undefined, y ?? undefined);
  });
}
inputs.optimize.addEventListener('change', () => {
  state.optimize = inputs.optimize.checked;
  recompute();
});

inputs.paperSize.addEventListener('change', () => {
  state.settings.paper.size = inputs.paperSize.value;
  onSettingsChanged();
});
inputs.orientation.addEventListener('change', () => {
  state.settings.paper.orientation = inputs.orientation.value as PaperSettings['orientation'];
  onSettingsChanged();
});
const settingInputs: Array<[HTMLInputElement, (v: number | null) => void]> = [
  [inputs.paperW, (v) => v && (state.settings.paper.customWidthMm = v)],
  [inputs.paperH, (v) => v && (state.settings.paper.customHeightMm = v)],
  [inputs.paperTop, (v) => v !== null && (state.settings.paper.topMm = v)],
  [inputs.paperLeft, (v) => (state.settings.paper.leftMm = v)],
  [inputs.machineW, (v) => v && (state.settings.machine.widthMm = v)],
  [inputs.machineH, (v) => v && (state.settings.machine.heightMm = v)],
  [inputs.mmPerRev, (v) => v && (state.settings.machine.mmPerRev = v)],
  [inputs.stepsPerRev, (v) => v && (state.settings.machine.stepsPerRev = v)],
  [inputs.stepMultiplier, (v) => v && (state.settings.machine.stepMultiplier = v)],
];
for (const [input, apply] of settingInputs) {
  input.addEventListener('change', () => {
    apply(numberValue(input));
    onSettingsChanged();
  });
}

$('saveSettings').addEventListener('click', () => {
  download('polargraph-instellingen.json', JSON.stringify(state.settings, null, 2) + '\n', 'application/json');
});
$<HTMLInputElement>('loadSettings').addEventListener('change', async (e) => {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0];
  if (!f) return;
  try {
    state.settings = mergeSettings(JSON.parse(await f.text()));
    onSettingsChanged();
  } catch {
    alertMessage('Dit instellingenbestand kon niet gelezen worden.');
  }
  input.value = '';
});

$('exportSd').addEventListener('click', exportSd);
$('exportGcode').addEventListener('click', exportG);
for (const [buttonId, textId] of [['copyText', 'fileText'], ['copyGcode', 'gcodeText']]) {
  $(buttonId).addEventListener('click', async () => {
    const ta = $<HTMLTextAreaElement>(textId);
    try {
      await navigator.clipboard.writeText(ta.value);
      $(buttonId).textContent = 'Gekopieerd';
    } catch {
      ta.select();
    }
  });
}

$('viewFit').addEventListener('click', () => viewer.fitAll());
$('viewPaper').addEventListener('click', () => viewer.fitPaper());
inputs.showDraw.addEventListener('change', () => viewer.setOptions({ showDraw: inputs.showDraw.checked }));
inputs.showTravel.addEventListener('change', () => viewer.setOptions({ showTravel: inputs.showTravel.checked }));
inputs.showCords.addEventListener('change', () => viewer.setOptions({ showCords: inputs.showCords.checked }));
inputs.progress.addEventListener('input', () => {
  playing = false;
  $('play').textContent = '▶';
  setProgress(Number(inputs.progress.value) / 1000);
});
$('play').addEventListener('click', play);

// ---------- Start ----------

syncSettingsInputs();
if (!loaded.fromStorage) {
  // Eerste bezoek: laat de machine-instellingen open zien, die moeten kloppen.
  $<HTMLDetailsElement>('machineDetails').open = true;
}
loadSvgText(exampleSvg, 'voorbeeld.svg');
$('filename').textContent = 'Voorbeeldtekening. Kies je eigen SVG hierboven.';
