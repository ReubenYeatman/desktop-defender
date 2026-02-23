import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (data: string) => ipcRenderer.invoke('save-game', data),
  loadGame: () => ipcRenderer.invoke('load-game') as Promise<string | null>,
  toggleAlwaysOnTop: () => ipcRenderer.send('toggle-always-on-top'),
});
