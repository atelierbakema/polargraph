Large machines
===================

Most machines seem to end up ready to draw A1 sized pictures at the most, so that means a machine around a metre wide.

I have built a machine 8m wide, and seen another 6m tall. Each have their own problems.

* [Huge Portland Design Week Project](http://www.polargraph.co.uk/2014/10/huge-portland-design-week-project/) is a good example of a big machine.

While there is not a practical limitation to the size of a machine in software, there are plenty of physical, mechanical reasons why things get tough at larger sizes.

* **Access:** It's a pain to have to go up ladders to get to the motors.
* **Speed:** A large machine doesn't go any faster, so it ends up taking days and days to detail a very large drawing. Path optimisations help here (Vector Optimiser), but there's no getting away from it. Any given pen has a certain top speed.
* **Quality:** A big machine has a bigger sweet spot, so quality is good overall. Because the weight of the gondola does not change with position, but the weight of the cord _does_ change, then it is possible for the cord to pull the gondola around in undesirable ways. When the gondola is right down in one lower corner, the cord from the opposite motor is likely to be slightly curved, so pulling the gondola further in towards the centre than it should be. In fact, it is likely to be impossible to move the gondola right to the edge. This is true of small machines too, but the hanging catenary problem only becomes worse as machines get bigger.
* **Set-up time** & cost: A cross between the first two above. It takes longer to set up a machine using stepladders, then if it goes wrong it costs it all again. If you've got a roll of paper 2m wide, it's going to take you some time to prepare the next canvas when you forget to home and draw a stripe through your nice clean paper. The paper itself is expensive and difficult to handle. Do not underestimate this.
* **Markers:** One reason that spraycans are popular is that they can put down a large mark, fast. With pen-based drawbots, it is difficult to go much larger than standard marker pens. It is usually intended that large images are viewed from a distance, so up close detail is reduced. With drawbots with small pens, no such reduction in detail is possible.
