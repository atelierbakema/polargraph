#pragma once
#include "Arduino.h"
#define SPI_HALF_SPEED 1
#define SPI_FULL_SPEED 0
class SPIClass { public: void begin() {} };
extern SPIClass SPI;
