RAMPS is a shield for Arduino MEGA, that has space for up to five motor drivers. It was designed for 3D printers, and is in very widespread use. [Here is a page about it.](http://reprap.org/wiki/Arduino_Mega_Pololu_Shield) The Polarshield is actually based loosely on RAMPS, and uses the same kind of motor drivers, so it is easy to get running.

Using the [polargraph_server_polarshield firmware](https://github.com/euphy/polargraph_server_polarshield), edit the [motherboard config lines](https://github.com/euphy/polargraph_server_polarshield/blob/master/polargraph_server_polarshield.ino#L60-L63) and making them so:

    #ifndef MOTHERBOARD
    //#define MOTHERBOARD POLARSHIELD
    #define MOTHERBOARD RAMPS14
    #endif

<a name="use-lcd"></a>
And also comment out this [line activating the touchscreen.]
(https://github.com/euphy/polargraph_server_polarshield/blob/master/polargraph_server_polarshield.ino#L85)

    //#define USE_LCD

###Motor assignations

* Motor A (left hand) is on the driver for E1, extruder 1.
* Motor B (right hand) is on the driver for the Y axis.

###Servo pins
Remember, the servo pins are not wired to the power by default, so you need to put a jumper or a link between VCC and +5, right next to the reset button on RAMPS. [source] (http://forums.reprap.org/read.php?219,256377)

![How to connect the servo 5v supply on RAMPS](../../docs/images/enable-servo-ramps.jpg)

This page is to collect the wisdom of those experimenting in this area.

[Mostly based on this forum thread.](http://www.polargraph.co.uk/forum/polargraphs-group2/building-hardware-forum3/arduino-mega-2560r3-with-ramps-1-4-thread286.0/)


motor pin name | RAMPS pin | Polarshield pin
--- | --- | ---
Motor A enable | D30 | D3
Motor A step | D36 | D4
Motor A dir | D34 | D5
Motor B enable | D56 | D6
Motor B step | D60 | D7
Motor B dir | D61 | D8
Servo 1 | D4 | D9

[RAMPS pin numbers taken from ErikZalm's Marlin firmware.](https://github.com/MarlinFirmware/Marlin/blob/Development/Marlin/pins_RAMPS_13.h#L20-L52)

*Note:* There seem to exist different batches of RAMPS1.4 with pin numbers slightly changed. [The test script for RAMPS1.4](https://reprap.org/wiki/File:RAMPS1.4_TestCode.pde) is very useful to find out correct pin assignments.
