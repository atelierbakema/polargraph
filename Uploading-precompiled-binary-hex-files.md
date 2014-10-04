Getting all the libraries and the source code to build the Polargraph firmware is easy, but even so sometimes you don't want to do it. I don't judge.

For that reason I package up pre-compiled hex files of the various firmwares, and you can upload these to the Arduino without having to have all the ducks lined up in a row to actually compile it.

Use AVRDUDE
AVRDUDE is a tool used to upload firmware to AVR microprocessors, and it is included in the Arduino IDE so you already have it.

Use a command line like:

    <path to arduino>/hardware/tools/avr/bin/avrdude
    -C<path to arduino>/hardware/tools/avr/etc/avrdude.conf
    -v -patmega2560 -carduino -D -b 115200 -cstk500v2
    -P<name of serial port>
    -Uflash:w:<path to compiled hex file>polargraph_server_polarshield_v1.x_2.4.cpp.hex:i

