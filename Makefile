check: lint test

lint:
	./node_modules/.bin/jshint *.js lib test

test:
	node --test --require should

.PHONY: check lint test
