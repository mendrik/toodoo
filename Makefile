.PHONY: install uninstall test check bundle

install:
	./install.sh

uninstall:
	./uninstall.sh

test:
	node --test tests/task_model.test.js

check:
	bash -n install.sh uninstall.sh
	node --check gnome-extension/extension.js
	node --check gnome-extension/taskModel.js
	glib-compile-schemas --strict --dry-run gnome-extension/schemas
	$(MAKE) test

bundle:
	mkdir -p dist
	cd gnome-extension && gnome-extensions pack --force \
		--extra-source=taskModel.js \
		--schema=schemas/org.gnome.shell.extensions.toodoo.gschema.xml \
		--out-dir=../dist .
