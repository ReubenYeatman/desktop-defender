interface ElectronAPI {
  saveGame: (data: string) => Promise<void>;
  loadGame: () => Promise<string | null>;
  toggleAlwaysOnTop: () => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
