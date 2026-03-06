/**
 * CNV Player — Preload Script v2.0
 * Bridges Electron main process with renderer.
 * Provides: file open dialog, CNV parsing (ZIP extraction + integrity),
 * font injection, and asset caching.
 */
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let JSZip;
try { JSZip = require('jszip'); } catch (e) {
  console.warn('JSZip not found, will use renderer-side parsing');
}

// --- Helpers ---
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// --- Asset Cache ---
const assetCache = new Map();

function getCachedAsset(key) {
  return assetCache.get(key) || null;
}

function setCachedAsset(key, data) {
  assetCache.set(key, data);
}

function clearAssetCache() {
  assetCache.clear();
}

// --- CNV Parser ---
async function parseCNV(filePath) {
  if (!JSZip) throw new Error('JSZip not available in preload');

  const fileBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  // Read manifest
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new Error('Invalid CNV: missing manifest.json');

  let manifest;
  try {
    const manifestText = await manifestFile.async('text');
    manifest = JSON.parse(manifestText);
  } catch (e) {
    throw new Error('Invalid CNV: corrupted manifest.json — ' + e.message);
  }

  if (!manifest.pages || !Array.isArray(manifest.pages)) {
    throw new Error('Invalid CNV: manifest has no pages array');
  }

  // Parse pages
  const pages = [];
  const errors = [];

  for (let i = 0; i < manifest.pages.length; i++) {
    const pageInfo = manifest.pages[i];
    const pageFile = zip.file(pageInfo.file);

    if (!pageFile) {
      errors.push('Missing page file: ' + pageInfo.file);
      pages.push({ svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="#1a1a2e"/><text x="960" y="540" text-anchor="middle" fill="#ff6b6b" font-size="32">Missing slide: ' + pageInfo.file + '</text></svg>', notes: '', transition: { type: 'fade', durationMs: 600 }, elements: [] });
      continue;
    }

    try {
      const svgBuffer = await pageFile.async('nodebuffer');
      const svgText = svgBuffer.toString('utf-8');

      // Verify integrity hash if provided
      if (pageInfo.hash) {
        const computedHash = sha256(svgBuffer);
        if (computedHash !== pageInfo.hash) {
          errors.push('Hash mismatch for ' + pageInfo.file + ': expected ' + pageInfo.hash.slice(0, 12) + '..., got ' + computedHash.slice(0, 12) + '...');
        }
      }

      pages.push({
        svg: svgText,
        notes: pageInfo.notes || '',
        transition: pageInfo.transition || manifest.defaultTransition || { type: 'fade', durationMs: 600 },
        elements: pageInfo.elements || [],
      });
    } catch (e) {
      errors.push('Error reading ' + pageInfo.file + ': ' + e.message);
      pages.push({ svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="#1a1a2e"/><text x="960" y="540" text-anchor="middle" fill="#ff6b6b" font-size="32">Error loading slide ' + (i + 1) + '</text></svg>', notes: '', transition: { type: 'fade', durationMs: 600 }, elements: [] });
    }
  }

  // Extract embedded fonts (WOFF2 in assets/)
  const fonts = [];
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    const fontFiles = [];
    assetsFolder.forEach((relativePath, file) => {
      if (relativePath.endsWith('.woff2') || relativePath.endsWith('.woff') || relativePath.endsWith('.ttf')) {
        fontFiles.push({ path: relativePath, file });
      }
    });

    for (const fontFile of fontFiles) {
      try {
        const fontData = await fontFile.file.async('base64');
        const ext = path.extname(fontFile.path).slice(1);
        const fontName = path.basename(fontFile.path, path.extname(fontFile.path));
        fonts.push({
          name: fontName,
          data: fontData,
          format: ext === 'ttf' ? 'truetype' : ext === 'woff' ? 'woff' : 'woff2',
        });
        setCachedAsset('font:' + fontName, fontData);
      } catch (e) {
        errors.push('Error loading font: ' + fontFile.path);
      }
    }
  }

  if (errors.length > 0) {
    console.warn('CNV parsing warnings:', errors);
  }

  return { manifest, pages, fonts, errors };
}

// --- Expose API to renderer ---
contextBridge.exposeInMainWorld('cnvAPI', {
  // Open file dialog and parse
  openFile: async () => {
    const result = await ipcRenderer.invoke('dialog:openFile');
    if (!result) return null;

    clearAssetCache();
    const parsed = await parseCNV(result);
    return parsed;
  },

  // Parse from buffer (drag-and-drop support)
  parseCNV: async (buffer) => {
    if (!JSZip) throw new Error('JSZip not available');
    clearAssetCache();
    const zip = await JSZip.loadAsync(buffer);
    const manifestText = await zip.file('manifest.json').async('text');
    const manifest = JSON.parse(manifestText);
    const pages = [];
    for (const p of manifest.pages) {
      const svg = await zip.file(p.file).async('text');
      pages.push({
        svg,
        notes: p.notes || '',
        transition: p.transition || manifest.defaultTransition || { type: 'fade', durationMs: 600 },
        elements: p.elements || [],
      });
    }
    return { manifest, pages, fonts: [], errors: [] };
  },

  // Listen for file loaded from main process (command-line arg)
  onFileLoaded: (callback) => {
    ipcRenderer.on('file:loaded', async (event, filePath) => {
      try {
        const parsed = await parseCNV(filePath);
        callback(parsed);
      } catch (e) {
        console.error('Failed to load file:', e);
      }
    });
  },

  // Get presentation info
  getVersion: () => '2.0.0',
});

console.log('CNV preload v2.0 ready');
