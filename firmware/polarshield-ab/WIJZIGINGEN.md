# Polarshield-firmware, Atelier Bakema-versie

Gebaseerd op **Sandy Noble's Polargraph Server 1.4.3** voor de Arduino Mega + Polarshield v2.x
(map `../polarshield/`, ongewijzigd bewaard als terugvaloptie). Licentie: GPL-3.0, net als het origineel.

## Versie 1.4.3-ab1 (20 november 2026)

| # | Wijziging | Waarom |
|---|---|---|
| F1 | Binnenkomende regels kunnen de buffer niet meer laten overlopen (`comms.ino`) | Een te lange regel of ruis op de kabel overschreef ander geheugen: vreemd gedrag of herstarts |
| F2 | Een regel zonder `,END` (bijv. een lege regel) wordt overgeslagen in plaats van uitgevoerd (`comms.ino`) | Schreef naar een ongeldig geheugenadres. Gebeurde ook bij SD-bestanden met lege regels |
| F3 | Meldingen over aanrakingen van het touchscreen staan standaard uit (`DEBUG_TOUCH`) | Ze gingen over dezelfde kabel als de commando's en verstoorden de communicatie (bijv. `DONE.READY`) |
| F4 | Na een aanraking wacht de firmware tot de vinger los is (`lcd_waitForRelease`) | Eén aanraking telde soms meerdere keren |
| SD | De bestandenlijst op het touchscreen toont alleen `.TXT`-bestanden, zonder mappen en verborgen bestanden | Een Mac zet `._naam`-bestanden op de SD-kaart; die "uitvoeren" gaf onzin of een crash |
| C51 | Nieuw commando: wachten. `C51,<milliseconden>,END` (max. 10 minuten per commando). Het touchscreen blijft werken, zodat je kunt stoppen | Voor de inktdroogtijd uit de nieuwe app |

Niet veranderd: de commandotaal, de motorbesturing, de instellingen in het geheugen van de machine en
de werking van het touchscreen. Bestanden die met de oude app gemaakt zijn, werken nog steeds.

## Bouwen

Het bestand `polarshield-ab-1.4.3-ab1.hex` is kant-en-klaar. Zelf bouwen gaat met de Arduino-omgeving
(bord: *Arduino Mega 2560*) en deze bibliotheken:

| Bibliotheek | Versie | Opmerking |
|---|---|---|
| UTFT | Henning Karlsen (mirror `dgolda/UTFT`) | Licentie CC BY-NC-SA: niet-commercieel |
| UTouch | Henning Karlsen (mirror `dgolda/UTouch`) | In `UTouchCD.h` de kalibratie van het 2,4"-scherm zetten: `CAL_X 0x03C34136UL`, `CAL_Y 0x03C0018AUL`, `CAL_S 0x000EF13FUL` |
| AccelStepper | 1.58 | |
| SD | 1.2.4 | |
| Servo | 1.1.8 | |

Gecompileerd met avr-gcc 7.3 en Arduino AVR-core 1.8.6: 86.972 bytes programma (34%), 5.268 bytes RAM (64%).
Het origineel gaf met dezelfde gereedschappen 87.172 bytes en 5.392 bytes RAM.

**Let op het schermtype.** De firmware is gebouwd voor het 2,4"-scherm dat vanaf augustus 2014 werd
meegeleverd (`LCD_TYPE TFT01_24_8`), net als Sandy's kant-en-klare bestand. Blijft het scherm na het
installeren wit of rommelig, zet dan de reservekopie terug (zie `INSTALLEREN.md`).

**Licentie-opmerking.** De schermbibliotheken UTFT en UTouch hebben een niet-commerciële licentie.
Voor een versie die verkocht wordt (bijvoorbeeld in een bouwpakket), moeten die worden vervangen.
