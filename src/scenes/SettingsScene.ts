import Phaser from 'phaser';
import { SaveManager } from '../managers/SaveManager';
import type { PlayerProfile, GameSettings } from '../models/GameState';
import { UI_THEME } from '../config/UITheme';

type TabName = 'audio' | 'visual' | 'window';

export class SettingsScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private returnScene: string = 'MainMenuScene';
  private currentTab: TabName = 'audio';

  // UI elements that need repositioning on resize
  private panel!: Phaser.GameObjects.Rectangle;
  private panelBorder!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private closeBtn!: Phaser.GameObjects.Rectangle;
  private closeBtnText!: Phaser.GameObjects.Text;
  private tabButtons: Map<TabName, { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = new Map();
  private contentContainer!: Phaser.GameObjects.Container;
  private backBtn!: Phaser.GameObjects.Rectangle;
  private backBtnText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  init(data: { profile: PlayerProfile; returnScene?: string }) {
    this.profile = data.profile;
    this.returnScene = data.returnScene || 'MainMenuScene';
  }

  create() {
    this.createUI();
    this.scale.on('resize', this.onResize, this);
  }

  private createUI() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Semi-transparent backdrop
    const backdrop = this.add.rectangle(0, 0, w, h, 0x000000, 0.75);
    backdrop.setOrigin(0, 0);
    backdrop.setInteractive();

    // Panel dimensions (responsive)
    const panelW = Math.min(w * 0.9, 420);
    const panelH = Math.min(h * 0.85, 480);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    // Panel background
    this.panel = this.add.rectangle(panelX + panelW / 2, panelY + panelH / 2, panelW, panelH, UI_THEME.sceneBgMid, 0.98);
    this.panel.setStrokeStyle(2, UI_THEME.accent);

    // Title
    this.title = this.add.text(w / 2, panelY + 28, 'SETTINGS', {
      fontSize: '24px',
      fontFamily: 'Impact, sans-serif',
      color: '#4a9eff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    // Close button
    const closeBtnSize = 28;
    this.closeBtn = this.add.rectangle(panelX + panelW - 20, panelY + 28, closeBtnSize, closeBtnSize, UI_THEME.buttonDanger);
    this.closeBtn.setInteractive({ useHandCursor: true });
    this.closeBtnText = this.add.text(panelX + panelW - 20, panelY + 28, 'X', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.closeBtn.on('pointerover', () => this.closeBtn.setAlpha(0.8));
    this.closeBtn.on('pointerout', () => this.closeBtn.setAlpha(1));
    this.closeBtn.on('pointerdown', () => this.closeSettings());

    // Tab buttons
    const tabs: TabName[] = ['audio', 'visual', 'window'];
    const tabLabels: Record<TabName, string> = { audio: 'AUDIO', visual: 'VISUAL', window: 'WINDOW' };
    const tabWidth = (panelW - 40) / 3;
    const tabY = panelY + 65;

    tabs.forEach((tab, i) => {
      const tabX = panelX + 20 + tabWidth * i + tabWidth / 2;
      const isActive = tab === this.currentTab;

      const tabBg = this.add.rectangle(tabX, tabY, tabWidth - 6, 30, isActive ? UI_THEME.accent : UI_THEME.panelBgDark);
      tabBg.setStrokeStyle(1, UI_THEME.accent);
      tabBg.setInteractive({ useHandCursor: true });

      const tabText = this.add.text(tabX, tabY, tabLabels[tab], {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: isActive ? '#0a192f' : '#aaccff',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);

      tabBg.on('pointerdown', () => this.switchTab(tab));

      this.tabButtons.set(tab, { bg: tabBg, text: tabText });
    });

    // Content container
    this.contentContainer = this.add.container(0, 0);

    // Back button
    const backBtnW = 120;
    const backBtnH = 36;
    this.backBtn = this.add.rectangle(w / 2, panelY + panelH - 30, backBtnW, backBtnH, UI_THEME.buttonPrimary);
    this.backBtn.setStrokeStyle(1, UI_THEME.accent);
    this.backBtn.setInteractive({ useHandCursor: true });

    this.backBtnText = this.add.text(w / 2, panelY + panelH - 30, 'BACK', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.backBtn.on('pointerover', () => this.backBtn.setFillStyle(UI_THEME.buttonPrimaryHover));
    this.backBtn.on('pointerout', () => this.backBtn.setFillStyle(UI_THEME.buttonPrimary));
    this.backBtn.on('pointerdown', () => this.closeSettings());

    // Render initial tab content
    this.renderTabContent();

    // ESC to close
    this.input.keyboard?.on('keydown-ESC', () => this.closeSettings());
  }

  private switchTab(tab: TabName) {
    this.currentTab = tab;

    // Update tab button styles
    this.tabButtons.forEach((btn, tabKey) => {
      const isActive = tabKey === tab;
      btn.bg.setFillStyle(isActive ? UI_THEME.accent : UI_THEME.panelBgDark);
      btn.text.setColor(isActive ? '#0a192f' : '#aaccff');
    });

    this.renderTabContent();
  }

  private renderTabContent() {
    // Clear existing content
    this.contentContainer.removeAll(true);

    const w = this.scale.width;
    const h = this.scale.height;
    const panelW = Math.min(w * 0.9, 420);
    const panelH = Math.min(h * 0.85, 480);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    const contentStartY = panelY + 100;
    const rowHeight = 45;
    const labelX = panelX + 30;
    const controlX = panelX + panelW - 30;

    switch (this.currentTab) {
      case 'audio':
        this.renderAudioTab(labelX, controlX, contentStartY, rowHeight, panelW);
        break;
      case 'visual':
        this.renderVisualTab(labelX, controlX, contentStartY, rowHeight, panelW);
        break;
      case 'window':
        this.renderWindowTab(labelX, controlX, contentStartY, rowHeight, panelW);
        break;
    }
  }

  private renderAudioTab(labelX: number, controlX: number, startY: number, rowHeight: number, panelW: number) {
    let y = startY;

    // Music Volume
    this.createSliderRow(labelX, controlX, y, 'Music', this.profile.settings.musicVolume, (val) => {
      this.profile.settings.musicVolume = val;
      this.saveSettings();
    }, panelW);
    y += rowHeight;

    // SFX Volume
    this.createSliderRow(labelX, controlX, y, 'SFX', this.profile.settings.sfxVolume, (val) => {
      this.profile.settings.sfxVolume = val;
      this.saveSettings();
    }, panelW);
    y += rowHeight;

    // Mute All
    this.createToggleRow(labelX, controlX, y, 'Mute All', this.profile.settings.muteAll, (val) => {
      this.profile.settings.muteAll = val;
      this.saveSettings();
    });
  }

  private renderVisualTab(labelX: number, controlX: number, startY: number, rowHeight: number, panelW: number) {
    let y = startY;

    // Screen Shake
    this.createToggleRow(labelX, controlX, y, 'Shake', this.profile.settings.screenShake, (val) => {
      this.profile.settings.screenShake = val;
      this.saveSettings();
    });
    y += rowHeight;

    // Vignette
    this.createToggleRow(labelX, controlX, y, 'Vignette', this.profile.settings.vignette, (val) => {
      this.profile.settings.vignette = val;
      this.saveSettings();
    });
    y += rowHeight;

    // Damage Numbers
    this.createToggleRow(labelX, controlX, y, 'Dmg Numbers', this.profile.settings.showDamageNumbers, (val) => {
      this.profile.settings.showDamageNumbers = val;
      this.saveSettings();
    });
    y += rowHeight;

    // Particle Quality
    this.createStringSelectorRow(labelX, controlX, y, 'Particles',
      ['low', 'medium', 'high'],
      ['LOW', 'MED', 'HIGH'],
      this.profile.settings.particleQuality,
      (val) => {
        this.profile.settings.particleQuality = val as 'low' | 'medium' | 'high';
        this.saveSettings();
      }
    );
  }

  private renderWindowTab(labelX: number, controlX: number, startY: number, rowHeight: number, panelW: number) {
    let y = startY;

    // Window Size - 5 pixel value options
    this.createSizeSelectorRow(labelX, controlX, y, 'Size',
      [400, 500, 600, 700, 800],
      this.profile.settings.windowSize,
      (val) => {
        this.profile.settings.windowSize = val as 400 | 500 | 600 | 700 | 800;
        this.saveSettings();
        if ((window as any).electronAPI) {
          (window as any).electronAPI.setWindowSize(val);
        }
      }
    );
    y += rowHeight;

    // Always On Top
    this.createToggleRow(labelX, controlX, y, 'On Top', this.profile.settings.alwaysOnTop, (val) => {
      this.profile.settings.alwaysOnTop = val;
      this.saveSettings();
      if ((window as any).electronAPI) {
        (window as any).electronAPI.setAlwaysOnTop(val);
      }
    });
    y += rowHeight;

    // Window Opacity
    this.createSliderRow(labelX, controlX, y, 'Opacity', this.profile.settings.windowOpacity, (val) => {
      const opacity = 0.5 + val * 0.5;
      this.profile.settings.windowOpacity = opacity;
      this.saveSettings();
      if ((window as any).electronAPI) {
        (window as any).electronAPI.setWindowOpacity(opacity);
      }
    }, panelW, 0.5, 1.0);
  }

  private createSliderRow(labelX: number, controlX: number, y: number, label: string, initialValue: number, onChange: (val: number) => void, panelW: number, minVal: number = 0, maxVal: number = 1) {
    // Label
    const labelText = this.add.text(labelX, y, label, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.contentContainer.add(labelText);

    // Slider track - reduced width
    const sliderWidth = 100;
    const sliderX = controlX - sliderWidth - 40;

    const track = this.add.rectangle(sliderX + sliderWidth / 2, y, sliderWidth, 6, UI_THEME.pauseSliderBg);
    this.contentContainer.add(track);

    // Normalize value to 0-1 for display
    const normalizedValue = (initialValue - minVal) / (maxVal - minVal);

    // Slider fill
    const fill = this.add.rectangle(sliderX, y, sliderWidth * normalizedValue, 6, UI_THEME.accent).setOrigin(0, 0.5);
    this.contentContainer.add(fill);

    // Slider knob
    const knob = this.add.circle(sliderX + sliderWidth * normalizedValue, y, 8, UI_THEME.pauseSliderKnob);
    knob.setStrokeStyle(2, UI_THEME.accent);
    knob.setInteractive({ useHandCursor: true, draggable: true });
    this.contentContainer.add(knob);

    // Value text
    const valueText = this.add.text(controlX - 30, y, `${Math.round(initialValue * 100)}%`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#66ccff',
    }).setOrigin(0, 0.5);
    this.contentContainer.add(valueText);

    // Drag handling
    this.input.setDraggable(knob);
    knob.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
      const boundedX = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderWidth);
      knob.x = boundedX;
      fill.width = boundedX - sliderX;

      const normalizedVal = (boundedX - sliderX) / sliderWidth;
      const actualVal = minVal + normalizedVal * (maxVal - minVal);
      valueText.setText(`${Math.round(actualVal * 100)}%`);
      onChange(normalizedVal);
    });
  }

  private createToggleRow(labelX: number, controlX: number, y: number, label: string, initialValue: boolean, onChange: (val: boolean) => void) {
    // Label
    const labelText = this.add.text(labelX, y, label, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.contentContainer.add(labelText);

    // Toggle box
    const boxSize = 24;
    const box = this.add.rectangle(controlX - boxSize / 2 - 10, y, boxSize, boxSize, initialValue ? UI_THEME.accent : UI_THEME.pauseToggleBg);
    box.setStrokeStyle(2, 0xffffff);
    box.setInteractive({ useHandCursor: true });
    this.contentContainer.add(box);

    // Checkmark
    const check = this.add.text(controlX - boxSize / 2 - 10, y, initialValue ? '\u2713' : '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.contentContainer.add(check);

    let state = initialValue;
    box.on('pointerdown', () => {
      state = !state;
      box.setFillStyle(state ? UI_THEME.accent : UI_THEME.pauseToggleBg);
      check.setText(state ? '\u2713' : '');
      onChange(state);
    });
  }

  private createStringSelectorRow(labelX: number, controlX: number, y: number, label: string, values: string[], displayLabels: string[], currentValue: string, onChange: (val: string) => void) {
    // Label
    const labelText = this.add.text(labelX, y, label, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.contentContainer.add(labelText);

    // Selector buttons
    const btnWidth = 38;
    const btnHeight = 24;
    const gap = 4;
    const totalWidth = values.length * btnWidth + (values.length - 1) * gap;
    const startX = controlX - totalWidth - 10;

    values.forEach((val, i) => {
      const btnX = startX + i * (btnWidth + gap) + btnWidth / 2;
      const isActive = val === currentValue;

      const btn = this.add.rectangle(btnX, y, btnWidth, btnHeight, isActive ? UI_THEME.accent : UI_THEME.panelBgDark);
      btn.setStrokeStyle(1, UI_THEME.accent);
      btn.setInteractive({ useHandCursor: true });
      this.contentContainer.add(btn);

      const btnText = this.add.text(btnX, y, displayLabels[i], {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: isActive ? '#0a192f' : '#aaccff',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
      this.contentContainer.add(btnText);

      btn.on('pointerdown', () => {
        onChange(val);
        this.renderTabContent();
      });
    });
  }

  private createSizeSelectorRow(labelX: number, controlX: number, y: number, label: string, values: number[], currentValue: number, onChange: (val: number) => void) {
    // Label
    const labelText = this.add.text(labelX, y, label, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.contentContainer.add(labelText);

    // Selector buttons - 5 buttons for pixel sizes
    const btnWidth = 36;
    const btnHeight = 24;
    const gap = 3;
    const totalWidth = values.length * btnWidth + (values.length - 1) * gap;
    const startX = controlX - totalWidth - 10;

    values.forEach((val, i) => {
      const btnX = startX + i * (btnWidth + gap) + btnWidth / 2;
      const isActive = val === currentValue;

      const btn = this.add.rectangle(btnX, y, btnWidth, btnHeight, isActive ? UI_THEME.accent : UI_THEME.panelBgDark);
      btn.setStrokeStyle(1, UI_THEME.accent);
      btn.setInteractive({ useHandCursor: true });
      this.contentContainer.add(btn);

      const btnText = this.add.text(btnX, y, String(val), {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: isActive ? '#0a192f' : '#aaccff',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
      this.contentContainer.add(btnText);

      btn.on('pointerdown', () => {
        onChange(val);
        this.renderTabContent();
      });
    });
  }

  private saveSettings() {
    SaveManager.load().then(state => {
      state.profile.settings = this.profile.settings;
      SaveManager.save(state);
    });
  }

  private closeSettings() {
    this.scene.start(this.returnScene, { profile: this.profile });
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    // For simplicity, just restart the scene on resize
    // This ensures all elements are properly repositioned
    this.scene.restart({ profile: this.profile, returnScene: this.returnScene });
  }

  shutdown() {
    this.scale.off('resize', this.onResize, this);
  }
}
