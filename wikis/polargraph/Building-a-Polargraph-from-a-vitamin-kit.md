![](../../docs/images/IMG_20140819_184709934.jpg)

If you've bought a [Polargraph vitamin kit](http://polargraph.bigcartel.com/product/polargraph-sd-vitamins-kit), then assembly is up to you.

## What's in it

* Polarshield, with LCD and stepper drivers
* Stepper motors
* Drive sprockets
* Motor brackets
* Gondola kit
* Servo motor (for pen lift)

## What's missing
* Arduino MEGA 2560 compatible microcontroller ([I also sell these, surprise](http://polargraph.bigcartel.com/product/tinysine-tosduino-mega2560-r3))
* Cables
* 9v / 12v 1500mA power supply
* A case

## What this involves
* Put the Polarshield onto an Arduino MEGA 2560 compatible microcontroller
* Compile and upload the firmware onto the arduino (http://www.polargraph.co.uk/setup/polargraphsd-updating-firmware/)
* Build the motor brackets, and [wire the motors up to the Polarshield](https://github.com/euphy/polargraph/wiki/Building-a-Polargraph-from-a-vitamin-kit#wiring)
* [Build the gondola](https://github.com/euphy/polargraph/wiki/Building-a-Polargraph-from-a-vitamin-kit#assembling-gondola)

## Wiring

The motors that are in the kit are bipolar steppers with four wires. The four wires power two separate motor drive coils, so there are two pairs of wires, one pair for each coil.

* Red and blue
* Black and green

To use the shield with the motors mounted the traditional way (shafts pointing towards the wall), then the sequence to wire the motors is (left-to-right): 

1. Blue
1. Red
1. Green
1. Black

![](../../docs/images/IMG_20140930_132001180.jpg)

Both motors are wired identically. The [firmware inverts the **direction** control pin of one of the motors](https://github.com/euphy/polargraph_server_polarshield/blob/master/configuration.ino#L129) so that they turn in opposite directions.

You can't damage anything by wiring these up in the wrong order, the [worst that will happen is that it'll go the wrong way](https://github.com/euphy/polargraph/wiki/It's-going-the-wrong-way!). 

**Always remember to cut the power before you unplug the motors. The motor drivers are sensitive to the kind of current spikes that occur when you suddenly remove the motor.**

## Connectors

The Polarshield has the same connectors on it as the PolargraphSD.

![](../../docs/images/IMG_20140819_184343781_HDR.jpg)

[These are neat, here's the data sheet about them.](http://uk.mouser.com/Search/ProductDetail.aspx?R=1778858virtualkey65100000virtualkey651-1778858) In principle you can just shove a bare end into each circular aperture. A tiny screwdriver in the rectangular slot opens up the spring cage inside, so in practice, I open them first because stranded wire isn't always stiff enough to get a good connection through force alone.

[![How to fit connectors](https://img.youtube.com/vi/7CiI953Qo_o/0.jpg)](https://www.youtube.com/watch?v=7CiI953Qo_o)

![](../../docs/images/IMG_20140819_184534289.jpg)

If you'd want screw terminals or something like that, there are some 3.5mm pitch holes that can accept a larger connector, hidden away under the stepper drivers. I usually need to shave a bit of plastic off the housing to make it fit, and the soldering on the inside is a bit tight, but do-able.

There's these little boards that I use to terminate the motor wires.

<a data-flickr-embed="true"  href="https://www.flickr.com/photos/euphy/16114656290/in/datetaken/" title="Motor breakout boards and connectors."><img src="https://farm8.staticflickr.com/7487/16114656290_b2d9548fc2_n.jpg" width="320" height="240" alt="Motor breakout boards and connectors."></a>

## Case

A case for the electronics is not necessary at all, but it makes it a little neater. The board itself is somewhat ESD-sensitive, so can behave slightly erratically if it is getting handled a lot (the touch screen often stops responding). It's non-permanent.

You can download and laser cut (or print, I guess) the case that the PolargraphSD comes in. 

The PDF file is here: https://github.com/euphy/polargraph_models/blob/master/casev2/flat2/polargraph_case_parts_basic_v2.2.pdf. It is designed to be cut from 3mm thick acrylic (or MDF), and held together with six M3 12mm bolts, and nuts and washers.

There's some pictures to help with assembly in this flickr album:

<a data-flickr-embed="true"  href="https://www.flickr.com/photos/euphy/albums/72157662946794342" title="PolargraphSD case assembly"><img src="https://farm6.staticflickr.com/5754/24146014225_80125fa152.jpg" width="500" height="281" alt="PolargraphSD case assembly"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

https://www.flickr.com/photos/euphy/albums/72157662946794342

## Software

The Polarshield is pre-set to use 8x microstepping, and the standard motors in the kit have 200 steps per revolution. The settings for your controller app should be:

* mm per rev – set it to 95 (why?  This is the length of string dealt out by one revolution of the motor)
* Steps per rev – set it to 200. If you have a Polargraph kit from before July 2014, it'll probably be 400 (why? This is the number of whole steps that the motor is capable of making)
* Step multiplier – set it to 8 (why? This is the default microstepping value for the polarshield – this sets the internal resolution that the machine uses while moving)

http://www.polargraph.co.uk/setup/polargraphsd-controller-application/

**Irritation warning**

_The controller doesn't like having steps per rev changed while it's running. Doesn't break it or anything, just spoils all your existing measurements, so you're best off closing it, then opening default.properties.txt and editing it manually - look for the line starting `machine.motors.stepsPerRev`._

##Assembling Gondola
There's a video about this here.
[![Gondola assembly video still](http://img.youtube.com/vi/ycrGUTGlzik/0.jpg)](http://www.youtube.com/watch?v=ycrGUTGlzik)