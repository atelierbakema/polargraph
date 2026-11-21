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

## Homen zonder schakelaars: "start vanaf linksboven"

De machine heeft nu nog geen schakelaars. Toch moet homen snel en betrouwbaar zijn, want daar ging het altijd mis: zet je de motoren uit (of gaan ze na 10 minuten vanzelf uit), dan vergeet de machine waar hij is. Je kunt de gondel dan met de hand verplaatsen, en daarna tekent hij verder vanaf de verkeerde plek.

**Idee:** je zet de pen met de hand op een vast, zichtbaar punt (de linkerbovenhoek van het papier) en het tekenbestand vertelt de machine zelf dat hij daar staat. Er is dan geen apart home-punt meer en geen volgorde om te onthouden.

### Stap 1: werkt met de huidige firmware (versie 0.1)

Uitgezocht in `firmware/polarshield/exec.ino`: de firmware heeft een commando `C09` dat zegt "de pen staat nu hier" (beide koordlengtes) en daarbij meteen de motoren aanzet. Er zijn ook commando's om de machinematen vast te leggen (`C24` breedte/hoogte, `C29` mm per omwenteling, `C30` stappen per omwenteling). Die schrijven alleen naar het geheugen van de machine als de waarde echt verandert, dus ze kunnen veilig in elk bestand staan.

De app zet daarom **bovenaan elk SD-bestand**:

1. de machinematen (breedte tussen de motoren, hoogte, motorinstellingen);
2. `C09` met de koordlengtes voor de linkerbovenhoek van het papier. Die rekent de app uit uit de breedte en de papierpositie;
3. pen omhoog.

Daarna volgt de tekening, en aan het eind pen omhoog en terug naar de linkerbovenhoek.

**Zo gebruik je het:**

1. Zet een klein kruisje op de linkerbovenhoek van je papier (of gebruik de hoek zelf).
2. Motoren uit, en trek de gondel met de hand zodat de pen precies op die hoek staat.
3. Kies het bestand op het touchscreen en start. De machine weet nu waar hij is, zet de motoren vast en begint.

Na de tekening staat de pen weer op linksboven, dus de volgende tekening kan meteen.

De app laat dit zien met een plaatje en een korte checklist bij "Bewaar voor SD-kaart". Via de computer (USB) werkt het precies hetzelfde: de app stuurt dezelfde startregels.

**Instellingen die de app hiervoor nodig heeft** (eenmalig, opgeslagen in je machine-instellingen):

- breedte tussen de motoren;
- hoogte van de motoren tot de vloer (veiligheidsgrens);
- positie van het papier: afstand van de motoren tot de bovenrand, en de linkerrand (standaard gecentreerd);
- papierformaat (breedte × hoogte), zodat de app ook rechtsboven, linksonder en rechtsonder kent en kan waarschuwen als een tekening buiten het papier valt.

Nog te testen op de echte machine: of `C09` vanuit een SD-bestand precies zo werkt als via USB, en hoe nauwkeurig je de pen met de hand op de hoek krijgt.

### Stap 2: home-wizard op het touchscreen (versie 0.4, firmware)

Met een kleine aanpassing van de firmware wordt het nog prettiger:

- **Begeleid homen op het touchscreen.** Bij het starten van een bestand vraagt het scherm: "Zet de pen op linksboven". Met pijltjesknoppen beweeg je de pen nauwkeurig naar de hoek, zonder met je hand aan de gondel te trekken, en bevestig je met "Hier".
- **"Niet gehomed" duidelijk tonen.** Gaan de motoren uit, dan toont het scherm dat de positie onbekend is, en moet je opnieuw homen voordat er getekend wordt. Zo kan het niet meer stilletjes misgaan.
- **Automatisch uitschakelen instelbaar.** Nu gaan de motoren na 10 minuten altijd uit, en dat is niet aan te passen. Dat wordt een instelling, inclusief "nooit".
- **De knop MOTORS ON** gaat niet meer stilletjes uit van een home-positie. Die aanname is nu de bron van veel verwarring.

#### Kalibratiewizard op de machine

Mark's idee: een **kalibratiewizard** (calibration wizard) op het touchscreen, zoals bij een 3D-printer of een nieuwe telefoon. Je doorloopt hem alleen als je de machine opnieuw opstelt ("ik heb mijn machine veranderd"):

1. "Hoe breed is je machine?" Meet de afstand tussen de motoren en vul die in met +/− knoppen.
2. "Hoe hoog hangen de motoren boven de vloer?" Meet en vul in.
3. Eventueel: motortype en tandwiel. Standaard staan die al goed.
4. Opslaan in het geheugen van de machine. De firmware heeft daar al plekken voor (breedte en hoogte via `C24`).

De **machine kent dan zijn eigen maten**, en een tekenbestand hoeft alleen nog te weten:

- het papier: breedte, hoogte, en waar het hangt (afstand onder de motoren, links of gecentreerd);
- de tekening zelf.

Bij elke tekening hoef je dan alleen de pen op linksboven van het papier te zetten (met de pijltjes) en op start te drukken.

**Belangrijke ontwerpkeuze die hieruit volgt:** in de huidige opzet rekent de computer alles om naar koordlengtes van de motoren, en die staan zo in het SD-bestand. Zo'n bestand werkt dus alleen bij precies die machinebreedte: verander je de breedte, dan kloppen al je oude bestanden niet meer. In de nieuwe opzet schrijft de app de tekening in **millimeters op het papier**, en rekent de **machine** zelf om naar koordlengtes met zijn eigen maten. Dan:

- werkt hetzelfde bestand op elke machinebreedte, ook bij iemand anders met een Polargraph;
- hoeft de machinebreedte maar op één plek te kloppen: in de machine.

Dit vraagt een uitbreiding van de firmware (een commando voor "beweeg naar x,y in mm op het papier"). Tot die tijd (versies 0.1 t/m 0.3) vraagt de app de machinematen zelf ook, en maakt hij bestanden in koordlengtes die bij de huidige firmware passen.

### Stap 3: automatisch homen met schakelaars (versie 0.5, hardware)

Zie hieronder. Daarmee verdwijnt het handmatige deel helemaal.

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
| **0.1** | Jouw belangrijkste werkwijze vervangen | SVG laden, op het papier plaatsen en schalen, tekenlijnen en beweeglijnen zien en aan/uit zetten, SD-bestand maken met checklist. Machinematen en papierpositie invullen. Homen via "start vanaf linksboven" (werkt met de huidige firmware). |
| **0.2** | Comfort | Instellingen opslaan en laden (inclusief import uit de oude app), tijdsinschatting, slimmere lijnvolgorde (minder beweeglijnen), voorbeeldweergave afspelen. |
| **0.3** | Tekenen via USB | Verbinden in Chrome/Edge, pen handmatig bewegen, live tekenen met voortgang, pauze en stop. |
| **0.4** | Machine betrouwbaarder | Firmware-reparaties: communicatie, touchscreen, crash bij lege regels, alleen `.TXT`-bestanden tonen. Kalibratiewizard en home-wizard op het touchscreen, "niet gehomed"-status, instelbare auto-uitschakeling, tekenbestanden in millimeters op het papier. |
| **0.5** | Automatisch homen | Eindschakelaars monteren, kalibratie (`C48`) testen en verbeteren, knop "Kalibreer machine" in de app en op het touchscreen. |
| **0.6+** | Meer creatieve mogelijkheden | Penbreedte en vulpatronen, meerdere kleuren of lagen (pen wisselen), tekst, foto's en rastereffecten. |
| **1.0** | Openbaar | Stabiel en gedocumenteerd, gepubliceerd op atelierbakema.com voor iedereen met een Polargraph. |

## Richting (besloten op 20 november 2026)

| Onderdeel | Besluit |
|---|---|
| **App** | Nieuwe webapp, op termijn op atelierbakema.com. Maakt G-code, en zolang nodig ook bestanden voor Sandy's firmware. Map `app/`. |
| **Firmware** | Nieuwe firmware voor de Arduino Mega + Polarshield (iedereen met een PolargraphSD heeft dit bord). G-code in millimeters op het papier, homen, kalibratiewizard en eindschakelaars vanaf het begin. Te installeren via de browser. Sandy's originele firmware blijft in de repo als terugvaloptie. Eerst onderzoeken of een bestaande open-source polargraph-firmware (bijv. die van Makelangelo) een goede basis is. |
| **Hardware** | Open ontwerpen (STL, DXF en bronbestanden) voor houders van eindschakelaars, tandwielen, gondel en behuizing. |
| **Licenties** | Sandy's software is GPL-3.0 en mag dus worden aangepast en verspreid, met naamsvermelding. In zijn hardware-repo's staat geen licentie: die ontwerpen bewaren en zelf gebruiken mag, verspreiden of verkopen niet zonder zijn toestemming. Mark overweegt Sandy te mailen. Anders maken we eigen ontwerpen. |
| **Naam** | Het project krijgt een eigen naam, met naamsvermelding van Sandy Noble. "Polargraph" is zijn merk. Werktitel van de app: Polargraph Studio. |

### Stand van zaken

- **20 november 2026:** de kern van de app is gebouwd en getest (`app/src/core/`, 32 tests). Het gaat om de meetkunde van de machine, SVG inlezen, plaatsen op het papier, slimme lijnvolgorde, en export naar Sandy's SD-formaat en naar G-code. Er is ook een commandoregelprogramma (`app/src/cli.ts`). Nog niet getest op de echte machine. 
- **20 november 2026 (later):** eerste versie van de webinterface (`app/index.html`, `app/src/ui/`). SVG laden of slepen, op het papier plaatsen (passend, schaal, draaien, positie), voorbeeld met tekenlijnen, beweeglijnen en koorden die je aan en uit zet, afspelen, rustig zoomen en schuiven met knoppen "Alles in beeld" en "Papier", instellingen bewaren in de browser en als bestand, en exporteren naar SD-bestand (met checklist) of G-code. Starten met `npm run dev` in `app/`.

- **20 november 2026 (avond):** aangepaste firmware **1.4.3-ab1** (later -ab2 met nieuw touchscreen) voor de PolargraphSD (`firmware/polarshield-ab/`), met bugfixes F1 t/m F4, een bestandenlijst zonder verborgen Mac-bestanden en een wachtcommando (`C51`) voor de inktdroogtijd. Compileert; nog niet op de machine getest. In de app: keuze welke firmware er op de machine staat, en **proefdraaien**: een SD-bestand regel voor regel uitvoeren zoals de firmware dat doet, ook voor oude bestanden.

- **20 november 2026 (nacht):** **firmware-emulator** (`firmware/emulator/`): de echte firmware draait als WebAssembly in de browser, met touchscreen, SD-kaart, motoren en penlift nagebootst. Daarmee meteen een bug gevonden en opgelost (F5: tekening stopte als je vinger na "DRAW THIS FILE" nog op het scherm lag).

### Ideeën om op te nemen in de planning

- **Beurtentekening** (idee van Mark, 21 nov): meerdere computers (bijv. vier) tekenen om de beurt op dezelfde machine. Architectuur: één server (homelab) als scheidsrechter met wachtrij en beurten, één verbinding naar de machine (er kan maar één ding tegelijk de motoren aansturen), en een live voorbeeld voor alle deelnemers. Beurtsystemen om uit te kiezen: per tekening, per lijn, per tijdvak, cadavre exquis (ieder een strook, alleen een randje van de vorige zien) of reageren op wat er al staat. Met één pen: pauze met melding bij een kleurwissel. Te bouwen na de USB-verbinding (versie 0.3) en de homelab-opzet.

- **Architectuur: rekenwerk in de browser, hosting als statische site** (besproken 21 nov): de webapp rekent alles op het apparaat van de gebruiker uit (SVG inlezen, volgorde, bestand maken). De openbare versie is daardoor alleen een set bestanden op GitHub Pages of Cloudflare Pages, eventueel op atelierbakema.com: (bijna) gratis, schaalt vanzelf, en tekeningen van anderen komen nooit op een server.
- **Homelab voor de eigen machine**: in het homelab draait dezelfde webapp in Docker, plus opslag van tekeningen, een wachtrij en instellingen per machine. Een klein bordje bij de machine (Raspberry Pi of ESP32) geeft de commando's via USB door en meldt de voortgang. Alleen bereikbaar in het eigen netwerk of via een VPN (bijv. Tailscale), niet openbaar.
- **Rechtstreeks SVG/JPG/PDF tekenen** (architectuurvraag van Mark): de Arduino Mega kan G-code aan, maar geen SVG, JPG of PDF (te weinig geheugen). Daarvoor een slimmer brein naast het bord: een Pi bij de machine met dezelfde kern als de webapp (USB-stick erin of via wifi), of een ESP32 die de webapp serveert. Pas na de eerste test op de echte machine.
- **Steun het project**: een rustige link onderaan de openbare site (GitHub Sponsors, Ko-fi, Liberapay of PayPal.me), met een eerlijke toelichting waar het geld naartoe gaat (hosting, domein, ontwikkeling).

- **Sprites en "rove" uit de firmware** (idee van Mark): Sandy's functies om tekst, krullen en de "Norwegian"-stijl op de machine zelf te laten tekenen, later uit de firmware halen en als bestanden voor de SD-kaart meeleveren, of door de webapp laten maken. Dat geeft ruimte in de firmware, en mensen houden de functies.
- **Foto-opties / pendikte**: in de webapp komen pendikte en vullingen onder de opties voor een tekening (arceringen hebben de pendikte nodig). Op het touchscreen alleen als er afbeeldingen op de kaart staan.
- **Instellingen via een AI-agent**: de machine luistert via USB naar commando's, ook voor instellingen. Een AI-agent (bijv. Claude Code op de Mac met de machine eraan) kan die lezen en aanpassen ("mijn machine is nu 2 meter breed").

- **Talen (na de beta):** de app en het touchscreen in meerdere talen. Voorstel: Nederlands, Engels (UK), Duits, Frans, Spaans, Chinees (vereenvoudigd) en Bahasa Indonesia. Geen Russisch en geen Amerikaans Engels. Lijst nog te bevestigen.
- **Touchscreen opnieuw ontwerpen:** met de emulator kunnen de schermen van de firmware worden aangepast en meteen in de browser bekeken, voordat iets op de machine gaat.

- **Tekenvolgorde zoals een kunstenaar** (20 nov, gebouwd): kies tussen slim (kortste weg), rechtshandig (linksboven naar rechtsonder) en linkshandig (rechtsboven naar linksonder). Alle drie werken van boven naar onder, omdat de penlift van de PolargraphSD onder de pen zit en anders over verse inkt schuurt. De keuze wordt onthouden.
- **Inktdroogtijd** (idee van Mark, 20 nov gebouwd): kruist een lijn een net getekende lijn, dan tekent de app eerst ergens anders verder en wacht zo nodig tot de inkt droog is. Instelbaar in seconden (0 = uit). In G-code wordt gewacht met `G4`; Sandy's firmware heeft geen wachtcommando, dus in het SD-bestand werkt alleen het aanpassen van de volgorde.
- **Rechts- en linkshandig zonder zigzag** (20 nov): in deze standen loopt elke lijn in de richting van de hand, ook als omkeren korter zou zijn. Verticale lijnen gaan van boven naar onder.

- **Drie manieren om te tekenen:** SD-kaart (machines met scherm), USB direct vanuit de browser (machines zonder scherm, versie 0.3), en een **Raspberry Pi** als netwerkplotter, zoals OctoPrint bij 3D-printers: de Pi hangt met USB aan de machine en je stuurt tekeningen via wifi vanaf je telefoon of laptop.
- **Oude 3D-printerbordjes:** Marlin (vanaf 2.1) heeft een polargraph-stand, toegevoegd door de makers van Makelangelo. FluidNC (ESP32) heeft een WallPlotter-stand. Daarmee kan vrijwel elk oud 3D-printerbord een polargraph aansturen. Eerst testen op Mark's bordjes.
- **Bouwpakket:** naar het voorbeeld van "print your own speakers": een lijst met te bestellen onderdelen (bord, 2 motoren, servo, schakelaars), STL-bestanden om zelf te printen, een duidelijke bouwbeschrijving, en de app op atelierbakema.com. Geschikt voor een ouder met kind en een 3D-printer.

## Techniek (eerste keuze, ter bespreking)

- **Webapp** in TypeScript, die volledig in de browser draait. Er is geen server nodig, dus hij kan als statische site op atelierbakema.com.
- **SVG-verwerking** in de browser. Paden worden één keer omgezet naar lijnsegmenten en bewaard.
- **Tekenvlak** met canvas/WebGL voor vloeiend zoomen en schuiven, ook bij grote tekeningen.
- **Kern los van de interface.** De wiskunde van de polargraph (lengtes van de koorden, stappen), het commandoformaat en het SD-bestand komen in een losse, goed geteste module. Zo kunnen we later ook een andere interface of een nieuwe firmware aansluiten.
- **Web Serial** voor USB (Chrome/Edge). Andere browsers krijgen een nette melding en gebruiken de SD-route.
- **Nagebootste machine** voor tests: een simulator die de firmware-commando's begrijpt, zodat de app getest kan worden zonder de echte machine.
- **Mapstructuur:** de nieuwe app komt in `app/` in deze repo. De oude controller blijft in `controller/` ter referentie.

## Open vragen

1. ~~Welke machine/firmware heb je precies?~~ **Beantwoord (20 nov 2026):** PolargraphSD met **Polarshield v2.0d** op een Arduino Mega 2560, twee A4988-motordrivers (motor A en B), touchscreen en SD-kaartlezer. De bijbehorende firmware is `firmware/polarshield/`. Zie [hardware.md](hardware.md).
2. **Kun je één SD-bestand delen** dat met de oude app is gemaakt en goed werkte? Dan weten we zeker welk formaat de machine verwacht.
3. **Machinematen:** afstand tussen de motoren, papierformaat dat je meestal gebruikt, en waar het home-punt zit.
4. **Welke functies uit de oude app gebruik je echt?** Bijvoorbeeld bepaalde vulstijlen.
5. **Hosting:** hoe wordt atelierbakema.com nu gehost? Dat bepaalt hoe we de app publiceren.
