#!/usr/bin/env node
/**
 * CNV Test Suite v2.0
 * Automated tests for the CNV generator, parser, and format validation.
 * No external test framework required — uses built-in assert.
 *
 * Usage: node test/run-tests.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const assert = require('assert');

let JSZip;
try { JSZip = require('jszip'); } catch (e) {
  console.error('Missing jszip. Run: npm install');
  process.exit(1);
}

const SAMPLE_PATH = path.join(__dirname, '..', 'samples', 'test-output.cnv');
const GENERATOR_PATH = path.join(__dirname, '..', 'generator', 'create-sample.js');

let passed = 0;
let failed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log('  PASS  ' + name);
  } catch (e) {
    failed++;
    console.log('  FAIL  ' + name);
    console.log('         ' + e.message);
  }
}

async function testAsync(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log('  PASS  ' + name);
  } catch (e) {
    failed++;
    console.log('  FAIL  ' + name);
    console.log('         ' + e.message);
  }
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ============================================================
//  TEST SUITES
// ============================================================

async function runTests() {
  console.log('');
  console.log('  CNV Test Suite v2.0');
  console.log('  ' + '='.repeat(50));
  console.log('');

  // --- Suite 1: Generator ---
  console.log('  [Generator]');

  test('Generator script exists', () => {
    assert.ok(fs.existsSync(GENERATOR_PATH), 'create-sample.js not found');
  });

  test('Generator runs without error', () => {
    const result = execSync('node ' + GENERATOR_PATH + ' ' + SAMPLE_PATH, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    assert.ok(result.includes('Done!') || result.includes('Created'), 'Expected success output');
  });

  test('Output file exists', () => {
    assert.ok(fs.existsSync(SAMPLE_PATH), 'Output .cnv file not found');
  });

  test('Output file is non-empty', () => {
    const stat = fs.statSync(SAMPLE_PATH);
    assert.ok(stat.size > 1000, 'File too small: ' + stat.size + ' bytes');
  });

  console.log('');

  // --- Suite 2: CNV Structure ---
  console.log('  [CNV Structure]');

  const buffer = fs.readFileSync(SAMPLE_PATH);
  const zip = await JSZip.loadAsync(buffer);

  test('Is valid ZIP', () => {
    assert.ok(zip, 'Not a valid ZIP file');
  });

  test('Contains manifest.json', () => {
    assert.ok(zip.file('manifest.json'), 'manifest.json not found');
  });

  const manifestText = await zip.file('manifest.json').async('text');
  let manifest;

  test('manifest.json is valid JSON', () => {
    manifest = JSON.parse(manifestText);
    assert.ok(typeof manifest === 'object', 'Not a valid JSON object');
  });

  test('Manifest has cnv_version', () => {
    assert.ok(manifest.cnv_version, 'Missing cnv_version');
    assert.strictEqual(typeof manifest.cnv_version, 'string');
  });

  test('Manifest has title', () => {
    assert.ok(manifest.title, 'Missing title');
  });

  test('Manifest has pages array', () => {
    assert.ok(Array.isArray(manifest.pages), 'pages is not an array');
    assert.ok(manifest.pages.length > 0, 'pages array is empty');
  });

  test('Manifest has totalPages matching pages.length', () => {
    assert.strictEqual(manifest.totalPages, manifest.pages.length);
  });

  console.log('');

  // --- Suite 3: Pages ---
  console.log('  [Pages]');

  for (let i = 0; i < manifest.pages.length; i++) {
    const pageInfo = manifest.pages[i];

    test('Page ' + (i + 1) + ' file exists: ' + pageInfo.file, () => {
      assert.ok(zip.file(pageInfo.file), 'File not found in archive');
    });

    await testAsync('Page ' + (i + 1) + ' is valid SVG', async () => {
      const svg = await zip.file(pageInfo.file).async('text');
      assert.ok(svg.includes('<svg'), 'No <svg> tag');
      assert.ok(svg.includes('</svg>'), 'No closing </svg> tag');
    });

    await testAsync('Page ' + (i + 1) + ' hash matches', async () => {
      if (!pageInfo.hash) { assert.fail('No hash provided'); }
      const content = await zip.file(pageInfo.file).async('nodebuffer');
      const computed = sha256(content);
      assert.strictEqual(computed, pageInfo.hash, 'Hash mismatch');
    });

    test('Page ' + (i + 1) + ' has dimensions', () => {
      assert.ok(pageInfo.width > 0, 'Invalid width');
      assert.ok(pageInfo.height > 0, 'Invalid height');
    });

    test('Page ' + (i + 1) + ' has transition', () => {
      assert.ok(pageInfo.transition, 'Missing transition');
      assert.ok(pageInfo.transition.type, 'Missing transition type');
      assert.ok(pageInfo.transition.durationMs > 0, 'Invalid duration');
    });
  }

  console.log('');

  // --- Suite 4: Format Compliance ---
  console.log('  [Format Compliance]');

  test('Pages use 1920x1080 dimensions', () => {
    manifest.pages.forEach((p, i) => {
      assert.strictEqual(p.width, 1920, 'Page ' + (i + 1) + ' width not 1920');
      assert.strictEqual(p.height, 1080, 'Page ' + (i + 1) + ' height not 1080');
    });
  });

  test('Aspect ratio is 16:9', () => {
    assert.strictEqual(manifest.aspectRatio, '16:9');
  });

  test('Has assets directory', () => {
    let hasAssets = false;
    zip.forEach((p) => { if (p.startsWith('assets/')) hasAssets = true; });
    assert.ok(hasAssets, 'No assets directory');
  });

  test('All page files are in pages/ directory', () => {
    manifest.pages.forEach((p) => {
      assert.ok(p.file.startsWith('pages/'), 'Page not in pages/: ' + p.file);
    });
  });

  test('Slide elements have animation data', () => {
    let hasAnimations = false;
    manifest.pages.forEach((p) => {
      if (p.elements && p.elements.length > 0) {
        p.elements.forEach((el) => {
          if (el.animation) hasAnimations = true;
        });
      }
    });
    assert.ok(hasAnimations, 'No animations found in any slide');
  });

  test('At least one slide has presenter notes', () => {
    const hasNotes = manifest.pages.some(p => p.notes && p.notes.length > 0);
    assert.ok(hasNotes, 'No presenter notes found');
  });

  console.log('');

  // --- Cleanup ---
  try { fs.unlinkSync(SAMPLE_PATH); } catch (e) { /* ignore */ }

  // --- Summary ---
  console.log('  ' + '='.repeat(50));
  console.log('  Results: ' + passed + '/' + total + ' passed, ' + failed + ' failed');
  if (failed === 0) {
    console.log('  All tests passed!');
  } else {
    console.log('  Some tests failed.');
  }
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
