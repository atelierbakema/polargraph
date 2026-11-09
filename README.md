Polargraph — archief en documentatie
====================================

Deze repo is het centrale archief van de Polargraph-software en -documentatie
van Sandy Noble (GitHub: `euphy`, website polargraph.co.uk — inmiddels offline).
Doel: alles op één plek bewaren, zodat er niets verloren gaat.

## Wat staat waar

| Map | Inhoud |
|---|---|
| [`wikis/polargraph/`](wikis/polargraph/Home.md) | **De handleiding.** Volledige wiki van Sandy (28 pagina's), inclusief geschiedenis. Begin bij [Home.md](wikis/polargraph/Home.md). |
| [`wikis/polargraphcontroller/`](wikis/polargraphcontroller/) | Wiki van de controller-app |
| [`wikis/polargraph_server_polarshield/`](wikis/polargraph_server_polarshield/) | Wiki van de Polarshield-firmware (Arduino Mega) |
| [`wikis/polargraph_server_polarshield_esp32/`](wikis/polargraph_server_polarshield_esp32/) | Wiki van de ESP32-firmware (o.a. *How to build the firmware*) |
| [`wikis/polargraph_server_a1/`](wikis/polargraph_server_a1/) | Wiki van de Arduino Uno-firmware |
| [`docs/images/`](docs/images/) | Afbeeldingen die de wiki gebruikt |
| [`archive/`](archive/) | **Complete backups** van al Sandy's repo's: alle code, alle branches, alle versies (tags) en alle wiki-geschiedenis. Zie [archive/README.md](archive/README.md). |

## De code zelf

Om mee te werken (bekijken, aanpassen, bouwen) staan de repo's ook los in dit account:

| Repo | Wat |
|---|---|
| [polargraphcontroller](https://github.com/atelierbakema/polargraphcontroller) | De desktop-app (Processing) waarmee je tekeningen maakt en naar de machine stuurt |
| [polargraph_server_polarshield_esp32](https://github.com/atelierbakema/polargraph_server_polarshield_esp32) | Firmware voor Polarshield met ESP32 (PlatformIO) |
| [polargraph_server_a1](https://github.com/atelierbakema/polargraph_server_a1) | Firmware voor Arduino Uno + Adafruit Motorshield |

Let op: in die losse repo's staat alleen de hoofdbranch. De oude versies, de
overige branches én de oorspronkelijke Mega-firmware (`polargraph_server_polarshield`,
die niet als losse repo in dit account staat) zitten wél in [`archive/`](archive/).

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
