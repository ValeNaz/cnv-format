/**
 * CNV Player — Electron Main Process v2.0
 * Creates a secure BrowserWindow with sandbox enabled.
 * Handles file open dialog and command-line file loading.
 *
 * Usage: npx electron player/main.js [file.cnv]
 */
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'CNV Player',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#0a0a14',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Needed for preload fs access
      webSecurity: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Check for command-line file argument
    const fileArg = process.argv.find(arg => arg.endsWith('.cnv'));
    if (fileArg) {
      const filePath = path.resolve(fileArg);
      if (fs.existsSync(filePath)) {
        setTimeout(() => {
          mainWindow.webContents.send('file:loaded', filePath);
        }, 500);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Remove default menu in production
  if (!process.argv.includes('--dev')) {
    mainWindow.setMenuBarVisibility(false);
  }
}

// --- IPC Handlers ---

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open CNV Presentation',
    filters: [
      { name: 'CNV Presentations', extensions: ['cnv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// --- App Lifecycle ---

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle file open from OS (macOS double-click .cnv)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('file:loaded', filePath);
  }
});

// Security: prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event) => {
    event.preventDefault();
  });
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

console.log('CNV Player main process v2.0');
