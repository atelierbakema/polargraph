# Testplan: de PolargraphSD in het atelier

Doel: de nieuwe firmware (1.4.3-ab2) en de nieuwe app op de echte machine testen, met metingen
die we daarna kunnen vergelijken. Reken op een halve dag.

## Meenemen

- [ ] Laptop (Mac of Windows) met internet; of test thuis aan de Windows-pc
- [ ] De USB-kabel van de machine
- [ ] **SD-kaartlezer** voor de laptop, en het SD-kaartje van de machine
- [ ] Rolmaat (voor de kalibratie) en een stalen liniaal of schuifmaat (voor het nameten)
- [ ] Papier A3 (een paar vellen) en tape
- [ ] De pennen die je normaal gebruikt, liefst ook één fijne en één dikke
- [ ] Telefoon voor foto's van de tekeningen en het scherm

## Vooraf thuis (10 minuten)

1. Installeer **avrdude**: op een Mac in Terminal `brew install avrdude`; op Windows via de Arduino IDE of het zipbestand van github.com/avrdudes/avrdude (zie `INSTALLEREN.md`).
   (Nog geen Homebrew? Zie https://brew.sh.)
2. Download de repo als zip van GitHub, of zorg dat je hem kunt openen.
   Je hebt nodig: `firmware/polarshield-ab/polarshield-ab-1.4.3-ab2.hex` en
   `firmware/polarshield-ab/INSTALLEREN.md`.

## In het atelier

### 1. Nulmeting met de oude firmware

1. Zet de machine aan. **Maak een foto van het opstartscherm**: welke versie staat er?
2. Meet met de rolmaat de **afstand tussen de twee tandwielen** (hart op hart) en de
   **hoogte van de tandwielen tot de vloer**. Schrijf ze op.
3. Hang een vel A3 op. Meet hoe ver de bovenrand onder de tandwielen hangt, en of het
   in het midden hangt.
4. Open de app. Vul bij **Machine** de breedte en hoogte in, en kies bij "Firmware op de
   machine" **Origineel**. Vul bij **Papier** het formaat en de positie in.
5. Kies bij **Testtekening** het **Bakema-bootje**, en klik **Bewaar voor SD-kaart**.
6. Zet het bestand op de SD-kaart, en werp de kaart netjes uit (rechtermuisknop → Verwijder).
7. Teken het bootje volgens de checklist (pen met de hand op linksboven, motoren uit, starten).
8. Meet na en vul de tabel hieronder in (kolom "oud").

### 2. Reservekopie en nieuwe firmware installeren

Volg `firmware/polarshield-ab/INSTALLEREN.md`:

1. **Eerst de reservekopie** van de huidige firmware maken (stap 3 daar). Bewaar het bestand goed.
2. Dan de nieuwe firmware installeren (stap 4).
3. Controleer:
   - [ ] Het opstartscherm speelt de animatie (blaadje, logo, glans)
   - [ ] De knoppen reageren op één tik, en niet dubbel
   - [ ] Taal wisselen werkt (Instellingen → Meer instellingen → Taal)
   - [ ] Kleuren wisselen werkt (Instellingen → Meer instellingen → Kleuren)
   - [ ] Pen omhoog/omlaag werkt, en de penlift staat nog goed afgesteld

### 3. Kalibratie

1. Druk op **Kalibratie** en vul de gemeten breedte en hoogte in. Opslaan.
2. Zet in de app bij "Firmware op de machine" **Atelier Bakema** (dan werkt ook de inktdroogtijd).

### 4. Testtekeningen

Maak ze in de app (Testtekening → kies → Bewaar voor SD-kaart) en teken ze in deze volgorde.
Gebruik telkens een vers vel of een leeg stuk papier.

| # | Tekening | Wat je controleert |
|---|---|---|
| 1 | Penlifttest | Alle streepjes compleet, geen sleepsporen |
| 2 | Maatvierkant 100 mm | Zijden 100 mm, diagonalen 141,4 mm |
| 3 | Bakema-bootje | Zie de tabel hieronder |
| 4 | Herhaaltest | Liggen de 5 vierkanten precies op elkaar? |
| 5 | Raster | Lijnen recht en evenwijdig, vakjes vierkant (50 mm) |
| 6 | Inktdroogtest | Teken hem twee keer: droogtijd 0 en droogtijd 20 s. Smeert het bij de kruisingen? |

### 5. Metingen

| Meting | Hoort | Oud | Nieuw |
|---|---|---|---|
| Liniaal bootje | 100 mm | | |
| Kajuit breedte × hoogte | 50 × 30 mm | | |
| Grote patrijspoort (beide richtingen) | 20 × 20 mm | | |
| Kleine patrijspoort | 10 × 10 mm | | |
| Mast loodrecht op dek? | ja | | |
| Arcering zeil: gelijke afstanden, geen sleepsporen? | ja | | |
| Maatvierkant zijden | 100 mm | | |
| Maatvierkant diagonalen | 141,4 mm | | |
| Herhaaltest: grootste verschuiving | 0 mm | | |
| Raster: vakje links en rechts | 50 × 50 mm | | |
| Tekentijd bootje | | | |

### 6. Terugsturen

Stuur me:
- foto's van de tekeningen (liefst met de liniaal ernaast) en van het scherm;
- de ingevulde tabel;
- alles wat raar ging of opviel, ook kleine dingen.

Met de metingen kunnen we de machine verder afstellen. Zijn de maten bijvoorbeeld een paar
procent te groot of te klein, dan klopt de "mm per omwenteling" niet helemaal.

## Als er iets misgaat

- **Scherm blijft wit of rommelig na het installeren:** zet de reservekopie terug
  (`INSTALLEREN.md`, "Terug naar de vorige versie").
- **De machine tekent scheef of op de verkeerde plek:** controleer of de machinebreedte in de app
  en in de machine (Kalibratie) hetzelfde is, en of de pen precies op linksboven stond.
- **Een bestand verschijnt niet op het touchscreen:** de naam moet eindigen op `.TXT` en het
  bestand moet in de hoofdmap van de kaart staan.
