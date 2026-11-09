Pixel masking is designed to work like a "chroma key" mechanism. You pick a particular colour from the source image using the `CHOOSE MASK COLOUR` feature, and then any pixels that have that colour are not rendered.

I'll show an example here. Drawing:

![](https://github.com/euphy/polargraph/blob/master/docs/images/example_mask.png)

without masking will look something like this:

![](https://github.com/euphy/polargraph/raw/master/docs/images/masking-example-02-pixelated.PNG)

When rendered, it'll still look like a rectangular panel. If you wanted to have some rounded corners, and for the inside of the Os with no ink at all in them, then you can give them a special colour which will be ignored.

![](https://github.com/euphy/polargraph/raw/master/docs/images/example_mask_keyed.png)

When loaded into the controller, pop up the information panel using `Ctrl+i` and notice the `Chroma key colour` box at the bottom. When you click `Choose mask colour` and click anywhere on the image, this chroma key colour is updated.

![](https://github.com/euphy/polargraph/raw/master/docs/images/masking-example-03-choose-chroma.PNG)

In the example above, I've picked the bright green. Now the density preview shows that those masked pixels are blank, and when I generate the command queue using the `lift pen over masked pixels` rendering option, the queue preview shows them as white pixels, with a pen lift before, and a pen drop afterwards. This usually results in a broken line, where the pen is lifted over masked areas.

![](https://github.com/euphy/polargraph/raw/master/docs/images/masking-example-04-blanks.PNG)

The other rendering option (`draw masked pixels as blanks`, shown below) doesn't lift the pen at all, but simply ignores the masked pixel and draws on to it's next destination. This usually results in a continuous line that goes through the masked areas.

![](https://github.com/euphy/polargraph/raw/master/docs/images/masking-example-04-skipped.PNG)

This is a very underdeveloped feature, so it's not obvious how it works!