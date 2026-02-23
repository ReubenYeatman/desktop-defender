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
