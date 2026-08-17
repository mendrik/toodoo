# Toodoo

[![Build](https://github.com/mendrik/toodoo/actions/workflows/build.yml/badge.svg)](https://github.com/mendrik/toodoo/actions/workflows/build.yml)

Toodoo is a deliberately small todo list for the GNOME panel. It keeps tasks
close at hand without opening a full application or running a background
service.

## Features

- A standard list icon in the GNOME panel.
- A compact `New task…` dialog controlled with Enter and Escape.
- Unfinished tasks shown before completed tasks.
- Per-task actions to mark done, mark undone, or delete.
- Persistent task storage through GSettings.

## Requirements

- GNOME Shell 46–50
- Bash
- GLib's `glib-compile-schemas` command

## Install

```bash
git clone https://github.com/mendrik/toodoo.git
cd toodoo
./install.sh
```

Log out and back in so GNOME Shell discovers the extension, then enable
**Toodoo** in the Extensions app.

## Use

Select the list icon in the panel, then choose `New task…`. Type a task and
press Enter to add it, or Escape to cancel. Open a task's submenu to change its
completion state or delete it.

Completed tasks stay in the list until deleted. Tasks survive extension
reloads, logout, and reinstall because they are stored in the user's GSettings
database.

## Uninstall

```bash
./uninstall.sh
```

Uninstalling removes the extension files but keeps stored tasks so a later
reinstall can restore them.

## Development

Development additionally requires Node.js 20 or newer, GNU Make, and the
`gnome-extensions` command supplied with GNOME Shell.

Run all static checks and unit tests:

```bash
make check
```

Create an installable GNOME Shell extension archive:

```bash
make bundle
```

The bundle is written to
`dist/toodoo@mendrik.github.io.shell-extension.zip`.

## License

Toodoo is licensed under the [GNU GPL v3](LICENSE).
