RAMPS is a shield for Arduino MEGA, that has space for up to five motor drivers. It was designed for 3D printers, and is in very widespread use. [Here is a page about it.](http://reprap.org/wiki/Arduino_Mega_Pololu_Shield)

The Polarshield is actually based loosely on RAMPS, and uses the same kind of motor drivers, so it should be easy to get it running!

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
Servo 1 | D7 | D9

So if you're using polargraph_server_polarshield, you should open up the configuration.ino tab, and update the values as so:

    const byte motoraEnablePin = 38;
    const byte motoraStepPin = 54;
    const byte motoraDirPin = 55;
    
    const byte motorbEnablePin = 56;
    const byte motorbStepPin = 60;
    const byte motorbDirPin = 61;

And in the main file (polargraph_server_polarshield.ino), update the servo pin:

    int const PEN_HEIGHT_SERVO_PIN = 7;

Now, I _think_ that's all you should need to do to switch over... The polarshield has a load of pins used up by the screen, and there's one line which is configured as an interrupt for the touchscreen. That's D2, which, on RAMPS is set to the X endstop. I don't know what it'l do if it isn't pulled high or low (because it's not really fastened to a screen) - whether it'll trigger touches randomly, or what.

So it might be worth taking these lines out too:

    pinMode(2, INPUT_PULLUP);
    attachInterrupt(INTERRUPT_TOUCH_PIN, lcd_touchInput, LOW);

They're in `configuration.ino` too - they just enable the interrupt-ability of that pin.