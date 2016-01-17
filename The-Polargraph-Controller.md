The Polargraph Controller is a little app that we use to specify the size of the machine, the sprockets, and the motor driver types.

You can see a preview of the machine, and lay out your artwork on it, visualising many aspects of the drawing.

## Run it

There are precompiled binary versions of the controller for Windows, OSX and Linux [in the main software bundle.](https://github.com/euphy/polargraphcontroller/releases/latest). If those don't work (Processing is a little fickle), then you can [compile and run it from source](https://github.com/euphy/polargraph/wiki/Running-the-controller-from-source-code) fairly easily.

## Interface

![Controller layout 1](https://github.com/euphy/polargraph/wiki/images/app_layout_01.png)

## Tabs

Different tabs show different sets of features. A preview of the machine is on most of them.

* [Input](https://github.com/euphy/polargraph/wiki/The-Polargraph-Controller-Input-Tab)
* [Setup](https://github.com/euphy/polargraph/wiki/The-Polargraph-Controller-Setup-Tab)
* [Roving](https://github.com/euphy/polargraph/wiki/The-Polargraph-Controller-Roving-Tab)
* [Trace](https://github.com/euphy/polargraph/wiki/The-Polargraph-Controller-Trace-Tab)
* [Queue](https://github.com/euphy/polargraph/wiki/The-Polargraph-Controller-Queue-Tab)

## Connection status

This piece of text indicates whether there is a Polargraph machine physically connected (USB), whether it is ready to receive commands, or whether it is busy drawing.

## Command queue

The command queue is a list of command waiting to be sent to the machine. The queue can be stopped (QUEUE PAUSED), or started (QUEUE RUNNING) by clicking on the header ("CommandQueue..."). When the queue is paused, entries in the queue can be deleted by clicking on them.

The items in the queue are sent in order. Some commands are rushed to the front of the queue, these are referred to as "realtime commands", and show up in cyan in the queue:

    * Send pen tip size
    * Send motor speed