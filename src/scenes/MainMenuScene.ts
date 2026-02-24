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

    // Background gradient overlay
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1e, 1);
    bg.fillRect(0, 0, w, h);

    // Decorative grid lines
    bg.lineStyle(1, 0x1a1a3e, 0.3);
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
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    this.add.text(w / 2, h * 0.35, 'IDLE TOWER DEFENSE', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#446688',
      letterSpacing: 4,
    }).setOrigin(0.5, 0.5);

    // Buttons
    let btnY = h * 0.50;

    this.createButton(w / 2, btnY, 170, 38, 'NEW RUN', 0x335577, 0x446688, '#ffffff', () => {
      this.gameState.run = null;
      this.scene.start('GameScene', { profile: this.gameState.profile });
    });

    if (this.gameState.run) {
      btnY += 48;
      this.createButton(w / 2, btnY, 170, 38, `CONTINUE (Wave ${this.gameState.run.currentWave})`, 0x447744, 0x558855, '#ffffff', () => {
        this.scene.start('GameScene', {
          profile: this.gameState.profile,
          savedRun: this.gameState.run,
        });
      });
    }

    if (this.gameState.profile.ascensionCount > 0) {
      btnY += 48;
      this.createButton(w / 2, btnY, 170, 34, `ASCENSION (${this.gameState.profile.totalAscendium} A)`, 0x442266, 0x553377, '#cc88ff', () => {
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
    const border = this.add.rectangle(x, y, w + 2, h + 2, 0x667788);
    border.setStrokeStyle(1, 0x667788);

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
