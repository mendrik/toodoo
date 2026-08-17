# Toodoo

[![Build](https://github.com/mendrik/toodoo/actions/workflows/build.yml/badge.svg)](https://github.com/mendrik/toodoo/actions/workflows/build.yml)

Toodoo is a deliberately small todo list for the GNOME panel. It keeps tasks
close at hand without opening a full application or running a background
service.

## Features

- A standard list icon in the GNOME panel.
- A compact `New task…` dialog controlled with Enter and Escape.
- Three explicit states: undone, done, and rejected.
- A bullet for undone tasks, a green check for done, and a red cross for rejected.
- Per-task actions to change state, edit, or delete.
- Global actions to delete completed tasks, delete rejected tasks, or clear the
  whole list.
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
title or select `Rejected`, `Undone`, or `Done`. Open the `Tasks` submenu to
delete all done tasks, delete all rejected tasks, or clear the whole list.

Tasks in every state stay in the list until deleted. Tasks survive extension
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
