# Analyse van de Polargraph-software

**Datum:** 20 november 2026
**Opgesteld door:** Claude Code, op verzoek van Mark
**Status:** eerste analyse. Er is nog niets aangepast in de code.

## Samenvatting

De software bestaat uit twee helften die via een seriële kabel (USB) met elkaar praten:

- **De controller** (`controller/`) is de desktop-app op je computer. Hij is geschreven in Processing 2.2.1 (uit 2014), zet afbeeldingen om in commando's en stuurt die één voor één naar de machine.
- **De firmware** (`firmware/`) draait op de machine zelf. Hij voert de commando's uit, bestuurt de motoren en de pen, en regelt het touchscreen.

Het "flaky" gedrag zit vooral in **hoe die twee met elkaar praten**. De controller verstuurt een commando, wacht op `READY`, en verstuurt dan het volgende. Gaat er onderweg één regel verloren of verminkt, dan blijft de controller wachten, wordt een commando overgeslagen, of crasht de firmware. De wiki heeft hier zelfs een eigen pagina voor: *Machine stuck on BUSY*.

Ik heb verschillende concrete bugs gevonden die precies dat veroorzaken. De meeste zijn klein en goed te repareren.

> **Eerst nodig:** welke machine heb je? Een touchscreen wijst op de **Polargraph SD** (Arduino Mega + Polarshield, map `firmware/polarshield/`). Een foto van het bord geeft zekerheid. Pas dan weten we welke firmware we moeten repareren en testen.

## Bevindingen

Ernst: **hoog** = veroorzaakt vastlopers of verkeerde tekeningen; **middel** = kan problemen geven; **laag** = onderhoud.

### Controller (desktop-app)

| # | Ernst | Wat | Waar |
|---|---|---|---|
| C1 | Hoog | **Regels van de machine worden weggegooid.** Na het lezen van één regel wordt de rest van de seriële buffer gewist (`myPort.clear()`). Stuurt de machine twee regels kort na elkaar, bijvoorbeeld een melding gevolgd door `READY`, dan gaat de tweede verloren. De controller blijft dan wachten op een `READY` die al geweest is, tot de machine na 5 seconden opnieuw `READY` stuurt. Dat geeft haperingen of een vastloper. | `controller/polargraphcontroller.pde:2326` |
| C2 | Hoog | **Opnieuw versturen werkt niet.** Vraagt de machine om een herhaling (`RESEND`), dan stuurt de controller het commando opnieuw, maar zonder regeleinde. De machine ziet het commando dus nooit als compleet. | `controller/polargraphcontroller.pde:2553` |
| C3 | Hoog | **Eén rare regel kan de verbinding stilleggen.** Bij een onverwachte regel van de machine (half ontvangen, ruis, een getal dat geen getal is) gooit `Integer.parseInt` een fout. In Processing schakelt een fout in `serialEvent` het ontvangen van seriële data **permanent uit**, tot je de app herstart. | `controller/polargraphcontroller.pde:2381, 2488, 2502, 2546` en andere |
| C4 | Middel | **Niet thread-safe.** Seriële data komt binnen op een andere thread dan het tekenen van de app. De status `drawbotReady` en de commandowachtrij worden zonder goede synchronisatie door beide gedeeld. Dat geeft zeldzame, onvoorspelbare fouten. | `controller/polargraphcontroller.pde:64, 141, 2560` |
| C5 | Middel | **Geen controle op transmissiefouten.** Er was een checksum (CRC) gepland, maar die staat uitgeschakeld. Een verminkt commando wordt zonder controle uitgevoerd of overgeslagen. | `controller/polargraphcontroller.pde:2584` (uitgecommentarieerd) |
| C6 | Middel | **Verouderd platform.** De app is gebouwd op Processing 2.2.1 met oude versies van ControlP5 en Geomerative. Op moderne computers, vooral Macs met Apple Silicon en recente macOS, is dat lastig of niet meer te starten. Dat moet ik nog testen. | hele app |

### Firmware Polarshield (Arduino Mega, met touchscreen)

| # | Ernst | Wat | Waar |
|---|---|---|---|
| F1 | Hoog | **Bufferoverloop.** Binnenkomende tekens worden in een buffer van 50 tekens gezet zonder te controleren of die vol is. Een te lange regel, of ruis op de kabel, overschrijft ander geheugen. Gevolg: willekeurig vreemd gedrag of een herstart. | `firmware/polarshield/comms.ino:99` |
| F2 | Hoog | **Crash bij een commando zonder `,END`.** Ontbreekt het eindteken, dan schrijft de code naar een ongeldig geheugenadres. Op een Arduino Mega overschrijft dat stilletjes interne registers. | `firmware/polarshield/comms.ino:170` |
| F3 | Hoog | **Touchscreen-debugtekst stoort de communicatie.** Bij elke aanraking stuurt de firmware debugregels over dezelfde kabel als de commando's ("touch ok", "Inputted!!", "DONE." …). `DONE.` heeft geen regeleinde, dus het volgende `READY` plakt eraan vast (`DONE.READY`) en wordt niet herkend. Samen met C1 verklaart dit waarschijnlijk een deel van het haperen rond het touchscreen. | `firmware/polarshield/lcd.ino:34, 47, 82` en `lcd_processTouchCommand` |
| F4 | Middel | **Geen goede afhandeling van ingedrukt houden.** Een aanraking wordt verwerkt zonder te wachten tot je loslaat. Blijf je drukken, dan kan dezelfde knop meerdere keren reageren. | `firmware/polarshield/lcd.ino:24–90` |
| F5 | Middel | **Afgekeurd commando wordt stil overgeslagen.** Kan een commando niet worden gelezen, dan meldt de firmware een fout, maar vraagt niet om herhaling. De controller gaat na 5 seconden verder met het volgende commando, en er ontbreekt een stuk van de tekening. | `firmware/polarshield/comms.ino:143–149` |
| F6 | Laag | **Parameters zonder lengtecontrole.** Parameters worden met `strcpy` in kleine vaste buffers gekopieerd (bijv. 10 tekens voor het commando). | `firmware/polarshield/comms.ino:212` |

### Firmware ESP32

Dit is de nieuwste versie van Sandy (2021). Daarin is een deel van de bovenstaande problemen al opgelost: de buffer wordt bewaakt, er is een time-out, en de firmware vraagt om herhaling (`RESEND`). Wel nog:

| # | Ernst | Wat | Waar |
|---|---|---|---|
| E1 | Hoog | **Herhaling vragen werkt niet samen met de controller**, door bug C2. De oplossing in de firmware loopt zo vast op de controller. | samen met C2 |
| E2 | Middel | **Bij een te lange regel wordt de verkeerde buffer gewist** (`currentCommand` in plaats van `nextCommand`). | `firmware/polarshield-esp32/src/comms.ino:68` |
| E3 | Middel | **De build is niet reproduceerbaar.** Het platform en een paar bibliotheken staan niet op een vaste versie (Encoder komt direct van een git-branch). Een aangepaste kopie van TFT_eSPI zit in de repo. Over een paar jaar bouwt dit waarschijnlijk niet meer zonder aanpassingen. | `firmware/polarshield-esp32/platformio.ini` |

### Firmware Uno (a1)

Dezelfde basis als de Polarshield-firmware, met dezelfde problemen F1, F2, F5 en F6 (zie `firmware/a1-uno/comms.ino:150`). Alleen relevant als je machine een Uno blijkt te hebben.

## Voorstel

### Fase 1: stabiliseren (klein, laag risico)

Gerichte reparaties zonder het ontwerp te veranderen:

1. **Controller:** C1 (geen regels meer weggooien), C2 (regeleinde bij herhaling), C3 (foutafhandeling in `serialEvent`) en C4 (thread-safe status en wachtrij).
2. **Firmware van jouw machine:** F1, F2 en F5 (buffer en commando-afhandeling), F3 (debugtekst achter een debug-schakelaar) en F4 (wachten tot loslaten).
3. **Testen** met een simulator van de machine op de computer, zodat de communicatie getest kan worden zonder de echte machine. Daarna een test op de machine zelf.

Dit alleen al zou het meeste haperen moeten oplossen.

### Fase 2: moderniseren (groter, apart besluit)

- **Controller:** overzetten naar een modern platform. Opties:
  - Processing 4: kleinste stap, zelfde code.
  - Een nieuwe app, bijvoorbeeld een webapp die via Web Serial met de machine praat en in de browser draait, zonder installatie.
- **Protocol:** een checksum per commando (C5), zodat transmissiefouten altijd worden gezien en herhaald.
- **Firmware:** reproduceerbare build met vaste versies, en waar het kan dezelfde verbeteringen in alle varianten.
- **Tests:** automatische tests voor het protocol, zodat toekomstige wijzigingen niets breken.

## Open vragen

1. Welke machine/welk bord heb je? Een foto van de elektronica is genoeg.
2. Op welke computer draai je de controller (Mac/Windows, welke versie)? Start de huidige versie daar nog?
3. Welke problemen zie je het vaakst? Bijvoorbeeld: blijft hangen op BUSY, stukken ontbreken in tekeningen, touchscreen reageert dubbel of niet, verbinding valt weg.
