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
* **Step 1 locks the motors, step 2 moves the motors but step 3 does nothing.** Better. This is usally

Usually
------

This means that there is a mismatch between the size of the machine in the controller, and the size that you've told the machine.

* Upload your machine specification. Click 'upload machine spec' on the 'setup' tab of the controller.