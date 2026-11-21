/**
*  Polargraph Server for ATMEGA1280+ 
*  Written by Sandy Noble
*  Released under GNU License version 3.
*  http://www.polargraph.co.uk
*  https://github.com/euphy/polargraph_server_polarshield

Specific features for Polarshield / arduino mega.
LCD (and touch screen).

All the many routines for drawing the buttons and menus and controls that appear
on the polargraphSD's touchscreen, AND the interrupt-driven routines to handle
input through the screen.

There is a lot of this, but it's pretty samey.
*/


/**  This is the method that is called by an interrupt when the touchscreen 
is touched. It sets a parameter (displayTouched) to true, but does not act 
directly on the touch.
*/

void lcd_touchInput()
{
  // don't trigger if it's already in processing
  if (!displayTouched)
  {
    while (touch.dataAvailable()) {
      touch.read();
      long x = touch.getX();
      long y = touch.getY();
      if ((x != -1) and (y != -1)) {
#ifdef DEBUG_TOUCH
        Serial.print("touch ok: ");
        Serial.print(touchX);
        Serial.print(",");
        Serial.println(touchY);
#endif
        touchX = x;
        touchY = y;
        displayTouched = true;
        lastInteractionTime = millis();
        break;
      }
    }
  }
  else {
#ifdef DEBUG_TOUCH
    Serial.println("Already touched.");
#endif
  }
}

/** 
*   This method should be regularly polled to see if the machine has
*   been touched, and to act on the touches.  It checks the value of 
*   displayTouched boolean, and if it is true, then attempts to 
*   process the touch command.
*/
void lcd_checkForInput()
{
  lcd_touchInput();
  
  if (displayTouched)
  {
#ifdef DEBUG_TOUCH
    Serial.print("2: ");
    Serial.print(touchX);
    Serial.print(",");
    Serial.println(touchY);
    Serial.println("Check for input");
#endif
    lastOperationTime = millis();
    if (screenState == SCREEN_STATE_POWER_SAVE)
    {
      delay(20);
      screenState = SCREEN_STATE_NORMAL;
      lcd_drawButtons();
    }
    else
    {
#ifdef DEBUG_TOUCH
      Serial.println("Inputted!!");
#endif
      delay(20);
      lcd_processTouchCommand();
    }
#ifdef DEBUG_TOUCH
    Serial.println("DONE.");
#endif
    // Wachten tot de vinger los is, zodat één aanraking niet meerdere keren telt (-ab1).
    lcd_waitForRelease();
    displayTouched = false;
  }
  else
  {
//    Serial.print("2a: ");
//    Serial.print(touchX);
//    Serial.print(",");
//    Serial.println(touchY);

//    Serial.print("Screen state: ");
//    Serial.print(screenState);
//    Serial.print(", lastInteractionTime: ");
//    Serial.print(lastInteractionTime);
//    Serial.print(" plus idle: ");
//    Serial.print(lastInteractionTime + screenSaveIdleTime);
//    Serial.print(", millis: ");
//    Serial.println(millis());
    
    if (screenState == SCREEN_STATE_NORMAL
    && (millis() > (lastInteractionTime + screenSaveIdleTime)))
    {
      // put it to sleep
      screenState = SCREEN_STATE_POWER_SAVE;
      lcd_clear();
    }
    else if (screenState == SCREEN_STATE_POWER_SAVE
      && (millis() < lastInteractionTime + screenSaveIdleTime))
    {
      delay(20);
      screenState = SCREEN_STATE_NORMAL;
      lcd_drawButtons();
    }
  }
}

void lcd_updateDisplay()
{
}


/* =============================================================================
   This is the code for controlling the LCD, menus and the hardware controls
   There's a lot of it, but it's mostly all the same.
   =============================================================================*/
int buttonCoords[12][2];
byte  gap = (LCD_TYPE == ITDB24E_8 || LCD_TYPE == TFT01_24_8) ? 10 : 10;
byte  buttonSize = 60;
byte  grooveSize = 36;
static int screenWidth = (LCD_TYPE == ITDB24E_8 || LCD_TYPE == TFT01_24_8) ? 320 : 220;
static int screenHeight = (LCD_TYPE == ITDB24E_8 || LCD_TYPE == TFT01_24_8) ? 240 : 176;
static int centreYPosition = (LCD_TYPE == ITDB24E_8 || LCD_TYPE == TFT01_24_8) ? 112 : 80;

const byte MENU_INITIAL = 1;
const byte MENU_RUNNING = 2;
const byte MENU_CHOOSE_FILE = 3;
const byte MENU_ADJUST_PENSIZE = 4;
const byte MENU_ADJUST_POSITION = 5;
const byte MENU_ADJUST_SPEED = 6;
const byte MENU_SETTINGS = 7;
const byte MENU_SETTINGS_2 = 8;
const byte MENU_ADJUST_PENLIFT = 9;
volatile byte currentMenu = MENU_INITIAL;

byte numberOfMenuButtons = 3;
const byte BUTTON_SET_HOME = 1;
const byte BUTTON_DRAW_FROM_SD = 2;
const byte BUTTON_MORE_RIGHT = 3;
const byte BUTTON_PAUSE_RUNNING = 4;
const byte BUTTON_RESUME_RUNNING = 5;
const byte BUTTON_RESET = 6;
const byte BUTTON_PEN_UP = 7;
const byte BUTTON_PEN_DOWN = 8;
const byte BUTTON_INC_SPEED = 9;
const byte BUTTON_DEC_SPEED = 10;
const byte BUTTON_NEXT_FILE = 11;
const byte BUTTON_PREV_FILE = 12;
const byte BUTTON_MAIN_MENU = 13;
const byte BUTTON_OK = 14;
const byte BUTTON_CANCEL_FILE = 15;
const byte BUTTON_DRAW_THIS_FILE = 16;
const byte BUTTON_INC_ACCEL = 18;
const byte BUTTON_DEC_ACCEL = 19;
const byte BUTTON_DONE = 20;
const byte BUTTON_MOVE_INC_A = 21;
const byte BUTTON_MOVE_DEC_A = 22;
const byte BUTTON_MOVE_INC_B = 23;
const byte BUTTON_MOVE_DEC_B = 24;
const byte BUTTON_INC_PENSIZE = 25;
const byte BUTTON_DEC_PENSIZE = 26;
const byte BUTTON_INC_PENSIZE_INC = 27;
const byte BUTTON_DEC_PENSIZE_INC = 28;
const byte BUTTON_ADJUST_SPEED_MENU = 29;
const byte BUTTON_ADJUST_PENSIZE_MENU = 30;
const byte BUTTON_ADJUST_POSITION_MENU = 31;
const byte BUTTON_POWER_ON = 32;
const byte BUTTON_POWER_OFF = 33;
const byte BUTTON_STOP_FILE = 34;
const byte BUTTON_SETTINGS_MENU = 35;
const byte BUTTON_CALIBRATE = 36;
const byte BUTTON_TOGGLE_ECHO = 37;
const byte BUTTON_RESET_SD = 38;
const byte BUTTON_SETTINGS_MENU_2 = 39;

const byte BUTTON_INC_PENLIFT_UP = 40;
const byte BUTTON_DEC_PENLIFT_UP = 41;
const byte BUTTON_INC_PENLIFT_DOWN = 42;
const byte BUTTON_DEC_PENLIFT_DOWN = 43;
const byte BUTTON_ADJUST_PENLIFT = 44;
const byte BUTTON_PENLIFT_SAVE_TO_EEPROM = 45;
const byte BUTTON_LANGUAGE = 46; // -ab1
const byte BUTTON_THEME = 47; // -ab2

/*  Kleuren van het touchscreen (-ab2). Er zijn een paar kleurenschema's; de keuze
    staat in de EEPROM (adres 47) en is te wijzigen met de knop KLEUREN in de instellingen.
    colorLight = knoppen, colorDark = achtergrond, colorBright = tekst op de achtergrond,
    colorButtonText = tekst op de knoppen. */
byte colorLightRed, colorLightGreen, colorLightBlue;
byte colorDarkRed, colorDarkGreen, colorDarkBlue;
byte colorBrightRed, colorBrightGreen, colorBrightBlue;
byte colorButtonTextRed, colorButtonTextGreen, colorButtonTextBlue;
byte colorAccentRed, colorAccentGreen, colorAccentBlue;
byte colorShineRed, colorShineGreen, colorShineBlue;

struct Theme {
  byte background[3];
  byte button[3];
  byte text[3];
  byte buttonText[3];
  byte accent[3];
  byte shine[3];
  const char *name[2]; // EN, NL
};

const char THEME_0_EN[] PROGMEM = "Teal";      const char THEME_0_NL[] PROGMEM = "Zeegroen";
const char THEME_1_EN[] PROGMEM = "Ink blue";  const char THEME_1_NL[] PROGMEM = "Inktblauw";
const char THEME_2_EN[] PROGMEM = "Graphite";  const char THEME_2_NL[] PROGMEM = "Grafiet";
const char THEME_3_EN[] PROGMEM = "Orange";    const char THEME_3_NL[] PROGMEM = "Oranje";
const char THEME_4_EN[] PROGMEM = "Paper";     const char THEME_4_NL[] PROGMEM = "Papier";
const char THEME_5_EN[] PROGMEM = "Classic";   const char THEME_5_NL[] PROGMEM = "Klassiek";

const Theme THEMES[] PROGMEM = {
  // achtergrond      knop               tekst              knoptekst          accent            glans
  {{29, 33, 36},   {31, 111, 100},  {244, 242, 236}, {244, 242, 236}, {224, 115, 46},  {228, 252, 244}, {THEME_0_EN, THEME_0_NL}},
  {{22, 26, 38},   {47, 91, 183},   {240, 242, 248}, {255, 255, 255}, {240, 190, 70},  {225, 236, 255}, {THEME_1_EN, THEME_1_NL}},
  {{24, 24, 24},   {72, 76, 80},    {236, 236, 232}, {250, 250, 246}, {224, 115, 46},  {255, 255, 255}, {THEME_2_EN, THEME_2_NL}},
  {{33, 26, 22},   {200, 92, 36},   {246, 238, 228}, {255, 250, 244}, {47, 91, 183},   {255, 236, 214}, {THEME_3_EN, THEME_3_NL}},
  {{226, 222, 211}, {29, 33, 36},   {29, 33, 36},    {244, 242, 236}, {224, 115, 46},  {255, 255, 255}, {THEME_4_EN, THEME_4_NL}},
  {{5, 5, 5},      {51, 102, 204},  {255, 255, 255}, {255, 255, 255}, {255, 255, 255}, {200, 220, 255}, {THEME_5_EN, THEME_5_NL}},
};
const byte THEME_COUNT = sizeof(THEMES) / sizeof(THEMES[0]);
const byte DEFAULT_THEME = 4; // Papier
byte lcdTheme = DEFAULT_THEME;

// Het blaadje op het opstartscherm is altijd papier met inkt, in elk kleurenschema.
const byte CARD_R = 244, CARD_G = 242, CARD_B = 236;
const byte INK_R = 29, INK_G = 33, INK_B = 36;

void lcd_applyTheme(byte t)
{
  if (t >= THEME_COUNT) t = DEFAULT_THEME;
  lcdTheme = t;
  const Theme *th = &THEMES[t];
  colorDarkRed = pgm_read_byte(&th->background[0]); colorDarkGreen = pgm_read_byte(&th->background[1]); colorDarkBlue = pgm_read_byte(&th->background[2]);
  colorLightRed = pgm_read_byte(&th->button[0]); colorLightGreen = pgm_read_byte(&th->button[1]); colorLightBlue = pgm_read_byte(&th->button[2]);
  colorBrightRed = pgm_read_byte(&th->text[0]); colorBrightGreen = pgm_read_byte(&th->text[1]); colorBrightBlue = pgm_read_byte(&th->text[2]);
  colorButtonTextRed = pgm_read_byte(&th->buttonText[0]); colorButtonTextGreen = pgm_read_byte(&th->buttonText[1]); colorButtonTextBlue = pgm_read_byte(&th->buttonText[2]);
  colorAccentRed = pgm_read_byte(&th->accent[0]); colorAccentGreen = pgm_read_byte(&th->accent[1]); colorAccentBlue = pgm_read_byte(&th->accent[2]);
  colorShineRed = pgm_read_byte(&th->shine[0]); colorShineGreen = pgm_read_byte(&th->shine[1]); colorShineBlue = pgm_read_byte(&th->shine[2]);
}

// Taal van het touchscreen (-ab1). Opgeslagen in de EEPROM.
const byte LANG_EN = 0;
const byte LANG_NL = 1;
const byte LANG_COUNT = 2;
const byte DEFAULT_LANGUAGE = LANG_NL;
byte lcdLanguage = DEFAULT_LANGUAGE;

extern "C" const uint8_t AbButtonFont[];
extern "C" const uint8_t AbLogo[];
extern "C" const uint16_t AbLogoWidth;
extern "C" const uint16_t AbLogoHeight;

extern "C" const uint8_t AbUiHeight;
extern "C" const uint8_t AbUiWidths[];
extern "C" const uint16_t AbUiOffsets[];
extern "C" const uint8_t AbUiData[];

/** Breedte in pixels van een tekst in het Inter-lettertype (-ab2). */
int lcd_textWidth(const char *text)
{
  int w = 0;
  for (const char *p = text; *p; p++) {
    byte c = (byte)*p;
    if (c < 32 || c > 126) c = '?';
    w += pgm_read_byte(&AbUiWidths[c - 32]);
  }
  return w;
}

/** Tekst in het Inter-lettertype met zachte randen (-ab2). De achtergrond moet er al staan:
 *  randpixels worden gemengd tussen tekstkleur (fr,fg,fb) en achtergrondkleur (br,bg,bb). */
void lcd_drawText(const char *text, int x, int y, byte fr, byte fg, byte fb, byte br, byte bg, byte bb)
{
  for (const char *p = text; *p; p++) {
    byte c = (byte)*p;
    if (c < 32 || c > 126) c = '?';
    byte w = pgm_read_byte(&AbUiWidths[c - 32]);
    uint16_t offset = pgm_read_word(&AbUiOffsets[c - 32]);
    uint16_t bit = 0;
    for (byte row = 0; row < AbUiHeight; row++) {
      int runStart = -1;
      byte runLevel = 0;
      for (byte col = 0; col <= w; col++) {
        byte level = 0;
        if (col < w) {
          byte data = pgm_read_byte(&AbUiData[offset + bit / 4]);
          level = (data >> (6 - 2 * (bit % 4))) & 3;
          bit++;
        }
        if (level != runLevel) {
          if (runLevel > 0) {
            lcd.setColor(br + ((int)fr - br) * runLevel / 3, bg + ((int)fg - bg) * runLevel / 3, bb + ((int)fb - bb) * runLevel / 3);
            lcd.fillRect(x + runStart, y + row, x + col - 1, y + row);
          }
          runStart = col;
          runLevel = level;
        }
      }
    }
    x += w;
  }
}

void lcd_drawText(String text, int x, int y, byte fr, byte fg, byte fb, byte br, byte bg, byte bb)
{
  lcd_drawText(text.c_str(), x, y, fr, fg, fb, br, bg, bb);
}

/** Tekst op de achtergrond, in de tekstkleur van het kleurenschema. */
void lcd_drawTextOnBackground(String text, int x, int y)
{
  lcd_drawText(text, x, y, colorBrightRed, colorBrightGreen, colorBrightBlue, colorDarkRed, colorDarkGreen, colorDarkBlue);
}

/** Naam van het kleurenschema in de strook tussen de knoppen (-ab2). */
void lcd_drawThemeName()
{
  char name[20];
  strncpy_P(name, (const char *)pgm_read_ptr(&THEMES[lcdTheme].name[lcdLanguage == LANG_NL ? 1 : 0]), sizeof(name) - 1);
  name[sizeof(name) - 1] = 0;
  String msg = String(lcdLanguage == LANG_NL ? "Kleuren: " : "Colours: ") + name;
  lcd.setColor(colorDarkRed, colorDarkGreen, colorDarkBlue);
  lcd.fillRect(0, buttonCoords[1][1] + 8, 319, buttonCoords[1][1] + 26);
  lcd_drawTextOnBackground(msg, buttonCoords[0][0], buttonCoords[1][1] + 9);
}

/** Scherm leegmaken in de achtergrondkleur (in plaats van zwart). */
void lcd_clear()
{
  lcd.setColor(colorDarkRed, colorDarkGreen, colorDarkBlue);
  lcd.fillRect(0, 0, 319, 239);
}

/** Wacht (maximaal 5 seconden) tot het scherm niet meer wordt aangeraakt (-ab1). */
void lcd_waitForRelease()
{
  unsigned long start = millis();
  while (touch.dataAvailable() && millis() - start < 5000)
  {
    touch.read();
    delay(10);
  }
}

void lcd_processTouchCommand()
{
#ifdef DEBUG_TOUCH
  Serial.println("process touch.");
  Serial.print("3: ");
  Serial.print(touchX);
  Serial.print(",");
  Serial.println(touchY);
#endif
  byte buttonNumber = lcd_getButtonNumber(touchX, touchY);
  lcd_outlinePressedButton(buttonNumber,colorAccentRed,colorAccentGreen,colorAccentBlue);

  byte pressedButton = lcd_getWhichButtonPressed(buttonNumber, currentMenu);
#ifdef DEBUG_TOUCH
  Serial.print("button:");
  Serial.println(pressedButton);
#endif
  switch (pressedButton)
  {
    case BUTTON_POWER_ON:
      lcd_runStartScript();
      lcd_drawButton(BUTTON_POWER_OFF);
      break;
    case BUTTON_POWER_OFF:
      lcd_runEndScript();
      lcd_drawButton(BUTTON_POWER_ON);
      break;
    case BUTTON_DRAW_FROM_SD:
      lcd_drawStoreContentsMenu();
      break;
//    case BUTTON_RESET_SD:
//      root.close();
//      sd_initSD();
//      lcd_drawStoreContentsMenu();
//      break;
    case BUTTON_MORE_RIGHT:
      break;
    case BUTTON_PAUSE_RUNNING:
      currentlyRunning = false;
      lcd_drawButton(BUTTON_RESUME_RUNNING);
      break;
    case BUTTON_RESUME_RUNNING:
      currentlyRunning = true;
      lcd_drawButton(BUTTON_PAUSE_RUNNING);
      break;
    case BUTTON_RESET:
      break;
    case BUTTON_PEN_UP:
      inNoOfParams=0;
      penlift_penUp();
      lcd_drawButton(BUTTON_PEN_DOWN);
      break;
    case BUTTON_PEN_DOWN:
      inNoOfParams=0;
      penlift_penDown();
      lcd_drawButton(BUTTON_PEN_UP);
      break;
    case BUTTON_INC_SPEED:
      exec_setMotorSpeed(currentMaxSpeed + speedChangeIncrement);
      lcd_drawNumberWithBackground(buttonCoords[8][0], centreYPosition, currentMaxSpeed);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_DEC_SPEED:
      exec_setMotorSpeed(currentMaxSpeed - speedChangeIncrement);
      lcd_drawNumberWithBackground(buttonCoords[8][0], centreYPosition, currentMaxSpeed);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_INC_ACCEL:
      exec_setMotorAcceleration(currentAcceleration + accelChangeIncrement);
      lcd_drawNumberWithBackground(buttonCoords[10][0], centreYPosition, currentAcceleration);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_DEC_ACCEL:
      exec_setMotorAcceleration(currentAcceleration - accelChangeIncrement);
      lcd_drawNumberWithBackground(buttonCoords[10][0], centreYPosition, currentAcceleration);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_INC_PENSIZE:
      penWidth = penWidth+penWidthIncrement;
      lcd_drawFloatWithBackground(buttonCoords[10][0], centreYPosition, penWidth);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_DEC_PENSIZE:
      penWidth = penWidth-penWidthIncrement;
      if (penWidth < penWidthIncrement)
        penWidth = penWidthIncrement;
      lcd_drawFloatWithBackground(buttonCoords[10][0], centreYPosition, penWidth);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_INC_PENSIZE_INC:
      penWidthIncrement += 0.005;
      lcd_drawFloatWithBackground(buttonCoords[8][0], centreYPosition, penWidthIncrement);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_DEC_PENSIZE_INC:
      penWidthIncrement -= 0.005;
      if (penWidthIncrement < 0.005)
        penWidthIncrement = 0.005;
      lcd_drawFloatWithBackground(buttonCoords[8][0], centreYPosition, penWidthIncrement);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_TOGGLE_ECHO:
      echoingStoredCommands = !echoingStoredCommands;
      delay(500);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_DRAW_THIS_FILE:
      if (commandFilename != "None" && commandFilename != "" && commandFilename != "            ")
      {
        Serial.print("Drawing this file: ");
        Serial.println(commandFilename);
        currentlyDrawingFromFile = true;
        lcd_drawButton(BUTTON_STOP_FILE);
        // Eerst wachten tot de vinger los is. Anders zag de firmware dezelfde aanraking
        // meteen als een druk op STOP (op dezelfde plek) en brak hij de tekening af (-ab1).
        lcd_waitForRelease();
        displayTouched = false;
        impl_exec_execFromStore(commandFilename);
        lcd_drawButton(pressedButton);
      }
      else
      {
        lcd_drawButton(pressedButton);
      }
      break;
    case BUTTON_STOP_FILE:
      Serial.print("Cancelling drawing this file: ");
      Serial.println(commandFilename);
      currentlyDrawingFromFile = false;
      lcd_drawButton(BUTTON_DRAW_THIS_FILE);
      break;
    case BUTTON_NEXT_FILE:
      // load the next filename
      Serial.println("looking up next filename.");
      commandFilename = lcd_loadFilename(commandFilename, 1);
      lcd_drawCurrentSelectedFilename();
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_PREV_FILE:
      // load the next filename
      Serial.println("looking up previous filename.");
      commandFilename = lcd_loadFilename(commandFilename, -1);
      lcd_drawCurrentSelectedFilename();
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_CANCEL_FILE:
      // return to main menu
      commandFilename = "";
      currentMenu = MENU_INITIAL;
      lcd.setColor(colorLightRed,colorLightGreen,colorLightBlue);
      lcd_clear();
      lcd_drawButtons();
      break;
    case BUTTON_ADJUST_PENSIZE_MENU:
      currentMenu = MENU_ADJUST_PENSIZE;
      lcd.setColor(colorLightRed,colorLightGreen,colorLightBlue);
      lcd_clear();
      lcd_drawButtons();
      break;
    case BUTTON_ADJUST_SPEED_MENU:
      currentMenu = MENU_ADJUST_SPEED;
      lcd.setColor(colorLightRed,colorLightGreen,colorLightBlue);
      lcd_clear();
      lcd_drawButtons();
      break;
    case BUTTON_ADJUST_POSITION_MENU:
      currentMenu = MENU_ADJUST_POSITION;
      lcd.setColor(colorLightRed,colorLightGreen,colorLightBlue);
      lcd_clear();
      lcd_drawButtons();
      break;
    case BUTTON_SETTINGS_MENU:
      currentMenu = MENU_SETTINGS;
      lcd.setColor(colorLightRed,colorLightGreen,colorLightBlue);
      lcd_clear();
      lcd_drawButtons();
      break;
    case BUTTON_SETTINGS_MENU_2:
      currentMenu = MENU_SETTINGS_2;
      lcd.setColor(colorLightRed,colorLightGreen,colorLightBlue);
      lcd_clear();
      lcd_drawButtons();
      break;
    case BUTTON_DONE:
      currentMenu = MENU_INITIAL;
      lcd.setColor(colorLightRed,colorLightGreen,colorLightBlue);
      lcd_clear();
      lcd_drawButtons();
      break;
    case BUTTON_MOVE_INC_A:
      motorA.move(moveIncrement);
      while (motorA.distanceToGo() != 0)
        motorA.run();
      lcd_drawNumberWithBackground(buttonCoords[8][0], centreYPosition, motorA.currentPosition());
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_MOVE_DEC_A:
      motorA.move(0-moveIncrement);
      while (motorA.distanceToGo() != 0)
        motorA.run();
      lcd_drawNumberWithBackground(buttonCoords[8][0], centreYPosition, motorA.currentPosition());
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_MOVE_INC_B:
      motorB.move(moveIncrement);
      while (motorB.distanceToGo() != 0)
        motorB.run();
      lcd_drawNumberWithBackground(buttonCoords[10][0], centreYPosition, motorB.currentPosition());
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_MOVE_DEC_B:
      motorB.move(0-moveIncrement);
      while (motorB.distanceToGo() != 0)
        motorB.run();
      lcd_drawNumberWithBackground(buttonCoords[10][0], centreYPosition, motorB.currentPosition());
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_CALIBRATE:
      calibrate_doCalibration();
      lcd_drawButton(pressedButton);
      break;
      
    case BUTTON_LANGUAGE:
      // Volgende taal, en onthouden (-ab1).
      lcdLanguage = (lcdLanguage + 1) % LANG_COUNT;
      EEPROM.write(EEPROM_LANGUAGE, lcdLanguage);
      lcd_clear();
      lcd_drawButtons();
      break;
    case BUTTON_THEME:
      // Volgend kleurenschema, en onthouden (-ab2).
      lcd_applyTheme((lcdTheme + 1) % THEME_COUNT);
      EEPROM.write(EEPROM_THEME, lcdTheme);
      lcd_clear();
      lcd_drawButtons();
      lcd_drawThemeName();
      break;
    case BUTTON_ADJUST_PENLIFT:
      currentMenu = MENU_ADJUST_PENLIFT;
      lcd.setColor(colorLightRed,colorLightGreen,colorLightBlue);
      lcd_clear();
      lcd_drawButtons();
      break;
    case BUTTON_INC_PENLIFT_UP:
      if (upPosition < 300) {
        upPosition += 1;
        if (isPenUp)
          penlift_movePen(upPosition-15, upPosition, penLiftSpeed);
        else
          penlift_movePen(downPosition, upPosition, penLiftSpeed);
        isPenUp = true;
      }
      lcd_drawNumberWithBackground(buttonCoords[10][0], centreYPosition, upPosition);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_DEC_PENLIFT_UP:
      if (upPosition > 0) {
        upPosition -= 1;
        if (isPenUp)
          penlift_movePen(upPosition+15, upPosition, penLiftSpeed);
        else
          penlift_movePen(downPosition, upPosition, penLiftSpeed);
        isPenUp = true;
      }
      lcd_drawNumberWithBackground(buttonCoords[10][0], centreYPosition, upPosition);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_INC_PENLIFT_DOWN:
      if (downPosition < 300) {
        downPosition += 1;
        if (isPenUp)
          penlift_movePen(upPosition, downPosition, penLiftSpeed);
        else
          penlift_movePen(downPosition-15, downPosition, penLiftSpeed);
        isPenUp = false;
      }
      lcd_drawNumberWithBackground(buttonCoords[8][0], centreYPosition, downPosition);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_DEC_PENLIFT_DOWN:
      if (downPosition > 0) {
        downPosition -= 1;
        if (isPenUp)
          penlift_movePen(upPosition, downPosition, penLiftSpeed);
        else
          penlift_movePen(downPosition+15, downPosition, penLiftSpeed);
        isPenUp = false;
      }
      lcd_drawNumberWithBackground(buttonCoords[8][0], centreYPosition, downPosition);
      lcd_drawButton(pressedButton);
      break;
    case BUTTON_PENLIFT_SAVE_TO_EEPROM:
      Serial.println("HJey");
      EEPROM_writeAnything(EEPROM_PENLIFT_DOWN, downPosition);
      EEPROM_writeAnything(EEPROM_PENLIFT_UP, upPosition);
      eeprom_loadPenLiftRange();
      delay(1000);
      lcd_drawButton(pressedButton);
      break;
  }
}


void lcd_drawNumberWithBackground(int x, int y, long value)
{
  lcd.setColor(colorDarkRed,colorDarkGreen,colorDarkBlue);
  lcd.fillRect(x, y, x+buttonSize, y+20);
  lcd_drawTextOnBackground(String(value), x, y);
}
void lcd_drawFloatWithBackground(int x, int y, float value)
{
  lcd.setColor(colorDarkRed,colorDarkGreen,colorDarkBlue);
  lcd.fillRect(x, y, x+buttonSize, y+20);
  lcd_drawTextOnBackground(String(value, 2), x, y);
}

void lcd_runStartScript()
{
  engageMotors();
  motorA.setCurrentPosition(startLengthStepsA);
  motorB.setCurrentPosition(startLengthStepsB);  
  Serial.println("finished start.");
}
void lcd_runEndScript()
{
  penlift_penUp();
  releaseMotors();
  isCalibrated = false;
}
void lcd_setCurrentMenu(byte menu)
{
  currentMenu = menu;
}

void lcd_displayFirstMenu()
{
  lcd.setColor(colorLightRed,colorLightGreen,colorLightBlue);
  lcd_clear();
  lcd_setCurrentMenu(MENU_INITIAL);
  lcd_drawButtons();
}

void lcd_drawStoreContentsMenu()
{
  lcd.setColor(colorLightRed,colorLightGreen,colorLightBlue);
  lcd_clear();
  lcd_setCurrentMenu(MENU_CHOOSE_FILE);
  lcd_drawButtons();
}

/*
This intialises the LCD itself, and builds the map of the button corner coordinates.
*/
void lcd_initLCD()
{
  lcd.InitLCD(LANDSCAPE);
  lcd_clear();

  
  // output lcd size
//  lcd.printNumI(lcd.getDisplayXSize(), 10, 40);
//  lcd.printNumI(lcd.getDisplayYSize(), 10, 52);


  buttonSize = (lcd.getDisplayXSize() - (gap*4)) / 3;
  grooveSize = lcd.getDisplayYSize() - (gap*2) - (buttonSize*2);


  buttonCoords[0][0] = gap;
  buttonCoords[0][1] = gap;
  buttonCoords[1][0] = gap+buttonSize;
  buttonCoords[1][1] = gap+buttonSize;

  buttonCoords[2][0] = gap+buttonSize+gap;
  buttonCoords[2][1] = gap;
  buttonCoords[3][0] = gap+buttonSize+gap+buttonSize;
  buttonCoords[3][1] = gap+buttonSize;

  buttonCoords[4][0] = gap+buttonSize+gap+buttonSize+gap;
  buttonCoords[4][1] = gap;
  buttonCoords[5][0] = gap+buttonSize+gap+buttonSize+gap+buttonSize;
  buttonCoords[5][1] = gap+buttonSize;

  buttonCoords[6][0] = gap;
  buttonCoords[6][1] = gap+buttonSize+grooveSize;
  buttonCoords[7][0] = gap+buttonSize;
  buttonCoords[7][1] = gap+buttonSize+buttonSize+grooveSize;

  buttonCoords[8][0] = gap+buttonSize+gap;
  buttonCoords[8][1] = gap+buttonSize+grooveSize;
  buttonCoords[9][0] = gap+buttonSize+gap+buttonSize;
  buttonCoords[9][1] = gap+buttonSize+buttonSize+grooveSize;

  buttonCoords[10][0] = gap+buttonSize+gap+buttonSize+gap;
  buttonCoords[10][1] = gap+buttonSize+grooveSize;
  buttonCoords[11][0] = gap+buttonSize+gap+buttonSize+gap+buttonSize;
  buttonCoords[11][1] = gap+buttonSize+buttonSize+grooveSize;

  touch.InitTouch();
  touch.setPrecision(PREC_MEDIUM);

  // Taal uit het geheugen (-ab1); een lege EEPROM (0xFF) geeft de standaardtaal.
  lcdLanguage = EEPROM.read(EEPROM_LANGUAGE);
  if (lcdLanguage >= LANG_COUNT) lcdLanguage = DEFAULT_LANGUAGE;
  lcd_applyTheme(EEPROM.read(EEPROM_THEME));

  lcd_drawSplash();
  
}

/*  Opstartscherm (-ab2): een animatie in de geest van een oude spelcomputer.
    Een papieren blaadje valt op het scherm en veert na, het logo wordt erop "getekend"
    zoals de plotter dat doet, en een lichtstreep glijdt over de letters.
    Per beeld wordt alleen getekend wat verandert, zodat het op de echte machine soepel loopt. */

const int SPLASH_CARD_X = 20;
const int SPLASH_CARD_W = 280;
const int SPLASH_CARD_H = 130;
const int SPLASH_CARD_Y = 40;     // eindpositie bovenkant
const int SPLASH_SHADOW = 5;

/** Tekent de "aan"-pixels van het logo binnen een kolombereik, als horizontale streepjes. */
void lcd_drawLogoSpan(int x0, int y0, int row, int colFrom, int colTo)
{
  int bytesPerRow = AbLogoWidth / 8;
  if (colFrom < 0) colFrom = 0;
  if (colTo > (int)AbLogoWidth) colTo = AbLogoWidth;
  int runStart = -1;
  for (int x = colFrom; x <= colTo; x++) {
    boolean on = false;
    if (x < colTo) on = pgm_read_byte(&AbLogo[row * bytesPerRow + x / 8]) & (0x80 >> (x % 8));
    if (on && runStart < 0) runStart = x;
    if (!on && runStart >= 0) {
      lcd.fillRect(x0 + runStart, y0 + row, x0 + x - 1, y0 + row);
      runStart = -1;
    }
  }
}

/** Het blaadje (met schaduw) op hoogte top; wist het stuk waar het vorige beeld stond. */
void lcd_drawSplashCard(int top, int previousTop)
{
  int x1 = SPLASH_CARD_X, x2 = SPLASH_CARD_X + SPLASH_CARD_W - 1;
  // vrijgekomen stuk boven (bij vallen) of onder (bij terugveren) wissen
  lcd.setColor(colorDarkRed, colorDarkGreen, colorDarkBlue);
  if (top > previousTop) lcd.fillRect(x1, max(previousTop, 0), x2 + SPLASH_SHADOW, min(top, 239));
  else if (top < previousTop) lcd.fillRect(x1, max(top + SPLASH_CARD_H, 0), x2 + SPLASH_SHADOW, min(previousTop + SPLASH_CARD_H + SPLASH_SHADOW, 239));
  // schaduw
  lcd.setColor(12, 14, 16);
  lcd.fillRect(x2 + 1, max(top + SPLASH_SHADOW, 0), x2 + SPLASH_SHADOW, min(top + SPLASH_CARD_H + SPLASH_SHADOW - 1, 239));
  lcd.fillRect(x1 + SPLASH_SHADOW, max(top + SPLASH_CARD_H, 0), x2 + SPLASH_SHADOW, min(top + SPLASH_CARD_H + SPLASH_SHADOW - 1, 239));
  // papier
  lcd.setColor(CARD_R, CARD_G, CARD_B);
  if (top + SPLASH_CARD_H > 0) lcd.fillRect(x1, max(top, 0), x2, min(top + SPLASH_CARD_H - 1, 239));
}

void lcd_drawSplash()
{
  lcd_clear();

  // 1. Het blaadje valt naar beneden (versnellend), en veert twee keer na.
  const int frames[] = { -130, -110, -84, -52, -14, 30, 40, 31, 40, 36, 40 };
  int previous = -SPLASH_CARD_H - SPLASH_SHADOW;
  for (byte i = 0; i < sizeof(frames) / sizeof(frames[0]); i++) {
    lcd_drawSplashCard(frames[i], previous);
    previous = frames[i];
    delay(45);
  }

  // 2. Het logo wordt "getekend", regel voor regel.
  int x0 = (320 - (int)AbLogoWidth) / 2;
  int y0 = SPLASH_CARD_Y + 30;
  lcd.setColor(colorLightRed, colorLightGreen, colorLightBlue);
  for (int row = 0; row < (int)AbLogoHeight; row++) {
    lcd_drawLogoSpan(x0, y0, row, 0, AbLogoWidth);
    delay(24);
  }

  // 3. Lichtstreep schuin over de letters.
  delay(250);
  const int band = 24;
  const int step = 5;
  for (int s = -band; s < (int)AbLogoWidth + (int)AbLogoHeight; s += step) {
    for (int row = 0; row < (int)AbLogoHeight; row++) {
      int start = s - row / 2;
      // vorige positie terug naar de logokleur
      lcd.setColor(colorLightRed, colorLightGreen, colorLightBlue);
      lcd_drawLogoSpan(x0, y0, row, start - step, start);
      // nieuwe positie in het licht
      lcd.setColor(colorShineRed, colorShineGreen, colorShineBlue);
      lcd_drawLogoSpan(x0, y0, row, start, start + band);
    }
    delay(16);
  }
  lcd.setColor(colorLightRed, colorLightGreen, colorLightBlue);
  for (int row = 0; row < (int)AbLogoHeight; row++) lcd_drawLogoSpan(x0, y0, row, 0, AbLogoWidth);

  // 4. Streep, naam en versie.
  int lineY = y0 + AbLogoHeight + 10;
  lcd.setColor(colorAccentRed, colorAccentGreen, colorAccentBlue);
  for (int w = 4; w <= 40; w += 6) {
    lcd.fillRect(x0, lineY, x0 + w, lineY + 3);
    delay(12);
  }
  lcd_drawText("POLARGRAPH", x0, lineY + 10, INK_R, INK_G, INK_B, CARD_R, CARD_G, CARD_B);
  String version = "v" + FIRMWARE_VERSION_NO;
  lcd_drawText(version, x0 + AbLogoWidth - lcd_textWidth(version.c_str()), lineY + 10, 110, 114, 116, CARD_R, CARD_G, CARD_B);

  lcd_drawTextOnBackground(lcdLanguage == LANG_NL ? "Gebaseerd op het werk van Sandy Noble" : "Based on the work of Sandy Noble", SPLASH_CARD_X, 216);
}

void lcd_showSummary()
{
  // Status van de SD-kaart onder het blaadje, in de gekozen taal en kleuren (-ab2).
  boolean nl = lcdLanguage == LANG_NL;
  String msg;
  if (!cardPresent) msg = nl ? "Geen SD-kaart gevonden" : "No SD card found";
  else if (!cardInit) msg = nl ? "SD-kaart niet leesbaar" : "SD card could not be read";
  else if (useAutoStartFromSD && autoStartFileFound) msg = (nl ? "Start automatisch: " : "Starting: ") + autoStartFilename;
  else msg = nl ? "SD-kaart klaar" : "SD card ready";
  lcd_drawTextOnBackground(msg, SPLASH_CARD_X, 192);
}

void lcd_drawButtons()
{
  lcd.setBackColor(colorLightRed,colorLightGreen,colorLightBlue);
  lcd.setColor(colorDarkRed,colorDarkGreen,colorDarkBlue);

  if (currentMenu == MENU_INITIAL)
  {
    if (powerIsOn)
      lcd_drawButton(BUTTON_POWER_OFF);
    else
      lcd_drawButton(BUTTON_POWER_ON);
    
    if (cardInit)
      lcd_drawButton(BUTTON_DRAW_FROM_SD);
      
    if (canCalibrate)  
      lcd_drawButton(BUTTON_CALIBRATE);
      
    if (isPenUp)
      lcd_drawButton(BUTTON_PEN_DOWN);
    else
      lcd_drawButton(BUTTON_PEN_UP);
    
    if (currentlyRunning)
      lcd_drawButton(BUTTON_PAUSE_RUNNING);
    else
      lcd_drawButton(BUTTON_RESUME_RUNNING);
      
    lcd_drawButton(BUTTON_SETTINGS_MENU);
    
  }
  else if (currentMenu == MENU_RUNNING)
  {
    lcd_drawButton(BUTTON_ADJUST_SPEED_MENU);
    lcd_drawButton(BUTTON_ADJUST_PENSIZE_MENU);
    
    if (currentlyRunning)
      lcd_drawButton(BUTTON_PAUSE_RUNNING);
    else
      lcd_drawButton(BUTTON_RESUME_RUNNING);
  }
  else if (currentMenu == MENU_CHOOSE_FILE)
  {
    lcd_drawButton(BUTTON_RESET_SD);
    lcd_drawButton(BUTTON_NEXT_FILE);
    lcd_drawButton(BUTTON_PREV_FILE);
    if (currentlyDrawingFromFile) 
      lcd_drawButton(BUTTON_STOP_FILE);
    else
      lcd_drawButton(BUTTON_DRAW_THIS_FILE);
    lcd_drawButton(BUTTON_CANCEL_FILE);
    lcd_drawCurrentSelectedFilename();
  }
  else if (currentMenu == MENU_ADJUST_SPEED)
  {
    lcd_drawButton(BUTTON_INC_SPEED);
    lcd_drawButton(BUTTON_DEC_SPEED);
    lcd_drawButton(BUTTON_INC_ACCEL);
    lcd_drawButton(BUTTON_DEC_ACCEL);
    lcd_drawButton(BUTTON_DONE);
    lcd_drawNumberWithBackground(buttonCoords[8][0], centreYPosition, currentMaxSpeed);
    lcd_drawNumberWithBackground(buttonCoords[10][0], centreYPosition, currentAcceleration);
  }
  else if (currentMenu == MENU_ADJUST_PENSIZE)
  {
    lcd_drawButton(BUTTON_INC_PENSIZE);
    lcd_drawButton(BUTTON_DEC_PENSIZE);
    lcd_drawButton(BUTTON_INC_PENSIZE_INC);
    lcd_drawButton(BUTTON_DEC_PENSIZE_INC);
    lcd_drawButton(BUTTON_DONE);
    lcd_drawFloatWithBackground(buttonCoords[8][0], centreYPosition, penWidthIncrement);
    lcd_drawFloatWithBackground(buttonCoords[10][0], centreYPosition, penWidth);
  }
  else if (currentMenu == MENU_ADJUST_POSITION)
  {
    lcd_drawButton(BUTTON_MOVE_INC_A);
    lcd_drawButton(BUTTON_MOVE_DEC_A);
    lcd_drawButton(BUTTON_MOVE_INC_B);
    lcd_drawButton(BUTTON_MOVE_DEC_B);
    lcd_drawButton(BUTTON_DONE);
    lcd_drawNumberWithBackground(buttonCoords[8][0], centreYPosition, motorA.currentPosition());
    lcd_drawNumberWithBackground(buttonCoords[10][0], centreYPosition, motorB.currentPosition());
  }
  else if (currentMenu == MENU_SETTINGS)
  {
    lcd_drawButton(BUTTON_ADJUST_POSITION_MENU);
    lcd_drawButton(BUTTON_DONE);
    lcd_drawButton(BUTTON_ADJUST_SPEED_MENU);
    lcd_drawButton(BUTTON_ADJUST_PENSIZE_MENU);
    lcd_drawButton(BUTTON_TOGGLE_ECHO);
    lcd_drawButton(BUTTON_SETTINGS_MENU_2);
  }
  else if (currentMenu == MENU_SETTINGS_2)
  {
    lcd_drawButton(BUTTON_ADJUST_PENLIFT);
    lcd_drawButton(BUTTON_LANGUAGE);
    lcd_drawButton(BUTTON_THEME);
    lcd_drawButton(BUTTON_DONE);
    lcd_drawThemeName();
  }
  else if (currentMenu == MENU_ADJUST_PENLIFT)
  {
    lcd_drawButton(BUTTON_INC_PENLIFT_UP);
    lcd_drawButton(BUTTON_DEC_PENLIFT_UP);
    lcd_drawButton(BUTTON_INC_PENLIFT_DOWN);
    lcd_drawButton(BUTTON_DEC_PENLIFT_DOWN);
    lcd_drawButton(BUTTON_PENLIFT_SAVE_TO_EEPROM);
    lcd_drawButton(BUTTON_DONE);
    lcd_drawNumberWithBackground(buttonCoords[8][0], centreYPosition, downPosition);
    lcd_drawNumberWithBackground(buttonCoords[10][0], centreYPosition, upPosition);
  }
}

void lcd_drawButtonBackground(byte coordsIndex)
{
  lcd.setColor(colorLightRed,colorLightGreen,colorLightBlue);
  lcd.fillRect(buttonCoords[coordsIndex][0], buttonCoords[coordsIndex][1], 
    buttonCoords[coordsIndex+1][0], buttonCoords[coordsIndex+1][1]);
    
  // set the colours to write the text
  lcd.setBackColor(colorLightRed,colorLightGreen,colorLightBlue);
  lcd.setColor(colorBrightRed,colorBrightGreen,colorBrightBlue);
}
void lcd_outlinePressedButton(byte pressedButton, byte r, byte g, byte b)
{
  Serial.println("Outlining.");
  if (pressedButton >= 1 && pressedButton <=6)
  {
    byte coordsIndex = (pressedButton * 2)-2;
    lcd.setColor(r,g,b);
    lcd.drawRect(buttonCoords[coordsIndex][0], buttonCoords[coordsIndex][1], 
      buttonCoords[coordsIndex+1][0], buttonCoords[coordsIndex+1][1]-1);
    lcd.drawRect(buttonCoords[coordsIndex][0]+1, buttonCoords[coordsIndex][1]+1, 
      buttonCoords[coordsIndex+1][0]-1, buttonCoords[coordsIndex+1][1]-2);
    lcd.setBackColor(colorLightRed,colorLightGreen,colorLightBlue);
    lcd.setColor(colorDarkRed,colorDarkGreen,colorDarkBlue);
  }
  Serial.println("Outlined!");
}
/*  Knoppen (-ab1): positie en tekst per taal in één tabel, in het flashgeheugen.
    Positie: 0 = linksboven, 2 = midden boven, 4 = rechtsboven, 6/8/10 = onderste rij.
    Een regel per knop is maximaal 11 tekens; "\\n" begint een nieuwe regel.
    Nieuwe taal: LANG_COUNT ophogen en per knop een tekst toevoegen. */
// BEGIN KNOPTEKSTEN (gemaakt door tools/labels.py)
const char LBL_0_EN[] PROGMEM = "Set\nhome";
const char LBL_0_NL[] PROGMEM = "Home\nzetten";
const char LBL_1_EN[] PROGMEM = "Motors\non";
const char LBL_1_NL[] PROGMEM = "Motoren\naan";
const char LBL_2_EN[] PROGMEM = "Motors\noff";
const char LBL_2_NL[] PROGMEM = "Motoren\nuit";
const char LBL_3_EN[] PROGMEM = "Show\nmessages";
const char LBL_3_NL[] PROGMEM = "Toon\nberichten";
const char LBL_4_EN[] PROGMEM = "Pen lift";
const char LBL_4_NL[] PROGMEM = "Penlift";
const char LBL_5_EN[] PROGMEM = "Draw\nfrom SD";
const char LBL_5_NL[] PROGMEM = "Tekenen\nvan SD";
const char LBL_6_EN[] PROGMEM = "More";
const char LBL_6_NL[] PROGMEM = "Meer";
const char LBL_7_EN[] PROGMEM = "Calibrate";
const char LBL_7_NL[] PROGMEM = "Kalibreren";
const char LBL_8_EN[] PROGMEM = "Pause";
const char LBL_8_NL[] PROGMEM = "Pauze";
const char LBL_9_EN[] PROGMEM = "Resume";
const char LBL_9_NL[] PROGMEM = "Doorgaan";
const char LBL_10_EN[] PROGMEM = "Reset";
const char LBL_10_NL[] PROGMEM = "Reset";
const char LBL_11_EN[] PROGMEM = "Pen\nup";
const char LBL_11_NL[] PROGMEM = "Pen\nomhoog";
const char LBL_12_EN[] PROGMEM = "Pen\ndown";
const char LBL_12_NL[] PROGMEM = "Pen\nomlaag";
const char LBL_13_EN[] PROGMEM = "Previous\nfile";
const char LBL_13_NL[] PROGMEM = "Vorig\nbestand";
const char LBL_14_EN[] PROGMEM = "Next\nfile";
const char LBL_14_NL[] PROGMEM = "Volgend\nbestand";
const char LBL_15_EN[] PROGMEM = "Back";
const char LBL_15_NL[] PROGMEM = "Terug";
const char LBL_16_EN[] PROGMEM = "Draw\nthis file";
const char LBL_16_NL[] PROGMEM = "Teken dit\nbestand";
const char LBL_17_EN[] PROGMEM = "Stop\ndrawing";
const char LBL_17_NL[] PROGMEM = "Stop\ntekenen";
const char LBL_18_EN[] PROGMEM = "Settings";
const char LBL_18_NL[] PROGMEM = "Instellingen";
const char LBL_19_EN[] PROGMEM = "More\nsettings";
const char LBL_19_NL[] PROGMEM = "Meer\ninstellingen";
const char LBL_20_EN[] PROGMEM = "Slower";
const char LBL_20_NL[] PROGMEM = "Langzamer";
const char LBL_21_EN[] PROGMEM = "Faster";
const char LBL_21_NL[] PROGMEM = "Sneller";
const char LBL_22_EN[] PROGMEM = "Accel.\nlower";
const char LBL_22_NL[] PROGMEM = "Optrekken\nrustiger";
const char LBL_23_EN[] PROGMEM = "Accel.\nhigher";
const char LBL_23_NL[] PROGMEM = "Optrekken\nsneller";
const char LBL_24_EN[] PROGMEM = "Step\nsmaller";
const char LBL_24_NL[] PROGMEM = "Stap\nkleiner";
const char LBL_25_EN[] PROGMEM = "Step\nlarger";
const char LBL_25_NL[] PROGMEM = "Stap\ngroter";
const char LBL_26_EN[] PROGMEM = "Pen size\nsmaller";
const char LBL_26_NL[] PROGMEM = "Pendikte\nkleiner";
const char LBL_27_EN[] PROGMEM = "Pen size\nlarger";
const char LBL_27_NL[] PROGMEM = "Pendikte\ngroter";
const char LBL_28_EN[] PROGMEM = "Done";
const char LBL_28_NL[] PROGMEM = "Klaar";
const char LBL_29_EN[] PROGMEM = "Pen size";
const char LBL_29_NL[] PROGMEM = "Pendikte";
const char LBL_30_EN[] PROGMEM = "Speed";
const char LBL_30_NL[] PROGMEM = "Snelheid";
const char LBL_31_EN[] PROGMEM = "Position";
const char LBL_31_NL[] PROGMEM = "Positie";
const char LBL_32_EN[] PROGMEM = "Cord A\nshorter";
const char LBL_32_NL[] PROGMEM = "Koord A\nkorter";
const char LBL_33_EN[] PROGMEM = "Cord A\nlonger";
const char LBL_33_NL[] PROGMEM = "Koord A\nlanger";
const char LBL_34_EN[] PROGMEM = "Cord B\nshorter";
const char LBL_34_NL[] PROGMEM = "Koord B\nkorter";
const char LBL_35_EN[] PROGMEM = "Cord B\nlonger";
const char LBL_35_NL[] PROGMEM = "Koord B\nlanger";
const char LBL_36_EN[] PROGMEM = "Pen down\n-";
const char LBL_36_NL[] PROGMEM = "Omlaag\n-";
const char LBL_37_EN[] PROGMEM = "Pen down\n+";
const char LBL_37_NL[] PROGMEM = "Omlaag\n+";
const char LBL_38_EN[] PROGMEM = "Pen up\n-";
const char LBL_38_NL[] PROGMEM = "Omhoog\n-";
const char LBL_39_EN[] PROGMEM = "Pen up\n+";
const char LBL_39_NL[] PROGMEM = "Omhoog\n+";
const char LBL_40_EN[] PROGMEM = "Save";
const char LBL_40_NL[] PROGMEM = "Opslaan";
const char LBL_41_EN[] PROGMEM = "Language\nEnglish";
const char LBL_41_NL[] PROGMEM = "Taal\nNederlands";
const char LBL_42_EN[] PROGMEM = "Colours";
const char LBL_42_NL[] PROGMEM = "Kleuren";
// EIND KNOPTEKSTEN

struct ButtonLabel {
  byte id;
  byte coordsIndex;
  const char *text[LANG_COUNT];
};

const ButtonLabel BUTTON_LABELS[] PROGMEM = {
// BEGIN KNOPTABEL (gemaakt door tools/labels.py)
  {BUTTON_SET_HOME, 0, {LBL_0_EN, LBL_0_NL}},
  {BUTTON_POWER_ON, 0, {LBL_1_EN, LBL_1_NL}},
  {BUTTON_POWER_OFF, 0, {LBL_2_EN, LBL_2_NL}},
  {BUTTON_TOGGLE_ECHO, 0, {LBL_3_EN, LBL_3_NL}},
  {BUTTON_ADJUST_PENLIFT, 0, {LBL_4_EN, LBL_4_NL}},
  {BUTTON_DRAW_FROM_SD, 2, {LBL_5_EN, LBL_5_NL}},
  {BUTTON_MORE_RIGHT, 4, {LBL_6_EN, LBL_6_NL}},
  {BUTTON_CALIBRATE, 4, {LBL_7_EN, LBL_7_NL}},
  {BUTTON_PAUSE_RUNNING, 6, {LBL_8_EN, LBL_8_NL}},
  {BUTTON_RESUME_RUNNING, 6, {LBL_9_EN, LBL_9_NL}},
  {BUTTON_RESET, 4, {LBL_10_EN, LBL_10_NL}},
  {BUTTON_PEN_UP, 8, {LBL_11_EN, LBL_11_NL}},
  {BUTTON_PEN_DOWN, 8, {LBL_12_EN, LBL_12_NL}},
  {BUTTON_PREV_FILE, 2, {LBL_13_EN, LBL_13_NL}},
  {BUTTON_NEXT_FILE, 8, {LBL_14_EN, LBL_14_NL}},
  {BUTTON_CANCEL_FILE, 6, {LBL_15_EN, LBL_15_NL}},
  {BUTTON_DRAW_THIS_FILE, 10, {LBL_16_EN, LBL_16_NL}},
  {BUTTON_STOP_FILE, 10, {LBL_17_EN, LBL_17_NL}},
  {BUTTON_SETTINGS_MENU, 10, {LBL_18_EN, LBL_18_NL}},
  {BUTTON_SETTINGS_MENU_2, 10, {LBL_19_EN, LBL_19_NL}},
  {BUTTON_DEC_SPEED, 2, {LBL_20_EN, LBL_20_NL}},
  {BUTTON_INC_SPEED, 8, {LBL_21_EN, LBL_21_NL}},
  {BUTTON_DEC_ACCEL, 4, {LBL_22_EN, LBL_22_NL}},
  {BUTTON_INC_ACCEL, 10, {LBL_23_EN, LBL_23_NL}},
  {BUTTON_DEC_PENSIZE_INC, 2, {LBL_24_EN, LBL_24_NL}},
  {BUTTON_INC_PENSIZE_INC, 8, {LBL_25_EN, LBL_25_NL}},
  {BUTTON_DEC_PENSIZE, 4, {LBL_26_EN, LBL_26_NL}},
  {BUTTON_INC_PENSIZE, 10, {LBL_27_EN, LBL_27_NL}},
  {BUTTON_DONE, 6, {LBL_28_EN, LBL_28_NL}},
  {BUTTON_ADJUST_PENSIZE_MENU, 4, {LBL_29_EN, LBL_29_NL}},
  {BUTTON_ADJUST_SPEED_MENU, 8, {LBL_30_EN, LBL_30_NL}},
  {BUTTON_ADJUST_POSITION_MENU, 2, {LBL_31_EN, LBL_31_NL}},
  {BUTTON_MOVE_DEC_A, 2, {LBL_32_EN, LBL_32_NL}},
  {BUTTON_MOVE_INC_A, 8, {LBL_33_EN, LBL_33_NL}},
  {BUTTON_MOVE_DEC_B, 4, {LBL_34_EN, LBL_34_NL}},
  {BUTTON_MOVE_INC_B, 10, {LBL_35_EN, LBL_35_NL}},
  {BUTTON_DEC_PENLIFT_DOWN, 2, {LBL_36_EN, LBL_36_NL}},
  {BUTTON_INC_PENLIFT_DOWN, 8, {LBL_37_EN, LBL_37_NL}},
  {BUTTON_DEC_PENLIFT_UP, 4, {LBL_38_EN, LBL_38_NL}},
  {BUTTON_INC_PENLIFT_UP, 10, {LBL_39_EN, LBL_39_NL}},
  {BUTTON_PENLIFT_SAVE_TO_EEPROM, 0, {LBL_40_EN, LBL_40_NL}},
  {BUTTON_LANGUAGE, 2, {LBL_41_EN, LBL_41_NL}},
  {BUTTON_THEME, 4, {LBL_42_EN, LBL_42_NL}},
// EIND KNOPTABEL
};

/** Tekst in het midden van een knop, met regels onder elkaar (-ab2: Inter, zachte randen). */
void lcd_drawButtonText(byte coordsIndex, const char *progmemText)
{
  char buf[40];
  strncpy_P(buf, progmemText, sizeof(buf) - 1);
  buf[sizeof(buf) - 1] = 0;

  const int lineH = AbUiHeight + 1;
  byte lines = 1;
  for (byte i = 0; buf[i]; i++) if (buf[i] == '\n') lines++;

  int left = buttonCoords[coordsIndex][0];
  int top = buttonCoords[coordsIndex][1];
  int y = top + (buttonSize - lines * lineH) / 2 + 1;
  char *line = buf;
  while (line) {
    char *next = strchr(line, '\n');
    if (next) *next = 0;
    int width = lcd_textWidth(line);
    lcd_drawText(line, left + (buttonSize - width) / 2, y,
      colorButtonTextRed, colorButtonTextGreen, colorButtonTextBlue,
      colorLightRed, colorLightGreen, colorLightBlue);
    y += lineH;
    line = next ? next + 1 : NULL;
  }
}

void lcd_drawButton(byte but)
{
  for (byte i = 0; i < sizeof(BUTTON_LABELS) / sizeof(BUTTON_LABELS[0]); i++)
  {
    if (pgm_read_byte(&BUTTON_LABELS[i].id) != but) continue;
    byte coordsIndex = pgm_read_byte(&BUTTON_LABELS[i].coordsIndex);
    const char *text = (const char *)pgm_read_ptr(&BUTTON_LABELS[i].text[lcdLanguage < LANG_COUNT ? lcdLanguage : 0]);
    lcd_drawButtonBackground(coordsIndex);
    lcd_drawButtonText(coordsIndex, text);
    return;
  }
}

void lcd_displayMachineSpec()
{
  lcd.setColor(colorDarkRed,colorDarkGreen,colorDarkBlue);
  lcd_clear();
  lcd.fillRect(10, 10, 210, 166);
  lcd.setBackColor(colorDarkRed,colorDarkGreen,colorDarkBlue);
  lcd.setColor(colorBrightRed,colorBrightGreen,colorBrightBlue);
  
  const int ROW_HEIGHT = 12;
  int currentRow = 30;
  byte key = 20;
  byte val = 130;
  
  lcd.print("Width: ", key, currentRow);
  lcd.printNumI(machineWidth, val, currentRow);
  
  currentRow += ROW_HEIGHT;
  lcd.print("Height:", key, currentRow);
  lcd.printNumI(machineHeight, val, currentRow);

  currentRow += ROW_HEIGHT;
  lcd.print("MmPerRev:", key, currentRow);
  lcd.printNumF(mmPerRev, 5, val, currentRow);

  currentRow += ROW_HEIGHT;
  lcd.print("StepsPerRev:", key, currentRow);
  lcd.printNumI(motorStepsPerRev, val, currentRow);

  currentRow += ROW_HEIGHT;
  lcd.print("MmPerStep:", key, currentRow);
  lcd.printNumF(mmPerStep,5, val, currentRow);

  currentRow += ROW_HEIGHT;
  lcd.print("StepsPerMM:", key, currentRow);
  lcd.printNumF(stepsPerMM,5, val, currentRow);

  currentRow += ROW_HEIGHT;
  lcd.print("StepMulti:", key, currentRow);
  lcd.printNumI(stepMultiplier,val, currentRow);
  
  currentRow += ROW_HEIGHT;
  lcd.print("PageWidth:", key, currentRow);
  lcd.printNumI(pageWidth, val, currentRow);

  currentRow += ROW_HEIGHT;
  lcd.print("PageHeight:", key, currentRow);
  lcd.printNumI(pageHeight, val, currentRow);


  currentRow += ROW_HEIGHT;
  lcd.print("Name:", key, currentRow);
  lcd.print(machineName, val, currentRow);
  
}


void lcd_drawCurrentSelectedFilename()
{
  // erase the previous stuff
  lcd.setColor(colorDarkRed,colorDarkGreen,colorDarkBlue);
  lcd.fillRect(buttonCoords[0][0],buttonCoords[1][1]+8, screenWidth, buttonCoords[1][1]+26);

  // see if there's one already found
  String msg = lcdLanguage == LANG_NL ? "Geen SD-kaart" : "No card found";

  if (commandFilename == "" || commandFilename == "            ")
  {
    if (cardInit) {
      commandFilename = lcd_loadFilename("", 1);
      msg = commandFilename;
    }
  }
  else
  {
    msg = commandFilename;
  }
  
  if (msg == "None") msg = lcdLanguage == LANG_NL ? "Geen tekenbestanden" : "No drawing files";
  lcd_drawTextOnBackground(msg, buttonCoords[0][0], buttonCoords[1][1]+9);
}

/** Hoort dit bestand in de lijst op het touchscreen? (-ab1)
 *  Alleen .TXT-bestanden. Geen mappen en geen verborgen bestanden, zoals de
 *  "._naam"-bestanden die een Mac op de SD-kaart zet (die beginnen met _ of .). */
boolean lcd_isDrawableFile(File &entry)
{
  if (!entry || entry.isDirectory()) return false;
  String name = entry.name();
  if (name.length() < 5) return false;
  char first = name.charAt(0);
  if (first == '_' || first == '.' || first == '~') return false;
  name.toUpperCase();
  return name.endsWith(".TXT");
}

String lcd_loadFilename(String selectedFilename, int direction)
{
  Serial.print("Current command filename: ");
  Serial.println(selectedFilename);

  root.rewindDirectory();
  String first = "";
  String previous = "";
  String result = selectedFilename;
  boolean foundSelected = false;

  while (true) {
    File entry = root.openNextFile();
    if (!entry) break;
    if (!lcd_isDrawableFile(entry)) {
      entry.close();
      continue;
    }
    String name = entry.name();
    entry.close();

    if (first == "") first = name;
    if (selectedFilename == "") {
      result = name;
      break;
    }
    if (foundSelected) {
      // Het bestand na het geselecteerde.
      if (direction > 0) result = name;
      break;
    }
    if (selectedFilename.equals(name)) {
      foundSelected = true;
      if (direction < 0) {
        if (previous != "") result = previous;
        break;
      }
      if (direction == 0) break;
    }
    previous = name;
  }
  // Het geselecteerde bestand bestaat niet (meer): begin bij het eerste.
  if (!foundSelected && selectedFilename != "") result = first;
  if (result == "") result = "None";

  Serial.print("Now command filename: ");
  Serial.println(result);
  return result;
}


void lcd_echoLastCommandToDisplay(String com, String prefix)
{
  if (currentMenu != MENU_INITIAL) return;
  
  lcd.setColor(colorDarkRed,colorDarkGreen,colorDarkBlue);
  lcd.fillRect(buttonCoords[0][0],buttonCoords[1][1]+8, screenWidth, buttonCoords[1][1]+26);
  lcd_drawTextOnBackground(prefix + com, buttonCoords[0][0], buttonCoords[1][1]+9);
}

byte lcd_getWhichButtonPressed(byte buttonNumber, byte menu)
{
  if (currentMenu == MENU_INITIAL)
  {
    switch (buttonNumber)
    {
      case 1: 
        if (powerIsOn) return BUTTON_POWER_OFF;
        else return BUTTON_POWER_ON; 
        break;
      case 2: 
        if (cardInit) return BUTTON_DRAW_FROM_SD;
        break;
      case 3: if (canCalibrate) { return BUTTON_CALIBRATE; } break;
      case 4:
        if (currentlyRunning) return BUTTON_PAUSE_RUNNING;
        else return BUTTON_RESUME_RUNNING;
      case 5: 
        if (isPenUp) return BUTTON_PEN_DOWN;
        else return BUTTON_PEN_UP; 
        break;
      case 6:
        return BUTTON_SETTINGS_MENU;
        break;
    }
  }
  else if (currentMenu == MENU_ADJUST_SPEED)
  {
    switch (buttonNumber)
    {
      case 2: return BUTTON_DEC_SPEED; break;
      case 5: return BUTTON_INC_SPEED; break;
      case 4: return BUTTON_DONE; break;
      case 3: return BUTTON_DEC_ACCEL; break;
      case 6: return BUTTON_INC_ACCEL; break;
    }
  }
  else if (currentMenu == MENU_ADJUST_PENSIZE)
  {
    switch (buttonNumber)
    {
      case 2: return BUTTON_DEC_PENSIZE_INC; break;
      case 5: return BUTTON_INC_PENSIZE_INC; break;
      case 4: return BUTTON_DONE; break;
      case 3: return BUTTON_DEC_PENSIZE; break;
      case 6: return BUTTON_INC_PENSIZE; break;
    }
  }
  else if (currentMenu == MENU_ADJUST_POSITION)
  {
    switch (buttonNumber)
    {
      case 2: return BUTTON_MOVE_DEC_A; break;
      case 5: return BUTTON_MOVE_INC_A; break;
      case 4: return BUTTON_DONE; break;
      case 3: return BUTTON_MOVE_DEC_B; break;
      case 6: return BUTTON_MOVE_INC_B; break;
    }
  }
  else if (currentMenu == MENU_ADJUST_PENLIFT)
  {
    switch (buttonNumber)
    {
      case 1: return BUTTON_PENLIFT_SAVE_TO_EEPROM; break;
      case 2: return BUTTON_DEC_PENLIFT_DOWN; break;
      case 3: return BUTTON_DEC_PENLIFT_UP; break;
      case 4: return BUTTON_DONE; break;
      case 5: return BUTTON_INC_PENLIFT_DOWN; break;
      case 6: return BUTTON_INC_PENLIFT_UP; break;
    }
  }
  else if (currentMenu == MENU_CHOOSE_FILE)
  {
    switch (buttonNumber)
    {
      case 2: return BUTTON_PREV_FILE; break;
      case 4: return BUTTON_CANCEL_FILE; break;
      case 5: return BUTTON_NEXT_FILE; break;
      case 6: 
        if (currentlyDrawingFromFile) return BUTTON_STOP_FILE;
        else return BUTTON_DRAW_THIS_FILE; 
        break;
    }
  }
  else if (currentMenu == MENU_SETTINGS)
  {
    switch (buttonNumber)
    {
      case 1: return BUTTON_TOGGLE_ECHO; break;
      case 2: return BUTTON_ADJUST_POSITION_MENU; break;
      case 3: return BUTTON_ADJUST_PENSIZE_MENU; break;
      case 4: return BUTTON_DONE; break;
      case 5: return BUTTON_ADJUST_SPEED_MENU; break;
      case 6: return BUTTON_SETTINGS_MENU_2; break;
    }
  }
  else if (currentMenu == MENU_SETTINGS_2)
  {
    switch (buttonNumber)
    {
      case 1: return BUTTON_ADJUST_PENLIFT; break;
      case 2: return BUTTON_LANGUAGE; break;
      case 3: return BUTTON_THEME; break;
      case 4: return BUTTON_DONE; break;
    }
  }
}

byte lcd_getButtonNumber(int x, int y)
{
  Serial.print("X:");
  Serial.print(x);
  Serial.print(", Y:");
  Serial.println(y);
  if (x >= buttonCoords[0][0] && x <= buttonCoords[1][0] 
     && y >= buttonCoords[0][1] && y <= buttonCoords[1][1])
    return 1;
  else if (x >= buttonCoords[2][0] && x <= buttonCoords[3][0] 
     && y >= buttonCoords[2][1] && y <= buttonCoords[1][1])
    return 2;   
  else if (x >= buttonCoords[4][0] && x <= buttonCoords[5][0] 
     && y >= buttonCoords[4][1] && y <= buttonCoords[5][1])
    return 3;   

  else if (x >= buttonCoords[6][0] && x <= buttonCoords[7][0] 
     && y >= buttonCoords[6][1] && y <= buttonCoords[7][1])
     return 4;
  else if (x >= buttonCoords[8][0] && x <= buttonCoords[9][0] 
     && y >= buttonCoords[8][1] && y <= buttonCoords[9][1])
     return 5;
  else if (x >= buttonCoords[10][0] && x <= buttonCoords[11][0] 
     && y >= buttonCoords[10][1] && y <= buttonCoords[11][1])
    return 6;
}
