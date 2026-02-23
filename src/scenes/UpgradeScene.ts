import Phaser from 'phaser';
import { EventBus } from '../managers/EventBus';
import { formatNumber } from '../utils/FormatUtils';

interface UpgradeRow {
  id: string;
  bg: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  buyBtn: Phaser.GameObjects.Rectangle;
  buyBtnText: Phaser.GameObjects.Text;
}

export class UpgradeScene extends Phaser.Scene {
  private panel!: Phaser.GameObjects.Rectangle;
  private rows: UpgradeRow[] = [];
  private onUpgradePurchased!: () => void;
  private onGoldChanged!: () => void;

  constructor() {
    super({ key: 'UpgradeScene' });
  }

  create() {
    this.rows = [];

    const w = this.scale.width;
    const h = this.scale.height;

    // Semi-transparent backdrop
    const backdrop = this.add.rectangle(0, 0, w, h, 0x000000, 0.5);
    backdrop.setOrigin(0, 0);
    backdrop.setInteractive();

    // Click backdrop to close
    backdrop.on('pointerdown', () => {
      this.closeScene();
    });

    // Panel
    const panelW = Math.min(w - 40, 320);
    const panelH = Math.min(h - 60, 400);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    this.panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0x222244);
    this.panel.setOrigin(0, 0);
    this.panel.setStrokeStyle(2, 0x4466aa);
    this.panel.setInteractive(); // prevent backdrop click from closing when clicking panel

    // Title
    this.add.text(panelX + 10, panelY + 8, 'UPGRADES', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // Close button
    const closeBtn = this.add.rectangle(panelX + panelW - 24, panelY + 8, 18, 18, 0x664444);
    closeBtn.setOrigin(0, 0);
    closeBtn.setInteractive({ useHandCursor: true });
    this.add.text(panelX + panelW - 20, panelY + 8, 'X', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ff4444',
    });
    closeBtn.on('pointerdown', () => {
      this.closeScene();
    });

    // Build upgrade rows
    this.buildUpgradeRows(panelX, panelY + 32, panelW);

    // Bind event handlers (save references so we can remove them)
    this.onUpgradePurchased = () => {
      if (this.scene.isActive()) this.refreshRows();
    };
    this.onGoldChanged = () => {
      if (this.scene.isActive()) this.refreshRows();
    };

    EventBus.on('upgrade-purchased', this.onUpgradePurchased);
    EventBus.on('gold-changed', this.onGoldChanged);

    // Clean up listeners when scene shuts down
    this.events.once('shutdown', () => {
      EventBus.off('upgrade-purchased', this.onUpgradePurchased);
      EventBus.off('gold-changed', this.onGoldChanged);
    });
  }

  private closeScene() {
    this.scene.stop();
  }

  private buildUpgradeRows(startX: number, startY: number, panelW: number) {
    const gameScene = this.scene.get('GameScene') as any;
    if (!gameScene || !gameScene.upgradeSystem) return;

    const upgrades = gameScene.upgradeSystem.getUpgradeList();
    const rowH = 42;

    for (let i = 0; i < upgrades.length; i++) {
      const u = upgrades[i];
      const y = startY + i * rowH;

      const bg = this.add.rectangle(startX + 4, y, panelW - 8, rowH - 2, 0x333355);
      bg.setOrigin(0, 0);

      const nameText = this.add.text(startX + 10, y + 4, u.name, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ffffff',
      });

      const levelText = this.add.text(startX + 10, y + 20, `Lv.${u.currentLevel}/${u.maxLevel} - ${u.description}`, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#aaaaaa',
      });

      const costStr = u.isMaxed ? 'MAX' : formatNumber(u.cost);
      const costText = this.add.text(startX + panelW - 100, y + 4, costStr, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: u.canAfford ? '#ffd700' : '#ff4444',
      });

      const buyBtn = this.add.rectangle(startX + panelW - 50, y + 20, 36, 16, u.canAfford && !u.isMaxed ? 0x447744 : 0x444444);
      buyBtn.setOrigin(0, 0);
      buyBtn.setInteractive({ useHandCursor: true });

      const buyBtnText = this.add.text(startX + panelW - 44, y + 21, u.isMaxed ? '--' : 'BUY', {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#ffffff',
      });

      const upgradeId = u.id;
      buyBtn.on('pointerdown', () => {
        const gs = this.scene.get('GameScene') as any;
        if (gs?.upgradeSystem) {
          gs.upgradeSystem.purchase(upgradeId);
        }
      });

      this.rows.push({ id: u.id, bg, nameText, levelText, costText, buyBtn, buyBtnText });
    }
  }

  private refreshRows() {
    const gameScene = this.scene.get('GameScene') as any;
    if (!gameScene?.upgradeSystem) return;

    const upgrades = gameScene.upgradeSystem.getUpgradeList();

    for (const row of this.rows) {
      const u = upgrades.find((up: any) => up.id === row.id);
      if (!u) continue;

      row.levelText.setText(`Lv.${u.currentLevel}/${u.maxLevel} - ${u.description}`);
      const costStr = u.isMaxed ? 'MAX' : formatNumber(u.cost);
      row.costText.setText(costStr);
      row.costText.setColor(u.canAfford ? '#ffd700' : '#ff4444');
      row.buyBtn.setFillStyle(u.canAfford && !u.isMaxed ? 0x447744 : 0x444444);
      row.buyBtnText.setText(u.isMaxed ? '--' : 'BUY');
    }
  }
}
