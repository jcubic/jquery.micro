VERSION=0.0.1
JSC=java -jar ~/bin/closure.bin/compiler.jar --js
SED=sed
CP=cp

ALL: README.md js/jquery.micro-$(VERSION).js js/jquery.micro-$(VERSION).min.js js/jquery.micro-min.js micro.jquery.json 

README.md: README.in
	$(SED) -e "s/{{V}}/$(VERSION)/g" < README.in > README.md

js/jquery.micro-$(VERSION).js: js/jquery.micro-src.js ~$(VERSION)
	$(SED) -e "s/{{V}}/$(VERSION)/g" -e "s/{{DATE}}/`date -uR`/g" js/jquery.micro-src.js > js/jquery.micro-$(VERSION).js

js/jquery.micro-$(VERSION).min.js: js/jquery.micro-$(VERSION).js
	$(JSC) js/jquery.micro-$(VERSION).js > js/jquery.micro-$(VERSION).min.js

js/jquery.micro-min.js: js/jquery.micro-$(VERSION).min.js
	$(CP) js/jquery.micro-$(VERSION).min.js js/jquery.micro-min.js

micro.jquery.json: manifest ~$(VERSION)
	$(SED) -e "s/{{V}}/$(VERSION)/g" manifest > micro.jquery.json

~$(VERSION):
	touch ~$(VERSION)
