
#  RootsMapper
#  https://github.com/dawithers/rootsmapper
#  Copyright (c) 2013 Mitch Withers, Drew Withers
#  Released under the MIT licence: http://opensource.org/licenses/mit-license


.SUFFIXES: .js .jss

SOURCES=map.jss keyfilter.jss oms.jss loading.jss infobox.jss url-template.jss binarytree.jss tooltip.jss fsAPI.jss utilities.jss downloadify.jss swfobject.jss jquery.jscrollpane.jss jquery.mousewheel.jss
JS=$(SOURCES:.jss=.js)
OUTPUT=../public/scripts/

install: compile
	cp *.js $(OUTPUT)

set-compile:
	$(eval COMPILER=java -jar ~/compiler.jar)
	$(eval ARG1=--js)
	$(eval ARG2=--js_output_file)

set-copy:
	$(eval COMPILER=cp)

compile: set-compile $(JS)

no-compile: set-copy $(JS)
	cp *.js $(OUTPUT)

.jss.js:
	$(COMPILER) $(ARG1) $< $(ARG2) $@ 

clean:
	rm -rf *.js $(OUTPUT)*.js
