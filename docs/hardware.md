# Hardware: Mark's PolargraphSD

Vastgesteld aan de hand van foto's, 20 november 2026.

| Onderdeel | Wat |
|---|---|
| Machine | PolargraphSD (Sandy Noble), in acrylbehuizing met touchscreen |
| Hoofdbord | Arduino Mega 2560 (rood kloonbord) |
| Shield | **Polarshield v2.0d** |
| Motordrivers | 2× A4988 (Pololu-formaat), voor motor A (links) en motor B (rechts) |
| Motor C | Aansluiting op de print aanwezig, maar niet bestukt en niet gebruikt door de firmware |
| Penlift | Servo-aansluiting `S1`/`S2` (3 pinnen: signaal, +, −) |
| Scherm | Touchscreen (UTFT-bibliotheek in de firmware) |
| Opslag | Micro-SD-kaartlezer aan de zijkant |
| Firmware | `firmware/polarshield/` (Polargraph Server voor ATMEGA2560) |

## De aansluiting "limits" (eindschakelaars)

Linksboven op de achterkant van de Polarshield zit een blokje van 6 pinnen met het opschrift **limits**, met de labels `+U`, `GND`, `X+`, `X−`, `Y+`, `Y−`. Dit is de aansluiting voor eindschakelaars.

Wat de firmware verwacht (`firmware/polarshield/polargraph_server_polarshield.ino:357–363` en `configuration.ino:111–114`):

| Firmware-naam | Arduino-pin | Vermoedelijk label | Functie in de kalibratie |
|---|---|---|---|
| `ENDSTOP_X_MIN` | 16 | `X−` | Schakelaar bij **motor A** (links) |
| `ENDSTOP_X_MAX` | 17 | `X+` | Niet gebruikt in de kalibratie |
| `ENDSTOP_Y_MIN` | 14 | `Y−` | Schakelaar bij **motor B** (rechts) |
| `ENDSTOP_Y_MAX` | 15 | `Y+` | Niet gebruikt in de kalibratie |

- De pinnen staan op `INPUT_PULLUP`. Een eenvoudige microschakelaar (normaal open) komt tussen de pin en `GND`. Ingedrukt betekent dat de firmware `0` leest, en zo verwacht de kalibratiecode het ook.
- `+U` is waarschijnlijk 5 V, voor optische of elektronische eindschakelaars. Voor gewone microschakelaars is die niet nodig.
- **Nog niet bevestigd:** welk label bij welke Arduino-pin hoort. Er is geen schema van de Polarshield v2.0d gevonden, niet in de repo's van Sandy en niet online. Controleer het met een multimeter op doorgang: meet tussen de `X−`-pin en Arduino-pin 16 (op de Mega gemarkeerd als `TX2`), en tussen `Y−` en pin 14 (`TX3`). Doe dit met de stroom eraf.

## Historie

Sandy heeft de kalibratieknop in versie 1.2 van de firmware weer van het touchscreen gehaald (commit `b00066c`, "removed the calibrate button"). De code (`calibrate.ino`, commando `C48`) is wel blijven staan. De routine is dus niet afgemaakt, en we moeten hem goed testen voordat we erop bouwen.
