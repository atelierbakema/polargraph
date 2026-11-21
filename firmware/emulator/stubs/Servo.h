#pragma once
#include "Arduino.h"
class Servo {
 public:
  uint8_t attach(int pin);
  uint8_t attach(int pin, int, int) { return attach(pin); }
  void detach();
  void write(int angle);
  int read() { return angle_; }
  bool attached() { return attached_; }
 private:
  int angle_ = 90;
  bool attached_ = false;
};
