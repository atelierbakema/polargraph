The language that Polargraph speaks is ascii, transported serially using ``processing.serial.Serial`` on the client (the Polargraph Controller), and Arduino's standard ``Serial`` on the server (the firmware).

Commands are composed of a command number, plus between zero and four parameters, for example

    C09,1000,2000,END

is a message, telling the machine that it's pen is 1000 steps away from the left motor, and 2000 steps away from the right motor.

The command is terminated by a CR (ASCII 10) character.

Once the command has been received and acted upon, the machine will respond with a ``READY`` message, to ask for the next command.

Units
-----

A "step" is one logical motor step. Units are almost always measured in motor steps, and they are almost always written in the native coordinates system. That is, as above, as distances from the left and right motors. There are a couple of exceptions, noted in the command list.

Commands can be short, like **lift pen**:

    C13,END

or longer like **run pen width test**:

    C11,56,0.5,2,05,END

Commands
--------

Commands and responses are detailed on [the Commands and Responses page.](https://github.com/euphy/polargraph/wiki/Polargraph-machine-commands-and-responses).

