# Desktop Agent

[![Flatpak](https://github.com/mendrik/james/actions/workflows/flatpak.yml/badge.svg)](https://github.com/mendrik/james/actions/workflows/flatpak.yml)

Desktop Agent is a GNOME Shell extension and local user service for running
questions and explicitly scoped file tasks through an authenticated Codex CLI. It provides a
small panel menu, an anchored multiline Ask popup, model selection, and live task status
without exposing the whole home directory to the worker.

## Features

- Open the Ask dialog from the panel icon or with **Super+A**.
- Select supported Codex models from the panel menu.
- Keep approval visible by default, or enable persistent **Auto-approve** to
  skip only the plan confirmation.
- Answer questions without mounting any user files.
- Diagnose local hardware and driver problems from a bounded, read-only system
  snapshot.
- Restrict file tasks to one existing directory selected in the request.
- Record job events and results under
  `~/.local/state/desktop-agent/jobs/`.

## Requirements

- GNOME Shell 46–50 on Linux
- Python 3 with PyGObject and GTK 4
- Bubblewrap (`bwrap`)
- libseccomp
- An installed and authenticated [Codex CLI](https://github.com/openai/codex)

## Install

```bash
git clone https://github.com/mendrik/james.git
cd james
./install.sh
```

Log out and back in so GNOME Shell discovers the extension, then enable
**Desktop Agent** in the Extensions app. The installer adds only user-level
files under `~/.local` and does not copy or modify `~/.codex`.

Use **Login** in the panel menu if the dedicated Desktop Agent Codex profile is
not authenticated. Login opens `codex login --device-auth`; the project never
asks for or stores an API key.

To remove installed program files while retaining configuration and audit
history:

```bash
./uninstall.sh
```

## Usage

Open **Ask…** or press **Super+A**. Questions do not need a folder. For a file
task, include one explicit existing folder in the request, for example:

```text
Rename images in ~/Downloads according to their content
```

Local diagnostic questions such as `What graphics card do I have?` and
`Why is my GPU driver failing?` automatically request read-only system
diagnostics. Desktop Agent collects fixed hardware, kernel, package, and journal
checks and gives Codex only the resulting snapshot—not a host shell.

Press **Ctrl+Enter** to prepare the task. With Auto-approve disabled, review the
canonical directory and capabilities before selecting **Run task**.

## Security model

The daemon, rather than the Shell extension, owns execution policy. Before a
job starts it:

- resolves at most one directory and rejects `/` and the entire home folder;
- mounts only that directory writable inside a Bubblewrap namespace, or mounts
  no user files when answering a question;
- runs Codex without its redundant inner filesystem sandbox only after the
  daemon has placed it inside the outer Bubblewrap boundary;
- routes every model-generated shell command through a seccomp launcher that
  blocks every non-Unix socket family while leaving Codex's own model connection
  available;
- exposes local diagnostics only as a bounded, read-only JSON snapshot produced
  by fixed command arguments;
- rejects administrator privileges and `sudo` access;
- snapshots regular files without following symlinks and writes an audit log.

Auto-approve skips the visual plan dialog but does not weaken these checks.

## Development

Run the policy tests and syntax checks:

```bash
make check
node --check gnome-extension/extension.js
```

Create a distributable GNOME Shell extension archive:

```bash
make bundle
```

## Flatpak build

The [Flatpak workflow](.github/workflows/flatpak.yml) builds the GTK control
launcher on pushes to `main` and on pull requests, then uploads an installable
`.flatpak` artifact. Build it locally with:

```bash
flatpak install --user flathub org.gnome.Platform//50 org.gnome.Sdk//50
flatpak-builder --user --force-clean build-dir \
  build-aux/flatpak/io.github.mendrik.DesktopAgent.yml
```

GNOME Shell extensions and user systemd services are host components, so the
Flatpak artifact is the companion launcher only. Install the complete agent
with `./install.sh`.

## License

Desktop Agent is licensed under the [GNU GPL v3](LICENSE).
# toodoo
