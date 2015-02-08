The pen lift feature in Polargraph is simple. There is a small R/C servo motor fitted to the gondola, and wired up on [pin 9](https://github.com/euphy/polargraph_server_polarshield/blob/master/polargraph_server_polarshield.ino#L144-L147) of the Arduino-compatible microcontroller board.

![video of the pen lift moving](<iframe width="560" height="315" src="https://www.youtube.com/embed/K6rT2SFoNa4" frameborder="0" allowfullscreen></iframe>)

Internally, there are two values:
* PEN UP: the control horn is pointed directly at the drawing surface, and so the centre of the gondola (and so the pen tip) is levered away from it. It's 12 o'clock. ([code](https://github.com/euphy/polargraph_server_polarshield/blob/master/polargraph_server_polarshield.ino#L139-L140))
* PEN DOWN: the control horn is pointed to 9 o'clock (or 3 o'clock), and the so the gondola and pen are able to fall onto the surface. ([code](https://github.com/euphy/polargraph_server_polarshield/blob/master/polargraph_server_polarshield.ino#L138), [code](https://github.com/euphy/polargraph_server_polarshield/blob/master/polargraph_server_polarshield.ino#L141))

There are default values for these two positions, but they usually need reversing, and if nothing else, they'll need adjusting. Servo motors are wildly variable. In principle, the two values should be 90 apart. In practice it's anything from 20 to 100 to get the same range of physical movement.

Adjust using the controller
---------------------------

On the <b>SETUP</b> tab of the controller, there are four buttons, near the bottom of the list:

![pen lift buttons](https://raw.githubusercontent.com/euphy/polargraph/master/docs/images/penlift_buttons.jpg)

The first two are obvious, the **TEST LIFT RANGE** button sends a message to oscillate the motor between those numbers a few times. Once you adjust the **UP** position and the **DOWN** position a few times, and run a few more tests, you can upload the the settings into the EEPROM of the machine with **UPLOAD LIFT RANGE**, and it'll be saved for future use. Hurray, right?

Adjust using the touchscreen
----------------------------

I don't have any pictures of this yet.
On the initial menu of the touchscreen, tap **MORE**, then **MORE** again, then **ADJUST PEN LIFT**.
The five useful buttons there are 
* Increment UP position
* Decrement UP position
* Increment DOWN position
* Decrement DOWN position
* Save to EEPROM

Once you've used these, and saved your new settings to EEPROM, it's worth returning to the initial menu and testing with **PEN UP / PEN DOWN** button, and the re-adjusting based on that. The reason is that the actual behaviour the motor is different when doing a full sweep (in a pen up/down) to when doing a very very tiny incremental move (in the adjustment phase). So it's worth checking.
