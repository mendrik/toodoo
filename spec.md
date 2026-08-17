# Toodoo specification

## Purpose

Toodoo is a tray-only todo tracker for GNOME Shell. Its panel menu is the
complete application interface.

## Panel menu

The panel uses the standard `view-list-symbolic` icon. Selecting it opens a
menu whose first item is always `New task…`. Every saved task follows as a
submenu item; the empty menu contains no placeholder row.

Unfinished tasks appear first, followed by completed tasks. Creation order is
preserved within both groups.

## Adding a task

`New task…` opens a focused, single-line modal dialog. The dialog contains no
buttons and displays `Enter to add • Esc to cancel` below the entry. Enter adds
trimmed, non-empty text and closes the dialog. Enter on blank input leaves the
dialog open. Escape closes it without changes.

## Task actions

Each task submenu presents exactly two actions:

- `Mark done` for an unfinished task, or `Mark undone` for a completed task.
- `Delete`, which removes the task immediately.

An unfinished task has a red cross icon. A completed task has a green check
icon. The icon shape and accessible name also communicate state, so color is
not the only signal.

## Persistence

Tasks are stored in the extension's GSettings schema as ordered `(id, title,
completed)` records. IDs are UUIDs so duplicate task titles are allowed and
actions always affect the selected task. Completed tasks remain stored until
deleted.
