It's quite easy to end up with empty pixels.

![Empty pixel drawing](https://raw.githubusercontent.com/euphy/polargraph/master/docs/images/empty-pixels.jpg)

This is when your pixel size (which is your grid size) is so small that it can't realistically fit any pen waves into each pixel.

Differently expressed, it means your pen is so thick that it can't draw anything in the pixel space other than either empty, or solid. No shading in between.

Look below for what happens when you put thicker and thicker pens into the machine without making compensating adjustments:

![Pixel explanation page 1](https://raw.githubusercontent.com/euphy/polargraph/master/docs/images/pixel_explanation_p1.png)

Ok, it's getting clearer now that there's a relationship between the size of a pixel, and the size of the pen you can usefully shade that pixel with.

With the medium pen, there's six different levels of detail that can be expressed, but because there's eleven different input values, some input values get merged with their neighbours.

![Pixel explanation - medium pen](https://raw.githubusercontent.com/euphy/polargraph/master/docs/images/pixel_explanation_p2.png)

We're really in trouble with the thickest pen: There's really only two levels of detail that can be expressed in such a small pixel: Empty (a line), or solid (one wave).

![Pixel explanation - thick pen](https://raw.githubusercontent.com/euphy/polargraph/master/docs/images/pixel_explanation_p3.png)

What this means that anything that is light will be lost entirely (as in the empty pixel picture at the top), and anything that is dark will be rendered as solid black.

##Solution

Grid size, pen size, resolution and shading detail are interlinked, and tightly interlinked when using a small grid. Try to resist the temptation to use a very small grid to get lots of detail. It doesn't work that way. Below a certain point, you start losing shading detail pretty suddenly.

* Use a smaller pen, or increase your grid size.
* Do a [pen width test](http://www.instructables.com/id/Polargraph-Drawing-Machine/step25/) at your chosen grid size to see what you can expect, and to measure your actual pen tip width.
* Remember that pen width is NOT saved on the machine when it is rebooted. You need to do **send pen width** from the controller after each reset, or include it in your exported command queue.






