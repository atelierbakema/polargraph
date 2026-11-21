// Emulator-versie van EEPROMAnything.h.
// Op de Arduino Mega is een int 2 bytes; in de browser 4. De firmware legt de EEPROM-adressen
// aan op 2-byte ints, dus ints worden hier als 2 bytes opgeslagen, net als op de echte chip.
#pragma once
#include <EEPROM.h>
#include <Arduino.h>

template <class T> struct AvrStorage { typedef T type; };
template <> struct AvrStorage<int> { typedef int16_t type; };
template <> struct AvrStorage<unsigned int> { typedef uint16_t type; };

template <class T> int EEPROM_writeAnything(int ee, const T &value) {
  typename AvrStorage<T>::type v = (typename AvrStorage<T>::type)value;
  const byte *p = (const byte *)(const void *)&v;
  unsigned int i;
  for (i = 0; i < sizeof(v); i++) EEPROM.write(ee++, *p++);
  return i;
}

template <class T> int EEPROM_readAnything(int ee, T &value) {
  typename AvrStorage<T>::type v;
  byte *p = (byte *)(void *)&v;
  unsigned int i;
  for (i = 0; i < sizeof(v); i++) *p++ = EEPROM.read(ee++);
  value = (T)v;
  return i;
}
