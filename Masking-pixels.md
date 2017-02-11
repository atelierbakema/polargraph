Pixel masking is designed to work like a "chroma key" mechanism. You pick a particular colour from the source image using the `CHOOSE MASK COLOUR` feature, and then any pixels that have that colour are not rendered.

I'll show an example here. Drawing [this picture], without masking will look something like this.

(02 pixelated)

When rendered, it'll still look like a rectangular panel. If you wanted to have some rounded corners, and for the inside of the Os with no ink at all in them, then you can give them a special colour which will be ignored.

(example mask keyed)

When loaded into the controller, pop up the information panel using `Ctrl+i` and notice the `Chroma key colour` box at the bottom. When you click `Choose mask colour` and click anywhere on the image, this chroma key colour is updated.

(03 chroma)

In the example above, I've picked the bright green. Now the density preview shows that those masked pixels are blank, and when I generate the command queue using the `lift pen over masked pixels` rendering option, the queue preview shows them as white pixels, with a pen lift before, and a pen drop afterwards. This usually results in a broken line, where the pen is lifted over masked areas.

(04 blanks)

The other rendering option (`draw masked pixels as blanks`, shown below) doesn't lift the pen at all, but simply ignores the masked pixel and draws on to it's next destination. This usually results in a continuous line that goes through the masked areas.



This is a very underdeveloped feature, so it's not obvious how it works!