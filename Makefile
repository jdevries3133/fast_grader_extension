all: build

prod: build
	python3 prep_prod.py

build: clean
	mkdir dist
	cp -r src/* dist

clean:
	rm -rf dist
