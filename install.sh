#!/usr/bin/env bash
set -euo pipefail

APP_ID="toodoo@mendrik.github.io"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL="${HOME}/.local"
EXTENSIONS_DIR="${LOCAL}/share/gnome-shell/extensions"
EXT_DIR="${EXTENSIONS_DIR}/${APP_ID}"

command -v glib-compile-schemas >/dev/null || {
  echo "glib-compile-schemas is required." >&2
  exit 1
}

rm -rf "${EXT_DIR:?}"
install -d -m 0755 "${EXT_DIR}/schemas"
install -m 0644 \
  "${ROOT}/gnome-extension/extension.js" \
  "${ROOT}/gnome-extension/taskModel.js" \
  "${ROOT}/gnome-extension/metadata.json" \
  "${ROOT}/gnome-extension/stylesheet.css" \
  "${EXT_DIR}/"
install -m 0644 \
  "${ROOT}/gnome-extension/schemas/org.gnome.shell.extensions.toodoo.gschema.xml" \
  "${EXT_DIR}/schemas/"
glib-compile-schemas --strict "${EXT_DIR}/schemas"

echo "Installed. Enable '${APP_ID}' in GNOME Extensions, then use its panel icon."
