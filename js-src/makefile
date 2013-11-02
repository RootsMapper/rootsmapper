
#  RootsMapper
#  https://github.com/dawithers/rootsmapper
#  Copyright (c) 2013 Mitch Withers, Drew Withers
#  Released under the MIT licence: http://opensource.org/licenses/mit-license


.SUFFIXES: .js .jss

SOURCES=map.jss keyfilter.jss oms.jss loading.jss infobox.jss url-template.jss binarytree.jss
JS=$(SOURCES:.jss=.js)
OUTPUT=../public/scripts/

compile: COMPILER="java -jar ~/compiler.jar" ARG1=--js ARG2=--js_output_file $(JS)

no-compile: COMPILER=cp $(JS)
	cp *.js $(OUTPUT)

.jss.js:
	$(COMPILER) $(ARG1) $< $(ARG2) $@ 

install: compile
	cp *.js $(OUTPUT)

clean:
	rm -rf *.js $(OUTPUT)*.js
