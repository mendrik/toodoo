#!/usr/bin/env bash
set -euo pipefail

APP_ID="toodoo@mendrik.github.io"
OLD_APP_ID="desktop-agent@mendrik.github.io"
OLD_ALT_APP_ID="io.github.mendrik.DesktopAgent"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL="${HOME}/.local"
EXTENSIONS_DIR="${LOCAL}/share/gnome-shell/extensions"
EXT_DIR="${EXTENSIONS_DIR}/${APP_ID}"

command -v glib-compile-schemas >/dev/null || {
  echo "glib-compile-schemas is required." >&2
  exit 1
}

# Remove executable artifacts from the unrelated Desktop Agent prototype.
if command -v systemctl >/dev/null; then
  systemctl --user disable --now desktop-agent.service 2>/dev/null || true
fi
rm -f \
  "${LOCAL}/bin/desktop-agentd" \
  "${LOCAL}/bin/desktop-agent" \
  "${HOME}/.config/systemd/user/desktop-agent.service" \
  "${LOCAL}/share/dbus-1/services/io.github.mendrik.DesktopAgent.service" \
  "${LOCAL}/share/applications/io.github.mendrik.DesktopAgent.desktop" \
  "${LOCAL}/share/icons/hicolor/scalable/apps/io.github.mendrik.DesktopAgent.svg" \
  "${LOCAL}/share/desktop-agent/dbus/io.github.mendrik.DesktopAgent1.xml" \
  "${LOCAL}/share/desktop-agent/daemon/sandbox_shell.py"
rm -rf \
  "${EXTENSIONS_DIR:?}/${OLD_APP_ID}" \
  "${EXTENSIONS_DIR:?}/${OLD_ALT_APP_ID}"
rmdir "${LOCAL}/share/desktop-agent/dbus" 2>/dev/null || true
rmdir "${LOCAL}/share/desktop-agent/daemon" 2>/dev/null || true
if command -v systemctl >/dev/null; then
  systemctl --user daemon-reload 2>/dev/null || true
fi

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
