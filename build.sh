#!/bin/sh
set -eu
cd "$(dirname "$0")"
zip -j ../teams-invitation-viewer-0.1.8.xpi manifest.json parser.js background.js content.js extract.js details.js popup.html popup.js icon.png
