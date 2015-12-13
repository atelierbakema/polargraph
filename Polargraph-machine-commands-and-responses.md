# Commands

Commands are send serially, as ascii. They take the form:

    <command>,[<param1>,<param2>,<param3>,<param4>,]END[:<checksum>]

Where items in squared brackets are optional.

The client should wait until it receives a ``READY`` message before sending a command.

*  **Change length:** `C01,<left target length>,<right target length>,END`
   Move motors at maximum speed until machine cords are at target distance from motors. 

*  **Change pen tip width:** `C02,<pen tip size>,END`
   Set pen tip to a new size. Unit here is millimetres, and should be a decimal. It is read as a `float` internally.

*  **Draw square wave shaded pixel:** `C05,<left distance>,<right distance>,<size>,<brightness>,END`
   Shade a pixel so it has a particular brightness. A pixel in this case is a "square" patch, whose sides are perpendicular to the axes of the machine. That is, it is a square drawn using the native coordinates system. This is usually a squished diamond in cartesian space.

   It is specified with a position (it's centre), a size (number of steps along it's sides) and a brightness value (how bright or dark it is). Position and size are measured in motor steps. A square wave pixel is shaded with a square wave pattern. A very dark pixel has many, full-width waves, a very bright pixel has no waves. Brightness is specified as a gray scale value, from 0 (black) to 255 (white), where the white is supplied by white paper, and black by black ink.

   The mapping of brightness to number of waves is controlled in the Polargraph Server firmware, and is usually linked to pen width to prevent ink saturation on very dense pixels.

        `C05,1000,784,55,11,END` 

        // Draw a pixel 55 steps square, and with it's centre 1000 steps from the left-hand motor, 
        // and 784 steps from the right-hand motor. Given what you know about the pen installed, 
        // shade it using a square wave pattern so it is something like 11 255ths covered in ink.

*  **Draw scribble shaded pixel:** `C06,<left distance>,<right distance>,<size>,<brightness>,END`
   Shade a pixel using a randomised pen movement pattern. This essentially scribbles in the pixel area to achieve the same kind of density of ink as C05. 

   This uses pen width to decide on the maximum number of scribbles in the exact same way as C05 uses it to decide the maximum number of waves. That makes sense with C05 because it never overlaps the lines - however scribble pixel often overlaps lines, yet it is possible that you could never achieve full coverage (because of the randomness of the pattern).

   This makes it's shading behaviour a bit weird. I usually halve the pen width before for drawing with scribble pixel otherwise things come out too light. Increasing the pixel scaling will make the pixels edges blend into it's  neighbour's too, which has a nice scribbly effect.

*  **Change drawing direction:** `C07,<direction mode>,<direction>,END`
   Square wave pixel (C05) has a direction in which the wave is drawn, either along a A axis (along an arc that is a particular radius from the left-hand motor), or along the B axis (from the right-hand motor). This command controls how that direction is chosen with the `direction mode` param, where options are:

   * 1: Automatic - attempts to decide the best way to do it based on where it's been and where it's going. This doesn't work that well. @TODO check if this is still true
   * 2: Preset - uses the last explicitly set direction.
   * 3: Random - Makes it up as it goes along. @TODO check if this is still true

   The second param is a the actual direction, if one needs to be set, for instance, if `direction mode` is 2 (preset).

   * 1: North-east direction: Along A axis, decreasing the B axis.
   * 2: South-east direction: Along B axis, increasing the A axis.
   * 3: South-west direction: Along A axis, increasing the B axis.
   * 4: North-west direction: Along B axis, decreasing the A axis.

*  **Test pen width using square pixel:** `C11,<pixel size>,<start pen tip size>,<end pen tip size>,<pen tip size increment>,END`
   Draws a series of test pixels, shaded to maximum density using a square wave pattern, but with a varying pen width setting. This can be used to measure how large the pen tip really is, but is really used to calibrate your "black point", to control what your maximum ink density is. It may not necessarily be a full coating of ink, or there might be nice effects you can get from overlapping ink.

   The pixel size is the size in motor steps. The *start pen tip size* is the size the pen tip will be set to for the very first pixel, and the *end pen tip size* is the size of the pen tip in the final pixel. *Pen tip size increment* controls how many pixels there are in between the start and the end.

   It is up to you to note next to each drawn pixel what the pen tip size was, and then to choose which patch you want as your maximum density and set it in the machine using `C02`.

*  **Set pen position:** `C09,<left distance>,<right distance>,END`
   Simply tells the machine where the pen already is. This is used primarily during homing. Set the pen to a particular, pre-measured position, then **set home** sends a `C09` command.

*  **Pen down:** `C13,[<servo position>,]END`
   Moves the pen lift servo motor into the **down**, **lowered**, or **drawing** position, with the pen tip against the page. The machine has a set **up** position saved in EEPROM, but given an integer parameter, it moves the servo to that position instead, and will use that position as **up** until the machine is next reset - even if it is not stated explicitly on subsequent `C13` calls. Use `C45` to save specific lift servo positions to EEPROM.

*  **Pen up:** `C14,[<servo position>,]END`
   Moves the pen lift servo motor into the **up**, **raised**, or **lifted** position. The parameter behaves in the same way as `C13`.

*  **Move pen direct:** `C17,<left target length>,<right target length>,<line segment lenght>,END`
   Moves the pen to the target, plotting a straight line in cartesian space. This is your basic "draw straight line to point". The coordinates are still in the native coordinates system though, not cartesian coordinates. The line is chopped into lots of little lines, and while each one will not be exactly straight, overall the path is straight. The `line segment length` parameter controls how long the sub-lines are. Larger values mean slightly quicker drawing, but more jagged lines. Default is a small value, eg 2. You can't really go any smaller than that.

Machine setup commands
----------------------

These settings are saved to the machine's internal EEPROM, and automatically reloaded upon reset.

*  **Set machine size:** `C24,<width>,<height>,END`
   Sets the machine's dimensions in millimetres.

*  **Get current machine details:** `C26,END`
   Request that the machine send a couple of responses, telling us all it's dirty secrets - how big it is, etc. These responses are detailed below in the Responses section of this page.

*  **Reset EEPROM:** `C27,END`
   Reset to factory defaults.

*  **Set machine millimetre extension per motor revolution:** `C29,<mm per rev>,END`
   Integer. Sets how much cord is payed out (or reeled in) with one revolution of the motor. This is one of the most important measurements to get right. It is nominally the circumference of the motor's drive sprockets, but the interaction of the beads into the sprocket teeth will make that inexact.

*  **Set motor steps per revolution:** `C30,<steps per rev>,END`
   Integer. Most motors have 200 steps per revolution, but this can be multiplied with certain kinds of motor stepping styles. If it is possible to create intermediate steps with microstepping, I would recommend not doing so. Instead use `C37` below to add a step multiplier. Yes, the resolution will suffer, but it usually doesn't make any difference.

*  **Set maximum motor speed:** `C31,<max motor speed>,END`
   Measured in steps per second.

*  **Set acceleration speed:** `C32,<acceleration speed>,END`
   Measured in steps per second, per second. Beautiful and musical sounding.

*  **Set step multiplier:** `C37,<multiplier>,END`
   This is a global number that all incoming coordinates are multiplied by upon arrival. This is to allow the machine to work internally at a higher resolution than it is addressed in. The main purpose for this is to allow practical use of microstepping. 

   With microstepping, each motor step is divided into many smaller steps, and it serves to move more smoothly between steps. It's quieter and more gentle. These intermediate steps are less positive than full steps, and so they are not reliable, except as a way to get between full steps. It is not a good idea to stop on a microstep, and that's the reason why the Polargraph machine is only addressable using full motor steps, even though internally it uses microsteps for all calculations.

   Polarshield uses 8x microstepping, so this value should be set to 8 for Polarshield. Adafruit Motorshield uses 16x microstepping so this value should be set to 16 in those cases.



Responses
---------

## Ready
The Polargraph Server firmware will respond with a ``READY`` when it is ready to accept another command. This may be parameterised with the server version or capabilities too. 

*  ``READY`` designates a machine running ``polargraph_server_a1``
*  ``READY_100`` means it is running ``polargraph_server_mega``
*  ``READY_200`` means it is running ``polargraph_server_polarshield``

These messages are used in the Polargraph Controller to limit which features are made available.

## Sync
The Polargraph Server will often report it's pen position to allow the Controller to feed something useful back to you.

    SYNC,3000,4000,END

States that the machine believes the pen it 3000 steps away from the left-hand motor, and 4000 steps away from the right-hand motor.

##