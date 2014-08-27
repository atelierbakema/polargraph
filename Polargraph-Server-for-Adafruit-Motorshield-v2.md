There's been a bit of ongoing investigation about getting the polargraph firmware running with the new Adafruit Motorshield (v2). In summary: Please don't. Noisy, slow, takes up all your memory.

https://github.com/euphy/polargraph_server_a1

The new Adafruit library is slightly bigger than the old one, and the polargraph_server_a1 firmware was super tight on space already, so I've split up the code into a set of features that can be easily enabled or disabled at compile time to save space:

* `PIXEL_DRAWING` - This is pixel shading.
* `PENLIFT` - Controlling a servo to lift the pen.
* `VECTOR_LINES` - Drawing straight lines, aka vector plotting.

Disabling either `PIXEL_DRAWING` or `VECTOR_LINES` reduces the sketch size until it can fit on an UNO, but dynamic memory usage is still so high that it doesn't really work properly (and very hard to debug or troubleshoot).

For this reason, if you want `PIXEL_DRAWING`, then you need to disable `PENLIFT` too.

This is a bit of a pain, but I don't see an acceptable alternative.

How to disable the features though?
-----------------------------------

1. Look in [polargraph_server_a1.ino, lines 39-41](https://github.com/euphy/polargraph_server_a1/blob/master/polargraph_server_a1.ino#L37-L41) and see that there are three lines there

```
#define PIXEL_DRAWING
#define PENLIFT
#define VECTOR_LINES
```

Any one of these three lines can be commented out (removed from the compilation) by putting `//` on the beginning of the line, or just by removing the line entirely.

1. Now look in [configuration.ino, lines 23-29](https://github.com/euphy/polargraph_server_a1/blob/master/configuration.ino#L23-L29) and make sure that the correct lines are commented out or removed:

```
// Using Adafruit Motorshield V2? Comment out this one line underneath.
//#include <AFMotor.h>

// Using Adafruit Motorshield V1? Comment out the three INCLUDE lines below.
#include <Wire.h>
#include <Adafruit_MotorShield.h>
#include "utility/Adafruit_PWMServoDriver.h"    
```

Precompiled binaries
--------------------

For convenience, there are some precompiled binaries for a few different hardware platforms in the https://github.com/euphy/polargraph_server_a1 repository.

Sources:
* <http://www.polargraph.co.uk/forum/polargraphs-group2/troubleshooting-forum5/towards-running-a-polargraph-with-an-adafruit-motorshield-v2-thread284.0/>
* <http://www.polargraph.co.uk/forum/polargraphs-group2/troubleshooting-forum5/motors-not-working-when-i-compile-but-hex-works-thread324/>
* <http://www.polargraph.co.uk/2014/04/polargraph-server-for-adafruit-motorshield-v2/>