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
    const backdrop = this.add.rectangle(0, 0, w, h, 0x000000, 0.6);
    backdrop.setOrigin(0, 0);
    backdrop.setInteractive();
    backdrop.on('pointerdown', () => this.closeScene());

    // Panel
    const panelW = Math.min(w - 30, 330);
    const panelH = Math.min(h - 50, 410);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    // Panel shadow
    this.add.rectangle(panelX + 3, panelY + 3, panelW, panelH, 0x000000, 0.4).setOrigin(0, 0);

    // Panel body
    this.panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0x1a1a3e);
    this.panel.setOrigin(0, 0);
    this.panel.setStrokeStyle(2, 0x4466aa);
    this.panel.setInteractive();

    // Title bar
    this.add.rectangle(panelX, panelY, panelW, 28, 0x2a2a5e).setOrigin(0, 0);
    this.add.text(panelX + 12, panelY + 6, 'UPGRADES', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaccff',
      fontStyle: 'bold',
    });

    // Close button
    const closeBtn = this.add.rectangle(panelX + panelW - 24, panelY + 5, 18, 18, 0x553344);
    closeBtn.setOrigin(0, 0);
    closeBtn.setStrokeStyle(1, 0x884466);
    closeBtn.setInteractive({ useHandCursor: true });
    this.add.text(panelX + panelW - 19, panelY + 6, 'X', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#ff6666',
      fontStyle: 'bold',
    });
    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x774455));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x553344));
    closeBtn.on('pointerdown', () => this.closeScene());

    // Build upgrade rows
    this.buildUpgradeRows(panelX, panelY + 32, panelW);

    // Bind event handlers
    this.onUpgradePurchased = () => {
      if (this.scene.isActive()) this.refreshRows();
    };
    this.onGoldChanged = () => {
      if (this.scene.isActive()) this.refreshRows();
    };

    EventBus.on('upgrade-purchased', this.onUpgradePurchased);
    EventBus.on('gold-changed', this.onGoldChanged);

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

      const bg = this.add.rectangle(startX + 4, y, panelW - 8, rowH - 2, 0x252550);
      bg.setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x333366, 0.5);

      const nameText = this.add.text(startX + 10, y + 4, u.name, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ddddff',
      });

      const levelText = this.add.text(startX + 10, y + 20, `Lv.${u.currentLevel}/${u.maxLevel} - ${u.description}`, {
        fontSize: '9px',
        fontFamily: 'monospace',
        color: '#8888aa',
      });

      const costStr = u.isMaxed ? 'MAX' : formatNumber(u.cost);
      const costText = this.add.text(startX + panelW - 100, y + 4, costStr, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: u.canAfford ? '#ffd700' : '#ff4444',
        fontStyle: 'bold',
      });

      const btnColor = u.canAfford && !u.isMaxed ? 0x447744 : 0x333344;
      const buyBtn = this.add.rectangle(startX + panelW - 46, y + 22, 38, 18, btnColor);
      buyBtn.setStrokeStyle(1, 0x558855);
      buyBtn.setInteractive({ useHandCursor: true });

      const buyBtnText = this.add.text(startX + panelW - 46, y + 22, u.isMaxed ? '--' : 'BUY', {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);

      const upgradeId = u.id;
      buyBtn.on('pointerover', () => {
        if (u.canAfford && !u.isMaxed) buyBtn.setFillStyle(0x558855);
      });
      buyBtn.on('pointerout', () => {
        const current = gameScene.upgradeSystem.getUpgradeList().find((up: any) => up.id === upgradeId);
        buyBtn.setFillStyle(current?.canAfford && !current.isMaxed ? 0x447744 : 0x333344);
      });
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
      row.buyBtn.setFillStyle(u.canAfford && !u.isMaxed ? 0x447744 : 0x333344);
      row.buyBtnText.setText(u.isMaxed ? '--' : 'BUY');
    }
  }
}
