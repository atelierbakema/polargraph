Archief: complete git-backups
=============================

Elk `.bundle`-bestand is een volledige kopie van één git-repository van Sandy Noble
(github.com/euphy), opgehaald op 9 november 2026: alle commits, alle branches en alle tags.

| Bestand | Commits | Branches | Tags |
|---|---|---|---|
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

`external-links.txt` bevat afbeeldingen en links in de wiki die buiten GitHub
stonden (Flickr, polargraph.co.uk, YouTube) en dus niet in deze backups zitten.
