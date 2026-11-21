The Polargraph Controller is a pretty thing (in some ways), and a memory and CPU hog. You might tolerate that while you're actively using it (laying out, building some artwork), but you might not want your little laptop fried for two days while it draws out a few lines.


## A solution
If you have a PolargraphSD, of course you just export the command queue as a text file, put it on an SD card and run the queue from the machine, without even being connected to a computer.


## A different solution
If you have an UNO-based Polargraph, then you don't have that luxury. However, if you **export queue** to a text file, you can use the python script in the gist below to send the queue, line by line to the Polargraph machine.

[Polargraph queue sender (low resource)](https://gist.github.com/euphy/75366a70346689190bb5)

It'll work fine on a Raspberry Pi and requires very little CPU or memory overhead.

## How to use it

1. Download the `send.py` file. (copy-paste into a new file is fine.)
1. Copy your command queue file into the same directory (folder) that you have put `send.py`.
1. Find out which port your Polargraph (Arduino) is connected to. 
1. You should have python installed (Rasppis already have this).
1. Make sure you have a python package called pyserial installed:

        pip install pyserial

1. At the command line (terminal), change to the directory where you have stored `send.py` and your command queue text file.
1. If your command queue file was called `mycommands.txt`, and your arduino was connected to `/dev/ttyACM0`, then you'd do:

        python send.py mycommands.txt /dev/ttyACM0

To find out which port the Arduino is connected to type `ls /dev/` before and after pluging the Arduino in. 

The Python script will be terminated once the SSH connection is lost. You can use the `screen` command to avoid this.

1. Install screen with `sudo apt-get install screen`
1. prefix the above command with screen:

        screen python send.py mycommands.txt /dev/ttyACM0

1. Everything will look the same now. You can detach from the screen by pressing `CTRL-D` and then `a`
1. When you are detached from the screen (ie. no output from the script) you can exit your SSH connection and the Polargraph will continue to draw.
1. To get back to the detached screen type `screen -r`