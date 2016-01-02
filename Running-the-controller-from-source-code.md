Processing, Java and Windows are a slightly fickle combination, and a compiled executable binary made on one system may not run ok on another system. Of course there is always a good reason why, but if you've tried running the 32 bit version, and you've tried running the 64 bit version, and neither work, it's usually easier to compile it and run from source than trying to diagnose your Java problems.

1.  Download Processing v2.2.1: https://processing.org/download/?processing. Make sure you get the version with Java included, even if you already have Java installed on your OS.
1.  Install it, and run it and figure out where it's put your Processing sketchbook folder. Processing calls programs (or apps) "sketches" and so your sketchbook folder is where it saves them. For me, on Windows, this folder is `C:\Users\sandy_000\Documents\Processing`, for you it'll be something else. If you need to find out where your sketchbook is, then you can open Processing, and go `file->preferences` and it'll tell you your Sketchbook location right at the top of the dialog box. The folder might not get created until you actually run Processing once.
1.  Download the latest code bundle: Go to https://github.com/euphy/polargraphcontroller/releases/latest and download the zip file linked to at the bottom of that page - it'll be called something like **`Polargraph*.zip`**.
1.  Unzip the code bundle and copy the three code library folders out of `<unzipped code bundle>/processing-source/Processing libraries/` into your `<processing sketchbook>/libraries/` folder. It'll look like:

        <Processing sketchbook folder>/libraries/controlP5/
        <Processing sketchbook folder>/libraries/diewald_CV_kit/
        <Processing sketchbook folder>/libraries/geomerative/

1.  Copy the whole `polargraphcontroller` folder from `processing-source/` into your Processing sketchbook folder. It'll look like:

        <Processing sketchbook folder>/polargraphcontroller

1.  Restart Processing and go `file->sketchbook->polargraphcontroller` to open the app source code. You should see 19 tabs open up, all with bits and pieces of code in them.
1.  Press the `run` button in the toolbar to run the sketch.