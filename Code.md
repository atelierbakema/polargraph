[Read about the project](The-Polargraph-Project)

**[Download the code bundle](https://github.com/euphy/polargraphcontroller/releases/latest)**

_Polargraph software bits and pieces are somewhat fragmented._

Separate repositories for smaller project elements, if you want them:

## Firmware.

The firmware is written for the Arduino platform.

* https://github.com/euphy/polargraph_server_a1
* https://github.com/euphy/polargraph_server_mega
* https://github.com/euphy/polargraph_server_polarshield
* https://github.com/euphy/polargraph_server_esf

## The Polargraph Controller App.

The controller is written in Processing, which is a kind of programming language, based on Java. 

The controller source code is at https://github.com/euphy/polargraphcontroller/ but there are also packaged releases at https://github.com/euphy/polargraphcontroller/releases/latest.

The packaged releases contain pre-compiled executable binaries for Windows, OSX and Linux, provided as a courtesy. Because of compatibility issues with Java and Processing (and usually Windows), these sometimes don't work. If you can't get your flavour to run on your operating system, then compile and run from source instead.

Or the older one that runs in Processing v1.5 if you have issues with the new version:
* https://github.com/euphy/polargraphcontroller/releases/tag/2015-07-18-10-05

Either way, it does require a Java runtime environment to be installed.

## Hardware.

* https://github.com/euphy/polarshield_hardware
* https://github.com/euphy/polargraph_models