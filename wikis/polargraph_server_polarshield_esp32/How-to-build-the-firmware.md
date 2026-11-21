How to build the Polargraph Server firmware for ESP32
========================================

The Polargraph Server for Polarshield and ESP32 is targetted at an Espressif ESP32 attached to [v3.x of a Polarshield](https://github.com/euphy/polarshieldv3_hardware).
It relies on having a touchscreen attached via SPI and will need a bit of work to remove that dependency if you don't have one.

*  A guide for building the hardware is here: PolargraphSD v3.0 construction.
*  The hardware in a PolargraphSD is a NodeMCU-32S, so choose that as the target board if you can.


Using PlatformIO to build firmware
---------------

This project is easily built using PlatformIO. This will automatically include all the libraries you need and is a delight to use.

*  Go to https://platformio.org/platformio-ide and install VSCode (or Atom), and the PlatformIO extension.
*  Download or clone this project (https://github.com/euphy/polargraph_server_polarshield_esp32/archive/master.zip) into a new folder in your ```<user>\Documents\PlatformIO\Projects``` folder.



Using Arduino IDE to build firmware
------------------

You can also use the Arduino IDE if you'd prefer, but you'll have to install your libraries yourself, and change the name of a folder.

*  Add the ESP32 to the Arduino IDE by following these instructions: https://github.com/espressif/arduino-esp32/blob/master/docs/arduino-ide/boards_manager.md
*  Some necessary libraries are not packaged in this project, and must be downloaded. Install the libraries you find listed in the ```lib_deps``` section of the project file (https://github.com/euphy/polargraph_server_polarshield_esp32/blob/master/platformio.ini#L21-L26).
*  Some necessary libraries are packaged in this project. Move the [folders you find in ```<root>/lib```](https://github.com/euphy/polargraph_server_polarshield_esp32/tree/master/lib) into your Arduino libraries folder.
*  Download or clone this project (https://github.com/euphy/polargraph_server_polarshield_esp32/archive/master.zip)
*  Unpack it into a folder, but then copy the ```src``` folder in the project into your Arduino sketchbook folder, and change it's name to match the name of the project: ```polargraph_server_polarshield_esp32```
