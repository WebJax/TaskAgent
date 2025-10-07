#!/bin/bash
# Generate all TaskAgent icons from master 1024x1024 logo
# Usage: ./generate-icons.sh

set -e

ICONS_DIR="/Users/jacobthygesen/Sites/taskagent/public/icons"
SOURCE_LOGO="task agent-1024.png"
PUBLIC_DIR="/Users/jacobthygesen/Sites/taskagent/public"

cd "$ICONS_DIR"

echo "🎨 Genererer ikoner fra $SOURCE_LOGO..."

# Standard web icons
echo "📱 Opretter standard web ikoner..."
magick "$SOURCE_LOGO" -resize 16x16 -quality 100 icon-16x16.png
magick "$SOURCE_LOGO" -resize 32x32 -quality 100 icon-32x32.png
magick "$SOURCE_LOGO" -resize 72x72 -quality 100 icon-72x72.png
magick "$SOURCE_LOGO" -resize 96x96 -quality 100 icon-96x96.png
magick "$SOURCE_LOGO" -resize 128x128 -quality 100 icon-128x128.png
magick "$SOURCE_LOGO" -resize 144x144 -quality 100 icon-144x144.png
magick "$SOURCE_LOGO" -resize 152x152 -quality 100 icon-152x152.png
magick "$SOURCE_LOGO" -resize 180x180 -quality 100 icon-180x180.png
magick "$SOURCE_LOGO" -resize 192x192 -quality 100 icon-192x192.png
magick "$SOURCE_LOGO" -resize 256x256 -quality 100 icon-256x256.png
magick "$SOURCE_LOGO" -resize 384x384 -quality 100 icon-384x384.png
magick "$SOURCE_LOGO" -resize 512x512 -quality 100 icon-512x512.png
cp "$SOURCE_LOGO" icon-1024x1024.png

# PWA Shortcut icons
echo "🚀 Opretter PWA shortcut ikoner..."
magick "$SOURCE_LOGO" -resize 192x192 -quality 100 shortcut-new-task.png
magick "$SOURCE_LOGO" -resize 192x192 -quality 100 shortcut-pause.png
magick "$SOURCE_LOGO" -resize 192x192 -quality 100 shortcut-reports.png

# Multi-resolution favicon
echo "⭐ Opretter multi-resolution favicon.ico..."
magick "$SOURCE_LOGO" -resize 16x16 -quality 100 temp-16.png
magick "$SOURCE_LOGO" -resize 32x32 -quality 100 temp-32.png
magick "$SOURCE_LOGO" -resize 48x48 -quality 100 temp-48.png
magick temp-16.png temp-32.png temp-48.png "$PUBLIC_DIR/favicon.ico"
rm temp-16.png temp-32.png temp-48.png

# Apple touch icon
echo "🍎 Opretter Apple touch icon..."
cp icon-180x180.png "$PUBLIC_DIR/apple-touch-icon.png"

echo "✅ Alle ikoner er genereret succesfuldt!"
echo ""
echo "Ikoner oprettet:"
ls -lh icon-*.png | wc -l | xargs echo "  - Standard ikoner:"
ls -lh shortcut-*.png | wc -l | xargs echo "  - Shortcut ikoner:"
echo "  - favicon.ico: $PUBLIC_DIR/favicon.ico"
echo "  - apple-touch-icon.png: $PUBLIC_DIR/apple-touch-icon.png"
