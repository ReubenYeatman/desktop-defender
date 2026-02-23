import Phaser from 'phaser';
import { formatNumber } from '../utils/FormatUtils';
import { AscensionSystem, type RunStats } from '../systems/AscensionSystem';
import type { PlayerProfile } from '../models/GameState';

export class GameOverScene extends Phaser.Scene {
  private runStats!: RunStats;
  private profile!: PlayerProfile;
  private ascensionSystem: AscensionSystem = new AscensionSystem();

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { runStats: RunStats; profile: PlayerProfile }) {
    this.runStats = data.runStats;
    this.profile = data.profile;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Background
    this.add.rectangle(0, 0, w, h, 0x000000, 0.85).setOrigin(0, 0);

    // Title
    this.add.text(w / 2, 40, 'GAME OVER', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Run stats
    const statsY = 80;
    const stats = [
      `Waves Survived: ${this.runStats.highestWave}`,
      `Enemies Killed: ${this.runStats.enemiesKilled}`,
      `Gold Earned: ${formatNumber(this.runStats.totalGoldEarned)}`,
    ];

    stats.forEach((text, i) => {
      this.add.text(w / 2, statsY + i * 22, text, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#cccccc',
      }).setOrigin(0.5, 0);
    });

    // Ascendium earned
    const ascendium = this.ascensionSystem.calculateAscendium(this.runStats, this.profile);
    this.add.text(w / 2, statsY + stats.length * 22 + 20, `Ascendium Earned: +${ascendium}`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#aa44ff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Ascend button
    const ascendBtnY = h - 100;
    const ascendBtn = this.add.rectangle(w / 2, ascendBtnY, 160, 36, 0x6633aa);
    ascendBtn.setInteractive({ useHandCursor: true });
    this.add.text(w / 2, ascendBtnY, 'ASCEND', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    ascendBtn.on('pointerdown', () => {
      // Apply ascendium
      this.profile.totalAscendium += ascendium;
      this.profile.ascensionCount++;
      this.profile.highestWaveEver = Math.max(this.profile.highestWaveEver, this.runStats.highestWave);
      this.profile.totalEnemiesKilled += this.runStats.enemiesKilled;

      this.scene.start('AscensionScene', { profile: this.profile });
    });

    // New Run button (skip ascension shop)
    const newRunBtnY = h - 55;
    const newRunBtn = this.add.rectangle(w / 2, newRunBtnY, 160, 30, 0x335577);
    newRunBtn.setInteractive({ useHandCursor: true });
    this.add.text(w / 2, newRunBtnY, 'New Run', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5, 0.5);

    newRunBtn.on('pointerdown', () => {
      this.profile.totalAscendium += ascendium;
      this.profile.ascensionCount++;
      this.profile.highestWaveEver = Math.max(this.profile.highestWaveEver, this.runStats.highestWave);
      this.profile.totalEnemiesKilled += this.runStats.enemiesKilled;

      this.scene.start('GameScene', { profile: this.profile });
    });
  }
}
