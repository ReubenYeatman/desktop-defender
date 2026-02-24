import type { GameState } from '../models/GameState';
import { createDefaultGameState } from '../models/GameState';

export class SaveManager {
  private static SAVE_VERSION = 1;

  static async save(state: GameState): Promise<void> {
    state.version = this.SAVE_VERSION;
    state.lastSaved = Date.now();
    const json = JSON.stringify(state);

    if (window.electronAPI) {
      await window.electronAPI.saveGame(json);
    } else {
      localStorage.setItem('desktop-defender-save', json);
    }
  }

  static async load(): Promise<GameState> {
    let json: string | null = null;

    if (window.electronAPI) {
      json = await window.electronAPI.loadGame();
    } else {
      json = localStorage.getItem('desktop-defender-save');
    }

    if (!json) return createDefaultGameState();

    try {
      const state = JSON.parse(json) as GameState;
      return this.migrate(state);
    } catch {
      return createDefaultGameState();
    }
  }

  static migrate(state: GameState): GameState {
    // Future migrations go here
    if (!state.version) {
      state.version = 1;
    }

    // Ensure new settings fields exist with defaults
    const settings = state.profile.settings;
    if (settings.muteAll === undefined) settings.muteAll = false;
    if (settings.particleQuality === undefined) settings.particleQuality = 'high';
    if (settings.vignette === undefined) settings.vignette = true;
    if (settings.showDamageNumbers === undefined) settings.showDamageNumbers = true;
    if (settings.windowOpacity === undefined) settings.windowOpacity = 1.0;
    // Migrate old string-based windowSize to numeric
    if (settings.windowSize === undefined || typeof settings.windowSize === 'string') {
      const sizeMap: Record<string, number> = { small: 400, medium: 600, large: 800 };
      settings.windowSize = (sizeMap[settings.windowSize as string] || 600) as 400 | 500 | 600 | 700 | 800;
    }

    return state;
  }

  static async deleteSave(): Promise<void> {
    if (window.electronAPI) {
      await window.electronAPI.saveGame('');
    } else {
      localStorage.removeItem('desktop-defender-save');
    }
  }
}
