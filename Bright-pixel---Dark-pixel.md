The `Bright Pixel` and `Dark Pixel` numberspinners let you set the levels of the brightest and the darkest pixel that you want to render. They apply a simple cutoff, and ignore pixels that are brighter (less ink) and darker (more ink) than the values in these two controls.

(gif of modification)

When you are looking at the density preview of your artwork, as you slide the values of bright/dark pixel, you'll see pixels disappearing from the preview (as above).

##How it draws

In the `RENDER PIXELS` dialog box, there's two options for how to render masked (or empty) pixels.

* `Lift pen over masked pixels`
* `Draw masked pixels as blanks`

With no masked pixels, then these buttons make no difference. The pic below shows the unfiltered/unmasked queue preview, with three pixels highlighted, and the three commands in the command queue.

(pic 01 annotated)

## Lift pen over masked pixels

I set `DARK PIXEL` to 60, so that the blackest pixel in the middle of that row of three is ignored. This leaves a gap.

So clear the queue, and regenerate the commands. `Lift pen over masked pixels` tells the renderer to add commands to lift the pen over each masked pixel. (Because of reasons, the masked pixel is still drawn - it just happens in mid-air.)

(pic 02 lift over annotated)

See that the preview still contains an empty pixel, but in the command queue, there's two extra commands, a C14 (lift pen off the paper) and a C13 (drop pen onto the paper), either side of the middle pixel.

In practice, on paper, this means that there is no ink laid down in the pixel.

## Draw masked pixels as blanks

The same render, with the `Draw masked pixels as blanks` option selected, skips the pixel rendering command completely.

(pic 03 blanks)

See that there's only two pixel commands in the queue (C05 commands), and no pen lifts.

In practice, on paper, this means there will be a straight line from the end of the first pixel in that row, to the beginning of the last pixel.


