/**
 * CNV Player — Electron Main Process
 * Opens .cnv files and renders presentations in fullscreen/kiosk mode.
 * 
 * Usage: electron player/main.js [path-to-file.cnv]
 *        npm run player -- path/to/file.cnv
 */

const { app, BrowserWindow, dialog, ipcMain, Menu, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let cnvFilePath = null;

// --- Parse CLI arguments ---
const args = process.argv.slice(2);
const isDevMode = args.includes('--dev');
const isKiosk = args.includes('--kiosk');
cnvFilePath = args.find(a => a.endsWith('.cnv'));

// --- App Setup ---
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !isDevMode,
    kiosk: isKiosk,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (isDevMode) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Hide cursor after 3 seconds of inactivity in presentation mode
  if (!isDevMode) {
    Menu.setApplicationMenu(null);
  }

  mainWindow.on('closed', () => { mainWindow = null; });

  // After window loads, send the CNV file path
  mainWindow.webContents.on('did-finish-load', () => {
    if (cnvFilePath) {
      const absPath = path.resolve(cnvFilePath);
      if (fs.existsSync(absPath)) {
        mainWindow.webContents.send('open-cnv', absPath);
      } else {
        mainWindow.webContents.send('error', `File not found: ${absPath}`);
      }
    } else {
      mainWindow.webContents.send('show-welcome');
    }
  });
}

// --- IPC Handlers ---

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'CNV Presentations', extensions: ['cnv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('read-file', async (event, filePath) => {
  return fs.readFileSync(filePath);
});

ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

ipcMain.handle('exit-presentation', () => {
  if (mainWindow) {
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
  }
});

// --- App Lifecycle ---

app.whenReady().then(() => {
  createWindow();

  // Register global shortcuts
  globalShortcut.register('F5', () => {
    if (mainWindow && !mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(true);
    }
  });

  globalShortcut.register('Escape', () => {
    if (mainWindow && mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});

// Handle file open on macOS (drag to dock icon)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  cnvFilePath = filePath;
  if (mainWindow) {
    mainWindow.webContents.send('open-cnv', filePath);
  }
});
