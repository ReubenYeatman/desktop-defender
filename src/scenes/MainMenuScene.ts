import Phaser from 'phaser';
import { SaveManager } from '../managers/SaveManager';
import type { GameState } from '../models/GameState';
import { UI_THEME } from '../config/UITheme';
import { TIMING } from '../config/TimingData';
import { UI_LAYOUT } from '../config/BalanceData';

export class MainMenuScene extends Phaser.Scene {
  private gameState!: GameState;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  async create() {
    this.gameState = await SaveManager.load();

    const w = this.scale.width;
    const h = this.scale.height;

    // Background gradient overlay
    const bg = this.add.graphics();
    bg.fillStyle(UI_THEME.sceneBgDark, 1);
    bg.fillRect(0, 0, w, h);

    // Decorative grid lines
    bg.lineStyle(1, UI_THEME.sceneBgLight, 0.3);
    for (let x = 0; x < w; x += 40) {
      bg.lineBetween(x, 0, x, h);
    }
    for (let y = 0; y < h; y += 40) {
      bg.lineBetween(0, y, w, y);
    }

    // Title with glow effect
    const titleShadow = this.add.text(w / 2 + 2, h * 0.2 + 2, 'DESKTOP\nDEFENDER', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#1a3a6e',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    const title = this.add.text(w / 2, h * 0.2, 'DESKTOP\nDEFENDER', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#4a9eff',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#1a3a6e',
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5);

    // Subtle title pulse
    this.tweens.add({
      targets: title,
      alpha: 0.8,
      duration: TIMING.titleFadeIn,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    this.add.text(w / 2, h * UI_LAYOUT.buttonYRatio, 'IDLE TOWER DEFENSE', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#446688',
      letterSpacing: 4,
    }).setOrigin(0.5, 0.5);

    // Buttons
    let btnY = h * UI_LAYOUT.buttonYRatioAlt;

    this.createButton(w / 2, btnY, 170, 38, 'NEW RUN', UI_THEME.buttonPrimary, UI_THEME.buttonPrimaryHover, '#ffffff', () => {
      this.gameState.run = null;
      this.scene.start('GameScene', { profile: this.gameState.profile });
    });

    if (this.gameState.run) {
      btnY += 48;
      this.createButton(w / 2, btnY, 170, 38, `CONTINUE (Wave ${this.gameState.run.currentWave})`, UI_THEME.buttonSuccess, UI_THEME.buttonSuccessHover, '#ffffff', () => {
        this.scene.start('GameScene', {
          profile: this.gameState.profile,
          savedRun: this.gameState.run,
        });
      });
    }

    if (this.gameState.profile.ascensionCount > 0) {
      btnY += 48;
      this.createButton(w / 2, btnY, 170, 34, `ASCENSION (${this.gameState.profile.totalAscendium} A)`, UI_THEME.buttonAscend, UI_THEME.buttonAscendHover, '#cc88ff', () => {
        this.scene.start('AscensionScene', { profile: this.gameState.profile });
      });
    }

    // Stats footer
    if (this.gameState.profile.highestWaveEver > 0) {
      this.add.text(w / 2, h - 30, `Best: Wave ${this.gameState.profile.highestWaveEver}  |  Ascensions: ${this.gameState.profile.ascensionCount}`, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#445566',
      }).setOrigin(0.5, 0.5);
    }

    // Version
    this.add.text(w - 8, h - 8, 'v1.0', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#333344',
    }).setOrigin(1, 1);
  }

  private createButton(
    x: number, y: number, w: number, h: number,
    label: string, bgColor: number, hoverColor: number,
    textColor: string, onClick: () => void
  ) {
    const border = this.add.rectangle(x, y, w + 2, h + 2, UI_THEME.textMuted);
    border.setStrokeStyle(1, UI_THEME.textMuted);

    const btn = this.add.rectangle(x, y, w, h, bgColor);
    btn.setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, {
      fontSize: label.length > 18 ? '11px' : '14px',
      fontFamily: 'monospace',
      color: textColor,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    btn.on('pointerover', () => btn.setFillStyle(hoverColor));
    btn.on('pointerout', () => btn.setFillStyle(bgColor));
    btn.on('pointerdown', onClick);
  }
}
