I [covered this great little tool on the blog](http://www.polargraph.co.uk/2014/10/huge-portland-design-week-project/). Written by [Evan Heidtmann](https://github.com/ezheidtmann) and [Olivier Bouwman](https://github.com/olivierbouwman) to speed up drawing, it takes a saved command queue, and reorders it to draw in an efficient manner.

Before and after:
![Before and after optimisation](http://www.polargraph.co.uk/wp-content/uploads/2014/12/motorcycle_pair_800.jpg)

This is an excellent little script. I hope I'll be able to pull the actual features into the main Polargraph Controller eventually, but until then, thanks to Evan and Olivier for investing the time into this project, and publishing the results. It's a neat piece of code too, good to read through.

## How to do it
###1. Download the optimizer
Get the code from [Evan's github repo](https://github.com/ezheidtmann/polargraph-optimizer). You can check it out with git or download it as a zip. Put it into a folder on your computer.

###2. Environment
The optimizer is a program written in Python. To be able to run this, you need to have Python installed. You might find you already have it. Open a command prompt and type `python`, if you get a `>>>` prompt then you've got it installed already, otherwise head to [python downloads](https://www.python.org/downloads/) and get it and install version 2.x.

###3. Produce your command queue, queue_1.txt
Use the Polargraph Controller to load your vector artwork, produce your command queue. Export the queue as a text file, for example, queue_1.txt.

###4. Use the optimizer on queue_1.txt to make queue_2.txt
Open a command prompt in the directory where you have the optimizer files, and do:

    python process.py queue_1.txt > queue_2.txt

Wait a couple of seconds (or more) until it's finished. The command tells Python to run `process.py`, with the exported queue as a parameter, and it also sends the output of the program to a new file: `queue_2.txt`. The names of the files here don't matter.

###5. Use queue_2.txt
You can load it back into the controller if you want to see how it looks, or you can just put it in the PolargraphSD on an SD card and draw from there.
