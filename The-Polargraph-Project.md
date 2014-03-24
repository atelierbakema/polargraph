A Polargraph is a kind of vertical hanging-V drawing machine, or plotter. It is technologically simple, but capable of precise work at large scales.

It consists of a hardware platform with a microcontroller and some motor drivers. This microcontroller has a piece of software written for it (called the firmware, sometimes the polargraph _server_ software). The firmware is uploaded to the microcontroller. This hardware platform is referred to as 'the polargraph machine'.

There is a small application called the Polargraph Controller, and that is used to send instructions to the machine. Images themselves are too large and complicated for the machine itself to understand, so the Polargraph Controller loads them directly, and decomposes them into larger pixels, dispatching them one by one to the machine to actually draw. The Polargraph Controller is written as a Processing application, but is available as a precompiled Java application on PC, Mac and Linux.

The main site for Polargraph is http://www.polargraph.co.uk. Source code for software and hardware elements are here on github, currently distributed amongst a number of repos, these will be brought to be under this umbrella project eventually.
