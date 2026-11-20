#pragma once
#include "Arduino.h"
class EEPROMClass {
 public:
  uint8_t read(int addr);
  void write(int addr, uint8_t value);
  void update(int addr, uint8_t value) { write(addr, value); }
};
extern EEPROMClass EEPROM;
