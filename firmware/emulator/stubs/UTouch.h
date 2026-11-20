// Emulator: het touchscreen. Aanrakingen komen van de muis of je vinger in de browser.
#pragma once
#include "Arduino.h"
#define PREC_LOW 1
#define PREC_MEDIUM 2
#define PREC_HI 3
#define PREC_EXTREME 4
class UTouch {
 public:
  UTouch(byte tclk, byte tcs, byte tdin, byte dout, byte irq) {}
  void InitTouch(byte orientation = 1) {}
  void read();
  bool dataAvailable();
  int16_t getX();
  int16_t getY();
  void setPrecision(byte) {}
};
