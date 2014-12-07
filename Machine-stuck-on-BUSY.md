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