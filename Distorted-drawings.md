Distorted drawings are symptoms of a machine that is poorly specified OR poorly calibrated (or both!).

The problem is, the initial error might be very small (just a few millimetres off), and there's no way to tell if the error is in the specification, or in the calibration (homing).

Three symptoms, two problems.

## Asymmetrical drawing
The drawing is central, but veers off to one side the further down the machine you draw.

**Usually:** Your pen is a couple of millimetres off to the side of the home position when you calibrate, OR your home point in the controller doesn't match the physical home point marked on your machine.

**Less commonly:** Your home point may be measured and marked correctly, but the rest of your machine might be off.

**Solution:** Measure your machine again, measure your home point, make sure your controller reflects the size of your machine down to the millimetre, save it and upload machine spec. Try again.

## Narrow bottom
The drawing tapers as the pen moves down the page, and has a concave bottom row.

**Usually:** The pen is actually slightly higher up the page than the machine thinks it is / The strings are slightly shorter than the machine thinks they are.

Maybe your home point is physically higher than you have told the controller, or the pen was actually higher than the home point when it was calibrated.

**Less commonly:** The pen is in the right place, but the machine is physically narrower than it thinks it is.

So the machine thinks the distance to the home point is 800mm (for instance), but it's actually only 750mm.

**Solution:** Measure, fix, re-upload machine spec! Do a bit of diagnosis by doing **set home** then physically moving the pen 10mm down, and see if that makes the distortion better or worse. Select an area in the controller and do **Draw outline selected** to quickly sketch out a rectangle for testing.
