Polargraph — archief en documentatie
====================================

Deze repo is het centrale archief van de Polargraph-software en -documentatie
van Sandy Noble (GitHub: `euphy`, website polargraph.co.uk — inmiddels offline).
Doel: alles op één plek bewaren, zodat er niets verloren gaat, en de software
hier verder onderhouden en verbeteren.

## Wat staat waar

| Map | Inhoud |
|---|---|
| [`app/`](app/) | **De nieuwe app** (in aanbouw): SVG naar tekenbestand, met slimme lijnvolgorde |
| [`controller/`](controller/) | De oude desktop-app van Sandy (Processing) waarmee je tekeningen maakt en naar de machine stuurt |
| [`firmware/polarshield-ab/`](firmware/polarshield-ab/) | **Aangepaste firmware** voor de PolargraphSD (1.4.3-ab2): bugfixes, wachtcommando, nieuw touchscreen in Nederlands en Engels. Zie `WIJZIGINGEN.md` en `INSTALLEREN.md` |
| [`firmware/emulator/`](firmware/emulator/) | **Emulator:** de echte firmware met touchscreen in de browser |
| [`firmware/polarshield/`](firmware/polarshield/) | Firmware voor Arduino Mega + Polarshield met touchscreen (Polargraph SD) |
| [`firmware/polarshield-esp32/`](firmware/polarshield-esp32/) | Firmware voor de ESP32-versie van de Polarshield (PlatformIO) |
| [`firmware/a1-uno/`](firmware/a1-uno/) | Firmware voor Arduino Uno + Adafruit Motorshield (de eerste machines) |
| [`docs/visie-en-planning.md`](docs/visie-en-planning.md) | **Visie en planning** voor de nieuwe webapp |
| [`docs/testplan-atelier.md`](docs/testplan-atelier.md) | **Testplan** voor de eerste test op de echte machine |
| [`docs/hardware.md`](docs/hardware.md) | De hardware van Mark's machine (PolargraphSD, Polarshield v2.0d) |
| [`docs/analyse-software.md`](docs/analyse-software.md) | **Analyse van de software:** gevonden bugs en verbetervoorstellen |
| [`wikis/polargraph/`](wikis/polargraph/Home.md) | **De handleiding.** Volledige wiki van Sandy (28 pagina's), inclusief geschiedenis. Begin bij [Home.md](wikis/polargraph/Home.md). |
| [`wikis/polargraphcontroller/`](wikis/polargraphcontroller/) | Wiki van de controller-app |
| [`wikis/polargraph_server_polarshield/`](wikis/polargraph_server_polarshield/) | Wiki van de Polarshield-firmware (Arduino Mega) |
| [`wikis/polargraph_server_polarshield_esp32/`](wikis/polargraph_server_polarshield_esp32/) | Wiki van de ESP32-firmware (o.a. *How to build the firmware*) |
| [`wikis/polargraph_server_a1/`](wikis/polargraph_server_a1/) | Wiki van de Arduino Uno-firmware |
| [`docs/images/`](docs/images/) | Afbeeldingen die de wiki gebruikt |
| [`archive/`](archive/) | **Complete backups** van al Sandy's repo's: alle code, alle branches, alle versies (tags) en alle wiki-geschiedenis. Zie [archive/README.md](archive/README.md). |

## Over de code

De mappen `controller/` en `firmware/` bevatten de laatste versie van Sandy's
code (de `master`-branch van elke repo). Elke map heeft een `HERKOMST.md` met de
exacte bron-commit. De volledige geschiedenis, alle oude versies en branches
staan in [`archive/`](archive/).

De losse forks in dit account (`polargraphcontroller`, `polargraph_server_polarshield_esp32`,
`polargraph_server_a1`) zijn niet meer nodig om mee te werken: deze repo is de werkplek.

## Wat (nog) niet automatisch bewaard kon worden

- **Release-downloads** (kant-en-klare zip's van de controller-app en
  firmware-bestanden). Die horen niet bij git en moeten met de hand worden
  gedownload van:
  - https://github.com/euphy/polargraphcontroller/releases (nieuwste: v2.6.0)
  - https://github.com/euphy/polargraph_server_polarshield_esp32/releases
  - https://github.com/euphy/polargraph_server_polarshield/releases

  Zet ze daarna bij een release in je eigen repo, of in `archive/releases/`.
- **Foto's op Flickr.** Een deel van de wiki toont foto's die op Flickr staan
  (22 stuks) en op polargraph.co.uk (die is al weg). Zie
  [archive/external-links.txt](archive/external-links.txt) voor de lijst.

Oorspronkelijke bron: https://github.com/euphy — alle eer voor deze software
gaat naar Sandy Noble.
