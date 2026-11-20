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

/*  Kleuren van het touchscreen (Atelier Bakema, -ab1).
    Light  = knoppen, Dark = achtergrond, Bright = tekst. Pas hier aan voor een ander kleurenschema.
    (Voorheen kreeg de knopkleur een "willekeurige" waarde.) */
byte colorLightRed = 31;     // knop: diep groenblauw  #1F6F64
byte colorLightGreen = 111;
byte colorLightBlue = 100;

byte colorDarkRed = 29;      // achtergrond: inkt  #1D2124
byte colorDarkGreen = 33;
byte colorDarkBlue = 36;

byte colorBrightRed = 244;   // tekst: papier  #F4F2EC
byte colorBrightGreen = 242;
byte colorBrightBlue = 236;

const byte colorAccentRed = 224;   // ingedrukte knop: oranje  #E0732E
const byte colorAccentGreen = 115;
const byte colorAccentBlue = 46;

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
  lcd.setColor(colorBrightRed,colorBrightGreen,colorBrightBlue);
  lcd.setBackColor(colorDarkRed,colorDarkGreen,colorDarkBlue);
  lcd.printNumI(value, x, y);
}
void lcd_drawFloatWithBackground(int x, int y, float value)
{
  lcd.setColor(colorDarkRed,colorDarkGreen,colorDarkBlue);
  lcd.fillRect(x, y, x+buttonSize, y+20);
  lcd.setColor(colorBrightRed,colorBrightGreen,colorBrightBlue);
  lcd.setBackColor(colorDarkRed,colorDarkGreen,colorDarkBlue);
  lcd.printNumF(value, 2, x, y);
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

  lcd_drawSplash();
  
}

/** Opstartscherm (-ab1): Atelier Bakema-logo op papierkleur, met de versie. */
void lcd_drawSplash()
{
  // papier
  lcd.setColor(colorBrightRed, colorBrightGreen, colorBrightBlue);
  lcd.fillRect(0, 0, 319, 239);

  // logo, regel voor regel als horizontale streepjes (snel op het echte scherm)
  int x0 = (320 - (int)AbLogoWidth) / 2;
  int y0 = 70;
  int bytesPerRow = AbLogoWidth / 8;
  lcd.setColor(colorDarkRed, colorDarkGreen, colorDarkBlue);
  for (int y = 0; y < (int)AbLogoHeight; y++) {
    int runStart = -1;
    for (int x = 0; x <= (int)AbLogoWidth; x++) {
      boolean on = false;
      if (x < (int)AbLogoWidth) on = pgm_read_byte(&AbLogo[y * bytesPerRow + x / 8]) & (0x80 >> (x % 8));
      if (on && runStart < 0) runStart = x;
      if (!on && runStart >= 0) {
        lcd.fillRect(x0 + runStart, y0 + y, x0 + x - 1, y0 + y);
        runStart = -1;
      }
    }
  }

  // streep in de knopkleur, en "POLARGRAPH" eronder
  lcd.setColor(colorLightRed, colorLightGreen, colorLightBlue);
  lcd.fillRect(x0, y0 + AbLogoHeight + 12, x0 + 40, y0 + AbLogoHeight + 15);
  lcd.setColor(colorDarkRed, colorDarkGreen, colorDarkBlue);
  lcd.setBackColor(colorBrightRed, colorBrightGreen, colorBrightBlue);
  lcd.setFont((uint8_t *)AbButtonFont);
  lcd.print("POLARGRAPH", x0, y0 + AbLogoHeight + 24);
  lcd.setFont(SmallFont);
  lcd.print("v" + FIRMWARE_VERSION_NO, x0, y0 + AbLogoHeight + 44);
  lcd.print("Gebaseerd op het werk van Sandy Noble", x0, 222);
}

void lcd_showSummary()
{
  // Status van de SD-kaart onder het logo, in de gekozen taal (-ab1).
  boolean nl = lcdLanguage == LANG_NL;
  int y = 196;
  lcd.setColor(colorDarkRed, colorDarkGreen, colorDarkBlue);
  lcd.setBackColor(colorBrightRed, colorBrightGreen, colorBrightBlue);
  lcd.setFont(SmallFont);
  int x = (320 - (int)AbLogoWidth) / 2;
  if (!cardPresent) {
    lcd.print(nl ? "Geen SD-kaart gevonden" : "No SD card found", x, y);
  }
  else if (!cardInit) {
    lcd.print(nl ? "SD-kaart niet leesbaar" : "SD card could not be read", x, y);
  }
  else if (useAutoStartFromSD && autoStartFileFound) {
    lcd.print((nl ? "Start automatisch: " : "Starting: ") + autoStartFilename, x, y);
  }
  else {
    lcd.print(nl ? "SD-kaart klaar" : "SD card ready", x, y);
  }
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
    lcd_drawButton(BUTTON_DONE);
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
const char LBL_0_EN[] PROGMEM = "SET\nHOME";
const char LBL_0_NL[] PROGMEM = "HOME\nZETTEN";
const char LBL_1_EN[] PROGMEM = "MOTORS\nON";
const char LBL_1_NL[] PROGMEM = "MOTOREN\nAAN";
const char LBL_2_EN[] PROGMEM = "MOTORS\nOFF";
const char LBL_2_NL[] PROGMEM = "MOTOREN\nUIT";
const char LBL_3_EN[] PROGMEM = "SHOW\nCOMMANDS";
const char LBL_3_NL[] PROGMEM = "TOON\nCOMMANDO'S";
const char LBL_4_EN[] PROGMEM = "PEN LIFT";
const char LBL_4_NL[] PROGMEM = "PENLIFT";
const char LBL_5_EN[] PROGMEM = "DRAW\nFROM SD";
const char LBL_5_NL[] PROGMEM = "TEKENEN\nVAN SD";
const char LBL_6_EN[] PROGMEM = "MORE";
const char LBL_6_NL[] PROGMEM = "MEER";
const char LBL_7_EN[] PROGMEM = "CALIBRATE";
const char LBL_7_NL[] PROGMEM = "KALIBREREN";
const char LBL_8_EN[] PROGMEM = "PAUSE";
const char LBL_8_NL[] PROGMEM = "PAUZE";
const char LBL_9_EN[] PROGMEM = "RESUME";
const char LBL_9_NL[] PROGMEM = "DOORGAAN";
const char LBL_10_EN[] PROGMEM = "RESET";
const char LBL_10_NL[] PROGMEM = "RESET";
const char LBL_11_EN[] PROGMEM = "PEN\nUP";
const char LBL_11_NL[] PROGMEM = "PEN\nOMHOOG";
const char LBL_12_EN[] PROGMEM = "PEN\nDOWN";
const char LBL_12_NL[] PROGMEM = "PEN\nOMLAAG";
const char LBL_13_EN[] PROGMEM = "PREVIOUS\nFILE";
const char LBL_13_NL[] PROGMEM = "VORIG\nBESTAND";
const char LBL_14_EN[] PROGMEM = "NEXT\nFILE";
const char LBL_14_NL[] PROGMEM = "VOLGEND\nBESTAND";
const char LBL_15_EN[] PROGMEM = "BACK";
const char LBL_15_NL[] PROGMEM = "TERUG";
const char LBL_16_EN[] PROGMEM = "DRAW\nTHIS FILE";
const char LBL_16_NL[] PROGMEM = "TEKEN\nDIT BESTAND";
const char LBL_17_EN[] PROGMEM = "STOP\nDRAWING";
const char LBL_17_NL[] PROGMEM = "STOP\nTEKENEN";
const char LBL_18_EN[] PROGMEM = "SETTINGS";
const char LBL_18_NL[] PROGMEM = "INSTEL-\nLINGEN";
const char LBL_19_EN[] PROGMEM = "MORE\nSETTINGS";
const char LBL_19_NL[] PROGMEM = "MEER\nINSTEL-\nLINGEN";
const char LBL_20_EN[] PROGMEM = "SLOWER";
const char LBL_20_NL[] PROGMEM = "LANGZAMER";
const char LBL_21_EN[] PROGMEM = "FASTER";
const char LBL_21_NL[] PROGMEM = "SNELLER";
const char LBL_22_EN[] PROGMEM = "ACCEL.\nLOWER";
const char LBL_22_NL[] PROGMEM = "ACCEL.\nLAGER";
const char LBL_23_EN[] PROGMEM = "ACCEL.\nHIGHER";
const char LBL_23_NL[] PROGMEM = "ACCEL.\nHOGER";
const char LBL_24_EN[] PROGMEM = "STEP\nSMALLER";
const char LBL_24_NL[] PROGMEM = "STAP\nKLEINER";
const char LBL_25_EN[] PROGMEM = "STEP\nLARGER";
const char LBL_25_NL[] PROGMEM = "STAP\nGROTER";
const char LBL_26_EN[] PROGMEM = "PEN SIZE\nSMALLER";
const char LBL_26_NL[] PROGMEM = "PENDIKTE\nKLEINER";
const char LBL_27_EN[] PROGMEM = "PEN SIZE\nLARGER";
const char LBL_27_NL[] PROGMEM = "PENDIKTE\nGROTER";
const char LBL_28_EN[] PROGMEM = "DONE";
const char LBL_28_NL[] PROGMEM = "KLAAR";
const char LBL_29_EN[] PROGMEM = "PEN SIZE";
const char LBL_29_NL[] PROGMEM = "PENDIKTE";
const char LBL_30_EN[] PROGMEM = "SPEED";
const char LBL_30_NL[] PROGMEM = "SNELHEID";
const char LBL_31_EN[] PROGMEM = "POSITION";
const char LBL_31_NL[] PROGMEM = "POSITIE";
const char LBL_32_EN[] PROGMEM = "CORD A\nSHORTER";
const char LBL_32_NL[] PROGMEM = "KOORD A\nKORTER";
const char LBL_33_EN[] PROGMEM = "CORD A\nLONGER";
const char LBL_33_NL[] PROGMEM = "KOORD A\nLANGER";
const char LBL_34_EN[] PROGMEM = "CORD B\nSHORTER";
const char LBL_34_NL[] PROGMEM = "KOORD B\nKORTER";
const char LBL_35_EN[] PROGMEM = "CORD B\nLONGER";
const char LBL_35_NL[] PROGMEM = "KOORD B\nLANGER";
const char LBL_36_EN[] PROGMEM = "PEN DOWN\n-";
const char LBL_36_NL[] PROGMEM = "PEN OMLAAG\n-";
const char LBL_37_EN[] PROGMEM = "PEN DOWN\n+";
const char LBL_37_NL[] PROGMEM = "PEN OMLAAG\n+";
const char LBL_38_EN[] PROGMEM = "PEN UP\n-";
const char LBL_38_NL[] PROGMEM = "PEN OMHOOG\n-";
const char LBL_39_EN[] PROGMEM = "PEN UP\n+";
const char LBL_39_NL[] PROGMEM = "PEN OMHOOG\n+";
const char LBL_40_EN[] PROGMEM = "SAVE";
const char LBL_40_NL[] PROGMEM = "OPSLAAN";
const char LBL_41_EN[] PROGMEM = "LANGUAGE\nENGLISH";
const char LBL_41_NL[] PROGMEM = "TAAL\nNEDERLANDS";

struct ButtonLabel {
  byte id;
  byte coordsIndex;
  const char *text[LANG_COUNT];
};

const ButtonLabel BUTTON_LABELS[] PROGMEM = {
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
};

/** Tekst in het midden van een knop, met regels onder elkaar. */
void lcd_drawButtonText(byte coordsIndex, const char *progmemText)
{
  char buf[40];
  strncpy_P(buf, progmemText, sizeof(buf) - 1);
  buf[sizeof(buf) - 1] = 0;

  const int charW = 8;
  const int lineH = 18;
  byte lines = 1;
  for (byte i = 0; buf[i]; i++) if (buf[i] == '\n') lines++;

  int left = buttonCoords[coordsIndex][0];
  int top = buttonCoords[coordsIndex][1];
  int y = top + (buttonSize - lines * lineH) / 2 + 1;
  char *line = buf;
  lcd.setFont((uint8_t *)AbButtonFont);
  while (line) {
    char *next = strchr(line, '\n');
    if (next) *next = 0;
    int width = strlen(line) * charW;
    lcd.print(line, left + (buttonSize - width) / 2, y);
    y += lineH;
    line = next ? next + 1 : NULL;
  }
  lcd.setFont(SmallFont);
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
  lcd.fillRect(buttonCoords[0][0],buttonCoords[1][1]+10, screenWidth, buttonCoords[1][1]+24);
  lcd.setColor(colorBrightRed,colorBrightGreen,colorBrightBlue);
  lcd.setBackColor(colorDarkRed,colorDarkGreen,colorDarkBlue);

  // see if there's one already found
  String msg = "No card found";

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
  
  lcd.print(msg, buttonCoords[0][0],buttonCoords[1][1]+10);
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
  lcd.fillRect(buttonCoords[0][0],buttonCoords[1][1]+10, screenWidth, buttonCoords[1][1]+24);
  lcd.setColor(colorBrightRed,colorBrightGreen,colorBrightBlue);
  lcd.setBackColor(colorDarkRed,colorDarkGreen,colorDarkBlue);
  lcd.print(prefix + com, buttonCoords[0][0],buttonCoords[1][1]+10);
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
