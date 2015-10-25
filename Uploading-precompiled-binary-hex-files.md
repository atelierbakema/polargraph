Getting all the libraries and the source code to build the Polargraph firmware is easy, but even so sometimes you don't want to do it. I don't judge.

For that reason I package up pre-compiled hex files of the various firmwares, and you can upload these to the Arduino without having to have all the ducks lined up in a row to actually compile it.

In the [latest code bundle](https://github.com/euphy/polargraphcontroller/releases/latest), there's a folder in `arduino-source` named after each firmware. For instance, to upload the firmware to an UNO, when you're using an Adafruit Motorshield v1, look for

    arduino-source/polargraph_server_a1/polargraph_server_a1_adafruit_v1.cpp.hex

XLoader on Windows
------

[Xloader](http://xloader.russemotto.com/) is a pretty shell around avrdude (below) that I recommend you use on Windows. It's neat and just works.

Use AVRDUDE
-------

[AVRDUDE](http://www.nongnu.org/avrdude/) is a tool used to upload firmware to AVR microprocessors, and it is included in the Arduino IDE so you already have it.

Use a command line like:

    <path to arduino>/hardware/tools/avr/bin/avrdude
    -C<path to arduino>/hardware/tools/avr/etc/avrdude.conf
    -v -patmega2560 -carduino -b 115200 -cstk500v2
    -P<name of serial port>
    -D -Uflash:w:<path to hex file>:i

For example, for me to upload the **blink** Arduino example sketch on Windows, my commandline looks like:

    C:\dev\Arduino\hardware/tools/avr/bin/avrdude 
    -CC:\dev\Arduino\hardware/tools/avr/etc/avrdude.conf 
    -v -patmega2560 -carduino -b115200 -cstk500v2
    -P\\.\COM1 
    -D -Uflash:w:C:\Users\sandy_000\Documents\Arduino\polargraph_firmware\polargraph_server_a1\polargraph_server_a1_adafruit_v1.cpp.hex:i


And I got that from turning on verbose uploading mode in the Arduino IDE (File -> Preferences), and attempting to upload the sketch to a disconnected Arduino board. So you can do that to figure out what your command will look like: where your avrdude files are, things like that.

It might look slightly different on Linux or MacOS.

