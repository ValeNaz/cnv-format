/**
 * CNV Player — Preload Script
 * Exposes safe IPC bridge to renderer process.
 */

const { contextBridge, ipcRenderer } = require('electron');
const JSZip = require('jszip');
const fs = require('fs');
const crypto = require('crypto');

contextBridge.exposeInMainWorld('cnvBridge', {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  
  // Parse a .cnv file and return its structured content
  parseCNV: async (filePath) => {
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);
    
    // Read container.json
    const containerStr = await zip.file('META-INF/container.json')?.async('string');
    if (!containerStr) throw new Error('Invalid CNV: missing META-INF/container.json');
    const container = JSON.parse(containerStr);
    
    // Read manifest.json
    const manifestStr = await zip.file('META-INF/manifest.json')?.async('string');
    const manifest = manifestStr ? JSON.parse(manifestStr) : null;
    
    // Read design.json
    const designStr = await zip.file('content/design.json')?.async('string');
    if (!designStr) throw new Error('Invalid CNV: missing content/design.json');
    const design = JSON.parse(designStr);
    
    // Read all pages
    const pages = [];
    for (const pageId of design.page_order) {
      const sceneStr = await zip.file(`content/pages/${pageId}/scene.json`)?.async('string');
      const timelineStr = await zip.file(`content/pages/${pageId}/timeline.json`)?.async('string');
      
      // Get thumbnail or fallback
      let thumbnailData = null;
      const thumbFile = zip.file(`thumbnails/${pageId}.svg`) || 
                         zip.file(`thumbnails/${pageId}.webp`) ||
                         zip.file(`thumbnails/${pageId}.png`) ||
                         zip.file(`fallback/${pageId}.svg`) ||
                         zip.file(`fallback/${pageId}.png`);
      
      if (thumbFile) {
        const ext = thumbFile.name.split('.').pop();
        const thumbData = await thumbFile.async('base64');
        const mimeMap = { svg: 'image/svg+xml', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg' };
        thumbnailData = `data:${mimeMap[ext] || 'image/png'};base64,${thumbData}`;
      }
      
      pages.push({
        id: pageId,
        scene: sceneStr ? JSON.parse(sceneStr) : null,
        timeline: timelineStr ? JSON.parse(timelineStr) : null,
        thumbnail: thumbnailData
      });
    }
    
    // Read assets (for video/audio playback)
    const assets = {};
    for (const entry of Object.keys(zip.files)) {
      if (entry.startsWith('assets/')) {
        const ext = entry.split('.').pop().toLowerCase();
        const mimeMap = { 
          mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', 
          aac: 'audio/aac', webp: 'image/webp', png: 'image/png',
          jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml',
          woff2: 'font/woff2'
        };
        if (mimeMap[ext]) {
          const assetData = await zip.file(entry).async('base64');
          assets[entry] = `data:${mimeMap[ext]};base64,${assetData}`;
        }
      }
    }
    
    // Verify integrity if manifest exists
    let integrityOk = true;
    if (manifest && manifest.entries) {
      for (const entry of manifest.entries) {
        if (entry.hash && entry.hash.startsWith('sha256:')) {
          const file = zip.file(entry.path);
          if (file) {
            const fileData = await file.async('nodebuffer');
            const actualHash = 'sha256:' + crypto.createHash('sha256').update(fileData).digest('hex');
            if (actualHash !== entry.hash) {
              console.warn(`Integrity check failed for ${entry.path}`);
              integrityOk = false;
            }
          }
        }
      }
    }
    
    return { container, design, pages, assets, manifest, integrityOk };
  },
  
  // Window controls
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  exitPresentation: () => ipcRenderer.invoke('exit-presentation'),
  
  // Listen for events from main process
  onOpenCNV: (callback) => ipcRenderer.on('open-cnv', (_, path) => callback(path)),
  onShowWelcome: (callback) => ipcRenderer.on('show-welcome', () => callback()),
  onError: (callback) => ipcRenderer.on('error', (_, msg) => callback(msg))
});
