import Phaser from 'phaser';
import { SaveManager } from '../managers/SaveManager';
import type { GameState } from '../models/GameState';

export class MainMenuScene extends Phaser.Scene {
  private gameState!: GameState;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  async create() {
    this.gameState = await SaveManager.load();

    const w = this.scale.width;
    const h = this.scale.height;

    // Title
    this.add.text(w / 2, h * 0.25, 'DESKTOP\nDEFENDER', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#4a9eff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // New Run button
    const newRunBtn = this.add.rectangle(w / 2, h * 0.55, 160, 36, 0x335577);
    newRunBtn.setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.55, 'New Run', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    newRunBtn.on('pointerdown', () => {
      this.gameState.run = null;
      this.scene.start('GameScene', { profile: this.gameState.profile });
    });

    // Continue button (if there's a saved run)
    if (this.gameState.run) {
      const contBtn = this.add.rectangle(w / 2, h * 0.65, 160, 36, 0x447744);
      contBtn.setInteractive({ useHandCursor: true });
      this.add.text(w / 2, h * 0.65, `Continue (Wave ${this.gameState.run.currentWave})`, {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#ffffff',
      }).setOrigin(0.5, 0.5);

      contBtn.on('pointerdown', () => {
        this.scene.start('GameScene', {
          profile: this.gameState.profile,
          savedRun: this.gameState.run,
        });
      });
    }

    // Ascension button
    if (this.gameState.profile.ascensionCount > 0) {
      const ascBtn = this.add.rectangle(w / 2, h * 0.78, 160, 30, 0x442266);
      ascBtn.setInteractive({ useHandCursor: true });
      this.add.text(w / 2, h * 0.78, `Ascension (${this.gameState.profile.totalAscendium} A)`, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#cc88ff',
      }).setOrigin(0.5, 0.5);

      ascBtn.on('pointerdown', () => {
        this.scene.start('AscensionScene', { profile: this.gameState.profile });
      });
    }

    // Stats
    if (this.gameState.profile.highestWaveEver > 0) {
      this.add.text(w / 2, h * 0.90, `Best: Wave ${this.gameState.profile.highestWaveEver} | Ascensions: ${this.gameState.profile.ascensionCount}`, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#666666',
      }).setOrigin(0.5, 0.5);
    }
  }
}
