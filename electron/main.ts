import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  console.log("Primary Display WorkArea:", primaryDisplay.workArea);
  const { x, y, width: workAreaWidth } = primaryDisplay.workArea;

  const windowWidth = 600;
  const windowHeight = 600;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    center: true,
    // x: x + workAreaWidth - windowWidth - 20, // 20px padding from right edge
    // y: y + 20, // 20px padding from top edge
    frame: false,
    resizable: true,      // Allow resize for setSize() to work on macOS
    alwaysOnTop: false,   // Default to false, load from saved settings
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 10 },
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log("Loading VITE URL:", process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    console.log("Loading Local File");
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', async () => {
    await applySavedWindowSettings();
    mainWindow?.show();
    mainWindow?.focus();
    console.log("Window is ready to show and focused");
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Load saved settings and apply to window on startup
async function applySavedWindowSettings() {
  try {
    const savePath = path.join(app.getPath('userData'), 'save.json');
    const json = await fs.readFile(savePath, 'utf-8');
    const gameState = JSON.parse(json);
    const settings = gameState?.profile?.settings;

    if (settings && mainWindow) {
      // Apply window size using setBounds for macOS compatibility
      const validSizes = [400, 500, 600, 700, 800];
      const size = validSizes.includes(settings.windowSize) ? settings.windowSize : 600;
      const bounds = mainWindow.getBounds();
      mainWindow.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: size,
        height: size
      });
      mainWindow.center();

      // Apply always on top with 'pop-up-menu' level for macOS
      if (settings.alwaysOnTop) {
        mainWindow.setAlwaysOnTop(true, 'pop-up-menu');
      } else {
        mainWindow.setAlwaysOnTop(false);
      }

      // Apply opacity
      if (settings.windowOpacity !== undefined) {
        mainWindow.setOpacity(Math.max(0.5, Math.min(1, settings.windowOpacity)));
      }

      console.log(`Applied saved settings: size=${size}, alwaysOnTop=${settings.alwaysOnTop}, opacity=${settings.windowOpacity}`);
    }
  } catch {
    // No saved settings or error reading, use defaults
    console.log('No saved settings found, using defaults');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC: Save game state to filesystem
const getSavePath = () => path.join(app.getPath('userData'), 'save.json');

ipcMain.handle('save-game', async (_event, data: string) => {
  await fs.writeFile(getSavePath(), data, 'utf-8');
});

ipcMain.handle('load-game', async () => {
  try {
    return await fs.readFile(getSavePath(), 'utf-8');
  } catch {
    return null;
  }
});

ipcMain.on('toggle-always-on-top', () => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop());
  }
});

ipcMain.handle('set-window-size', (_event, size: number) => {
  // Accept numeric pixel values: 400, 500, 600, 700, 800
  const validSizes = [400, 500, 600, 700, 800];
  const dim = validSizes.includes(size) ? size : 600;
  if (mainWindow) {
    // Use setBounds instead of setSize for better macOS compatibility
    const bounds = mainWindow.getBounds();
    console.log(`[Window Resize] Before: ${bounds.width}x${bounds.height}`);
    mainWindow.setBounds({
      x: bounds.x,
      y: bounds.y,
      width: dim,
      height: dim
    });
    mainWindow.center();
    console.log(`[Window Resize] After: ${dim}x${dim}`);
  }
});

ipcMain.handle('set-window-opacity', (_event, opacity: number) => {
  if (mainWindow) {
    mainWindow.setOpacity(Math.max(0.5, Math.min(1, opacity)));
  }
});

ipcMain.handle('set-always-on-top', (_event, value: boolean) => {
  if (mainWindow) {
    // Use 'pop-up-menu' level for macOS - stays above Dock and other windows
    if (value) {
      mainWindow.setAlwaysOnTop(true, 'pop-up-menu');
    } else {
      mainWindow.setAlwaysOnTop(false);
    }
    console.log(`[Always on Top] Set to: ${value}, actual: ${mainWindow.isAlwaysOnTop()}`);
  }
});
