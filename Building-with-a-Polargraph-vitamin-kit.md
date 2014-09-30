If you've bought a Polargraph vitamin kit, then assembly is up to you.

![](https://github.com/euphy/polargraph/raw/master/docs/images/IMG_20140819_184709934.jpg)

## What's in it

* Polarshield, with LCD and stepper drivers
* Stepper motors
* Drive sprockets
* Motor brackets
* Gondola kit
* Servo motor (for pen lift)

## What's missing
* Arduino MEGA 2560 compatible microcontroller (I sell these)
* Cables
* 9v / 12v power supply

## Wiring

The motors that are in the kit are bipolar steppers with four wires. The four wires power two separate motor drive coils, so there are two pairs of wires, one pair for each coil.

* Red and blue
* Black and green

To use the shield with the motors mounted the traditional way (shafts pointing towards the wall), then the sequence to wire the motors is (left-to-right): 

1. Blue
1. Red
1. Green
1. Black

![](https://github.com/euphy/polargraph/raw/master/docs/images/IMG_20140930_132001180.jpg)

Both motors are wired identically. The [firmware inverts the **direction** control pin of one of the motors](https://github.com/euphy/polargraph_server_polarshield/blob/master/configuration.ino#L129) so that they turn in opposite directions.

You can't damage anything by wiring these up in the wrong order, the [worst that will happen is that it'll go the wrong way](https://github.com/euphy/polargraph/wiki/It's-going-the-wrong-way!). 

**Always remember to cut the power before you unplug the motors. The motor drivers are sensitive to the kind of current spikes that occur when you suddenly remove the motor.**

## Connectors

The Polarshield has the same connectors on it as the PolargraphSD.

![](https://github.com/euphy/polargraph/raw/master/docs/images/IMG_20140819_184343781_HDR.jpg)

[These are neat.](http://uk.mouser.com/Search/ProductDetail.aspx?R=1778858virtualkey65100000virtualkey651-1778858) In principle you can just shove a bare end into each aperture. In practice, I prefer to use a tiny screwdriver in the slot to fit them more gently.

![](https://github.com/euphy/polargraph/raw/master/docs/images/IMG_20140819_184534289.jpg)

If you'd want screw terminals or something like that, there are some 3.5mm pitch holes that can accept a larger connector, hidden away under the stepper drivers. I usually need to shave a bit of plastic off the housing to make it fit, and the soldering on the inside is a bit tight, but do-able.

