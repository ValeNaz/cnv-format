#!/usr/bin/env node
/**
 * CNV CLI Tool v2.0
 * Inspect, validate, and extract .cnv presentation files.
 *
 * Commands:
 *   info <file>      Show metadata and structure
 *   validate <file>  Verify integrity (hashes, structure)
 *   extract <file>   Extract contents to directory
 *   list <file>      List all files in the archive
 *
 * Usage: node tools/cli.js <command> <file.cnv>
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let JSZip;
try { JSZip = require('jszip'); } catch (e) {
  console.error('Missing dependency: npm install jszip');
  process.exit(1);
}

const COMMANDS = ['info', 'validate', 'extract', 'list'];

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// --- Commands ---

async function cmdInfo(filePath) {
  const { zip, manifest } = await loadCNV(filePath);
  const stat = fs.statSync(filePath);

  console.log('');
  console.log('  CNV File Info');
  console.log('  ' + '='.repeat(50));
  console.log('  File:        ' + path.basename(filePath));
  console.log('  Size:        ' + formatBytes(stat.size));
  console.log('  CNV Version: ' + (manifest.cnv_version || 'unknown'));
  console.log('  Title:       ' + (manifest.title || 'Untitled'));
  console.log('  Author:      ' + (manifest.author || 'Unknown'));
  console.log('  Created:     ' + (manifest.created || 'Unknown'));
  console.log('  Generator:   ' + (manifest.generator || 'Unknown'));
  console.log('  Pages:       ' + (manifest.pages ? manifest.pages.length : 0));
  console.log('  Aspect:      ' + (manifest.aspectRatio || 'Unknown'));

  if (manifest.description) {
    console.log('  Description: ' + manifest.description.slice(0, 80));
  }
  if (manifest.tags && manifest.tags.length > 0) {
    console.log('  Tags:        ' + manifest.tags.join(', '));
  }

  console.log('');
  console.log('  Slides:');
  if (manifest.pages) {
    manifest.pages.forEach((p, i) => {
      const transition = p.transition ? p.transition.type : 'none';
      const hasNotes = p.notes && p.notes.length > 0 ? 'yes' : 'no';
      const elements = p.elements ? p.elements.length : 0;
      console.log('    ' + (i + 1) + '. ' + p.file + '  [' + p.width + 'x' + p.height + '] trans=' + transition + ' notes=' + hasNotes + ' elements=' + elements);
    });
  }

  // Count assets
  let assetCount = 0;
  zip.folder('assets').forEach(() => { assetCount++; });
  console.log('');
  console.log('  Assets:      ' + assetCount + ' file(s)');
  console.log('');
}

async function cmdValidate(filePath) {
  const { zip, manifest } = await loadCNV(filePath);
  let errors = 0;
  let warnings = 0;
  let checks = 0;

  console.log('');
  console.log('  Validating: ' + path.basename(filePath));
  console.log('  ' + '-'.repeat(50));

  // Check manifest structure
  checks++;
  if (!manifest.cnv_version) { warn('Missing cnv_version'); warnings++; }
  else { pass('cnv_version: ' + manifest.cnv_version); }

  checks++;
  if (!manifest.pages || !Array.isArray(manifest.pages)) {
    fail('No pages array in manifest'); errors++;
  } else {
    pass('Pages array: ' + manifest.pages.length + ' slides');
  }

  // Check each page
  if (manifest.pages) {
    for (let i = 0; i < manifest.pages.length; i++) {
      const pageInfo = manifest.pages[i];
      checks++;

      const pageFile = zip.file(pageInfo.file);
      if (!pageFile) {
        fail('Missing file: ' + pageInfo.file); errors++;
        continue;
      }
      pass('Found: ' + pageInfo.file);

      // Verify hash
      if (pageInfo.hash) {
        checks++;
        const content = await pageFile.async('nodebuffer');
        const computed = sha256(content);
        if (computed === pageInfo.hash) {
          pass('Hash OK: ' + pageInfo.file + ' [' + computed.slice(0, 12) + '...]');
        } else {
          fail('Hash MISMATCH: ' + pageInfo.file);
          console.log('      Expected: ' + pageInfo.hash.slice(0, 20) + '...');
          console.log('      Got:      ' + computed.slice(0, 20) + '...');
          errors++;
        }
      } else {
        checks++;
        warn('No hash for: ' + pageInfo.file);
        warnings++;
      }

      // Check SVG validity
      checks++;
      const svgContent = await pageFile.async('text');
      if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
        pass('Valid SVG: ' + pageInfo.file);
      } else {
        fail('Invalid SVG: ' + pageInfo.file); errors++;
      }
    }
  }

  console.log('');
  console.log('  Results: ' + checks + ' checks, ' + errors + ' errors, ' + warnings + ' warnings');
  if (errors === 0) {
    console.log('  Status: VALID');
  } else {
    console.log('  Status: INVALID (' + errors + ' error(s))');
  }
  console.log('');

  process.exit(errors > 0 ? 1 : 0);
}

async function cmdList(filePath) {
  const { zip } = await loadCNV(filePath);

  console.log('');
  console.log('  Contents of: ' + path.basename(filePath));
  console.log('  ' + '-'.repeat(50));

  const files = [];
  zip.forEach((relativePath, file) => {
    if (!file.dir) {
      files.push({ path: relativePath, size: file._data ? file._data.uncompressedSize || 0 : 0 });
    }
  });

  files.sort((a, b) => a.path.localeCompare(b.path));
  files.forEach(f => {
    console.log('  ' + f.path.padEnd(45) + formatBytes(f.size).padStart(10));
  });

  console.log('');
  console.log('  Total: ' + files.length + ' file(s)');
  console.log('');
}

async function cmdExtract(filePath) {
  const { zip } = await loadCNV(filePath);
  const outDir = path.join(path.dirname(filePath), path.basename(filePath, '.cnv') + '_extracted');

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('');
  console.log('  Extracting to: ' + outDir);
  console.log('  ' + '-'.repeat(50));

  let count = 0;
  const entries = [];
  zip.forEach((relativePath, file) => { if (!file.dir) entries.push({ path: relativePath, file }); });

  for (const entry of entries) {
    const fullPath = path.join(outDir, entry.path);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const content = await entry.file.async('nodebuffer');
    fs.writeFileSync(fullPath, content);
    console.log('  Extracted: ' + entry.path);
    count++;
  }

  console.log('');
  console.log('  Done: ' + count + ' file(s) extracted');
  console.log('');
}

// --- Helpers ---

async function loadCNV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('File not found: ' + filePath);
    process.exit(1);
  }

  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    console.error('Invalid CNV file: missing manifest.json');
    process.exit(1);
  }

  const manifest = JSON.parse(await manifestFile.async('text'));
  return { zip, manifest };
}

function pass(msg) { console.log('    PASS  ' + msg); }
function fail(msg) { console.log('    FAIL  ' + msg); }
function warn(msg) { console.log('    WARN  ' + msg); }

// --- Main ---
const args = process.argv.slice(2);
const command = args[0];
const file = args[1];

if (!command || !COMMANDS.includes(command)) {
  console.log('');
  console.log('  CNV CLI Tool v2.0');
  console.log('  Usage: node tools/cli.js <command> <file.cnv>');
  console.log('');
  console.log('  Commands:');
  console.log('    info      Show file metadata and structure');
  console.log('    validate  Verify integrity and hashes');
  console.log('    extract   Extract all contents to directory');
  console.log('    list      List all files in the archive');
  console.log('');
  process.exit(0);
}

if (!file) {
  console.error('Error: No file specified');
  process.exit(1);
}

const handlers = { info: cmdInfo, validate: cmdValidate, list: cmdList, extract: cmdExtract };
handlers[command](file).catch(err => {
  console.error('Error: ' + err.message);
  process.exit(1);
});
