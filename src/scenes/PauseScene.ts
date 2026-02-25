import Phaser from 'phaser';
import { SaveManager } from '../managers/SaveManager';
import type { PlayerProfile } from '../models/GameState';
import { EventBus } from '../managers/EventBus';
import { UI_THEME } from '../config/UITheme';

export class PauseScene extends Phaser.Scene {
  private profile!: PlayerProfile;

  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data: { profile: PlayerProfile }) {
    this.profile = data.profile;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Semi-transparent darkened overlay
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.75);
    bg.setOrigin(0, 0);
    bg.setInteractive();

    // Panel dimensions (responsive)
    const panelW = Math.min(w * 0.85, 360);
    const panelH = Math.min(h * 0.7, 340);
    const cx = w / 2;
    const cy = h / 2;

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(UI_THEME.sceneBgMid, 0.95);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 16);
    panel.lineStyle(2, UI_THEME.accent, 1);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 16);

    // Title
    this.add.text(cx, cy - panelH / 2 + 35, 'PAUSED', {
      fontSize: '28px',
      fontFamily: 'Impact, sans-serif',
      color: '#4a9eff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Quick settings
    let currentY = cy - 50;

    // Music Volume slider
    this.add.text(cx - panelW / 2 + 30, currentY, 'Music', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    this.createSlider(cx + 30, currentY, panelW * 0.35, this.profile.settings.musicVolume, (val) => {
      this.profile.settings.musicVolume = val;
      this.saveSettings();
    });

    currentY += 45;

    // SFX Volume slider
    this.add.text(cx - panelW / 2 + 30, currentY, 'SFX', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    this.createSlider(cx + 30, currentY, panelW * 0.35, this.profile.settings.sfxVolume, (val) => {
      this.profile.settings.sfxVolume = val;
      this.saveSettings();
    });

    // Buttons
    const btnY = cy + 50;
    const btnSpacing = 50;

    // Resume button
    this.createButton(cx, btnY, 'RESUME', UI_THEME.accent, () => {
      this.resumeGame();
    });

    // Settings button
    this.createButton(cx, btnY + btnSpacing, 'SETTINGS', UI_THEME.panelBgLight, () => {
      // Pause the game scenes and open settings
      this.scene.launch('SettingsScene', {
        profile: this.profile,
        returnScene: 'PauseScene',
      });
      this.scene.stop();
    });

    // Leave Round button
    this.createButton(cx, btnY + btnSpacing * 2, 'LEAVE ROUND', UI_THEME.buttonDanger, () => {
      this.promptAbandonRun();
    });

    // ESC/P to unpause
    this.input.keyboard?.on('keydown-ESC', () => this.resumeGame());
    this.input.keyboard?.on('keydown-P', () => this.resumeGame());

    // Handle resize
    this.scale.on('resize', this.onResize, this);
  }

  private createSlider(x: number, y: number, width: number, initialValue: number, onChange: (val: number) => void) {
    const track = this.add.rectangle(x + width / 2, y, width, 6, UI_THEME.pauseSliderBg).setOrigin(0.5);
    const fill = this.add.rectangle(x, y, width * initialValue, 6, UI_THEME.accent).setOrigin(0, 0.5);
    const knob = this.add.circle(x + width * initialValue, y, 10, UI_THEME.pauseSliderKnob);
    knob.setStrokeStyle(2, UI_THEME.accent);
    knob.setInteractive({ useHandCursor: true, draggable: true });

    this.input.setDraggable(knob);

    knob.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
      const boundedX = Phaser.Math.Clamp(dragX, x, x + width);
      knob.x = boundedX;
      fill.width = boundedX - x;
      const normalizedValue = (boundedX - x) / width;
      onChange(normalizedValue);
    });
  }

  private createButton(x: number, y: number, text: string, color: number, onClick: () => void) {
    const btnWidth = 180;
    const btnHeight = 40;

    const btn = this.add.rectangle(x, y, btnWidth, btnHeight, color);
    btn.setStrokeStyle(2, 0xffffff);
    btn.setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: 'Impact, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout', () => btn.setAlpha(1.0));
    btn.on('pointerdown', () => {
      btn.setAlpha(0.6);
      onClick();
    });
    btn.on('pointerup', () => btn.setAlpha(0.8));
  }

  private saveSettings() {
    SaveManager.load().then(state => {
      state.profile.settings = this.profile.settings;
      SaveManager.save(state);
    });
  }

  private resumeGame() {
    this.scene.resume('GameScene');
    this.scene.resume('HUDScene');
    this.scene.stop();
  }

  private promptAbandonRun() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8).setOrigin(0);
    overlay.setInteractive();

    const promptBox = this.add.rectangle(cx, cy, 280, 140, UI_THEME.pauseSliderBg);
    promptBox.setStrokeStyle(2, UI_THEME.buttonDanger);

    this.add.text(cx, cy - 35, 'Leave round?', {
      fontSize: '20px',
      fontFamily: 'Impact, sans-serif',
      color: '#ff4444',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 10, 'Progress will be lost.', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.createButton(cx - 70, cy + 35, 'CANCEL', UI_THEME.pauseSliderKnob, () => {
      this.scene.restart({ profile: this.profile });
    });

    this.createButton(cx + 70, cy + 35, 'QUIT', UI_THEME.buttonDanger, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        EventBus.removeAll();
        SaveManager.load().then(state => {
          state.run = null;
          SaveManager.save(state).then(() => {
            this.scene.stop('GameScene');
            this.scene.stop('HUDScene');
            this.scene.stop('UpgradeScene');
            this.scene.start('BootScene');
          });
        });
      });
    });
  }

  private onResize() {
    this.scene.restart({ profile: this.profile });
  }

  shutdown() {
    this.scale.off('resize', this.onResize, this);
  }
}
