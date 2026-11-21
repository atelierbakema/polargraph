// Emulator: een SD-kaart in het werkgeheugen. Bestanden komen uit de browser.
#pragma once
#include "Arduino.h"
#define FILE_READ 0x01
#define FILE_WRITE 0x13
#define SD_CARD_TYPE_SD1 1
#define SD_CARD_TYPE_SD2 2
#define SD_CARD_TYPE_SDHC 3
#define LS_DATE 1
#define LS_SIZE 2
#define LS_R 4

class File : public Print {
 public:
  File() {}
  File(int index, bool dir) : index_(index), dir_(dir) {}
  size_t write(uint8_t c) override;
  using Print::write;
  int read();
  int peek();
  int available();
  void flush() {}
  bool seek(uint32_t pos);
  uint32_t position();
  uint32_t size();
  void close();
  operator bool() const { return index_ >= 0 || dir_; }
  const char *name();
  bool isDirectory() { return dir_; }
  File openNextFile(uint8_t mode = FILE_READ);
  void rewindDirectory() { dirPos_ = 0; }
 private:
  int index_ = -1;
  bool dir_ = false;
  uint32_t pos_ = 0;
  int dirPos_ = 0;
};

class SDClass {
 public:
  bool begin(uint8_t csPin = 0);
  File open(const char *path, uint8_t mode = FILE_READ);
  File open(const String &path, uint8_t mode = FILE_READ) { return open(path.c_str(), mode); }
  bool exists(const char *path);
  bool remove(const char *path);
};
extern SDClass SD;

class Sd2Card { public: bool init(uint8_t, uint8_t) { return true; } uint8_t type() { return SD_CARD_TYPE_SDHC; } };
class SdVolume { public: bool init(Sd2Card &) { return true; } uint8_t fatType() { return 32; } uint8_t blocksPerCluster() { return 64; } uint32_t clusterCount() { return 60000; } };
class SdFile { public: bool openRoot(SdVolume &) { return true; } void ls(uint8_t) {} };
