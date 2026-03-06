# CNV Format

> **Next-generation offline presentation format + runtime**

CNV (.cnv) is an open container format for pixel-perfect offline presentations, designed as a "PDF for the presentation era." It packages scene graphs, video, audio, animations, and fonts into a single self-contained file, playable by a dedicated offline player.

## Why CNV?

| Current Export | Problem |
|---|---|
| **PDF** | No animations, no video, no transitions |
| **PPTX** | Broken effects, font substitution, wrong colors |
| **MP4** | No interactivity, no slide navigation, huge files |
| **GIF** | Low quality, no audio, size limits |

**CNV solves all of these** — self-contained, pixel-perfect, interactive, portable.

---

## Quick Start

### Prerequisites
- Node.js 20+ 
- npm 10+

### Install
```bash
git clone https://github.com/ValeNaz/cnv-format.git
cd cnv-format
npm install
```

### Generate a Sample Presentation
```bash
npm run generate:sample
# Creates: samples/demo-presentation.cnv
```

### Open in the Player
```bash
npm run player -- samples/demo-presentation.cnv
```

### Player Controls
| Key | Action |
|-----|--------|
| **→** / **Space** / **PageDown** | Next slide |
| **←** / **PageUp** | Previous slide |
| **Home** | First slide |
| **End** | Last slide |
| **F5** / **F** | Toggle fullscreen |
| **Escape** | Exit fullscreen |
| **Click right half** | Next slide |
| **Click left half** | Previous slide |
| **Swipe left** | Next slide (touch) |
| **Swipe right** | Previous slide (touch) |

---

## Project Structure

```
cnv-format/
├── docs/
│   ├── SPEC-v0.1.md               # Format specification
│   └── CANVA-PARTNERSHIP-PROPOSAL.md  # Partnership pitch document
├── generator/
│   └── create-sample.js           # Sample .cnv file generator
├── player/
│   ├── main.js                    # Electron main process
│   ├── preload.js                 # Preload with CNV parser
│   └── renderer/
│       └── index.html             # Player UI + scene graph renderer
├── samples/                       # Generated .cnv sample files
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

---

## Format Overview

A .cnv file is a ZIP archive containing:

```
presentation.cnv
├── META-INF/container.json    # Format version, page count
├── META-INF/manifest.json     # SHA-256 hashes for all assets
├── content/design.json        # Title, dimensions, page order
├── content/pages/001/scene.json    # Scene graph per page
├── content/pages/001/timeline.json # Animation timeline
├── assets/images/*.webp       # Embedded images
├── assets/video/*.mp4         # Embedded video (H.264)
├── assets/fonts/*.woff2       # Subset fonts
├── thumbnails/*.svg           # Page thumbnails
└── fallback/*.svg             # Static fallbacks
```

See [docs/SPEC-v0.1.md](docs/SPEC-v0.1.md) for the complete specification.

---

## Key Features

- **Scene Graph Rendering** — Elements positioned and styled from JSON scene descriptors
- **Animation System** — Fade, slide, scale, rotate with configurable timing and easing
- **Page Transitions** — Fade, slide, zoom, dissolve between pages
- **Video/Audio** — Embedded H.264 video and MP3/AAC audio with autoplay
- **Integrity Verification** — SHA-256 hashes on all assets, checked on load
- **Kiosk Mode** — Fullscreen, auto-hiding controls, keyboard/touch navigation
- **Portable** — Player runs from USB, no installation required
- **Secure** — No executable code in format, Chromium sandbox in player

---

## Documents for Canva Partnership

This repo includes ready-to-present documents:

1. **[Format Specification v0.1](docs/SPEC-v0.1.md)** — Complete technical spec for the .cnv format
2. **[Partnership Proposal](docs/CANVA-PARTNERSHIP-PROPOSAL.md)** — Business case, architecture, roadmap, revenue model
3. **Working MVP** — Functional generator + player demonstrating the concept

---

## Roadmap

- [x] Format specification v0.1
- [x] Sample .cnv generator
- [x] Electron-based player with scene graph rendering
- [x] Keyboard/mouse/touch navigation
- [x] SHA-256 integrity verification
- [x] Fullscreen and kiosk mode
- [ ] Video/audio embedded playback
- [ ] Page transitions with CSS animations
- [ ] Presenter view (multi-monitor)
- [ ] Digital signature verification (Ed25519)
- [ ] Canva Connect API integration for auto-export
- [ ] Windows/macOS portable builds
- [ ] Mobile player (iOS/Android)

---

## License

MIT — see [LICENSE](LICENSE)

## Contact

**ValeNaz** — [github.com/ValeNaz](https://github.com/ValeNaz)
