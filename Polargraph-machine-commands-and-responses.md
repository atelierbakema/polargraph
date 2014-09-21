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

   It is specified with a position (it's centre), a size (number of steps along it's sides) and a brightness value (how bright or dark it is). Position and size are measured in motor steps. A square wave pixel is shaded with a square wave pattern. A very dark pixel has many, full-width waves, a very bright pixel has no waves. Brightness is specified as a gray scale value, from 0 (black) to 255 (white), where the white is supplied by white paper, and black by blank ink.

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

*  **Test pen width using square pixel:** `C11,<pixel size>,<start pen tip size>,<end pen tip size>,<pen tip size increment>,END
   Draws a series of test pixels, shaded to maximum density using a square wave pattern, but with a varying pen width setting. This can be used to measure how large the pen tip really is, but is really used to calibrate your "black point", to control what your maximum ink density is. It may not necessarily be a full coating of ink, or there might be nice effects you can get from overlapping ink.

   The pixel size is the size in motor steps. The *start pen tip size* is the size the pen tip will be set to for the very first pixel, and the *end pen tip size* is the size of the pen tip in the final pixel. *Pen tip size increment* controls how many pixels there are in between the start and the end.

   It is up to you to note next to each drawn pixel what the pen tip size was, and then to choose which patch you want as your maximum density and set it in the machine using `C02`.



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