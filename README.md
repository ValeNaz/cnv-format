# CNV Format

**Next-generation offline presentation format + runtime.**

CNV is a portable, secure, and rich presentation format designed as a modern alternative to PDF/PPTX for offline use. Think of it as a "PDF of the future" — but built for interactive, animated presentations with pixel-perfect rendering.

## Features

- **ZIP-based container** with structured manifest, SVG pages, and embedded assets
- **Vector-perfect rendering** via SVG slides with gradients, shapes, and text
- **Per-element animations** (fade, slide, scale) with configurable delays
- **Slide transitions** (fade, slideLeft, slideRight, zoomIn)
- **Presenter notes** for each slide (toggle with N key)
- **SHA-256 integrity verification** for every page
- **Dark UI player** with thumbnail sidebar, progress bar, and keyboard shortcuts
- **Touch/swipe support** for mobile devices
- **Fullscreen presentation mode**
- **Web fallback** — player works in browser without Electron (loads JSZip from CDN)
- **CLI tools** for inspecting and validating .cnv files
- **Automated test suite**

## Project Structure

```
cnv-format/
  docs/
    SPEC-v0.1.md                 # Format specification
    CANVA-PARTNERSHIP-PROPOSAL.md # Canva partnership pitch
  generator/
    create-sample.js             # Generates a 7-slide demo .cnv file
  player/
    main.js                      # Electron main process
    preload.js                   # CNV parser with integrity checks
    renderer/
      index.html                 # Player UI (dark theme, transitions, notes)
  tools/
    cli.js                       # CLI: info, validate, list, extract
  test/
    run-tests.js                 # Automated test suite
  package.json
  README.md
```

## Quick Start

```bash
# Clone and install
git clone https://github.com/ValeNaz/cnv-format.git
cd cnv-format
npm install

# Generate a sample presentation
node generator/create-sample.js

# Open with the player
npx electron player/main.js samples/demo-presentation.cnv

# Or open in web mode (no Electron needed)
# Just open player/renderer/index.html in a browser and load the .cnv file
```

## CLI Tools

```bash
# Show file info
node tools/cli.js info samples/demo-presentation.cnv

# Validate integrity
node tools/cli.js validate samples/demo-presentation.cnv

# List archive contents
node tools/cli.js list samples/demo-presentation.cnv

# Extract all files
node tools/cli.js extract samples/demo-presentation.cnv
```

## Running Tests

```bash
node test/run-tests.js
```

## Keyboard Shortcuts (Player)

| Key | Action |
|-----|--------|
| Arrow Right / Space | Next slide |
| Arrow Left | Previous slide |
| Home | First slide |
| End | Last slide |
| F | Toggle fullscreen |
| N | Toggle presenter notes |
| ? | Show keyboard shortcuts |
| Esc | Exit fullscreen |

## CNV File Format

A .cnv file is a ZIP archive containing:

- `manifest.json` — Metadata, page list, SHA-256 hashes, animation data
- `pages/*.svg` — Vector slides (1920x1080, full scene graph)
- `assets/*` — Embedded fonts (WOFF2), images, audio, video

See [docs/SPEC-v0.1.md](docs/SPEC-v0.1.md) for the full specification.

## Canva Partnership

This project includes a detailed partnership proposal for Canva to adopt .cnv as a native export format. See [docs/CANVA-PARTNERSHIP-PROPOSAL.md](docs/CANVA-PARTNERSHIP-PROPOSAL.md).

## Roadmap

- **MVP (current):** ZIP container, SVG renderer, Electron player, basic animations, CLI tools
- **v1.0 (6 months):** Video/audio playback, font embedding, kiosk mode, auto-update
- **v2.0 (12 months):** Canva SDK integration, DRM support, mobile apps, cloud sync

## License

MIT
