#!/usr/bin/env bash
# Bouwt de firmware-emulator voor de browser.
# Vereist: arduino-builder (voor de Arduino-voorbewerking) en Emscripten (em++).
#   ./build.sh [schetsmap] [uitvoernaam] [exportnaam]
#   standaard: ../polarshield-ab  firmware.js  PolargraphFirmware
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SKETCH="$(cd "${1:-$HERE/../polarshield-ab}" && pwd)"
# De schets heet naar het .ino-bestand met setup() erin (de Arduino IDE eist dat de map zo heet).
NAME="$(basename "$(grep -l "void setup" "$SKETCH"/*.ino | head -1)" .ino)"
OUT="$HERE/dist"
OUTFILE="${2:-firmware.js}"
EXPORT="${3:-PolargraphFirmware}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$OUT" "$WORK/sketch/$NAME" "$WORK/build"
cp "$SKETCH"/*.ino "$SKETCH"/*.h "$SKETCH"/*.c "$WORK/sketch/$NAME/" 2>/dev/null || true
# EEPROM-opslag met AVR-maten (int = 2 bytes), zie stubs/EEPROMAnything.h.
cp "$HERE/stubs/EEPROMAnything.h" "$WORK/sketch/$NAME/EEPROMAnything.h"
# Bibliotheken voor de voorbewerking: alleen de headers, zodat de includes gevonden worden.
for lib in UTFT UTouch SD Servo; do mkdir -p "$WORK/libs/$lib" && cp "$HERE/stubs/$lib.h" "$WORK/libs/$lib/"; done
mkdir -p "$WORK/libs/AccelStepper" && cp "$HERE/vendor/AccelStepper.h" "$WORK/libs/AccelStepper/"

# 1. Arduino-voorbewerking: alle .ino-bestanden samenvoegen en functieprototypes toevoegen,
#    zoals de Arduino IDE dat doet. De schermbibliotheken komen uit de emulator.
#    arduino-builder schrijft het samengevoegde bestand naar build/sketch/<naam>.ino.cpp;
#    het linken voor de echte chip mislukt daarna (de bibliotheken zijn alleen headers),
#    en dat is hier de bedoeling.
arduino-builder -compile \
  -hardware /usr/share/arduino/hardware \
  -tools /usr/share/arduino-builder \
  -libraries "$WORK/libs" \
  -fqbn arduino:avr:mega:cpu=atmega2560 \
  -build-path "$WORK/build" \
  -prefs=runtime.tools.avr-gcc.path=/usr \
  -prefs=runtime.tools.ctags.path=/usr/bin \
  "$WORK/sketch/$NAME/$NAME.ino" > "$WORK/arduino-builder.log" 2>&1 || true
if [ ! -f "$WORK/build/sketch/$NAME.ino.cpp" ]; then
  cat "$WORK/arduino-builder.log"
  echo "Voorbewerking mislukt." >&2
  exit 1
fi
cp "$WORK/build/sketch/$NAME.ino.cpp" "$WORK/sketch.cpp"

# 2. Compileren naar WebAssembly, met de nagebootste onderdelen.
em++ -O2 -std=gnu++11 -w -DARDUINO=10806 -DPOLARGRAPH_EMULATOR \
  -I"$WORK/sketch/$NAME" -I"$HERE/stubs" -I"$HERE/vendor" \
  -s ASYNCIFY=1 -s ASYNCIFY_STACK_SIZE=65536 \
  -s ALLOW_MEMORY_GROWTH=1 -s INVOKE_RUN=0 -s SINGLE_FILE=1 -s MODULARIZE=1 -s EXPORT_NAME="$EXPORT" \
  -s EXPORTED_FUNCTIONS='["_main","_malloc","_free","_emu_framebuffer","_emu_framebuffer_version","_emu_touch","_emu_serial_in","_emu_sd_add","_emu_set_speed","_emu_motor_a","_emu_motor_b","_emu_servo_angle","_emu_servo_on","_emu_eeprom"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","callMain","HEAPU16","HEAPU8","UTF8ToString","stringToUTF8","lengthBytesUTF8"]' \
  "$WORK/sketch.cpp" \
  "$HERE/emu.cpp" "$HERE/vendor/WString.cpp" "$HERE/vendor/Print.cpp" "$HERE/vendor/AccelStepper.cpp" \
  "$HERE/vendor/DefaultFonts.c" $(ls "$WORK/sketch/$NAME"/*.c 2>/dev/null) \
  -o "$OUT/$OUTFILE"
echo "Klaar: $OUT/$OUTFILE"
