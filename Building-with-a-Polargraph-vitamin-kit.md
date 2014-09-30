If you've bought a Polargraph vitamin kit, then assembly is up to you.

The kit comes with

* Polarshield, with LCD and stepper drivers
* Stepper motors
* Drive sprockets
* Motor brackets
* Gondola kit
* Servo motor (for pen lift)

So the main things that you need to source yourself are

* Arduino MEGA 2560 compatible microcontroller (I sell these)
* Cables
* 9v / 12v power supply

The only part of the assembly that needs knowing about is the the motor wiring.

The motors that are in the kit are bipolar steppers with four wires. The four wires power two separate motor drive coils, so there are two pairs of wires, one pair for each coil.

* Red and blue
* Black and green

To use the shield with the motors mounted the traditional way (shafts pointing towards the wall), then the sequence to wire the motors is (left-to-right): 

1. Blue
1. Red
1. Green
1. Black

![](https://github.com/euphy/polargraph/raw/master/docs/images/IMG_20140930_132001180.jpg)