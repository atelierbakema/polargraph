Archief: complete git-backups
=============================

Elk `.bundle`-bestand is een volledige kopie van één git-repository van Sandy Noble
(github.com/euphy), opgehaald op 9 november 2026 (hardware-repo's en oudere firmware op 20 november 2026): alle commits, alle branches en alle tags.

| Bestand | Commits | Branches | Tags | Inhoud |
|---|---|---|---|---|
| `polargraph.bundle` | 15 | 1 | 0 |
| `polargraph.wiki.bundle` | 256 | 1 | 0 |
| `polargraphcontroller.bundle` | 133 | 5 (master, dev, eisf, processing_v2, webcam) | 28 |
| `polargraphcontroller.wiki.bundle` | 3 | 1 | 0 |
| `polargraph_server_polarshield.bundle` | 115 | 4 (master, esp32, polarshield-unified-spi, unified-spi-tft) | 14 |
| `polargraph_server_polarshield.wiki.bundle` | 4 | 1 | 0 |
| `polargraph_server_polarshield_esp32.bundle` | 195 | 2 (master, foreground-motors) | 9 |
| `polargraph_server_polarshield_esp32.wiki.bundle` | 4 | 1 | 0 |
| `polargraph_server_a1.bundle` | 63 | 1 | 1 |
| `polargraph_server_a1.wiki.bundle` | 1 | 1 | 0 |
| `polarshield_hardware.bundle` | 34 | 1 | 4 | Printontwerpen (Eagle-schema's, gerbers) van de Polarshield v2.0d t/m v2.6 |
| `polarshieldv3_hardware.bundle` | 20 | 1 | 0 | Printontwerp Polarshield v3 (ESP32) |
| `polarweb.bundle` | 119 | 1 | 1 | Sandy's eerdere experiment met een web-controller (2015) |
| `polargraph_server_mega.bundle` | 21 | 1 | 0 | Oudere Mega-firmware (tot 2014) |
| `polargraph_server_esf.bundle` | 32 | 1 | 0 | Firmware voor de "ESF edition" |
| `AccelStepperEncoder.bundle` | 11 | 1 | 0 | Sandy's uitbreiding van de AccelStepper-bibliotheek met encoders |

## Terugzetten

Een bundle gedraagt zich als een gewone repository:

```bash
git clone polargraphcontroller.bundle polargraphcontroller
```

Alle branches en tags in één keer naar een (lege) GitHub-repo zetten:

```bash
git clone --mirror polargraphcontroller.bundle polargraphcontroller.git
cd polargraphcontroller.git
git push --mirror https://github.com/atelierbakema/<nieuwe-repo>.git
```

**Nog niet in dit archief:** `euphy/polargraph_models` (behuizing, tandwielen en andere 3D- en lasersnijbestanden, ±95 MB). Die is te groot om als één bestand in git te zetten, en wordt veiliggesteld door hem op GitHub te forken naar `atelierbakema`.

`external-links.txt` bevat afbeeldingen en links in de wiki die buiten GitHub
stonden (Flickr, polargraph.co.uk, YouTube) en dus niet in deze backups zitten.
