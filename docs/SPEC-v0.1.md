# CNV Format Specification v0.1

**Status:** Draft | **Date:** 2026-06-03 | **Authors:** ValeNaz | **Version:** 0.1.0

---

## 1. Introduction

### 1.1 Purpose
The CNV format (.cnv) is a container format designed for pixel-perfect offline playback of rich presentations originally created in Canva. It serves as a "next-generation PDF" optimized for presentations with full support for video, audio, animations, and transitions.

### 1.2 Design Goals
1. **Pixel-perfect fidelity** — Rendered output must match Canva's online rendering
2. **Self-contained** — All assets (images, video, audio, fonts) embedded in a single file
3. **Offline-first** — No network dependencies for playback
4. **Portable** — Playable from USB drives without installation
5. **Secure** — Signed and integrity-verified content
6. **Efficient** — Smaller than PDF/PPTX through deduplication and modern compression
7. **Progressive** — Instant-start playback of first slide while loading remaining content

### 1.3 Comparison with Existing Formats
| Aspect | PDF | PPTX | CNV |
|--------|-----|------|-----|
| Video playback | No mainstream viewer | Yes, limited | Yes, H.264/H.265 native |
| Animations | None | OOXML model | Full Canva animation set |
| Pixel-perfect Canva | No | No | Yes (with engine) |
| Progressive loading | Yes (linearized) | No | Yes (manifest-based) |
| Modern compression | DEFLATE only | DEFLATE | zstd (RFC 8878) |
| Digital signatures | PAdES | XML Sig | Ed25519 |

---

## 2. File Structure

### 2.1 Container
A .cnv file is a ZIP archive with extension `.cnv` and MIME type `application/vnd.cnv-presentation`.
Uses Zstandard (zstd) for text entries, Store for pre-compressed entries (WebP, MP4, WOFF2).

### 2.2 Directory Layout
```
presentation.cnv
+-- META-INF/
|   +-- container.json       # Container metadata and version
|   +-- manifest.json        # Complete asset manifest with SHA-256 hashes
|   +-- signatures.json      # Digital signatures (optional)
+-- content/
|   +-- design.json          # Design-level metadata
|   +-- pages/
|       +-- 001/
|       |   +-- scene.json   # Scene graph for this page
|       |   +-- timeline.json # Animation timeline (optional)
|       +-- 002/ ...
+-- assets/
|   +-- images/{hash}.webp
|   +-- video/{hash}.mp4
|   +-- audio/{hash}.mp3
|   +-- fonts/{hash}.woff2
+-- thumbnails/
|   +-- 001.webp             # Page thumbnails (800x600 max)
+-- fallback/
    +-- 001.png              # Full-resolution static fallback
```

---

## 3. Schema Definitions

### 3.1 container.json
```json
{
  "cnv_version": "0.1.0",
  "created_at": "2026-06-03T14:30:00Z",
  "generator": { "name": "cnv-generator", "version": "0.1.0" },
  "page_count": 5,
  "total_duration_ms": 30000,
  "features": ["video", "animations", "audio"]
}
```

### 3.2 manifest.json
```json
{
  "entries": [
    {
      "path": "content/pages/001/scene.json",
      "size": 4523,
      "hash": "sha256:a1b2c3d4...",
      "compression": "zstd"
    }
  ]
}
```

### 3.3 design.json
```json
{
  "title": "Q4 Strategy Presentation",
  "dimensions": { "width": 1920, "height": 1080, "unit": "px" },
  "page_order": ["001", "002", "003"],
  "default_transition": { "type": "fade", "duration_ms": 500 },
  "metadata": {
    "author": "Jane Doe",
    "source_design_id": "DAVZr1z5464",
    "export_date": "2026-06-03T14:30:00Z"
  }
}
```

### 3.4 scene.json (Per-Page Scene Graph)
```json
{
  "page_id": "001",
  "dimensions": { "width": 1920, "height": 1080 },
  "background": { "type": "solid", "color": "#1a1a2e" },
  "elements": [
    {
      "id": "elem_001", "type": "text",
      "position": { "x": 100, "y": 200 },
      "size": { "width": 800, "height": 120 },
      "rotation": 0, "opacity": 1.0, "z_index": 1,
      "content": {
        "text": "Welcome to CNV",
        "font": { "family": "Inter", "weight": 700, "size": 64, "color": "#ffffff",
                  "asset_ref": "assets/fonts/f8e7d6c5b4a3.woff2" },
        "alignment": "left"
      },
      "animations": [
        { "trigger": "on_enter", "type": "fade_in", "duration_ms": 800, "delay_ms": 200, "easing": "ease-out" }
      ]
    },
    {
      "id": "elem_002", "type": "image",
      "position": { "x": 960, "y": 100 },
      "size": { "width": 860, "height": 880 },
      "rotation": 0, "opacity": 1.0, "z_index": 0,
      "content": { "asset_ref": "assets/images/a1b2c3d4e5f6.webp", "fit": "cover" }
    },
    {
      "id": "elem_003", "type": "video",
      "position": { "x": 100, "y": 400 },
      "size": { "width": 640, "height": 360 },
      "rotation": 0, "opacity": 1.0, "z_index": 3,
      "content": { "asset_ref": "assets/video/b2c3d4e5f6a7.mp4",
                    "autoplay": true, "loop": false, "muted": false }
    }
  ],
  "transition": { "type": "slide_left", "duration_ms": 600 }
}
```

### 3.5 timeline.json
```json
{
  "page_id": "001",
  "duration_ms": 8000,
  "auto_advance": true,
  "tracks": [
    { "element_id": "elem_001",
      "keyframes": [
        { "time_ms": 0, "properties": { "opacity": 0, "y": 220 } },
        { "time_ms": 1000, "properties": { "opacity": 1, "y": 200 } }
      ],
      "easing": "cubic-bezier(0.25, 0.1, 0.25, 1)" }
  ]
}
```

---

## 4. Element Types
| Type | Description |
|------|-------------|
| text | Rich text with font, color, alignment |
| image | Raster/vector image with crop and filters |
| video | Video with autoplay, loop, time range |
| shape | Vector shape with fill, stroke, border-radius |
| group | Container for child elements |
| audio | Audio-only element |

All elements share: id, type, position, size, rotation, opacity, z_index, animations, blend_mode.

## 5. Animation System
**Types:** fade_in, fade_out, slide_in_*, scale_in/out, rotate_in, typewriter, wipe_*, custom (keyframe)
**Transitions:** none, fade, slide_*, zoom_in/out, dissolve
**Easing:** linear, ease, ease-in, ease-out, ease-in-out, cubic-bezier(a,b,c,d)

## 6. Asset Requirements
- **Images:** WebP or PNG, max 8192x8192, sRGB
- **Video:** H.264 Baseline (Level 4.1), MP4 container, max 3840x2160, AAC-LC audio
- **Audio:** MP3 or AAC, 44100/48000 Hz, mono/stereo
- **Fonts:** WOFF2, subset to used glyphs only

## 7. Security
- SHA-256 hash per asset, verified before rendering
- Ed25519 digital signatures on manifest
- No executable code (JS, WASM) permitted
- No external URL references - all assets embedded
- Player MUST NOT make network requests during rendering

## 8. Conformance Levels
- **Level 1 (Static):** Text, images, shapes only
- **Level 2 (Animated):** Adds animations and transitions
- **Level 3 (Rich Media):** Adds video, audio, timeline sync

## 9. Identifiers
- Extension: `.cnv`
- MIME: `application/vnd.cnv-presentation`
- Magic bytes: `50 4B 03 04` (ZIP) + META-INF/container.json entry
