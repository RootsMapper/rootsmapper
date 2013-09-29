# RootsMapper


## Setup
1. Go into the public/includes folder <br />
2. Copy config-example.php to config.php <br />
3. Edit config.php and populate with your info <br />

## Populate scripts folder

### Option 1: Copy uncompiled scripts
1. Copy .jss files from js-src to public/scripts
2. Rename extensions in public/scripts from .jss to .js

### Option 2: Compile using Google Closure
The src files are found in js-src/. The included makefile utilizes
the Google Closure Compiler.
1. cd js-src/
2. Edit makefile and set the location of compiler.jar
3. make
4. make install
