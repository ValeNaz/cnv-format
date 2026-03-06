# CNV Format — Canva Partnership Proposal

**Prepared by:** ValeNaz | **Date:** June 2026 | **Version:** 1.0

---

## Executive Summary

We propose a partnership with Canva to develop **CNV** — a native offline presentation format that enables Canva users to download self-contained, pixel-perfect presentations playable anywhere without internet, specialized software, or Canva account access.

**The gap:** Canva's current export options (PDF, PPTX, MP4) all lose significant fidelity. PDF drops all animations and video. PPTX loses Canva-specific effects. MP4 removes interactivity. No existing format preserves the full Canva experience offline.

**The solution:** A .cnv format — a signed, compressed container with embedded scene graph, assets, and animations — paired with a lightweight offline player. Think "PDF for the presentation era."

**The opportunity:** Enterprise customers in air-gapped environments (defense, healthcare, manufacturing), event/kiosk operators, and education users in low-connectivity regions represent a $200M+ addressable market for premium offline capabilities.

---

## The Problem

### What Users Tell Us
- "I spent 3 hours on a Canva presentation. Exported to PPTX — half the animations broke"
- "Our trade show kiosk needs presentations running offline all day"
- "We work in a classified facility. No cloud access. Canva is useless for final delivery"
- "The MP4 export works but I can't pause or navigate to specific slides"

### Current Export Limitations
| Format | Animations | Video | Interactive | Fidelity |
|--------|-----------|-------|-------------|----------|
| PDF | None | None | No | Low |
| PPTX | Partial | Yes | Partial | Medium |
| MP4 | Baked-in | Baked-in | No | High visual, no interaction |
| GIF | Limited | N/A | No | Low |
| PNG | None | N/A | No | High (static only) |

### Market Evidence
- Canva has 190M+ monthly active users (2024)
- Enterprise segment growing 100%+ YoY
- Air-gapped/offline use cases are the #1 barrier for enterprise adoption in regulated industries
- PowerPoint holds enterprise presentation market largely due to offline reliability

---

## The Solution: CNV Format

### What Is It?
A new file format (.cnv) that packages a complete Canva presentation — scene graph, assets, animations, video, fonts — into a single self-contained file, playable by a dedicated offline player.

### Key Features
1. **Pixel-Perfect Rendering** — Uses Canva's own rendering engine (compiled to WASM) to guarantee identical output
2. **Full Media Support** — Embedded video (H.264), audio, GIF, all Canva animations and transitions
3. **Interactive Navigation** — Slide navigation, presenter view, autoplay/kiosk mode
4. **Secure by Design** — Digitally signed, integrity-verified, no executable code, optional encryption
5. **Portable** — Runs from USB drive on Windows/macOS without installation
6. **Compact** — 30-50% smaller than equivalent PPTX through asset deduplication and modern compression (zstd)

### Architecture
```
[Canva Editor] --export--> [.cnv file] --open--> [CNV Player]
                              |                       |
                         ZIP container            Electron app
                         + scene graph            + Canva WASM engine
                         + embedded assets        + media playback
                         + signatures             + kiosk mode
```

---

## What We Need from Canva

### Critical (Must Have)
1. **Scene Graph Export** — Access to the internal design representation (elements, positions, effects, animations) in a structured format (JSON)
2. **Rendering Engine Module** — Canva's rendering engine compiled as a standalone WASM module for the offline player
3. **Font Licensing** — License agreement that permits font embedding/subsetting in .cnv exports

### Important (Should Have)
4. **Export Pipeline Integration** — New "Download as .cnv" option in Canva's export menu
5. **Content License Extension** — CLA amendment covering offline .cnv distribution
6. **API for Programmatic Export** — Connect API endpoint for .cnv generation

### Nice to Have
7. **Canva branding** on the player ("Powered by Canva")
8. **Analytics hooks** for optional usage telemetry when online
9. **Template gallery** of .cnv-optimized presentation templates

---

## What We Bring

1. **Format Specification v0.1** — Complete technical spec (see docs/SPEC-v0.1.md)
2. **Working MVP** — Functional .cnv generator + Electron-based player
3. **Test Suite** — 10 reference presentations with automated pixel-diff testing
4. **Security Analysis** — Threat model and mitigation plan
5. **Go-to-Market Strategy** — Enterprise sales playbook and pricing model
6. **Engineering Team** — Ready to execute with 2-3 dedicated engineers

---

## Business Model

### Revenue Opportunity for Canva

| Model | Description | Estimated Revenue |
|-------|-------------|-------------------|
| **Premium Export** | .cnv export as Canva Pro/Enterprise feature | $5-15M ARR (Year 1) |
| **Player Licensing** | Enterprise volume licensing for CNV Player | $3-8M ARR |
| **Kiosk Edition** | Managed kiosk player with remote management | $2-5M ARR |
| **Air-Gap Enterprise** | On-premise export server for classified environments | $10-20M ARR |

### Competitive Advantage
- First cloud design tool with true offline delivery format
- Defensible moat: format tied to Canva rendering engine
- Enterprise unlock: removes #1 objection for regulated industries
- Retention: users who export .cnv are deeper in the Canva ecosystem

---

## Implementation Roadmap

### Phase 1: POC (8 weeks) — IN PROGRESS
- [x] Format specification v0.1
- [x] MVP generator (creates .cnv from pre-rendered assets)
- [x] MVP player (opens .cnv, navigates slides, fullscreen)
- [ ] 5 sample presentations
- [ ] Benchmark report (size, load time, quality vs PDF/PPTX)

### Phase 2: Alpha (3 months) — Requires Canva Partnership
- Integration with Canva Connect API for automated .cnv generation
- Scene graph rendering (vector, not rasterized)
- Video/audio embedded playback
- Digital signature verification
- Windows + macOS player builds

### Phase 3: Beta (6 months)
- Canva rendering engine integration (WASM)
- "Download as .cnv" in Canva UI
- Presenter view with multi-monitor support
- Kiosk mode with autoplay and scheduling
- Font subsetting with license verification

### Phase 4: GA (12 months)
- Mobile player (iOS/Android)
- Enterprise admin console for fleet management
- On-premise export server for air-gapped environments
- Analytics and usage reporting
- Canva Apps Marketplace listing

---

## Risk Analysis

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Canva declines partnership | Critical | Medium | Build pre-rendered fallback; approach as Enterprise feature request |
| Font licensing complications | High | High | Use only embeddable fonts; negotiate blanket license |
| Format adopted by competitors | Medium | Low | Canva engine dependency makes format Canva-exclusive |
| Security vulnerability in player | High | Medium | Chromium sandbox + code signing + auto-update |
| Low user adoption | Medium | Medium | A/B test export UX; enterprise push first |

---

## Team and Contact

**ValeNaz** — Product & Engineering Lead
- GitHub: github.com/ValeNaz
- Proposal repo: github.com/ValeNaz/cnv-format

### Request
We're seeking a 30-minute meeting with Canva's Platform Engineering or Enterprise Product team to discuss:
1. Technical feasibility of scene graph export
2. Rendering engine licensing model
3. Enterprise customer demand validation
4. Partnership structure and timeline

---

## Appendix: Legal Considerations

### Current Canva Policy Constraints
Per Canva Developer Terms (Dec 2025), Section 5.viii:
> Apps that primarily export designs to third-party systems require Canva's express written consent or must use the Content Publisher intent.

Per Content License Agreement, Section 9A:
> Font Software may only be used as an integrated component of a Canva Design that is exported from Canva.

**Implication:** The .cnv format MUST be an official Canva export format (not a third-party extraction) to comply with existing policies. This reinforces the partnership approach.

### Recommended Legal Framework
1. Canva treats .cnv as an official export format under the CLA
2. Font licensing terms extended to cover offline .cnv playback
3. Pro Content license applies to .cnv exports (same as PDF/PPTX)
4. Player distribution under Canva's brand and terms
