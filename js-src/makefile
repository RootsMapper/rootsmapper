.SUFFIXES: .js .jss

COMPILER=java -jar ~/compiler.jar

SOURCES=map.js keyfilter.js oms.js loading.js infobox.js
JS=$(SOURCES:.jss=.js)
OUTPUT=../public/scripts/


compile: $(JS)

.jss.js:
	$(COMPILER) --js $< --js_output_file $@ 

install: compile
	cp *.js $(OUTPUT)

clean:
	rm -rf *.js $(OUTPUT)*.js
