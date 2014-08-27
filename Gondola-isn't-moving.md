Yes way, it happens to the best of us.

Test for it
-----------

1. click `set home`
    * Your motors will wriggle, and then be energised, and lock.
1. click `move pen to point`, and click somewhere on the machine on-screen.
    * Your motors should pull the pen to a new location, not necessarily in a straight line
1. click `move direct`, and click somewhere on the machine on-screen.
    * Your motors should pull the pen to a new location, moving the pen in a straight line.

What happened
-------------

* **None of the above did anything.** That's not good news. Indicates some deeper problem, probably with the power supply, power connections etc. Check your polarity, your supply voltage.
* **Step 1 locks the motors, step 2 moves the motors but step 3 does nothing.** Better. This is usually means that there is a mismatch between the size of the machine in the controller, and the size that you've told the machine. The machine looks at your request, and will often find that the move would take the pen off the  edge of the machine, and will politely refuse to cooperate.

Debug
-----

There is a debug console in the Polargraph controller that shows you the raw communication between the machine and the controller. You can pop it up with **ctrl+C**. When you've done that, send your **move direct** command and watch for the response from the machine. You will **probably** see something like 

    line was not on the page, skipping it!

Solution
--------

* **Upload your machine specification.** Click 'upload machine spec' on the 'setup' tab of the controller.