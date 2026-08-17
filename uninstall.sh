#!/usr/bin/env bash
set -euo pipefail

APP_ID="toodoo@mendrik.github.io"
LOCAL="${HOME}/.local"
EXT_DIR="${LOCAL}/share/gnome-shell/extensions/${APP_ID}"

if command -v gnome-extensions >/dev/null; then
  gnome-extensions disable "${APP_ID}" 2>/dev/null || true
fi
rm -rf "${EXT_DIR:?}"

echo "Removed Toodoo extension files. Stored tasks were kept."
