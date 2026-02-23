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

    this.add.rectangle(0, 0, w, h, 0x110022).setOrigin(0, 0);

    this.add.text(w / 2, 36, 'ASCENSION', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#aa44ff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.ascendiumText = this.add.text(w / 2, 62, `Ascendium: ${this.profile.totalAscendium}`, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#cc88ff',
    }).setOrigin(0.5, 0);

    // Upgrade list
    const upgrades = this.ascensionSystem.getUpgradeList(this.profile);
    const startY = 90;
    const rowH = 38;

    this.rows = [];
    for (let i = 0; i < upgrades.length; i++) {
      const u = upgrades[i];
      const y = startY + i * rowH;

      this.add.rectangle(10, y, w - 20, rowH - 2, 0x222244).setOrigin(0, 0);

      this.add.text(16, y + 4, u.name, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#ffffff',
      });

      this.add.text(16, y + 18, u.description, {
        fontSize: '9px',
        fontFamily: 'monospace',
        color: '#888888',
      });

      const levelText = this.add.text(w - 110, y + 4, `Lv.${u.currentLevel}/${u.maxLevel}`, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#aaaaaa',
      });

      const costStr = u.isMaxed ? 'MAX' : formatNumber(u.cost);
      const costText = this.add.text(w - 110, y + 18, costStr, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: u.canAfford ? '#cc88ff' : '#ff4444',
      });

      const buyBtn = this.add.rectangle(w - 40, y + 10, 30, 20, u.canAfford && !u.isMaxed ? 0x6633aa : 0x333333);
      buyBtn.setInteractive({ useHandCursor: true });
      this.add.text(w - 50, y + 6, u.isMaxed ? '--' : 'BUY', {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#ffffff',
      });

      buyBtn.on('pointerdown', () => {
        if (this.ascensionSystem.purchaseUpgrade(u.id, this.profile)) {
          this.refreshRows();
        }
      });

      this.rows.push({ id: u.id, levelText, costText, buyBtn });
    }

    // Start Run button
    const startBtn = this.add.rectangle(w / 2, h - 40, 160, 36, 0x447744);
    startBtn.setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h - 40, 'START RUN', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

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
      row.buyBtn.setFillStyle(u.canAfford && !u.isMaxed ? 0x6633aa : 0x333333);
    }
  }
}
