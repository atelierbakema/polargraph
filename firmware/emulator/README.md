# PolargraphSD-emulator

De **echte firmware** van de PolargraphSD (`../polarshield-ab/`), gecompileerd naar WebAssembly
en draaiend in de browser. Je ziet het touchscreen precies zoals op de machine, kunt erop drukken,
bestanden op een nagebootste SD-kaart zetten en zien wat de machine zou tekenen.

Open `index.html` via een lokale webserver (bijvoorbeeld `python3 -m http.server` in deze map).

## Wat wordt nagebootst

| Onderdeel | Hoe |
|---|---|
| Scherm (320×240) | Eigen versie van de UTFT-API (`emu.cpp`), met de echte lettertypes van UTFT |
| Touchscreen | Muis of vinger op het scherm in de browser |
| SD-kaart | Bestanden in het werkgeheugen, toe te voegen vanuit de browser |
| Motoren | De echte AccelStepper-bibliotheek; de posities worden uitgelezen en getekend |
| Penlift (servo) | De hoek wordt uitgelezen: onder 135° = pen omlaag |
| EEPROM | Geheugen met dezelfde opslagmaten als de echte chip (`stubs/EEPROMAnything.h`) |
| Seriële poort (USB) | Uitvoer in het venster "USB-verbinding"; je kunt commando's sturen |
| Tijd | Instelbaar sneller dan echt (1× tot 100×) |
| Herstarten | Knop "Herstart machine"; de EEPROM (instellingen, taal, kleuren) wordt in de browser bewaard, per firmware |

De firmwarecode zelf wordt niet aangepast voor de emulator.

## Bouwen

Nodig: `arduino-builder` (voor de Arduino-voorbewerking) en Emscripten (`em++`). Op Ubuntu:

```bash
sudo apt-get install arduino-builder arduino-core-avr gcc-avr avr-libc emscripten
```

```bash
./build.sh
```

Dit maakt `dist/firmware.js` (met de WebAssembly erin). Een losse pagina om online te zetten:

```bash
python3 make-standalone.py polargraph-emulator.html
```

## Gevonden met de emulator

- Na "DRAW THIS FILE" werd een vinger die nog op het scherm lag gezien als een druk op STOP
  (dezelfde plek), waardoor de tekening meteen stopte. Opgelost in 1.4.3-ab1 (F5).

## Bekende verschillen met de echte machine

- Rekenen gaat in de browser met 32 bits in plaats van 16 bits voor `int`; afrondingen kunnen
  op de laatste stap verschillen.
- De motoren hebben geen massa of traagheid: de emulator laat zien wat de firmware doet, niet hoe
  de gondel zwaait.

Licenties: firmware GPL-3.0; Arduino-core (WString, Print) LGPL-2.1; AccelStepper GPL;
lettertypes uit UTFT (CC BY-NC-SA 3.0).
