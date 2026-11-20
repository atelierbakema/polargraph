# Firmware installeren op de PolargraphSD

Dit zet de Atelier Bakema-versie (`polarshield-ab-1.4.3-ab1.hex`) op de machine. **Eerst maak je een
reservekopie van de firmware die er nu op staat**, zodat je altijd terug kunt.

Je hebt nodig: een computer, de USB-kabel van de machine, en het programma **avrdude**.

## 1. avrdude installeren

**Mac** (met [Homebrew](https://brew.sh)):

```bash
brew install avrdude
```

**Windows:** installeer de Arduino IDE; daarin zit avrdude. Of gebruik het programma XLoader
(kies *Mega(ATMEGA2560)* en 115200 baud) en sla stap 3 over.

## 2. De poort van de machine vinden

Sluit de machine met USB aan en zet hem aan. Op een Mac:

```bash
ls /dev/cu.*
```

De machine is meestal iets als `/dev/cu.usbmodem1411` of `/dev/cu.usbserial-A1234`.
Gebruik die naam hieronder in plaats van `POORT`.

## 3. Reservekopie maken (belangrijk!)

```bash
avrdude -p atmega2560 -c wiring -P POORT -b 115200 -U flash:r:polargraph-reservekopie.hex:i
```

Bewaar `polargraph-reservekopie.hex` goed, bijvoorbeeld ook in deze repo.

## 4. De nieuwe firmware installeren

```bash
avrdude -p atmega2560 -c wiring -P POORT -b 115200 -D -U flash:w:polarshield-ab-1.4.3-ab1.hex:i
```

De machine herstart. Linksonder op het touchscreen hoort nu **v1.4.3-ab1** te staan.

Je machine-instellingen (breedte, penlift enzovoort) staan in een ander deel van het geheugen
(EEPROM) en blijven bewaard.

## Terug naar de vorige versie

```bash
avrdude -p atmega2560 -c wiring -P POORT -b 115200 -D -U flash:w:polargraph-reservekopie.hex:i
```

Of zet Sandy's originele 1.4.3 terug: `../polarshield/polargraph_server_polarshield.ino.hex`.
