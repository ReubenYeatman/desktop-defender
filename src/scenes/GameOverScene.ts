import Phaser from 'phaser';
import { formatNumber } from '../utils/FormatUtils';
import { AscensionSystem, type RunStats } from '../systems/AscensionSystem';
import type { PlayerProfile } from '../models/GameState';
import { UI_THEME } from '../config/UITheme';
import { TIMING } from '../config/TimingData';

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
    this.add.rectangle(0, 0, w, h, UI_THEME.gameOverBg).setOrigin(0, 0);

    // Red vignette overlay
    const vignette = this.add.graphics();
    vignette.fillStyle(UI_THEME.gameOverAccent, 0.08);
    vignette.fillRect(0, 0, w, h);

    // Title with shake-in animation
    const title = this.add.text(w / 2, 50, 'GAME OVER', {
      fontSize: '26px',
      fontFamily: 'monospace',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#440000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    title.setScale(0.5);
    title.setAlpha(0);
    this.tweens.add({
      targets: title,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Divider line
    const divider = this.add.graphics();
    divider.lineStyle(1, UI_THEME.gameOverPanel, 0.5);
    divider.lineBetween(w * 0.15, 75, w * 0.85, 75);

    // Run stats - animated entrance
    const statsY = 85;
    const stats = [
      { label: 'Waves Survived', value: `${this.runStats.highestWave}`, color: '#ffffff' },
      { label: 'Enemies Killed', value: `${this.runStats.enemiesKilled}`, color: '#ff8888' },
      { label: 'Gold Earned', value: formatNumber(this.runStats.totalGoldEarned), color: '#ffd700' },
    ];

    stats.forEach((stat, i) => {
      const y = statsY + i * 28;
      const row = this.add.container(w / 2, y);

      const labelText = this.add.text(-70, 0, stat.label, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#888888',
      });

      const valueText = this.add.text(70, 0, stat.value, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: stat.color,
        fontStyle: 'bold',
      }).setOrigin(1, 0);

      row.add([labelText, valueText]);
      row.setAlpha(0);

      this.tweens.add({
        targets: row,
        alpha: 1,
        x: row.x,
        duration: 400,
        delay: 300 + i * 150,
        ease: 'Power2',
      });
    });

    // Ascendium earned - prominent
    const ascendium = this.ascensionSystem.calculateAscendium(this.runStats, this.profile);

    const ascBox = this.add.rectangle(w / 2, statsY + stats.length * 28 + 15, 200, 30, UI_THEME.ascensionPanel);
    ascBox.setStrokeStyle(1, UI_THEME.ascensionAccent);

    const ascText = this.add.text(w / 2, statsY + stats.length * 28 + 15, `+${ascendium} ASCENDIUM`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#cc88ff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    ascText.setAlpha(0);
    this.tweens.add({
      targets: [ascText, ascBox],
      alpha: 1,
      duration: 600,
      delay: 800,
      ease: 'Power2',
    });

    // Pulse the ascendium text
    this.tweens.add({
      targets: ascText,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      delay: TIMING.gameOverDelay,
      ease: 'Sine.easeInOut',
    });

    // Buttons
    const ascendBtnY = h - 65;
    this.createButton(w / 2, ascendBtnY, 170, 30, 'ASCEND', UI_THEME.ascensionAccent, UI_THEME.ascensionAccentLight, '#ffffff', () => {
      this.applyRunRewards(ascendium);
      this.scene.start('AscensionScene', { profile: this.profile });
    });

    const newRunBtnY = h - 25;
    this.createButton(w / 2, newRunBtnY, 170, 30, 'NEW RUN', UI_THEME.buttonPrimary, UI_THEME.buttonPrimaryHover, '#aaaaaa', () => {
      this.applyRunRewards(ascendium);
      this.scene.start('GameScene', { profile: this.profile });
    });

    // Handle resize
    this.scale.on('resize', this.onResize, this);
  }

  private onResize() {
    this.scene.restart({ runStats: this.runStats, profile: this.profile });
  }

  shutdown() {
    this.scale.off('resize', this.onResize, this);
  }

  private applyRunRewards(ascendium: number) {
    this.profile.totalAscendium += ascendium;
    this.profile.ascensionCount++;
    this.profile.highestWaveEver = Math.max(this.profile.highestWaveEver, this.runStats.highestWave);
    this.profile.totalEnemiesKilled += this.runStats.enemiesKilled;
  }

  private createButton(
    x: number, y: number, w: number, h: number,
    label: string, bgColor: number, hoverColor: number,
    textColor: string, onClick: () => void
  ) {
    const btn = this.add.rectangle(x, y, w, h, bgColor);
    btn.setStrokeStyle(1, UI_THEME.textMuted);
    btn.setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: textColor,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    btn.on('pointerover', () => btn.setFillStyle(hoverColor));
    btn.on('pointerout', () => btn.setFillStyle(bgColor));
    btn.on('pointerdown', onClick);
  }
}
