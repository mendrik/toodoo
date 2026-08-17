# Toodoo specification

## Purpose

Toodoo is a tray-only todo tracker for GNOME Shell. Its panel menu is the
complete application interface.

## Panel menu

The panel uses the standard `view-list-symbolic` icon. Selecting it opens a
menu whose first item is always `New task…`. Every saved task follows as a
submenu item; the empty menu contains no placeholder row. A global `Tasks`
submenu provides `Delete completed`, `Delete rejected`, and `Delete all`
commands. Each command is disabled when it has no tasks to remove.

Undone tasks appear first, followed by done tasks and then rejected tasks.
Creation order is preserved within each state group. `Delete completed`
removes done tasks only, while `Delete rejected` removes rejected tasks only.

## Adding a task

`New task…` opens a focused, single-line modal dialog. The dialog contains no
buttons and displays `Enter to add • Esc to cancel` below the entry. Enter adds
trimmed, non-empty text and closes the dialog. Enter on blank input leaves the
dialog open. Escape closes it without changes.

## Task actions

Each task submenu presents three mutually exclusive state choices. The current
state has a radio-style dot:

- `Rejected`
- `Undone`
- `Done`

The state choices are followed by these actions:

- `Edit…`, which opens the task dialog with the current title. Enter saves a
  trimmed, non-empty title and Escape leaves the task unchanged.
- `Delete`, which removes the task immediately.

An undone task has a single bullet icon, a done task has a green check, and a
rejected task has a red cross. The icon shape and accessible name also
communicate state, so color is not the only signal.

## Persistence

Tasks are stored in the extension's GSettings schema as ordered `(id, title,
state)` records. IDs are UUIDs so duplicate task titles are allowed and actions
always affect the selected task. Existing boolean records are migrated once:
unfinished becomes undone and completed becomes done.
