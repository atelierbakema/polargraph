// Emulator: op een computer staat alles gewoon in het werkgeheugen.
#pragma once
#include <string.h>
#include <stdint.h>
#define PROGMEM
#define PGM_P const char *
#define PSTR(s) (s)
#define pgm_read_byte(addr) (*(const uint8_t *)(addr))
#define pgm_read_word(addr) (*(const uint16_t *)(addr))
#define pgm_read_dword(addr) (*(const uint32_t *)(addr))
#define pgm_read_float(addr) (*(const float *)(addr))
#define strlen_P strlen
#define strcpy_P strcpy
#define strncpy_P strncpy
#define strcmp_P strcmp
#define strncmp_P strncmp
#define strcasecmp_P strcasecmp
#define strcat_P strcat
#define strstr_P strstr
#define memcpy_P memcpy
#define sprintf_P sprintf

// avr-libc-functies die WString.cpp gebruikt (zie emu.cpp).
#ifdef __cplusplus
extern "C" {
#endif
char *itoa(int value, char *str, int base);
char *utoa(unsigned int value, char *str, int base);
char *ltoa(long value, char *str, int base);
char *ultoa(unsigned long value, char *str, int base);
char *dtostrf(double val, signed char width, unsigned char prec, char *s);
#ifdef __cplusplus
}
#endif
#define pgm_read_ptr(addr) (*(void *const *)(addr))
