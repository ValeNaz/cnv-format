#!/usr/bin/env node
/**
 * CNV Sample Generator v2.0
 * Creates a rich sample .cnv presentation for testing the CNV Player.
 * Features: gradients, multi-element layouts, animations, presenter notes,
 *           embedded images (base64), video placeholders, shape primitives.
 *
 * Usage: node generator/create-sample.js [output-path]
 * Default output: samples/demo-presentation.cnv
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');

const OUTPUT_PATH = process.argv[2] || path.join(__dirname, '..', 'samples', 'demo-presentation.cnv');

// --- Color Palette ---
const PALETTE = {
  primary:    '#7B2FF7',
  secondary:  '#00C4B4',
  accent:     '#FF6B6B',
  dark:       '#1A1A2E',
  light:      '#F5F5FF',
  gold:       '#FFD700',
  gradient1:  ['#7B2FF7', '#00C4B4'],
  gradient2:  ['#FF6B6B', '#FFD700'],
  gradient3:  ['#1A1A2E', '#3A3A5E'],
};

// --- Helper Functions ---

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function uid() {
  return crypto.randomBytes(8).toString('hex');
}

/** Creates a linear gradient SVG def */
function svgGradient(id, colors, angle = 0) {
  const rad = (angle * Math.PI) / 180;
  const x1 = Math.round(50 - Math.cos(rad) * 50);
  const y1 = Math.round(50 - Math.sin(rad) * 50);
  const x2 = Math.round(50 + Math.cos(rad) * 50);
  const y2 = Math.round(50 + Math.sin(rad) * 50);
  const stops = colors.map((c, i) =>
    `<stop offset="${Math.round((i / (colors.length - 1)) * 100)}%" stop-color="${c}"/>`
  ).join('\n      ');
  return `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      ${stops}
    </linearGradient>`;
}

/** Creates a rounded rectangle */
function svgRoundedRect(x, y, w, h, rx, fill, opacity = 1) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" opacity="${opacity}"/>`;
}

/** Creates text with optional shadow */
function svgText(x, y, text, opts = {}) {
  const {
    fontSize = 32, fill = '#FFFFFF', anchor = 'middle',
    fontWeight = 'normal', fontFamily = 'Inter, system-ui, sans-serif',
    shadow = false, maxWidth = null
  } = opts;
  const shadowEl = shadow
    ? `<text x="${x + 2}" y="${y + 2}" font-size="${fontSize}" fill="rgba(0,0,0,0.3)"
        text-anchor="${anchor}" font-weight="${fontWeight}" font-family="${fontFamily}">${text}</text>`
    : '';
  const widthAttr = maxWidth ? ` textLength="${maxWidth}" lengthAdjust="spacingAndGlyphs"` : '';
  return `${shadowEl}
    <text x="${x}" y="${y}" font-size="${fontSize}" fill="${fill}"
      text-anchor="${anchor}" font-weight="${fontWeight}" font-family="${fontFamily}"${widthAttr}>${text}</text>`;
}

/** Creates a circle */
function svgCircle(cx, cy, r, fill, opacity = 1) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
}

/** Creates a decorative dot pattern */
function svgDotPattern(x, y, cols, rows, spacing, r, fill, opacity = 0.15) {
  let dots = '';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      dots += `<circle cx="${x + col * spacing}" cy="${y + row * spacing}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
    }
  }
  return dots;
}

/** Full SVG wrapper */
function buildSVG(width, height, defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    ${defs}
  </defs>
  ${body}
</svg>`;
}


// ============================================================
//  SLIDE DEFINITIONS
// ============================================================

function createSlides() {
  const W = 1920, H = 1080;
  const slides = [];

  // ── SLIDE 1: Title Slide ──────────────────────────────────
  {
    const defs = svgGradient('bg1', PALETTE.gradient1, 135);
    const body = `
      ${svgRoundedRect(0, 0, W, H, 0, 'url(#bg1)')}
      ${svgDotPattern(60, 60, 20, 12, 90, 3, '#FFFFFF', 0.08)}
      ${svgRoundedRect(160, 280, 600, 6, 3, '#FFFFFF', 0.5)}
      ${svgCircle(1600, 200, 300, '#FFFFFF', 0.04)}
      ${svgCircle(1650, 250, 200, '#FFFFFF', 0.06)}
      ${svgRoundedRect(120, 320, 900, 280, 24, 'rgba(255,255,255,0.08)')}
      ${svgText(570, 420, 'CNV Format', { fontSize: 80, fontWeight: 'bold', shadow: true })}
      ${svgText(570, 510, 'Next-Generation Offline Presentations', { fontSize: 32, fill: 'rgba(255,255,255,0.85)' })}
      ${svgRoundedRect(370, 560, 400, 4, 2, PALETTE.gold)}
      ${svgText(570, 620, 'v0.1 · MVP Demo', { fontSize: 24, fill: PALETTE.gold })}
      ${svgRoundedRect(1250, 650, 500, 300, 20, 'rgba(255,255,255,0.06)')}
      ${svgText(1500, 760, '📦 .cnv', { fontSize: 56, fontWeight: 'bold' })}
      ${svgText(1500, 820, 'Portable · Secure · Rich', { fontSize: 20, fill: 'rgba(255,255,255,0.7)' })}
    `;
    slides.push({
      svg: buildSVG(W, H, defs, body),
      notes: 'Welcome slide. Introduce the CNV format concept: a next-generation offline presentation format that works like a portable PDF but with rich media, animations, and pixel-perfect rendering.',
      transition: { type: 'fade', durationMs: 800 },
      elements: [
        { id: uid(), type: 'text', content: 'CNV Format', x: 120, y: 360, w: 900, h: 100,
          animation: { type: 'slideInLeft', durationMs: 600, delayMs: 200 } },
        { id: uid(), type: 'text', content: 'Next-Generation Offline Presentations', x: 120, y: 460, w: 900, h: 50,
          animation: { type: 'fadeIn', durationMs: 500, delayMs: 600 } },
        { id: uid(), type: 'shape', shape: 'roundedRect', x: 1250, y: 650, w: 500, h: 300,
          animation: { type: 'scaleIn', durationMs: 700, delayMs: 400 } },
      ],
    });
  }

  // ── SLIDE 2: Problem Statement ────────────────────────────
  {
    const defs = svgGradient('bg2', PALETTE.gradient3, 180);
    const cards = [
      { icon: '📄', label: 'PDF', problem: 'Static, no animations' },
      { icon: '📊', label: 'PPTX', problem: 'Requires Office, fidelity loss' },
      { icon: '🎥', label: 'MP4', problem: 'No interactivity, large files' },
    ];
    let cardsSvg = '';
    cards.forEach((c, i) => {
      const cx = 260 + i * 500;
      cardsSvg += `
        ${svgRoundedRect(cx, 420, 420, 320, 20, 'rgba(255,255,255,0.06)')}
        ${svgRoundedRect(cx, 420, 420, 6, 3, PALETTE.accent)}
        ${svgText(cx + 210, 520, c.icon, { fontSize: 64 })}
        ${svgText(cx + 210, 590, c.label, { fontSize: 36, fontWeight: 'bold' })}
        ${svgText(cx + 210, 650, c.problem, { fontSize: 20, fill: 'rgba(255,255,255,0.6)' })}
      `;
    });
    const body = `
      ${svgRoundedRect(0, 0, W, H, 0, 'url(#bg2)')}
      ${svgText(W / 2, 180, 'The Problem', { fontSize: 56, fontWeight: 'bold', shadow: true })}
      ${svgRoundedRect(860, 230, 200, 4, 2, PALETTE.accent)}
      ${svgText(W / 2, 310, 'Current export formats fall short for offline presentations', { fontSize: 26, fill: 'rgba(255,255,255,0.7)' })}
      ${cardsSvg}
      ${svgText(W / 2, 900, '→ We need a format built for modern presentations', { fontSize: 24, fill: PALETTE.secondary })}
    `;
    slides.push({
      svg: buildSVG(W, H, defs, body),
      notes: 'Explain the gap: PDF is static, PPTX loses fidelity outside Office, MP4 is non-interactive and huge. None preserve the original Canva experience offline.',
      transition: { type: 'slideLeft', durationMs: 600 },
      elements: cards.map((c, i) => ({
        id: uid(), type: 'card', x: 260 + i * 500, y: 420, w: 420, h: 320,
        animation: { type: 'slideInUp', durationMs: 500, delayMs: 300 + i * 200 },
      })),
    });
  }

  // ── SLIDE 3: Solution / Architecture ──────────────────────
  {
    const defs = svgGradient('bg3', ['#0F2027', '#203A43', '#2C5364'], 135);
    const layers = [
      { y: 340, label: 'manifest.json', desc: 'Metadata, page order, integrity hashes', color: PALETTE.primary },
      { y: 440, label: 'pages/*.svg', desc: 'Vector slides with full scene graph', color: PALETTE.secondary },
      { y: 540, label: 'assets/*', desc: 'Images, fonts (WOFF2), audio, video', color: PALETTE.accent },
      { y: 640, label: 'animations.json', desc: 'Per-element keyframe animations', color: PALETTE.gold },
    ];
    let layersSvg = '';
    layers.forEach((l, i) => {
      layersSvg += `
        ${svgRoundedRect(300, l.y, 1320, 80, 12, 'rgba(255,255,255,0.05)')}
        ${svgRoundedRect(300, l.y, 8, 80, 4, l.color)}
        ${svgText(340, l.y + 45, l.label, { fontSize: 24, fontWeight: 'bold', anchor: 'start', fill: l.color })}
        ${svgText(700, l.y + 45, l.desc, { fontSize: 20, anchor: 'start', fill: 'rgba(255,255,255,0.6)' })}
      `;
    });
    const body = `
      ${svgRoundedRect(0, 0, W, H, 0, 'url(#bg3)')}
      ${svgText(W / 2, 140, '📦 CNV Container Architecture', { fontSize: 48, fontWeight: 'bold', shadow: true })}
      ${svgText(W / 2, 210, 'ZIP-based package with structured contents', { fontSize: 24, fill: 'rgba(255,255,255,0.6)' })}
      ${svgRoundedRect(250, 270, 1420, 520, 20, 'rgba(255,255,255,0.03)')}
      ${svgText(960, 320, '.cnv file (ZIP container)', { fontSize: 20, fill: 'rgba(255,255,255,0.4)' })}
      ${layersSvg}
      ${svgText(W / 2, 870, 'SHA-256 integrity · Gzip compression · Streaming extraction', { fontSize: 20, fill: PALETTE.secondary })}
    `;
    slides.push({
      svg: buildSVG(W, H, defs, body),
      notes: 'Walk through the CNV container structure. It is a standard ZIP file with a well-defined directory layout. The manifest.json provides metadata and SHA-256 hashes for integrity verification. SVG pages ensure pixel-perfect vector rendering.',
      transition: { type: 'fade', durationMs: 700 },
      elements: layers.map((l, i) => ({
        id: uid(), type: 'layer', label: l.label, x: 300, y: l.y, w: 1320, h: 80,
        animation: { type: 'slideInLeft', durationMs: 400, delayMs: 200 + i * 150 },
      })),
    });
  }

  // ── SLIDE 4: Player Features ──────────────────────────────
  {
    const defs = svgGradient('bg4', PALETTE.gradient1, 45);
    const features = [
      { icon: '🔒', title: 'Secure', desc: 'Sandboxed renderer, hash verification' },
      { icon: '⚡', title: 'Fast', desc: 'Instant load, streaming extraction' },
      { icon: '🎨', title: 'Pixel-Perfect', desc: 'SVG rendering, embedded fonts' },
      { icon: '📱', title: 'Cross-Platform', desc: 'Desktop, mobile, web offline' },
      { icon: '🎬', title: 'Rich Media', desc: 'Video, audio, GIF support' },
      { icon: '🔄', title: 'Animations', desc: 'Per-element transitions' },
    ];
    let featuresSvg = '';
    features.forEach((f, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const fx = 180 + col * 560;
      const fy = 340 + row * 280;
      featuresSvg += `
        ${svgRoundedRect(fx, fy, 480, 220, 16, 'rgba(255,255,255,0.08)')}
        ${svgText(fx + 60, fy + 80, f.icon, { fontSize: 48, anchor: 'start' })}
        ${svgText(fx + 130, fy + 80, f.title, { fontSize: 28, fontWeight: 'bold', anchor: 'start' })}
        ${svgText(fx + 60, fy + 140, f.desc, { fontSize: 18, fill: 'rgba(255,255,255,0.65)', anchor: 'start' })}
      `;
    });
    const body = `
      ${svgRoundedRect(0, 0, W, H, 0, 'url(#bg4)')}
      ${svgDotPattern(0, 0, 22, 13, 90, 2, '#FFFFFF', 0.05)}
      ${svgText(W / 2, 160, 'CNV Player Features', { fontSize: 52, fontWeight: 'bold', shadow: true })}
      ${svgRoundedRect(810, 210, 300, 4, 2, '#FFFFFF', 0.3)}
      ${svgText(W / 2, 280, 'Electron-based runtime for all platforms', { fontSize: 24, fill: 'rgba(255,255,255,0.7)' })}
      ${featuresSvg}
    `;
    slides.push({
      svg: buildSVG(W, H, defs, body),
      notes: 'Showcase the 6 key features of the CNV Player. Emphasize that the Electron-based runtime provides true cross-platform support while maintaining security through sandboxing and hash verification.',
      transition: { type: 'slideRight', durationMs: 600 },
      elements: features.map((f, i) => ({
        id: uid(), type: 'featureCard', x: 180 + (i % 3) * 560, y: 340 + Math.floor(i / 3) * 280, w: 480, h: 220,
        animation: { type: 'scaleIn', durationMs: 400, delayMs: 100 + i * 120 },
      })),
    });
  }

  // ── SLIDE 5: Comparison Table ─────────────────────────────
  {
    const defs = svgGradient('bg5', PALETTE.gradient3, 0);
    const headers = ['Feature', 'PDF', 'PPTX', 'MP4', 'CNV'];
    const rows = [
      ['Vector Graphics', '✅', '⚠️', '❌', '✅'],
      ['Animations', '❌', '⚠️', '✅', '✅'],
      ['Video/Audio', '⚠️', '✅', '✅', '✅'],
      ['Offline Portable', '✅', '⚠️', '✅', '✅'],
      ['Interactivity', '⚠️', '✅', '❌', '✅'],
      ['Pixel-Perfect', '✅', '❌', '✅', '✅'],
      ['File Size', '✅', '⚠️', '❌', '✅'],
      ['No Extra Software', '✅', '❌', '✅', '⚠️'],
    ];
    const colW = 280;
    const startX = (W - colW * 5) / 2;
    const startY = 260;
    const rowH = 65;
    let tableSvg = '';
    // Header row
    headers.forEach((h, i) => {
      const x = startX + i * colW + colW / 2;
      tableSvg += svgRoundedRect(startX + i * colW + 4, startY, colW - 8, 60, 8,
        i === 4 ? PALETTE.primary : 'rgba(255,255,255,0.1)');
      tableSvg += svgText(x, startY + 40, h, {
        fontSize: 22, fontWeight: 'bold', fill: i === 4 ? '#FFFFFF' : 'rgba(255,255,255,0.9)'
      });
    });
    // Data rows
    rows.forEach((row, ri) => {
      const ry = startY + 80 + ri * rowH;
      if (ri % 2 === 0) {
        tableSvg += svgRoundedRect(startX, ry - 10, colW * 5, rowH, 4, 'rgba(255,255,255,0.03)');
      }
      row.forEach((cell, ci) => {
        const cx = startX + ci * colW + colW / 2;
        tableSvg += svgText(cx, ry + 30, ci === 0 ? cell : cell, {
          fontSize: ci === 0 ? 18 : 28,
          anchor: ci === 0 ? 'middle' : 'middle',
          fill: ci === 0 ? 'rgba(255,255,255,0.85)' : '#FFFFFF',
        });
      });
    });
    // Highlight CNV column
    tableSvg += svgRoundedRect(startX + 4 * colW, startY - 10, colW, 80 + rows.length * rowH + 20, 12,
      'rgba(123,47,247,0.1)');

    const body = `
      ${svgRoundedRect(0, 0, W, H, 0, 'url(#bg5)')}
      ${svgText(W / 2, 140, 'Format Comparison', { fontSize: 52, fontWeight: 'bold', shadow: true })}
      ${svgRoundedRect(810, 190, 300, 4, 2, PALETTE.secondary)}
      ${tableSvg}
      ${svgText(W / 2, 920, '✅ = Full Support   ⚠️ = Partial   ❌ = None', { fontSize: 18, fill: 'rgba(255,255,255,0.5)' })}
    `;
    slides.push({
      svg: buildSVG(W, H, defs, body),
      notes: 'Comparison table showing CNV advantages over existing formats. CNV combines the best of all worlds: vector fidelity of PDF, rich media of PPTX, and portability. Note: CNV currently requires a lightweight player (marked partial for No Extra Software).',
      transition: { type: 'fade', durationMs: 600 },
      elements: [
        { id: uid(), type: 'table', x: startX, y: startY, w: colW * 5, h: 80 + rows.length * rowH,
          animation: { type: 'fadeIn', durationMs: 800, delayMs: 300 } },
      ],
    });
  }

  // ── SLIDE 6: Roadmap ──────────────────────────────────────
  {
    const defs = svgGradient('bg6', ['#0D0D1A', '#1A0D2E'], 135);
    const phases = [
      { label: 'MVP', time: '6-8 weeks', items: ['ZIP container', 'SVG renderer', 'Electron player', 'Basic animations'], color: PALETTE.secondary },
      { label: 'v1.0', time: '6 months', items: ['Video/audio', 'Font embedding', 'Kiosk mode', 'Auto-update'], color: PALETTE.primary },
      { label: 'v2.0', time: '12 months', items: ['Canva integration', 'DRM support', 'Mobile apps', 'Cloud sync'], color: PALETTE.accent },
    ];
    let roadmapSvg = '';
    // Timeline line
    roadmapSvg += `<line x1="300" y1="500" x2="1620" y2="500" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>`;
    phases.forEach((p, i) => {
      const cx = 460 + i * 500;
      // Node circle
      roadmapSvg += svgCircle(cx, 500, 16, p.color);
      roadmapSvg += svgCircle(cx, 500, 8, '#FFFFFF');
      // Phase card
      roadmapSvg += svgRoundedRect(cx - 180, 300, 360, 160, 16, 'rgba(255,255,255,0.06)');
      roadmapSvg += svgRoundedRect(cx - 180, 300, 360, 5, 3, p.color);
      roadmapSvg += svgText(cx, 345, p.label, { fontSize: 28, fontWeight: 'bold', fill: p.color });
      roadmapSvg += svgText(cx, 380, p.time, { fontSize: 18, fill: 'rgba(255,255,255,0.5)' });
      // Items below timeline
      p.items.forEach((item, j) => {
        roadmapSvg += svgText(cx, 570 + j * 35, '• ' + item, {
          fontSize: 18, fill: 'rgba(255,255,255,0.7)', anchor: 'middle'
        });
      });
    });
    const body = `
      ${svgRoundedRect(0, 0, W, H, 0, 'url(#bg6)')}
      ${svgDotPattern(50, 50, 21, 12, 90, 2, PALETTE.primary, 0.06)}
      ${svgText(W / 2, 160, 'Development Roadmap', { fontSize: 52, fontWeight: 'bold', shadow: true })}
      ${svgRoundedRect(810, 210, 300, 4, 2, PALETTE.gold)}
      ${svgText(W / 2, 260, 'From MVP to Canva Partnership', { fontSize: 24, fill: 'rgba(255,255,255,0.6)' })}
      ${roadmapSvg}
      ${svgText(W / 2, 900, 'Open source · MIT License · github.com/ValeNaz/cnv-format', { fontSize: 20, fill: 'rgba(255,255,255,0.4)' })}
    `;
    slides.push({
      svg: buildSVG(W, H, defs, body),
      notes: 'Present the three-phase roadmap. MVP focuses on core rendering. v1.0 adds production features. v2.0 targets official Canva partnership with DRM and mobile apps.',
      transition: { type: 'slideLeft', durationMs: 600 },
      elements: phases.map((p, i) => ({
        id: uid(), type: 'milestone', label: p.label, x: 280 + i * 500, y: 300, w: 360, h: 420,
        animation: { type: 'slideInUp', durationMs: 500, delayMs: 200 + i * 250 },
      })),
    });
  }

  // ── SLIDE 7: Thank You / CTA ──────────────────────────────
  {
    const defs = [
      svgGradient('bg7', PALETTE.gradient1, 135),
      svgGradient('btnGrad', PALETTE.gradient2, 90),
    ].join('\n');
    const body = `
      ${svgRoundedRect(0, 0, W, H, 0, 'url(#bg7)')}
      ${svgDotPattern(0, 0, 22, 13, 90, 3, '#FFFFFF', 0.06)}
      ${svgCircle(960, 540, 400, 'rgba(255,255,255,0.03)')}
      ${svgCircle(960, 540, 280, 'rgba(255,255,255,0.03)')}
      ${svgCircle(960, 540, 160, 'rgba(255,255,255,0.04)')}
      ${svgText(W / 2, 380, 'Thank You', { fontSize: 80, fontWeight: 'bold', shadow: true })}
      ${svgRoundedRect(760, 420, 400, 4, 2, PALETTE.gold)}
      ${svgText(W / 2, 500, 'Ready to revolutionize offline presentations?', { fontSize: 28, fill: 'rgba(255,255,255,0.8)' })}
      ${svgRoundedRect(710, 560, 500, 70, 35, 'url(#btnGrad)')}
      ${svgText(W / 2, 605, 'github.com/ValeNaz/cnv-format', { fontSize: 22, fontWeight: 'bold' })}
      ${svgText(W / 2, 720, 'Contact: valenaz@github · Open to collaboration', { fontSize: 20, fill: 'rgba(255,255,255,0.5)' })}
    `;
    slides.push({
      svg: buildSVG(W, H, defs, body),
      notes: 'Closing slide. Encourage audience to check out the GitHub repository, try the MVP, and consider partnership opportunities.',
      transition: { type: 'zoomIn', durationMs: 800 },
      elements: [
        { id: uid(), type: 'text', content: 'Thank You', x: 360, y: 320, w: 1200, h: 100,
          animation: { type: 'scaleIn', durationMs: 700, delayMs: 0 } },
        { id: uid(), type: 'button', x: 710, y: 560, w: 500, h: 70,
          animation: { type: 'slideInUp', durationMs: 500, delayMs: 500 } },
      ],
    });
  }

  return slides;
}


// ============================================================
//  MANIFEST BUILDER
// ============================================================

function buildManifest(pages) {
  return {
    cnv_version: '0.1.0',
    title: 'CNV Format — Next-Gen Offline Presentations',
    author: 'ValeNaz',
    created: new Date().toISOString(),
    generator: 'cnv-sample-generator/2.0.0',
    description: 'A demo presentation showcasing the CNV format capabilities including rich SVG slides, per-element animations, presenter notes, and gradient backgrounds.',
    tags: ['demo', 'cnv', 'presentation', 'offline', 'canva'],
    defaultTransition: { type: 'fade', durationMs: 600 },
    pages: pages.map((p, i) => ({
      index: i,
      file: `pages/slide-${String(i + 1).padStart(3, '0')}.svg`,
      width: 1920,
      height: 1080,
      hash: p.hash,
      title: `Slide ${i + 1}`,
      notes: p.notes || '',
      transition: p.transition || { type: 'fade', durationMs: 600 },
      elements: p.elements || [],
      durationMs: 0,
    })),
    assets: [],
    totalPages: pages.length,
    aspectRatio: '16:9',
  };
}


// ============================================================
//  MAIN BUILD
// ============================================================

async function main() {
  console.log('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃  CNV Sample Generator v2.0       ┃');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');

  const slides = createSlides();
  console.log(`✅ Generated ${slides.length} slides\n`);

  // Prepare page data with hashes
  const pages = slides.map((slide, i) => {
    const svgBuffer = Buffer.from(slide.svg, 'utf-8');
    return {
      index: i,
      svg: svgBuffer,
      hash: sha256(svgBuffer),
      notes: slide.notes,
      transition: slide.transition,
      elements: slide.elements,
    };
  });

  const manifest = buildManifest(pages);

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Create ZIP archive
  const output = fs.createWriteStream(OUTPUT_PATH);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(1);
      console.log(`✅ Created: ${OUTPUT_PATH}`);
      console.log(`┅ Size:    ${sizeKB} KB`);
      console.log(`┅ Pages:   ${pages.length}`);
      console.log(`┅ Format:  CNV v${manifest.cnv_version}\n`);
      console.log('  Slides:');
      pages.forEach((p, i) => {
        console.log(`    ${i + 1}. slide-${String(i + 1).padStart(3, '0')}.svg  [${p.hash.slice(0, 12)}…]`);
      });
      console.log(`\n✅ Done! Open with: npx electron player/main.js ${OUTPUT_PATH}\n`);
      resolve();
    });
    archive.on('error', reject);
    archive.pipe(output);

    // Add manifest
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

    // Add SVG pages
    pages.forEach((p, i) => {
      archive.append(p.svg, { name: `pages/slide-${String(i + 1).padStart(3, '0')}.svg` });
    });

    // Add placeholder assets directory marker
    archive.append('', { name: 'assets/.gitkeep' });

    archive.finalize();
  });
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
