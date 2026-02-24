import Phaser from 'phaser';
import { AscensionSystem } from '../systems/AscensionSystem';
import { formatNumber } from '../utils/FormatUtils';
import type { PlayerProfile } from '../models/GameState';

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
    this.add.rectangle(0, 0, w, h, 0x0a0022).setOrigin(0, 0);

    // Decorative lines
    const lines = this.add.graphics();
    lines.lineStyle(1, 0x221144, 0.3);
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
    const ascBox = this.add.rectangle(w / 2, 66, 180, 22, 0x221144);
    ascBox.setStrokeStyle(1, 0x553388);

    this.ascendiumText = this.add.text(w / 2, 66, `Ascendium: ${this.profile.totalAscendium}`, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#cc88ff',
    }).setOrigin(0.5, 0.5);

    // Upgrade list
    const upgrades = this.ascensionSystem.getUpgradeList(this.profile);
    const startY = 86;
    const rowH = 38;

    this.rows = [];
    for (let i = 0; i < upgrades.length; i++) {
      const u = upgrades[i];
      const y = startY + i * rowH;

      const rowBg = this.add.rectangle(w / 2, y + (rowH - 2) / 2, w - 20, rowH - 2, 0x1a1144);
      rowBg.setStrokeStyle(1, 0x332266, 0.5);

      this.add.text(16, y + 4, u.name, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#ddddff',
      });

      this.add.text(16, y + 18, u.description, {
        fontSize: '9px',
        fontFamily: 'monospace',
        color: '#777799',
      });

      const levelText = this.add.text(w - 110, y + 4, `Lv.${u.currentLevel}/${u.maxLevel}`, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#aaaacc',
      });

      const costStr = u.isMaxed ? 'MAX' : formatNumber(u.cost);
      const costText = this.add.text(w - 110, y + 18, costStr, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: u.canAfford ? '#cc88ff' : '#ff4444',
      });

      const buyBtn = this.add.rectangle(w - 40, y + rowH / 2 - 1, 34, 22,
        u.canAfford && !u.isMaxed ? 0x6633aa : 0x222233);
      buyBtn.setStrokeStyle(1, 0x553388);
      buyBtn.setInteractive({ useHandCursor: true });

      this.add.text(w - 40, y + rowH / 2 - 1, u.isMaxed ? '--' : 'BUY', {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);

      buyBtn.on('pointerover', () => {
        if (!u.isMaxed && this.profile.totalAscendium >= u.cost) {
          buyBtn.setFillStyle(0x7744bb);
        }
      });
      buyBtn.on('pointerout', () => {
        const current = this.ascensionSystem.getUpgradeList(this.profile).find(up => up.id === u.id);
        buyBtn.setFillStyle(current?.canAfford && !current.isMaxed ? 0x6633aa : 0x222233);
      });
      buyBtn.on('pointerdown', () => {
        if (this.ascensionSystem.purchaseUpgrade(u.id, this.profile)) {
          this.refreshRows();
        }
      });

      this.rows.push({ id: u.id, levelText, costText, buyBtn });
    }

    // Start Run button
    const startBtn = this.add.rectangle(w / 2, h - 40, 170, 38, 0x447744);
    startBtn.setStrokeStyle(1, 0x558855);
    startBtn.setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h - 40, 'START RUN', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x558855));
    startBtn.on('pointerout', () => startBtn.setFillStyle(0x447744));
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { profile: this.profile });
    });
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
      row.buyBtn.setFillStyle(u.canAfford && !u.isMaxed ? 0x6633aa : 0x222233);
    }
  }
}
