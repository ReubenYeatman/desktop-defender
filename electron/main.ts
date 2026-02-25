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

  const windowWidth = 300;
  const windowHeight = 300;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    center: true,
    frame: false,
    resizable: false,     // Disable resizing
    alwaysOnTop: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 10, y: 10 },
    useContentSize: true,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, '../electron/preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log("Loading VITE URL:", process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    console.log("Loading Local File");
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Apply settings after window is fully shown (more reliable on macOS)
  mainWindow.once('show', async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    await applySavedWindowSettings();
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
      // Force 300x300 regardless of settings
      const size = 300;
      mainWindow.setContentSize(size, size, false);
      mainWindow.center();

      // Force always-on-top so the game overlays all tabs permanently
      mainWindow.setAlwaysOnTop(true, 'floating');

      if (settings.windowOpacity !== undefined) {
        mainWindow.setOpacity(Math.max(0.5, Math.min(1, settings.windowOpacity)));
      }
    }
  } catch {
    // No saved settings, use defaults
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
  const validSizes = [300, 400, 500, 600, 700, 800];
  const dim = validSizes.includes(size) ? size : 300;
  if (mainWindow) {
    // Keep window centered on its current position
    const [oldW, oldH] = mainWindow.getContentSize();
    const bounds = mainWindow.getBounds();
    const deltaW = dim - oldW;
    const deltaH = dim - oldH;
    mainWindow.setContentSize(dim, dim, false);
    mainWindow.setBounds({
      x: Math.round(bounds.x - deltaW / 2),
      y: Math.round(bounds.y - deltaH / 2),
      width: bounds.width + deltaW,
      height: bounds.height + deltaH,
    });
  }
});

ipcMain.handle('set-window-opacity', (_event, opacity: number) => {
  if (mainWindow) {
    mainWindow.setOpacity(Math.max(0.5, Math.min(1, opacity)));
  }
});

ipcMain.handle('set-always-on-top', (_event, value: boolean) => {
  if (mainWindow) {
    if (value) {
      mainWindow.setAlwaysOnTop(true, 'floating');
    } else {
      mainWindow.setAlwaysOnTop(false);
    }
  }
});
