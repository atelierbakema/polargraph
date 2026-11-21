The control protocol for the Polargraph goes like:

1. _MACHINE SAYS:_ `READY`
1. _CONTROLLER SAYS:_ Here's a command `C17,100,100,END`
1. _MACHINE SAYS:_ Thanks, going to work on this for a bit `BUSY`
1. _CONTROLLER SAYS:_ Ok, I'll wait.
1. _MACHINE SAYS:_ Ok, I've done my line `READY`

Etcetera.

If the command never finishes, then the machine stays BUSY forever.

As always, the first step to diagnosis is to open the debug console in the Controller with `Ctrl-C`, and look at what is really happening.


#But why would the command never finish?!

- It might just a very long-running command. This could be because:
    - you've forgotten to do "set home" before doing your first move
    - you've got the speed set extremely low
    - your machine is set up wrong, so what looks like a small move on the screen is actually a very very large move for the machine

- The machine might have crashed, or become corrupted when it received the command

As always, the first step to diagnosis is to open the debug console in the Controller with `Ctrl-C`, and look at what is really happening.

See these instances: 
* http://www.polargraph.co.uk/forum/polargraphs-group2/troubleshooting-forum5/busy-message-after-initiating-controller-thread476.0/
* https://github.com/euphy/polargraph_server_polarshield/issues/9

I hesitate to suggest this because it doesn't make any sense, but this seems to be a problem for boards with RAMPS, rather than with Polarshield. I can't believe that it is anything to do with the RAMPS hardware, because the Arduino drives blind - that is, it receives no information or guidance from the RAMPS.

It is possible however, that almost all machines with RAMPS were once machines with a previous 3D-printer firmware on, and so the EEPROM on those machines is already loaded with information. Certainly that's what happened in the first link above. HOWEVER... I don't understand why having a pre-stocked EEPROM would make it any less reliable than a fresh one.

I can't replicate this, and I don't support using RAMPS.

In the first case, uncomment the lines

`#define DEBUG_STATE`
`#define DEBUG_COMMS`

In polargraph_server_polarshield to get a more verbose output from the machine, and then watch the communications carefully.