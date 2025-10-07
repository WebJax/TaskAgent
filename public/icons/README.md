# TaskAgent Icons

Alle ikoner er genereret fra `task agent-1024.png` (1024x1024 masterikon).

## Ikonstørrelser

### Standard Web Icons
- `icon-16x16.png` - Browser favicon (små)
- `icon-32x32.png` - Browser favicon (standard)
- `icon-72x72.png` - Android Chrome
- `icon-96x96.png` - Android Chrome
- `icon-128x128.png` - Chrome Web Store
- `icon-144x144.png` - Microsoft Tile
- `icon-152x152.png` - iPad iOS Safari
- `icon-180x180.png` - iPhone iOS Safari (anbefalet)
- `icon-192x192.png` - Android Chrome (standard)
- `icon-256x256.png` - Ekstra støtte
- `icon-384x384.png` - PWA splash screen
- `icon-512x512.png` - PWA standard (høj opløsning)
- `icon-1024x1024.png` - macOS & høj opløsning displays

### PWA Shortcut Icons
- `shortcut-new-task.png` - Genvej til ny opgave
- `shortcut-pause.png` - Genvej til pause
- `shortcut-reports.png` - Genvej til rapporter

### Root Icons
- `/favicon.ico` - Multi-resolution favicon (16x16, 32x32, 48x48)
- `/apple-touch-icon.png` - Standard Apple touch ikon (180x180)

## Platforme Support

### iOS/iPadOS
- 152x152 - iPad
- 180x180 - iPhone (anbefalet af Apple)
- 192x192 - Fallback

### Android
- 72x72 - ldpi
- 96x96 - mdpi
- 144x144 - xhdpi
- 192x192 - xxhdpi (anbefalet)
- 512x512 - xxxhdpi

### macOS
- 1024x1024 - macOS app icon specification

### Progressive Web App (PWA)
- 192x192 - Minimum anbefalet
- 512x512 - Høj opløsning
- 1024x1024 - Premium support

## Kvalitetsindstillinger
- Alle ikoner er genereret med `-quality 100` for maksimal skarphed
- Bruger ImageMagick til resizing
- PNG format for transparens support

## Generering
For at regenerere alle ikoner:
```bash
cd /Users/jacobthygesen/Sites/taskagent/public/icons
# Kør generate-icons.sh script
```

## Reference
- Manifestfil: `/manifest.json`
- HTML referencer: `/public/index.html` og `/public/reports.html`
