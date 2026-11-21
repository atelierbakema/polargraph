// Emulator: het 320x240-scherm van de PolargraphSD, getekend in een framebuffer.
// Volgt de API van Henning Karlsen's UTFT voor zover de firmware die gebruikt.
#pragma once
#include "Arduino.h"
#define LEFT 0
#define RIGHT 9999
#define CENTER 9998
#define PORTRAIT 0
#define LANDSCAPE 1
#define VGA_TRANSPARENT 0xFFFFFFFF
#define ITDB28 0
#define TFT01_24_8 4
#define ITDB24E_8 14
#define ITDB22 8

class UTFT {
 public:
  UTFT(byte model, int RS, int WR, int CS, int RST) {}
  void InitLCD(byte orientation = LANDSCAPE);
  void clrScr();
  void drawRect(int x1, int y1, int x2, int y2);
  void fillRect(int x1, int y1, int x2, int y2);
  void setColor(byte r, byte g, byte b);
  void setColor(word color);
  void setBackColor(byte r, byte g, byte b);
  void setBackColor(uint32_t color);
  void print(char *st, int x, int y, int deg = 0);
  void print(const char *st, int x, int y, int deg = 0) { print((char *)st, x, y, deg); }
  void print(String st, int x, int y, int deg = 0);
  void printNumI(long num, int x, int y, int length = 0, char filler = ' ');
  void printNumF(double num, byte dec, int x, int y, char divider = '.', int length = 0, char filler = ' ');
  void setFont(uint8_t *font);
  int getDisplayXSize() { return 320; }
  int getDisplayYSize() { return 240; }
 private:
  void printChar(byte c, int x, int y);
  void pixel(int x, int y, uint16_t c);
  uint16_t fcolor = 0xFFFF, bcolor = 0;
  bool transparent = false;
  uint8_t *font = nullptr;
};
