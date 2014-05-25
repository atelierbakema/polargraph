RAMPS is a shield for Arduino MEGA, that has space for up to five motor drivers. It was designed for 3D printers, and is in very widespread use. [Here is a page about it.](http://reprap.org/wiki/Arduino_Mega_Pololu_Shield)

The Polarshield is actually based loosely on RAMPS, and uses the same kind of motor drivers, so it should be easy to get it running.

This page is to collect the wisdom of those experimenting in this area.

[Mostly based on this forum thread.](http://www.polargraph.co.uk/forum/polargraphs-group2/building-hardware-forum3/arduino-mega-2560r3-with-ramps-1-4-thread286.0/)


motor pin name | RAMPS pin | Polarshield pin
--- | --- | ---
Motor A enable | D38 | D3
Motor A step | D54 | D4
Motor A dir | D55 | D5
Motor B enable | D56 | D6
Motor B step | D60 | D7
Motor B dir | D61 | D8
Servo 1 | D4 | D9

[RAMPS pin numbers taken from ErikZalm's Marlin firmware.](https://github.com/ErikZalm/Marlin/blob/Marlin_v1/Marlin/pins.h#L527-L537)

So if you're using polargraph_server_polarshield, you should open up the configuration.ino tab, and update the values as so:

    const byte motoraEnablePin = 30;
    const byte motoraStepPin = 36;
    const byte motoraDirPin = 34;
    
    const byte motorbEnablePin = 56;
    const byte motorbStepPin = 60;
    const byte motorbDirPin = 61;

[link](https://github.com/euphy/polargraph_server_polarshield/blob/master/configuration.ino#L58-L64)

And in the main file [polargraph_server_polarshield.ino](https://github.com/euphy/polargraph_server_polarshield/blob/master/polargraph_server_polarshield.ino#L101), update the servo pin:

    int const PEN_HEIGHT_SERVO_PIN = 4;

Remember, that by default, the servo pins are not wired to connect power, so you need to put a jumper or a link between VCC and +5, right next to the reset button on RAMPS. [source] (http://forums.reprap.org/read.php?219,256377)

![How to connect the servo 5v supply on RAMPS](https://raw.githubusercontent.com/euphy/polargraph/master/docs/images/enable-servo-ramps.jpg)
