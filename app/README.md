# Polargraph Studio (werktitel)

De nieuwe app voor de Polargraph-tekenmachine. Zie [../docs/visie-en-planning.md](../docs/visie-en-planning.md) voor de visie en planning.

**Status:** versie 0.1 in aanbouw. De kern werkt en is getest; de webinterface komt hierna.

## Wat er al is

De **kern** (`src/core/`), los van elke interface, zodat de webapp, de commandoregel en later de nieuwe firmware dezelfde logica delen:

| Bestand | Wat |
|---|---|
| `machine.ts` | Meetkunde van de machine: koordlengtes, papierpositie, omrekenen naar motorstappen, controle van de opstelling |
| `svg.ts` | SVG inlezen: paden, lijnen, rechthoeken, cirkels, groepen, transformaties, viewBox en eenheden. Meldt tekst en afbeeldingen. |
| `plan.ts` | Tekening op het papier plaatsen (passend maken, schalen, draaien), afknippen op de papierrand, **slimme volgorde** (steeds de dichtstbijzijnde lijn, zo nodig omgedraaid), aansluitende lijnen samenvoegen, statistieken en tijdsinschatting |
| `export/legacy.ts` | Bestand voor de **huidige firmware** van de PolargraphSD (SD-kaart en USB), met "start vanaf linksboven" en een controle op alles waar de firmware over struikelt |
| `export/gcode.ts` | **G-code** voor de nieuwe firmware en andere plotters |

De oude controller tekende lijnen in de volgorde waarin ze in de SVG stonden (`PATH_SORT_NONE` in `controller/drawing.pde`). Lijnen die naast elkaar liggen werden daardoor vaak ver uit elkaar getekend. De nieuwe kern kiest steeds de dichtstbijzijnde volgende lijn en draait een lijn om als dat korter is. Dat scheelt verplaatsingen en geeft de pen minder kans om uit te drogen.

## Gebruiken (commandoregel)

Vereist Node.js 22.18 of nieuwer.

```bash
npm install
```

```bash
node src/cli.ts tekening.svg --breedte 1000 --hoogte 1500 --papier A3 --boven 250
```

Dit maakt een bestand voor de SD-kaart (bijv. `TEKENING.TXT`) en laat zien hoe je het tekent. Met `--formaat gcode` maak je G-code. Alle opties: `node src/cli.ts --help`.

## Testen

```bash
npm test
```

```bash
npm run typecheck
```

## Nog niet getest op de echte machine

Het SD-bestand volgt de regels uit de code van Sandy's firmware, maar is nog niet op de machine zelf geprobeerd. Eerste test: een eenvoudige rechthoek tekenen en nameten.
