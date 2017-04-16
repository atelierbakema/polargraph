## The problem
Processing, Java and Windows are a slightly fickle combination, and a compiled executable binary made on one system may not run ok on another system. Of course there is always a good reason why, but if you've tried running the 32 bit version, and you've tried running the 64 bit version, and neither work, it's usually easier to compile it and run from source than trying to diagnose your Java problems.

>###What is Processing? 
>Processing is a programming language and an environment (editor) that allows small, but sophisticated graphical apps to be developed quickly. It's based on Java. Polargraph Controller is written in Processing, and is run by loading the Polargraph Controller's source code into the Processing editor, and running it.

## How to do it
1.  Download Processing **v2.2.1**: https://processing.org/download/?processing. Make sure you get the version with Java included, even if you already have Java installed on your OS. Processing's most recent version is **3**, so don't just get the newest package. (Version 3 introduces some breaking changes that are not accounted for yet.)
1.  Install Processing, and run it and figure out where it's put your Processing sketchbook folder. Processing calls programs (or apps) "sketches" and so your sketchbook folder is where it saves them. For me, on Windows, this folder is `C:\Users\sandy_000\Documents\Processing`, for you it'll be something else. If you need to find out where your sketchbook is, then you can open Processing, and go `file->preferences` and it'll tell you your Sketchbook location right at the top of the dialog box. The folder might not get created until you actually run Processing once.
1.  Download the latest code bundle: Go to https://github.com/euphy/polargraphcontroller/releases/latest and download the zip file linked to at the bottom of that page - it'll be called something like **`Polargraph*.zip`**.
1.  Unzip the code bundle and copy the three code library folders out of 

        <unzipped code bundle>/processing-source/Processing libraries/

    into your 

        <processing sketchbook>/libraries/

    folder. It'll look like:

        <Processing sketchbook folder>/libraries/controlP5/
        <Processing sketchbook folder>/libraries/diewald_CV_kit/
        <Processing sketchbook folder>/libraries/geomerative/

*Note:* there may be no libraries inside code bundle, then you have to download them yourself and restart Processing.

1.  Copy the whole `polargraphcontroller` folder from `processing-source/` into your Processing sketchbook folder. It'll look like:

        <Processing sketchbook folder>/polargraphcontroller

1.  Restart Processing and go `file->sketchbook->polargraphcontroller` to open the app source code. You should see 19 tabs open up, all with bits and pieces of code in them.
1.  Press the `run` button in the toolbar to run the sketch.

## Why this is better than running the compiled versions anyway

The black area at the bottom of the Processing editor window is called **the console**, and it shows a lot of useless debugging noise, but it also sometimes show useful things. Or at least things that can be useful when trying to figure out why something isn't working. Nice to have.

## Why this is worse than running the compiled versions

You've got to set up the libraries. Just a bit of a faff.