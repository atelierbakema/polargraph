# Visie en planning: nieuwe Polargraph-app

**Status:** visie, ter bespreking met Mark
**Datum:** 20 november 2026
**Eigenaar:** Mark Bakema (Atelier Bakema). Uitgewerkt met Claude Code als architect.

## Waarom

De bestaande controller van Sandy Noble was een mooi startpunt en heeft jaren gewerkt. Maar voor een kunstenaar die gewoon zijn eigen tekeningen wil plotten is hij te ingewikkeld en te onbetrouwbaar:

- Je ziet niet wat tekenlijnen zijn en wat beweeglijnen (pen omhoog), en je kunt ze niet makkelijk aan- en uitzetten.
- Een tekening moet op een heel specifieke manier zijn opgezet, anders "snapt" de app hem niet.
- De volgorde (homen, USB, opslaan voor de SD-kaart, afspelen) is foutgevoelig. Doe je één stap verkeerd, dan werkt het gewoon niet.
- Zoomen en schuiven lopen vast of je raakt de weg kwijt.
- Foto's en rastereffecten werken in de praktijk niet.
- De app draait op Processing 2.2.1 uit 2014 en is op een moderne computer lastig te starten.

Zie [analyse-software.md](analyse-software.md) voor de technische oorzaken.

**Besluit:** we schrijven de app opnieuw, als **webapp**, en laten de oude controller los. Niet in één keer, maar stap voor stap, met elke maand een bruikbare verbetering.

## Visie

> Een Polargraph-app voor kunstenaars: je sleept je tekening erin, je ziet precies wat de machine gaat doen, en je krijgt een bestand voor de SD-kaart. De app is rustig en duidelijk, legt uit wat nodig is op het moment dat het nodig is, en werkt in de browser op atelierbakema.com.

### Uitgangspunten

1. **Vanuit de kunstenaar, niet vanuit de machine.** Taal en stappen sluiten aan bij hoe je tekent, niet bij hoe de motoren werken. Technische instellingen staan apart.
2. **Eerst je eigen vectortekeningen (SVG).** Dat is het hart. Foto's en rastereffecten komen later, als extra.
3. **De SD-kaart is de hoofdroute.** Zo tekent Mark meestal, en het werkt in elke browser zonder kabel. Tekenen via USB is een extra.
4. **Laat zien wat er gaat gebeuren.** Tekenlijnen en beweeglijnen in eigen kleuren, aan en uit te zetten, met een voorbeeldweergave en een tijdsinschatting.
5. **Fouten voorkomen in plaats van melden.** De app maakt alleen bestanden die de machine zeker begrijpt, en legt homen uit met een plaatje en een checklist.
6. **Stabiel en snel.** Grote SVG's blijven vloeiend, zoomen en schuiven werken zoals in een moderne teken- of kaartapp, en er is altijd een knop "passend maken".
7. **Werkt met de bestaande machine.** De app spreekt dezelfde commandotaal als de huidige Polarshield-firmware. Er hoeft niets aan de machine te veranderen om te beginnen.
8. **Alles blijft van jou.** Bestanden worden in de browser verwerkt en niet geüpload. Instellingen kun je downloaden en weer laden, zoals bij [Spokeit](https://spokeit.fr).
9. **Open source.** GPL-3.0, net als Sandy's code, met naamsvermelding.

## Hoe het werkt (gebruikersflow)

1. **Machine instellen (één keer).** Een korte begeleide stap: breedte tussen de motoren, papierformaat en -positie, en het home-punt. Dat sla je op als instellingenbestand. Oude `.properties`-bestanden van de oude app kun je importeren.
2. **Tekening laden.** Sleep een SVG erin. Je ziet je papier met je tekening, die je kunt verschuiven, schalen en draaien.
3. **Controleren.** Tekenlijnen in donker, beweeglijnen in een lichte kleur, allebei aan en uit te zetten. Een afspeelknop laat zien in welke volgorde de machine tekent. Je ziet een tijdsinschatting en waarschuwingen, bijvoorbeeld als iets buiten het papier valt.
4. **Naar de machine:**
   - **"Bewaar voor SD-kaart"**: je krijgt een bestand met een goede naam, plus een checklist: pen op het home-punt, motoren aan, bestand kiezen op het touchscreen.
   - **"Teken nu via USB"** (alleen in Chrome en Edge), met live voortgang en pauzeren.

## Wat we weten over de SD-kaart en homen

Uitgezocht in de firmware `firmware/polarshield/` (Arduino Mega + Polarshield). Nog te bevestigen op de echte machine.

**Bestandsformaat**

- Een SD-bestand bevat dezelfde commando's als de USB-verbinding, één per regel (of gescheiden door `;`). Elk commando eindigt op `,END`, bijvoorbeeld `C17,4120,3890,2,END`.
- De firmware leest het bestand regel voor regel en voert elke regel uit. Tussen de regels kijkt hij of het touchscreen is aangeraakt, zodat je kunt stoppen.
- Regels mogen maximaal 50 tekens lang zijn; langere regels worden afgekapt.
- Bestanden staan in de hoofdmap van de kaart. De firmware gebruikt korte bestandsnamen (8.3, zoals `VOGEL01.TXT`). Lange namen worden afgekort.

**Valkuilen die we in de app moeten afvangen**

- **Lege regels en regels zonder `,END` laten de firmware crashen** (bug F2 in de analyse). De app mag die dus nooit maken.
- **Een Mac zet verborgen bestanden op de SD-kaart** (`._naam.txt`, `.Trashes`, `.Spotlight-V100`). Het touchscreen toont die gewoon in de lijst. Kies je er per ongeluk één, dan probeert de machine onzin uit te voeren, met dezelfde crash als gevolg. De app moet dit uitleggen, en we kunnen in de firmware filteren op `.TXT`.
- **`AUTORUN.TXT` start automatisch**, 4 seconden na het aanzetten van de machine. Handig, maar verrassend als je het niet weet. De app gebruikt die naam nooit per ongeluk.

**Homen: waarom het "niet blijft hangen"**

- De machine heeft geen sensoren en weet niet waar de pen hangt. Je moet het hem vertellen.
- Op de Polarshield gebeurt dat met de knop **MOTORS ON**: die zet de motoren aan **en gaat ervan uit dat de pen op dat moment op het home-punt hangt**. Hangt de pen ergens anders, dan klopt de hele tekening niet. Er is wel een knop "SET HOME" gedefinieerd, maar die wordt in de code nergens afgehandeld.
- **Na 10 minuten zonder activiteit schakelt de machine de motoren automatisch uit** en vergeet hij de positie. De gondel kan dan zakken. Wacht je na het homen te lang met starten, dan klopt home niet meer.
- De nieuwe app legt dit uit met een plaatje, en de checklist zet de stappen in de goede volgorde: pen naar home, MOTORS ON, binnen 10 minuten bestand starten. Later kunnen we in de firmware de automatische uitschakeling instelbaar maken en duidelijk op het scherm laten zien of de machine "gehomed" is.

## Automatisch homen met eindschakelaars

Mark's idee: een schakelaar links bij motor A en een rechts bij motor B, waar de gondel tegenaan komt. De machine kan zijn positie dan zelf vinden, zonder handmatig homen.

**Doel: homen zoals een 3D-printer.** Je zet de machine aan of start een tekening, de machine homet zichzelf, en begint dan te tekenen. Geen handmatige stappen, geen volgorde om te onthouden.

**Sandy had dit al half gebouwd.** In alle drie de firmwares zit een experimentele kalibratie, commando `C48` (`calibrate_doCalibration` in `firmware/polarshield/calibrate.ino`):

1. Pen omhoog, alle motoren uit.
2. Motor A trekt de gondel langzaam naar zich toe tot de schakelaar links klikt. Op dat moment is de lengte van koord A precies bekend: de schakelaar zit op een vaste afstand van het tandwiel (standaard 130 mm, `ENDSTOP_X_MIN_POSITION`).
3. Motor A laat weer koord vieren, en motor B doet hetzelfde aan de rechterkant.
4. Beide koordlengtes zijn nu bekend, dus de machine weet precies waar de gondel hangt. Hij keert terug naar de plek waar hij begon en meldt zich als "gekalibreerd".

De schakelaars komen op de aansluitingen voor eindschakelaars: pin 16 voor links (motor A) en pin 14 voor rechts (motor B). Dit is in alle drie de firmwares al zo gedefinieerd.

**Twee schakelaars zijn genoeg.** Uit de afstand tussen de motoren en de twee koordlengtes volgt de positie van de gondel met een driehoek. Je hoeft daarvoor niet elke keer handmatig een middenpunt of de vloer aan te wijzen. Wat je wél één keer moet vastleggen:

- de afstand tussen de twee motoren (nauwkeurig gemeten);
- waar het papier hangt ten opzichte van de motoren (bovenrand en linkerrand). Dat is een instelling in de app, die je alleen opnieuw doet als je het papier verplaatst.

**Hoe het homen moet gaan (uitwerking met Mark):**

1. **Instellingen die je opgeeft** (in de app, opgeslagen in je machine-instellingen):
   - **Breedte tussen de motoren.** Die verschilt per opstelling: met hetzelfde touw kan de machine 2 meter of 5 meter breed zijn. Dit is de belangrijkste instelling en moet nauwkeurig gemeten worden.
   - **Waar het papier hangt:** afstand van de motoren tot de bovenrand van het papier, en de horizontale positie (standaard gecentreerd).
   - **Hoogte van de motoren tot de vloer**, als veiligheidsgrens: zo ver mag de gondel nooit zakken. Voor het bepalen van de positie is deze waarde niet nodig.
2. **Je hoeft de gondel nergens neer te zetten.** Vanuit elke positie:
   - Links aantrekken tot de schakelaar klikt, terwijl rechts koord viert.
   - Dan links koord vieren en rechts aantrekken tot die schakelaar klikt.
3. **Zekerheid door herhalen, zoals bij een 3D-printer.** Elke schakelaar wordt twee keer benaderd: eerst snel tot hij klikt, dan een klein stukje terug (bijv. 10 mm), en dan langzaam opnieuw. De tweede, langzame meting is de echte. Daarna gaat de machine nog één keer links-rechts heen en weer en vergelijkt de getelde stappen met de eerste ronde. Wijken ze meer af dan een kleine marge, dan is er iets mis (koord geslipt, gondel klem), en meldt de machine dat in plaats van te gaan tekenen.
4. **Klaar:** de machine weet waar hij hangt, rijdt naar het startpunt van de tekening en begint.

Dit is een verbetering ten opzichte van Sandy's routine, die elke schakelaar één keer benadert zonder controle.

**Hardware:** de schakelaars worden op het bord aangesloten op de ingangen die de firmware als pin 16 (links) en pin 14 (rechts) gebruikt. Op welke aansluitingen of soldeerpunten dat op jouw bord zit, bepalen we met een foto van het bord.

**Om te onderzoeken:** als de schakelaar de gondel op een vast punt naast de motor vasthoudt (niet alleen op een vaste koordlengte), kan de machine in principe ook de breedte tussen de motoren zelf meten: het aantal stappen dat koord B inloopt van de linker- naar de rechterschakelaar volgt rechtstreeks uit die breedte. Dan zou je de breedte niet eens meer hoeven op te geven. Dit is een mooie latere verbetering, maar voor de eerste versie geven we de breedte gewoon op.

**Wat dit oplevert:**

- Geen "home blijft niet hangen" meer: na het aanzetten of na de auto-uitschakeling laat je de machine zichzelf opnieuw kalibreren.
- Een SD-bestand kan zelf beginnen met kalibreren (`C48` als eerste regel). Dan hoef je alleen het bestand te starten. Nog te testen of dit vanuit een bestand goed werkt.
- De app kan het als vaste stap aanbieden: "Kalibreer machine".

**Nog uit te zoeken:**

- Welke schakelaars en hoe te monteren (een klein 3D-geprint houdertje bij elk tandwiel).
- Of de routine betrouwbaar is. Sandy noemt hem "experimental", en het touchscreen heeft er nog geen knop voor.
- Dit kan een eigen stap in de planning worden, na versie 0.4.

## Planning

Elke versie werkt op zichzelf. Richttempo: ongeveer één versie per maand.

| Versie | Doel | Wat je kunt |
|---|---|---|
| **0.1** | Jouw belangrijkste werkwijze vervangen | SVG laden, op het papier plaatsen en schalen, tekenlijnen en beweeglijnen zien en aan/uit zetten, SD-bestand maken met checklist. Machinematen handmatig invullen. |
| **0.2** | Comfort | Instellingen opslaan en laden (inclusief import uit de oude app), tijdsinschatting, slimmere lijnvolgorde (minder beweeglijnen), voorbeeldweergave afspelen. |
| **0.3** | Tekenen via USB | Verbinden in Chrome/Edge, pen handmatig bewegen, live tekenen met voortgang, pauze en stop. |
| **0.4** | Machine betrouwbaarder | Firmware-reparaties: communicatie, touchscreen, crash bij lege regels, alleen `.TXT`-bestanden tonen, home-status op het scherm, instelbare auto-uitschakeling. |
| **0.5** | Automatisch homen | Eindschakelaars monteren, kalibratie (`C48`) testen en verbeteren, knop "Kalibreer machine" in de app en op het touchscreen. |
| **0.6+** | Meer creatieve mogelijkheden | Penbreedte en vulpatronen, meerdere kleuren of lagen (pen wisselen), tekst, foto's en rastereffecten. |
| **1.0** | Openbaar | Stabiel en gedocumenteerd, gepubliceerd op atelierbakema.com voor iedereen met een Polargraph. |

## Techniek (eerste keuze, ter bespreking)

- **Webapp** in TypeScript, die volledig in de browser draait. Er is geen server nodig, dus hij kan als statische site op atelierbakema.com.
- **SVG-verwerking** in de browser. Paden worden één keer omgezet naar lijnsegmenten en bewaard.
- **Tekenvlak** met canvas/WebGL voor vloeiend zoomen en schuiven, ook bij grote tekeningen.
- **Kern los van de interface.** De wiskunde van de polargraph (lengtes van de koorden, stappen), het commandoformaat en het SD-bestand komen in een losse, goed geteste module. Zo kunnen we later ook een andere interface of een nieuwe firmware aansluiten.
- **Web Serial** voor USB (Chrome/Edge). Andere browsers krijgen een nette melding en gebruiken de SD-route.
- **Nagebootste machine** voor tests: een simulator die de firmware-commando's begrijpt, zodat de app getest kan worden zonder de echte machine.
- **Mapstructuur:** de nieuwe app komt in `app/` in deze repo. De oude controller blijft in `controller/` ter referentie.

## Open vragen

1. **Welke machine/firmware heb je precies?** Een foto van het bord, of de tekst op het touchscreen bij het opstarten.
2. **Kun je één SD-bestand delen** dat met de oude app is gemaakt en goed werkte? Dan weten we zeker welk formaat de machine verwacht.
3. **Machinematen:** afstand tussen de motoren, papierformaat dat je meestal gebruikt, en waar het home-punt zit.
4. **Welke functies uit de oude app gebruik je echt?** Bijvoorbeeld bepaalde vulstijlen.
5. **Hosting:** hoe wordt atelierbakema.com nu gehost? Dat bepaalt hoe we de app publiceren.
