const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (data) => ipcRenderer.invoke('save-game', data),
  loadGame: () => ipcRenderer.invoke('load-game'),
  toggleAlwaysOnTop: () => ipcRenderer.send('toggle-always-on-top'),
  setWindowSize: (size) => ipcRenderer.invoke('set-window-size', size),
  setWindowOpacity: (opacity) => ipcRenderer.invoke('set-window-opacity', opacity),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('set-always-on-top', value),
});
