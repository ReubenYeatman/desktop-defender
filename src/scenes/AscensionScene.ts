import Phaser from 'phaser';
import { AscensionSystem } from '../systems/AscensionSystem';
import { formatNumber } from '../utils/FormatUtils';
import type { PlayerProfile } from '../models/GameState';
import { UI_THEME } from '../config/UITheme';

export class AscensionScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private ascensionSystem: AscensionSystem = new AscensionSystem();
  private ascendiumText!: Phaser.GameObjects.Text;
  private rows: { id: string; levelText: Phaser.GameObjects.Text; costText: Phaser.GameObjects.Text; buyBtn: Phaser.GameObjects.Rectangle }[] = [];

  constructor() {
    super({ key: 'AscensionScene' });
  }

  init(data: { profile: PlayerProfile }) {
    this.profile = data.profile;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Background
    this.add.rectangle(0, 0, w, h, UI_THEME.ascensionBg).setOrigin(0, 0);

    // Decorative lines
    const lines = this.add.graphics();
    lines.lineStyle(1, UI_THEME.ascensionPanel, 0.3);
    for (let y = 0; y < h; y += 30) {
      lines.lineBetween(0, y, w, y);
    }

    // Title
    this.add.text(w / 2, 36, 'ASCENSION', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#aa44ff',
      fontStyle: 'bold',
      stroke: '#330066',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);

    // Ascendium counter
    const ascBox = this.add.rectangle(w / 2, 66, 180, 22, UI_THEME.ascensionPanel);
    ascBox.setStrokeStyle(1, UI_THEME.ascensionButton);

    this.ascendiumText = this.add.text(w / 2, 66, `Ascendium: ${this.profile.totalAscendium}`, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#cc88ff',
    }).setOrigin(0.5, 0.5);

    // Ascension upgrades scrolling container
    const panelW = 280;
    const panelH = h - 130; // Leave space for headers and footer
    const initialPanelX = (w - panelW) / 2;
    const initialPanelY = 85;

    const scrollContainer = this.add.container(initialPanelX, initialPanelY);

    const maskShape = this.make.graphics({ x: 0, y: 0 }, false);
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(initialPanelX, initialPanelY, panelW, panelH);
    const scrollMask = maskShape.createGeometryMask();
    scrollContainer.setMask(scrollMask);

    // Upgrade list
    const upgrades = this.ascensionSystem.getUpgradeList(this.profile);
    const rowH = 38;
    let maxScroll = 0;

    this.rows = [];
    for (let i = 0; i < upgrades.length; i++) {
      const u = upgrades[i];
      const y = i * rowH;

      const rowContainer = this.add.container(0, 0);

      const rowBg = this.add.rectangle(panelW / 2, y + (rowH - 2) / 2, panelW - 10, rowH - 2, UI_THEME.ascensionPanelDark);
      rowBg.setStrokeStyle(1, UI_THEME.ascensionButtonAlt, 0.5);
      rowContainer.add(rowBg);

      const nameText = this.add.text(10, y + 4, u.name, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#ddddff',
      });
      rowContainer.add(nameText);

      const descText = this.add.text(10, y + 18, u.description, {
        fontSize: '9px',
        fontFamily: 'monospace',
        color: '#777799',
      });
      rowContainer.add(descText);

      const levelText = this.add.text(panelW - 65, y + 4, `Lv.${u.currentLevel}/${u.maxLevel}`, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#aaaacc',
      });
      rowContainer.add(levelText);

      const costStr = u.isMaxed ? 'MAX' : formatNumber(u.cost);
      const costText = this.add.text(panelW - 65, y + 18, costStr, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: u.canAfford ? '#cc88ff' : '#ff4444',
      });
      rowContainer.add(costText);

      const buyBtn = this.add.rectangle(panelW - 25, y + rowH / 2 - 1, 34, 22,
        u.canAfford && !u.isMaxed ? UI_THEME.ascensionAccent : UI_THEME.ascensionButtonAlt);
      buyBtn.setStrokeStyle(1, UI_THEME.ascensionButton);
      buyBtn.setInteractive({ useHandCursor: true });
      rowContainer.add(buyBtn);

      const buyBtnText = this.add.text(panelW - 25, y + rowH / 2 - 1, u.isMaxed ? '--' : 'BUY', {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
      rowContainer.add(buyBtnText);

      // Hit zone for the button
      buyBtn.on('pointerover', () => {
        if (!u.isMaxed && this.profile.totalAscendium >= u.cost) {
          buyBtn.setFillStyle(UI_THEME.ascensionAccentLight);
        }
      });
      buyBtn.on('pointerout', () => {
        const current = this.ascensionSystem.getUpgradeList(this.profile).find(up => up.id === u.id);
        buyBtn.setFillStyle(current?.canAfford && !current.isMaxed ? UI_THEME.ascensionAccent : UI_THEME.ascensionButtonAlt);
      });
      buyBtn.on('pointerdown', () => {
        if (this.ascensionSystem.purchaseUpgrade(u.id, this.profile)) {
          this.refreshRows();
        }
      });

      scrollContainer.add(rowContainer);
      this.rows.push({ id: u.id, levelText, costText, buyBtn });
    }

    const totalHeight = upgrades.length * rowH;
    maxScroll = Math.max(0, totalHeight - panelH);

    let scrollY = 0;
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      scrollY += deltaY * 0.5;
      scrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll);
      scrollContainer.y = initialPanelY - scrollY;
    });

    // Start Run button
    const startBtn = this.add.rectangle(w / 2, h - 25, 170, 30, UI_THEME.buttonSuccess);
    startBtn.setStrokeStyle(1, UI_THEME.buttonSuccessHover);
    startBtn.setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h - 25, 'START RUN', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    startBtn.on('pointerover', () => startBtn.setFillStyle(UI_THEME.buttonSuccessHover));
    startBtn.on('pointerout', () => startBtn.setFillStyle(UI_THEME.buttonSuccess));
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { profile: this.profile });
    });

    // Handle resize
    this.scale.on('resize', this.onResize, this);
  }

  private onResize() {
    this.scene.restart({ profile: this.profile });
  }

  shutdown() {
    this.scale.off('resize', this.onResize, this);
  }

  private refreshRows() {
    this.ascendiumText.setText(`Ascendium: ${this.profile.totalAscendium}`);
    const upgrades = this.ascensionSystem.getUpgradeList(this.profile);

    for (const row of this.rows) {
      const u = upgrades.find(up => up.id === row.id);
      if (!u) continue;
      row.levelText.setText(`Lv.${u.currentLevel}/${u.maxLevel}`);
      row.costText.setText(u.isMaxed ? 'MAX' : formatNumber(u.cost));
      row.costText.setColor(u.canAfford ? '#cc88ff' : '#ff4444');
      row.buyBtn.setFillStyle(u.canAfford && !u.isMaxed ? UI_THEME.ascensionAccent : UI_THEME.ascensionButtonAlt);
    }
  }
}
