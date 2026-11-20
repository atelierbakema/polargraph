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
| C5 | Middel | **Geen controle op transmissiefouten.** Er was een checksum (CRC) gepland, maar die staat uitgeschakeld. Een verminkt commando wordt zonder controle uitgevoerd of overgeslagen. | `controller/polargraphcontroller.pde:2586` (uitgecommentarieerd) |
| C6 | Middel | **Verouderd platform.** De app is gebouwd op Processing 2.2.1 met oude versies van ControlP5 en Geomerative. Op moderne computers, vooral Macs met Apple Silicon en recente macOS, is dat lastig of niet meer te starten. Dat moet ik nog testen. | hele app |

### Controller: tekenvlak, zoomen en SVG's

Mark merkt dat de app na het laden van een SVG en het vergroten of verkleinen raar gaat doen, dat je "de weg kwijtraakt" zonder terug te kunnen naar het begin, en dat de app soms helemaal vastloopt. Dit zijn de oorzaken die ik in de code vond:

| # | Ernst | Wat | Waar |
|---|---|---|---|
| Z1 | Hoog | **De SVG wordt elk beeld opnieuw uitgerekend.** Bij elke keer tekenen vraagt de app de bibliotheek (Geomerative) om de hele SVG opnieuw om te zetten in punten, en maakt hij voor elk punt nieuwe objecten aan. Bij een gedetailleerde SVG gaat de app daardoor kruipen of lijkt hij vast te lopen, vooral tijdens zoomen en slepen, want dan wordt er continu getekend. De oplossing is de punten één keer berekenen en bewaren. | `controller/DisplayMachine.pde:517` (en `:457`) |
| Z2 | Hoog | **Geen "terug naar begin".** Er is geen knop of toets om het beeld te resetten. De functie die de machine netjes in beeld zet (`fitDisplayMachineToWindow`) wordt alleen bij het starten of na het vergroten van het venster aangeroepen. Ben je eenmaal uit beeld geschoven of ver in- of uitgezoomd, dan kom je niet makkelijk terug. | `controller/polargraphcontroller.pde:634, 831` |
| Z3 | Hoog | **Schuiven kan alleen met de middelste muisknop.** Een trackpad of Magic Mouse heeft geen middelste knop, dus op een Mac kun je het beeld met de muis niet verschuiven. De sneltoetsen zijn ook geen alternatief: Ctrl+pijltjes zijn op macOS gereserveerd voor Mission Control, en Ctrl+PageUp/PageDown voor zoomen bestaan niet op een Mac-laptop. | `controller/polargraphcontroller.pde:1318–1328, 1381, 1467` |
| Z4 | Middel | **Zoomen springt.** Elke tik van het scrollwiel zoomt 10%, met een bereik van 1% tot 3000%. Een trackpad stuurt tientallen scroll-gebeurtenissen per veeg, dus het beeld schiet in een fractie van een seconde naar extreem in- of uitgezoomd. | `controller/polargraphcontroller.pde:500–501, 1280` |
| Z5 | Middel | **Zoomen loopt door het tekenen heen.** Scroll-gebeurtenissen worden op een andere thread verwerkt dan het tekenen (een eigen Java-listener). Zoom en positie veranderen dus soms terwijl er half getekend is. Dat geeft rare tussenbeelden en af en toe een fout. | `controller/polargraphcontroller.pde:675–681, 1555` |
| Z6 | Laag | **Het middelpunt van de SVG klopt soms niet.** De functie die SVG's tekent gebruikt voor het middelpunt de globale schaal in plaats van de schaal die hij meekrijgt, waardoor de rode stip bij een tweede vorm (de "capture"-vorm) op de verkeerde plek kan staan. | `controller/DisplayMachine.pde:513` |

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

1. **Controller, communicatie:** C1 (geen regels meer weggooien), C2 (regeleinde bij herhaling), C3 (foutafhandeling in `serialEvent`) en C4 (thread-safe status en wachtrij).
2. **Controller, tekenvlak:** Z1 (SVG-punten één keer berekenen), Z2 (knop en toets "beeld resetten"), Z3 (schuiven met spatie + slepen of met de linkermuisknop, en Mac-vriendelijke sneltoetsen), Z4 (rustiger zoomen met grenzen) en Z5 (zoomen op de teken-thread verwerken).
3. **Firmware van jouw machine:** F1, F2 en F5 (buffer en commando-afhandeling), F3 (debugtekst achter een debug-schakelaar) en F4 (wachten tot loslaten).
4. **Testen** met een simulator van de machine op de computer, zodat de communicatie getest kan worden zonder de echte machine. Daarna een test op de machine zelf.

Dit alleen al zou het meeste haperen moeten oplossen.

### Fase 2: moderniseren tot webapp op atelierbakema.com

Mark kiest voor een **webapp**, gehost op atelierbakema.com, zodat ook anderen hun Polargraph er weer mee kunnen gebruiken. Het voorbeeld is [Spokeit](https://spokeit.fr): een online tool waarmee je zonder installatie wielen ontwerpt en je instellingen kunt downloaden.

Hoe dat er technisch uitziet:

- **De app draait in de browser.** Je opent atelierbakema.com, sluit de machine met USB aan en klikt op "Verbinden". De browser praat dan direct met de machine via **Web Serial**. Er is geen server nodig die de machine bestuurt en je hoeft niets te installeren.
  - Let op: Web Serial werkt in Chrome, Edge en andere Chromium-browsers, op Mac, Windows, Linux en ChromeOS. Safari en Firefox ondersteunen het (nog) niet. De app moet dat netjes melden.
- **Bestanden blijven op je eigen computer.** Afbeeldingen en SVG's worden in de browser verwerkt en niet geüpload.
- **Instellingen als download.** Machinematen, penbreedte, snelheden en tekenstijlen kun je opslaan als bestand en later weer laden, net als bij Spokeit. Het bestaande `.properties`-formaat kunnen we blijven inlezen, zodat oude instellingen bruikbaar blijven.
- **Modern tekenvlak.** Zoomen en schuiven zoals in een kaart- of tekenapp, met trackpad, muis en touch, en altijd een knop "passend maken". SVG's worden één keer omgezet en bewaard, zodat ook grote bestanden vloeiend blijven.
- **Tekenen zonder computer.** Werkt de firmware met een SD-kaart, dan kan de webapp ook een commandobestand voor de SD-kaart maken.
- **Betrouwbaar protocol.** Een checksum per commando (C5), automatisch opnieuw versturen, en een duidelijke status: verbonden, bezig, klaar, fout.
- **Open source.** De app blijft onder dezelfde GPL-3.0-licentie als Sandy's code, met naamsvermelding.

Ook nodig:

- **Firmware:** een reproduceerbare build met vaste versies, en waar het kan dezelfde verbeteringen in alle varianten.
- **Tests:** automatische tests voor het protocol en een nagebootste machine, zodat de webapp ontwikkeld en getest kan worden zonder dat de echte machine aan hoeft.

**Volgorde:** eerst fase 1, zodat je nu al stabieler kunt tekenen met de bestaande app. Daarna de webapp stap voor stap: eerst verbinden en handmatig bewegen, dan SVG's tekenen, dan afbeeldingen en tekenstijlen. De oude app blijft werken tot de webapp alles kan.

## Open vragen

1. Welke machine/welk bord heb je? Een foto van de elektronica is genoeg.
2. Op welke computer draai je de controller (Mac/Windows, welke versie)? Start de huidige versie daar nog?
3. Welke tekenstijlen en functies uit de oude app gebruik je echt? Die komen als eerste in de webapp.
4. Welke problemen zie je het vaakst? Bijvoorbeeld: blijft hangen op BUSY, stukken ontbreken in tekeningen, touchscreen reageert dubbel of niet, verbinding valt weg.
