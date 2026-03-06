#!/usr/bin/env node
/**
 * CNV Sample Generator
 * Creates a sample .cnv presentation file for testing the CNV Player.
 * 
 * Usage: node generator/create-sample.js [output-path]
 * Default output: samples/demo-presentation.cnv
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');

const OUTPUT_PATH = process.argv[2] || path.join(__dirname, '..', 'samples', 'demo-presentation.cnv');

// --- Helper Functions ---

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function createSVGSlide(config) {
  const { width, height, bgColor, title, subtitle, titleColor, subtitleColor, elements } = config;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
  svg += `  <rect width="${width}" height="${height}" fill="${bgColor}"/>\n`;
  
  if (title) {
    svg += `  <text x="${width/2}" y="${height * 0.35}" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="700" fill="${titleColor || '#ffffff'}" text-anchor="middle">${title}</text>\n`;
  }
  if (subtitle) {
    svg += `  <text x="${width/2}" y="${height * 0.5}" font-family="Inter, Arial, sans-serif" font-size="36" fill="${subtitleColor || '#cccccc'}" text-anchor="middle">${subtitle}</text>\n`;
  }
  if (elements) {
    svg += elements;
  }
  svg += '</svg>';
  return Buffer.from(svg);
}

// --- Slide Definitions ---

const SLIDES = [
  {
    id: '001',
    title: 'CNV Format',
    subtitle: 'Next-Gen Offline Presentations',
    bgColor: '#0f0f23',
    titleColor: '#00d4ff',
    subtitleColor: '#8892b0',
    elements: [
      { type: 'text', text: 'CNV Format', x: 960, y: 350, font_size: 72, font_weight: 700, color: '#00d4ff' },
      { type: 'text', text: 'Next-Gen Offline Presentations', x: 960, y: 450, font_size: 36, color: '#8892b0' },
      { type: 'shape', shape: 'circle', cx: 960, cy: 700, r: 40, fill: '#00d4ff', opacity: 0.3 }
    ],
    animations: [
      { element_id: 'elem_001', trigger: 'on_enter', type: 'fade_in', duration_ms: 1000, delay_ms: 0 },
      { element_id: 'elem_002', trigger: 'on_enter', type: 'fade_in', duration_ms: 800, delay_ms: 500 }
    ],
    transition: { type: 'fade', duration_ms: 600 }
  },
  {
    id: '002',
    title: 'The Problem',
    subtitle: 'Current exports lose fidelity',
    bgColor: '#1a1a2e',
    titleColor: '#e94560',
    subtitleColor: '#c4c4c4',
    elements: [
      { type: 'text', text: 'The Problem', x: 960, y: 250, font_size: 64, font_weight: 700, color: '#e94560' },
      { type: 'text', text: 'PDF: No animations, no video', x: 960, y: 420, font_size: 28, color: '#ffffff' },
      { type: 'text', text: 'PPTX: Broken effects, wrong fonts', x: 960, y: 480, font_size: 28, color: '#ffffff' },
      { type: 'text', text: 'MP4: No interactivity, huge files', x: 960, y: 540, font_size: 28, color: '#ffffff' },
      { type: 'text', text: 'GIF: Low quality, no audio', x: 960, y: 600, font_size: 28, color: '#ffffff' }
    ],
    animations: [
      { element_id: 'elem_001', trigger: 'on_enter', type: 'slide_in_left', duration_ms: 600, delay_ms: 0 }
    ],
    transition: { type: 'slide_left', duration_ms: 500 }
  },
  {
    id: '003',
    title: 'The Solution',
    subtitle: '.cnv — Pixel-perfect offline presentations',
    bgColor: '#16213e',
    titleColor: '#00ff88',
    subtitleColor: '#b8c1ec',
    elements: [
      { type: 'text', text: 'The Solution: .cnv', x: 960, y: 250, font_size: 64, font_weight: 700, color: '#00ff88' },
      { type: 'text', text: 'Self-contained ZIP with scene graph + assets', x: 960, y: 420, font_size: 28, color: '#ffffff' },
      { type: 'text', text: 'Full video, audio, animations support', x: 960, y: 480, font_size: 28, color: '#ffffff' },
      { type: 'text', text: 'Digitally signed & integrity-verified', x: 960, y: 540, font_size: 28, color: '#ffffff' },
      { type: 'text', text: 'Runs from USB — no install needed', x: 960, y: 600, font_size: 28, color: '#ffffff' }
    ],
    transition: { type: 'slide_left', duration_ms: 500 }
  },
  {
    id: '004',
    title: 'Architecture',
    subtitle: 'How it works',
    bgColor: '#0a192f',
    titleColor: '#64ffda',
    subtitleColor: '#8892b0',
    elements: [
      { type: 'text', text: 'Architecture', x: 960, y: 200, font_size: 56, font_weight: 700, color: '#64ffda' },
      { type: 'text', text: '[Canva] → export → [.cnv file] → open → [CNV Player]', x: 960, y: 380, font_size: 24, color: '#ccd6f6' },
      { type: 'text', text: 'Container: ZIP + zstd compression', x: 300, y: 500, font_size: 22, color: '#8892b0' },
      { type: 'text', text: 'Scene Graph: JSON element tree', x: 300, y: 550, font_size: 22, color: '#8892b0' },
      { type: 'text', text: 'Assets: WebP, MP4, WOFF2', x: 300, y: 600, font_size: 22, color: '#8892b0' },
      { type: 'text', text: 'Security: SHA-256 + Ed25519', x: 300, y: 650, font_size: 22, color: '#8892b0' },
      { type: 'text', text: 'Player: Electron + Chromium', x: 960, y: 500, font_size: 22, color: '#8892b0' },
      { type: 'text', text: 'Renderer: HTML5 Canvas/WebGL', x: 960, y: 550, font_size: 22, color: '#8892b0' },
      { type: 'text', text: 'Modes: Fullscreen, Kiosk, Presenter', x: 960, y: 600, font_size: 22, color: '#8892b0' }
    ],
    transition: { type: 'fade', duration_ms: 800 }
  },
  {
    id: '005',
    title: 'Thank You',
    subtitle: 'github.com/ValeNaz/cnv-format',
    bgColor: '#0f0f23',
    titleColor: '#00d4ff',
    subtitleColor: '#64ffda',
    elements: [
      { type: 'text', text: 'Thank You', x: 960, y: 350, font_size: 72, font_weight: 700, color: '#00d4ff' },
      { type: 'text', text: 'github.com/ValeNaz/cnv-format', x: 960, y: 480, font_size: 28, color: '#64ffda' },
      { type: 'text', text: 'Spec v0.1 — MVP Player — Partnership Proposal', x: 960, y: 560, font_size: 22, color: '#8892b0' }
    ],
    transition: { type: 'fade', duration_ms: 1000 }
  }
];

// --- Main Generator ---

async function generateCNV() {
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const output = fs.createWriteStream(OUTPUT_PATH);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);

  const WIDTH = 1920;
  const HEIGHT = 1080;
  const manifestEntries = [];

  // --- META-INF/container.json ---
  const container = {
    cnv_version: '0.1.0',
    created_at: new Date().toISOString(),
    generator: { name: 'cnv-generator', version: '0.1.0' },
    page_count: SLIDES.length,
    total_duration_ms: SLIDES.length * 5000,
    features: ['animations']
  };
  const containerBuf = Buffer.from(JSON.stringify(container, null, 2));
  archive.append(containerBuf, { name: 'META-INF/container.json' });
  manifestEntries.push({ path: 'META-INF/container.json', size: containerBuf.length, hash: 'sha256:' + sha256(containerBuf) });

  // --- content/design.json ---
  const design = {
    title: 'CNV Format Demo Presentation',
    dimensions: { width: WIDTH, height: HEIGHT, unit: 'px' },
    page_order: SLIDES.map(s => s.id),
    default_transition: { type: 'fade', duration_ms: 500 },
    metadata: {
      author: 'ValeNaz',
      created_in: 'cnv-generator',
      export_date: new Date().toISOString()
    }
  };
  const designBuf = Buffer.from(JSON.stringify(design, null, 2));
  archive.append(designBuf, { name: 'content/design.json' });
  manifestEntries.push({ path: 'content/design.json', size: designBuf.length, hash: 'sha256:' + sha256(designBuf) });

  // --- Per-page content ---
  for (const slide of SLIDES) {
    // Scene graph
    const scene = {
      page_id: slide.id,
      dimensions: { width: WIDTH, height: HEIGHT },
      background: { type: 'solid', color: slide.bgColor },
      elements: slide.elements.map((el, i) => ({
        id: `elem_${String(i + 1).padStart(3, '0')}`,
        type: el.type || 'text',
        position: { x: el.x || el.cx || 0, y: el.y || el.cy || 0 },
        size: { width: el.width || WIDTH, height: el.height || (el.font_size || 36) * 1.5 },
        rotation: 0,
        opacity: el.opacity || 1.0,
        z_index: i,
        content: el.type === 'shape' ? {
          shape_type: el.shape,
          fill: { type: 'solid', color: el.fill }
        } : {
          text: el.text,
          font: {
            family: 'Inter',
            weight: el.font_weight || 400,
            size: el.font_size || 36,
            color: el.color || '#ffffff'
          },
          alignment: 'center'
        }
      })),
      transition: slide.transition || { type: 'fade', duration_ms: 500 }
    };

    if (slide.animations) {
      scene.elements.forEach((el, i) => {
        const anim = slide.animations.find(a => a.element_id === el.id);
        if (anim) {
          el.animations = [{ trigger: anim.trigger, type: anim.type, duration_ms: anim.duration_ms, delay_ms: anim.delay_ms || 0, easing: 'ease-out' }];
        }
      });
    }

    const sceneBuf = Buffer.from(JSON.stringify(scene, null, 2));
    archive.append(sceneBuf, { name: `content/pages/${slide.id}/scene.json` });
    manifestEntries.push({ path: `content/pages/${slide.id}/scene.json`, size: sceneBuf.length, hash: 'sha256:' + sha256(sceneBuf) });

    // Timeline
    const timeline = {
      page_id: slide.id,
      duration_ms: 5000,
      auto_advance: false,
      tracks: scene.elements.filter(el => el.animations).map(el => ({
        element_id: el.id,
        keyframes: el.animations ? [
          { time_ms: el.animations[0].delay_ms || 0, properties: { opacity: 0 } },
          { time_ms: (el.animations[0].delay_ms || 0) + el.animations[0].duration_ms, properties: { opacity: 1 } }
        ] : []
      }))
    };
    const timelineBuf = Buffer.from(JSON.stringify(timeline, null, 2));
    archive.append(timelineBuf, { name: `content/pages/${slide.id}/timeline.json` });
    manifestEntries.push({ path: `content/pages/${slide.id}/timeline.json`, size: timelineBuf.length, hash: 'sha256:' + sha256(timelineBuf) });

    // SVG thumbnail (used as both thumbnail and fallback)
    const svgBuf = createSVGSlide({
      width: WIDTH, height: HEIGHT,
      bgColor: slide.bgColor,
      title: slide.elements.find(e => e.font_size >= 56)?.text,
      subtitle: slide.elements.find(e => e.font_size && e.font_size < 40 && e.font_size >= 28)?.text,
      titleColor: slide.elements.find(e => e.font_size >= 56)?.color,
      subtitleColor: slide.elements.find(e => e.font_size && e.font_size < 40)?.color
    });
    archive.append(svgBuf, { name: `thumbnails/${slide.id}.svg` });
    archive.append(svgBuf, { name: `fallback/${slide.id}.svg` });
    manifestEntries.push({ path: `thumbnails/${slide.id}.svg`, size: svgBuf.length, hash: 'sha256:' + sha256(svgBuf) });
  }

  // --- META-INF/manifest.json ---
  const manifest = { entries: manifestEntries };
  const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2));
  archive.append(manifestBuf, { name: 'META-INF/manifest.json' });

  // Finalize
  await archive.finalize();

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const size = archive.pointer();
      console.log(`\n✅ CNV file created: ${OUTPUT_PATH}`);
      console.log(`   Size: ${(size / 1024).toFixed(1)} KB`);
      console.log(`   Pages: ${SLIDES.length}`);
      console.log(`   Format version: 0.1.0`);
      console.log(`\n   Open with: npm run player -- ${OUTPUT_PATH}`);
      resolve();
    });
    output.on('error', reject);
  });
}

generateCNV().catch(err => {
  console.error('❌ Error generating CNV file:', err);
  process.exit(1);
});
