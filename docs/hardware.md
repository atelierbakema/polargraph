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

**Bevestigd** uit Sandy's originele printontwerp van precies dit bord (`Polarshield v2.0d.sch` in `archive/polarshield_hardware.bundle`, bestand `Polarshield_2.0d-SandyNoble_2014-07-30.zip`). Het blokje heet daar `JP15`:

| Pin JP15 | Label op het bord | Signaal | Arduino-pin | Gebruik in de firmware |
|---|---|---|---|---|
| 1 | `X−` | X-MIN | D16 | Schakelaar bij **motor A** (links), `ENDSTOP_X_MIN` |
| 2 | `Y−` | Y-MIN | D14 | Schakelaar bij **motor B** (rechts), `ENDSTOP_Y_MIN` |
| 3 | `X+` | X-MAX | D17 | `ENDSTOP_X_MAX`, niet gebruikt in de kalibratie |
| 4 | `Y+` | Y-MAX | D15 | `ENDSTOP_Y_MAX`, niet gebruikt in de kalibratie |
| 5 | `+U` | VCC (5 V) | – | Voeding voor optische of elektronische sensoren |
| 6 | `GND` | GND | – | Massa |

- De firmware zet deze pinnen op `INPUT_PULLUP` (`configuration.ino:111–114`). Een gewone microschakelaar (normaal open) komt tussen `X−` en `GND` (links) en tussen `Y−` en `GND` (rechts). Ingedrukt betekent dat de firmware `0` leest, en zo verwacht de kalibratiecode het ook.
- Er hoeft niets gesoldeerd te worden: de header zit er al op. Een stekkertje met twee schakelaars is genoeg.

De servo-aansluitingen in hetzelfde schema: `SER1`/`SER2`, met pin 1 GND, pin 2 VCC en pin 3 het signaal (`SERV1`/`SERV2`).

## Historie

Sandy heeft de kalibratieknop in versie 1.2 van de firmware weer van het touchscreen gehaald (commit `b00066c`, "removed the calibrate button"). De code (`calibrate.ino`, commando `C48`) is wel blijven staan. De routine is dus niet afgemaakt, en we moeten hem goed testen voordat we erop bouwen.
