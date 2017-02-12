[Read about the project](The-Polargraph-Project)

**[Download the code bundle](https://github.com/euphy/polargraphcontroller/releases/latest)**

_Polargraph software bits and pieces are somewhat fragmented._

Separate repositories for smaller project elements, if you want them:

## Firmware.

The firmware is written for the Arduino platform.

* https://github.com/euphy/polargraph_server_a1 For UNO and MEGA boards with Adafruit motorshields.
* https://github.com/euphy/polargraph_server_polarshield The official firmware for the PolargraphSD, which is a MEGA with a Polarshield on top.
* https://github.com/euphy/polargraph_server_esf Experimental firmware built for the Edinburgh Science Festival Polargraph machines which were based on a Teensy 3.

## The Polargraph Controller App.

The controller is written in Processing, which is a kind of programming language, based on Java. 

The controller source code is at https://github.com/euphy/polargraphcontroller/ but there are also packaged releases at https://github.com/euphy/polargraphcontroller/releases/latest.

It runs in Processing v2.2.1.

The packaged releases contain pre-compiled executable binaries for Windows, OSX and Linux, provided as a courtesy. Because of compatibility issues with Java and Processing (and usually Windows), these sometimes don't work. If you can't get your flavour to run on your operating system, then [compile and run from source instead](https://github.com/euphy/polargraph/wiki/Running-the-controller-from-source-code).

Or the older one that runs in Processing v1.5 if you have issues with the new version:
* https://github.com/euphy/polargraphcontroller/releases/tag/2015-07-18-10-05

Either way, it does require a Java runtime environment to be installed.

## Standalone queue runner for low power devices

There's a little [script here on github](https://github.com/euphy/polargraph/wiki/Standalone-command-queue-runner) that accepts a queue in a text file, and pipes out the commands one by one. Takes almost no CPU.

## Hardware.

* https://github.com/euphy/polarshield_hardware
* https://github.com/euphy/polargraph_models