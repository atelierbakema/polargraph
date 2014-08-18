A Polargraph is a kind of vertical hanging-V drawing machine, or plotter. It is technologically simple, but capable of precise work at large scales.

It consists of a hardware platform with a microcontroller and some motor drivers. This microcontroller has a piece of software written for it (called the firmware, sometimes the polargraph _server_ software). The firmware is uploaded to the microcontroller. This hardware platform is referred to as 'the polargraph machine'.

There is a small application called the Polargraph Controller, used to send instructions to the machine. Images themselves are too large and complicated for the machine itself to understand, so the Polargraph Controller loads them instead, and decomposes them into larger picture elements, or patches of shading, dispatching them one by one to the machine to actually draw. The Polargraph Controller is written as a Processing application, but is available as a precompiled Java application on PC, Mac and Linux.

The main site for Polargraph is http://www.polargraph.co.uk. Source code for software and hardware elements are here on github, currently distributed amongst a number of repos, these will be brought to be under this umbrella project eventually.

What's in a name?
-----------

Polargraph is a particular brand of drawing machine. It is often used in a generic way to describe any of these kinds of machine, and I take that as a compliment to the ubiquity of the project, but it shouldn't really be used except when referring to this Polargraph project.

It is not a generic name for a drawbot, and the term was not in use before this project began.