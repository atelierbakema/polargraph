There are a couple of useful features that have keyboard shortcuts, rather than visible buttons.

## Debugging
* ```Ctrl+c```: Debugging console that shows the raw communications between the controller and the machine, plus any "system.out" traffic from the controller

## Navigation
* ```Ctrl+arrow keys```: move the machine preview around
* ```Ctrl+pgup or pgdn```: zoom the machine preview (change the scaling)

## Display
* ```Ctrl+g```: Shows guide lines on or off
* ```Ctrl+s```: Shows Selected Centres - this is a mark where the centre of each selected pixel is. Useful when finely tuning a pixel pattern.
* ```Ctrl+i```: Shows the "information" overlay, which has a handful of interesting bits on it, including the pixel mask colour and an extremely flawed time estimation calculator.

## Control
* ```#```: sends a high-priority "lift pen" command to the top of the command queue
* ```~```: as above, but "drop pen"

## Geometry
* ```< and >```: increase and decrease the "maximum segment length" that controls how long vector art lines get chopped into. The default for this is 2 and the minimum is 1. This isn't something you can see a preview of.

