import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

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
    resizable: true,
    alwaysOnTop: true,
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

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
    app.focus({ steal: true });
    console.log("Window is ready to show and focused");
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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
