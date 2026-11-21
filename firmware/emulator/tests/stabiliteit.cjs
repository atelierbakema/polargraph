// Stabiliteitstest: bestookt de firmware in de emulator met commando's via de "USB-poort",
// afgewisseld met rommel, en meet of hij steeds netjes READY antwoordt.
//
// Gebruik (vanuit firmware/emulator, met een webserver op poort 8765):
//   python3 -m http.server 8765 &
//   node tests/stabiliteit.cjs [nieuw|origineel] [aantal]
// Vereist Playwright (in de cloudomgeving al aanwezig).
const { chromium } = require('playwright');

const firmware = process.argv[2] || 'nieuw';
const COUNT = Number(process.argv[3] || 2000);

// Voorspelbaar "toeval", zodat elke run hetzelfde is.
let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

// Machine van 650 x 650 mm (standaard bij een lege EEPROM); 200 stappen per 95 mm.
const W = 650;
const steps = (mm) => Math.round((mm * 200) / 95);
const cords = (x, y) => [steps(Math.hypot(x, y)), steps(Math.hypot(W - x, y))];

function makeCommand() {
  const r = rnd();
  if (r < 0.55) {
    const [a, b] = cords(150 + rnd() * 350, 150 + rnd() * 380);
    return { text: `C17,${a},${b},2,END`, valid: true, target: [a, b] };
  }
  if (r < 0.65) return { text: pick(['C13,END', 'C14,END']), valid: true };
  const junk = [
    '',                                                     // lege regel
    'C17,1000,1000,2',                                      // zonder ,END
    'X'.repeat(300),                                        // veel te lang
    'C17,' + '9'.repeat(120) + ',END',                      // lang getal
    String.fromCharCode(...Array.from({ length: 40 }, () => 33 + Math.floor(rnd() * 90))), // ruis
    'C99,1,2,END',                                          // onbekend commando
    ',END',                                                 // alleen het eind
    'END',
  ];
  return { text: pick(junk), valid: false };
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.goto(`http://localhost:8765/#${firmware === 'origineel' ? 'origineel' : 'nieuw'}`);
  await page.waitForFunction(() => typeof window.emuSend === 'function');
  await page.waitForTimeout(7000); // opstarten
  await page.evaluate(() => {
    window.emuLines = [];
    window.emuOnLine = (t) => window.emuLines.push(t);
    window.emuSpeed(20);
  });

  // Startpositie vastleggen.
  const [a0, b0] = cords(325, 340);
  const first = [{ text: `C09,${a0},${b0},END`, valid: true, setPos: [a0, b0] }];
  const commands = first.concat(Array.from({ length: COUNT }, makeCommand));

  const stats = { ok: 0, slow: 0, hang: 0, invalidAnswered: 0 };
  let expected = [a0, b0];
  const started = Date.now();
  let crashed = null;
  for (let i = 0; i < commands.length; i++) {
    const c = commands[i];
    let answered;
    try {
    answered = await page.evaluate(async ({ text }) => {
      window.emuLines = [];
      window.emuSend(text + '\n');
      const t0 = performance.now();
      // READY binnen 3 s (echte tijd; de emulator loopt 20x zo snel, dus ~60 s machinetijd)
      while (performance.now() - t0 < 3000) {
        if (window.emuLines.some((l) => l.startsWith('READY'))) return performance.now() - t0;
        await new Promise((r) => setTimeout(r, 5));
      }
      return -1;
    }, c);
    } catch (e) {
      const recent = commands.slice(Math.max(0, i - 3), i + 1).map((x) => JSON.stringify(x.text.length > 60 ? x.text.slice(0, 60) + '…' : x.text));
      crashed = `bij commando ${i} van ${commands.length}: ${e.message.split('\n')[0]}. Laatste commando's: ${recent.join(', ')}`;
      break;
    }
    if (answered < 0) {
      stats.hang++;
    } else {
      // Een READY die pas komt na de "nog steeds wakker"-herhaling (elke 5 s) telt als haperen.
      if (answered > 200 && !c.valid) stats.slow++;
      else stats.ok++;
      if (!c.valid) stats.invalidAnswered++;
    }
    if (c.target) expected = c.target;
    if (c.setPos) expected = c.setPos;
  }

  if (crashed) {
    console.log(`Firmware: ${firmware}`);
    console.log(`GECRASHT ${crashed}`);
    console.log(`Tot dan: netjes ${stats.ok}, haperend ${stats.slow}, vastgelopen ${stats.hang}`);
    await browser.close().catch(() => {});
    process.exit(1);
  }
  // Waar staat de machine nu? Vraag de motorposities op via de emulator.

  console.log(`Firmware: ${firmware}`);
  console.log(`Commando's: ${commands.length} (waarvan rommel: ${commands.filter((c) => !c.valid).length})`);
  console.log(`Netjes beantwoord: ${stats.ok}`);
  console.log(`Haperend (traag antwoord na rommel): ${stats.slow}`);
  console.log(`Vastgelopen (geen READY binnen 3 s): ${stats.hang}`);
  console.log(`Fouten in de pagina: ${pageErrors.length}${pageErrors.length ? ' - ' + pageErrors[0] : ''}`);
  console.log(`Duur: ${Math.round((Date.now() - started) / 1000)} s`);
  console.log(`Verwachte eindpositie (volle stappen): A ${expected[0]}, B ${expected[1]}`);
  const status = await page.locator('#motors').innerText();
  console.log(`Emulator meldt (microstappen): ${status}`);
  await browser.close();
})();
