// Emulator voor de PolargraphSD-firmware in de browser.
//
// Bootst de onderdelen van de Arduino Mega + Polarshield na die de firmware gebruikt:
// tijd, seriële poort, scherm (UTFT), touchscreen (UTouch), SD-kaart, EEPROM, servo.
// De motoren zijn de echte AccelStepper-bibliotheek; de emulator leest hun posities uit.
//
// Werkt met Emscripten + ASYNCIFY: de firmware draait in een eindeloze lus, en geeft
// regelmatig de beurt terug aan de browser (in delay(), Serial.available() en micros()).

#include <emscripten.h>
#include <string>
#include <vector>
#include <deque>
#include "Arduino.h"
#include "SPI.h"
#include "SD.h"
#include "EEPROM.h"
#include "Servo.h"
#include "UTFT.h"
#include "UTouch.h"
#include "AccelStepper.h"

// ---------- Tijd en de beurt teruggeven aan de browser ----------

static double startMs = emscripten_get_now();
static double lastYield = 0;
/** Snelheidsfactor: 1 = echte tijd. Hoger = de machine "tekent" sneller in de emulator. */
static double speed = 1.0;
static double virtualOffset = 0;

static double nowMs() { return (emscripten_get_now() - startMs) * speed + virtualOffset; }

static void maybeYield() {
  double real = emscripten_get_now();
  if (real - lastYield > 12) {
    lastYield = real;
    emscripten_sleep(0);
  }
}

unsigned long millis() { maybeYield(); return (unsigned long)nowMs(); }
unsigned long micros() { maybeYield(); return (unsigned long)(nowMs() * 1000.0); }
void delay(unsigned long ms) {
  double until = nowMs() + ms;
  while (nowMs() < until) {
    lastYield = emscripten_get_now();
    emscripten_sleep(ms > 20 ? 10 : 1);
  }
}
void delayMicroseconds(unsigned int) {}

// ---------- Pinnen ----------

static uint8_t pinState[100];
void pinMode(uint8_t pin, uint8_t mode) { if (pin < 100 && mode == INPUT_PULLUP) pinState[pin] = HIGH; }
void digitalWrite(uint8_t pin, uint8_t val) { if (pin < 100) pinState[pin] = val; }
int digitalRead(uint8_t pin) { return pin < 100 ? pinState[pin] : LOW; }
int analogRead(uint8_t) { return 512; }
void analogWrite(uint8_t, int) {}
long random(long howbig) { return howbig <= 0 ? 0 : rand() % howbig; }
long random(long lo, long hi) { return hi <= lo ? lo : lo + rand() % (hi - lo); }
void randomSeed(unsigned long s) { srand(s); }

// ---------- Getallen naar tekst (avr-libc) ----------

extern "C" {
static char *toBase(unsigned long v, char *str, int base, bool neg) {
  char buf[40];
  int i = 0;
  if (v == 0) buf[i++] = '0';
  while (v > 0) {
    int d = v % base;
    buf[i++] = d < 10 ? '0' + d : 'a' + d - 10;
    v /= base;
  }
  int j = 0;
  if (neg) str[j++] = '-';
  while (i > 0) str[j++] = buf[--i];
  str[j] = 0;
  return str;
}
char *itoa(int v, char *s, int b) { return v < 0 && b == 10 ? toBase((unsigned long)(-(long)v), s, b, true) : toBase((unsigned int)v, s, b, false); }
char *utoa(unsigned int v, char *s, int b) { return toBase(v, s, b, false); }
char *ltoa(long v, char *s, int b) { return v < 0 && b == 10 ? toBase((unsigned long)(-v), s, b, true) : toBase((unsigned long)v, s, b, false); }
char *ultoa(unsigned long v, char *s, int b) { return toBase(v, s, b, false); }
char *dtostrf(double val, signed char width, unsigned char prec, char *s) {
  sprintf(s, "%*.*f", width, prec, val);
  return s;
}
}

// ---------- Seriële poort ----------

EmuSerial Serial;
SPIClass SPI;
static std::deque<uint8_t> serialIn;
static std::string serialOut;

EM_JS(void, js_serial_out, (const char *text), { if (Module.onSerial) Module.onSerial(UTF8ToString(text)); });

size_t EmuSerial::write(uint8_t c) {
  if (c == '\n') {
    js_serial_out(serialOut.c_str());
    serialOut.clear();
  } else if (c != '\r') {
    serialOut.push_back((char)c);
  }
  return 1;
}
int EmuSerial::available() { maybeYield(); return (int)serialIn.size(); }
int EmuSerial::read() {
  if (serialIn.empty()) return -1;
  int c = serialIn.front();
  serialIn.pop_front();
  return c;
}
int EmuSerial::peek() { return serialIn.empty() ? -1 : serialIn.front(); }

// ---------- EEPROM ----------

EEPROMClass EEPROM;
static uint8_t eeprom[4096];
static bool eepromInit = false;
uint8_t EEPROMClass::read(int addr) {
  if (!eepromInit) { memset(eeprom, 0xFF, sizeof eeprom); eepromInit = true; }
  return addr >= 0 && addr < 4096 ? eeprom[addr] : 0xFF;
}
void EEPROMClass::write(int addr, uint8_t v) {
  if (!eepromInit) { memset(eeprom, 0xFF, sizeof eeprom); eepromInit = true; }
  if (addr >= 0 && addr < 4096) eeprom[addr] = v;
}

// ---------- Servo (penlift) ----------

static int servoAngle = 180; // pen omhoog tot de firmware iets anders zegt
static bool servoOn = false;
uint8_t Servo::attach(int) { attached_ = true; servoOn = true; return 1; }
void Servo::detach() { attached_ = false; servoOn = false; }
void Servo::write(int angle) { angle_ = angle; servoAngle = angle; }

// ---------- SD-kaart ----------

struct SdEntry { std::string name; std::vector<uint8_t> data; };
static std::vector<SdEntry> sdFiles;
static bool sdPresent = true;
SDClass SD;

static int findFile(const char *path) {
  std::string p(path);
  while (!p.empty() && p[0] == '/') p.erase(0, 1);
  for (auto &ch : p) ch = toupper(ch);
  for (size_t i = 0; i < sdFiles.size(); i++) if (sdFiles[i].name == p) return (int)i;
  return -1;
}
bool SDClass::begin(uint8_t) { return sdPresent; }
File SDClass::open(const char *path, uint8_t mode) {
  std::string p(path);
  if (p == "/" || p.empty()) return File(-1, true);
  int i = findFile(path);
  if (i < 0 && mode == FILE_WRITE) {
    std::string n(path);
    while (!n.empty() && n[0] == '/') n.erase(0, 1);
    for (auto &ch : n) ch = toupper(ch);
    sdFiles.push_back({n, {}});
    i = (int)sdFiles.size() - 1;
  }
  if (i < 0) return File();
  File f(i, false);
  if (mode == FILE_WRITE) f.seek(f.size());
  return f;
}
bool SDClass::exists(const char *path) { return findFile(path) >= 0; }
bool SDClass::remove(const char *path) {
  int i = findFile(path);
  if (i < 0) return false;
  sdFiles.erase(sdFiles.begin() + i);
  return true;
}
size_t File::write(uint8_t c) {
  if (index_ < 0) return 0;
  auto &d = sdFiles[index_].data;
  if (pos_ >= d.size()) d.push_back(c); else d[pos_] = c;
  pos_++;
  return 1;
}
int File::read() {
  if (index_ < 0) return -1;
  auto &d = sdFiles[index_].data;
  maybeYield();
  return pos_ < d.size() ? d[pos_++] : -1;
}
int File::peek() { if (index_ < 0) return -1; auto &d = sdFiles[index_].data; return pos_ < d.size() ? d[pos_] : -1; }
int File::available() { if (index_ < 0) return 0; return (int)(sdFiles[index_].data.size() - pos_); }
bool File::seek(uint32_t p) { pos_ = p; return true; }
uint32_t File::position() { return pos_; }
uint32_t File::size() { return index_ < 0 ? 0 : (uint32_t)sdFiles[index_].data.size(); }
void File::close() {}
const char *File::name() { return index_ < 0 ? "/" : sdFiles[index_].name.c_str(); }
File File::openNextFile(uint8_t) {
  if (!dir_ || dirPos_ >= (int)sdFiles.size()) return File();
  return File(dirPos_++, false);
}

// ---------- Scherm ----------

static uint16_t fb[320 * 240];
static int fbVersion = 0;
static uint16_t rgb565(byte r, byte g, byte b) { return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3); }

void UTFT::pixel(int x, int y, uint16_t c) {
  if (x < 0 || y < 0 || x >= 320 || y >= 240) return;
  fb[y * 320 + x] = c;
}
void UTFT::InitLCD(byte) { clrScr(); }
void UTFT::clrScr() { memset(fb, 0, sizeof fb); fbVersion++; }
void UTFT::setColor(byte r, byte g, byte b) { fcolor = rgb565(r, g, b); }
void UTFT::setColor(word c) { fcolor = c; }
void UTFT::setBackColor(byte r, byte g, byte b) { bcolor = rgb565(r, g, b); transparent = false; }
void UTFT::setBackColor(uint32_t c) {
  if (c == VGA_TRANSPARENT) transparent = true;
  else { bcolor = (uint16_t)c; transparent = false; }
}
void UTFT::fillRect(int x1, int y1, int x2, int y2) {
  if (x1 > x2) { int t = x1; x1 = x2; x2 = t; }
  if (y1 > y2) { int t = y1; y1 = y2; y2 = t; }
  for (int y = y1; y <= y2; y++) for (int x = x1; x <= x2; x++) pixel(x, y, fcolor);
  fbVersion++;
}
void UTFT::drawRect(int x1, int y1, int x2, int y2) {
  if (x1 > x2) { int t = x1; x1 = x2; x2 = t; }
  if (y1 > y2) { int t = y1; y1 = y2; y2 = t; }
  for (int x = x1; x <= x2; x++) { pixel(x, y1, fcolor); pixel(x, y2, fcolor); }
  for (int y = y1; y <= y2; y++) { pixel(x1, y, fcolor); pixel(x2, y, fcolor); }
  fbVersion++;
}
void UTFT::setFont(uint8_t *f) { font = f; }
void UTFT::printChar(byte c, int x, int y) {
  if (!font) return;
  int xs = font[0], ys = font[1], offset = font[2], count = font[3];
  if (c < offset || c >= offset + count) c = offset;
  const uint8_t *glyph = font + 4 + (c - offset) * (xs / 8) * ys;
  for (int row = 0; row < ys; row++) {
    for (int col = 0; col < xs; col++) {
      bool on = glyph[row * (xs / 8) + col / 8] & (0x80 >> (col % 8));
      if (on) pixel(x + col, y + row, fcolor);
      else if (!transparent) pixel(x + col, y + row, bcolor);
    }
  }
}
void UTFT::print(char *st, int x, int y, int) {
  if (!font) return;
  int len = (int)strlen(st);
  if (x == RIGHT) x = 320 - len * font[0];
  if (x == CENTER) x = (320 - len * font[0]) / 2;
  for (int i = 0; i < len; i++) printChar((byte)st[i], x + i * font[0], y);
  fbVersion++;
}
void UTFT::print(String st, int x, int y, int deg) { print((char *)st.c_str(), x, y, deg); }
void UTFT::printNumI(long num, int x, int y, int length, char filler) {
  char buf[25];
  snprintf(buf, sizeof buf, "%ld", num);
  std::string s(buf);
  while (length > 0 && (int)s.size() < length) s.insert(s.begin(), filler);
  print((char *)s.c_str(), x, y);
}
void UTFT::printNumF(double num, byte dec, int x, int y, char divider, int length, char filler) {
  char buf[40];
  snprintf(buf, sizeof buf, "%.*f", dec, num);
  std::string s(buf);
  for (auto &ch : s) if (ch == '.') ch = divider;
  while (length > 0 && (int)s.size() < length) s.insert(s.begin(), filler);
  print((char *)s.c_str(), x, y);
}

// ---------- Touchscreen ----------

static bool touchDown = false;
static int touchX = 0, touchY = 0;
void UTouch::read() {}
bool UTouch::dataAvailable() { maybeYield(); return touchDown; }
int16_t UTouch::getX() { return touchDown ? touchX : -1; }
int16_t UTouch::getY() { return touchDown ? touchY : -1; }

// ---------- Brug naar JavaScript ----------

extern AccelStepper motorA;
extern AccelStepper motorB;

extern "C" {
EMSCRIPTEN_KEEPALIVE uint16_t *emu_framebuffer() { return fb; }
EMSCRIPTEN_KEEPALIVE int emu_framebuffer_version() { return fbVersion; }
EMSCRIPTEN_KEEPALIVE void emu_touch(int down, int x, int y) { touchDown = down != 0; touchX = x; touchY = y; }
EMSCRIPTEN_KEEPALIVE void emu_serial_in(const char *text) { for (const char *p = text; *p; p++) serialIn.push_back((uint8_t)*p); }
EMSCRIPTEN_KEEPALIVE void emu_sd_add(const char *name, const uint8_t *data, int len) {
  int i = findFile(name);
  if (i >= 0) sdFiles[i].data.assign(data, data + len);
  else {
    std::string n(name);
    for (auto &ch : n) ch = toupper(ch);
    sdFiles.push_back({n, std::vector<uint8_t>(data, data + len)});
  }
}
EMSCRIPTEN_KEEPALIVE void emu_set_speed(double s) {
  double now = nowMs();
  speed = s > 0 ? s : 1;
  startMs = emscripten_get_now();
  virtualOffset = now;
}
EMSCRIPTEN_KEEPALIVE long emu_motor_a() { return motorA.currentPosition(); }
EMSCRIPTEN_KEEPALIVE long emu_motor_b() { return motorB.currentPosition(); }
EMSCRIPTEN_KEEPALIVE int emu_servo_angle() { return servoAngle; }
EMSCRIPTEN_KEEPALIVE int emu_servo_on() { return servoOn ? 1 : 0; }
}

void setup();
void loop();

int main() {
  memset(pinState, 0, sizeof pinState);
  setup();
  while (true) {
    loop();
    maybeYield();
  }
}
