import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs/promises';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    minWidth: 400,
    minHeight: 400,
    maxWidth: 700,
    maxHeight: 700,
    frame: false,
    resizable: true,
    alwaysOnTop: false,
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
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

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
