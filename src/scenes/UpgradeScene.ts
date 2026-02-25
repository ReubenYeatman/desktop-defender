import Phaser from 'phaser';
import { EventBus } from '../managers/EventBus';
import { formatNumber } from '../utils/FormatUtils';
import { UI_THEME } from '../config/UITheme';

interface UpgradeRow {
  id: string;
  bg: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Image;
  titleText: Phaser.GameObjects.Text;
  descText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  hitZone: Phaser.GameObjects.Zone;
  progressBarFill: Phaser.GameObjects.Rectangle;
}

export class UpgradeScene extends Phaser.Scene {
  private panel!: Phaser.GameObjects.Rectangle;
  private scrollContainer!: Phaser.GameObjects.Container;
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;
  private rows: UpgradeRow[] = [];
  private onUpgradePurchased!: () => void;
  private onGoldChanged!: () => void;

  public static instance: UpgradeScene | null = null;

  private scrollY: number = 0;
  private maxScroll: number = 0;
  private panelH: number = 0;

  constructor() {
    super({ key: 'UpgradeScene' });
  }

  create() {
    if (UpgradeScene.instance) {
      UpgradeScene.instance.scene.stop();
    }
    UpgradeScene.instance = this;

    this.rows = [];

    const w = this.scale.width;
    const h = this.scale.height;

    // Semi-transparent backdrop
    const backdrop = this.add.rectangle(0, 0, w, h, 0x000000, 0.4);
    backdrop.setOrigin(0, 0);
    backdrop.setInteractive();
    backdrop.on('pointerdown', () => this.closeScene());

    // Panel fixed size fitting into 300x300
    const panelW = 280;
    this.panelH = 260;
    const initialPanelX = (w - panelW) / 2;
    const initialPanelY = (h - this.panelH) / 2;

    // Create a container for the entire panel so we can drag it
    const panelContainer = this.add.container(initialPanelX, initialPanelY);

    // Panel shadow
    const shadow = this.add.rectangle(3, 3, panelW, this.panelH, 0x000000, 0.4).setOrigin(0, 0);
    panelContainer.add(shadow);

    // Panel style (cyan glowing frame)
    this.panel = this.add.rectangle(0, 0, panelW, this.panelH, UI_THEME.panelBg, 0.9);
    this.panel.setOrigin(0, 0);
    this.panel.setStrokeStyle(3, UI_THEME.accent);
    this.panel.setInteractive({ draggable: true }); // Make the panel background draggable
    panelContainer.add(this.panel);

    // Title bar
    const titleBar = this.add.rectangle(0, 0, panelW, 40, UI_THEME.headerBg).setOrigin(0, 0);
    panelContainer.add(titleBar);

    const titleText = this.add.text(panelW / 2, 20, 'DESKTOP DEFENDER:\nSYSTEM UPGRADES', {
      fontSize: '14px',
      fontFamily: 'Impact, sans-serif',
      color: '#cceeff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5);
    panelContainer.add(titleText);

    // Close button
    const closeBtn = this.add.rectangle(panelW - 24, 8, 20, 20, UI_THEME.headerBg);
    closeBtn.setOrigin(0, 0);
    closeBtn.setInteractive({ useHandCursor: true });

    const closeText = this.add.text(panelW - 14, 18, 'X', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffaaaa',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    panelContainer.add([closeBtn, closeText]);

    closeBtn.on('pointerover', () => closeBtn.setFillStyle(UI_THEME.accentDark));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(UI_THEME.headerBg));
    closeBtn.on('pointerdown', () => this.closeScene());

    // --- SCROLLING SETUP ---
    // Instead of GeometryMask (which is buggy with dragging), we will put the rows in a container
    // and crop the container, or use a mask specifically tied to the panel Container
    this.scrollContainer = this.add.container(0, 40);
    panelContainer.add(this.scrollContainer);

    // Create a precise geometric mask for the scroll area
    const maskShape = this.make.graphics({ x: 0, y: 0 }, false);
    // Draw the mask rect relative to screen. We'll update it during drag.
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(initialPanelX, initialPanelY + 40, panelW, this.panelH - 70);
    const scrollMask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(scrollMask);

    // Build upgrade rows inside the container
    this.buildUpgradeRows(0, panelW);

    // Bottom Credits panel
    const bottomH = 30;
    const creditsBg = this.add.rectangle(0, this.panelH - bottomH, panelW, bottomH, UI_THEME.headerBg).setOrigin(0, 0);
    panelContainer.add(creditsBg);

    const gs = this.scene.get('GameScene') as any;
    const initialGold = gs?.economySystem ? gs.economySystem.getGold() : 0;

    const creditsTextStr = this.add.text(panelW / 2, this.panelH - bottomH / 2, `CREDITS: ${initialGold}`, {
      fontSize: '16px',
      fontFamily: 'Impact, sans-serif',
      color: '#66ccff'
    }).setOrigin(0.5, 0.5);
    panelContainer.add(creditsTextStr);

    // Scrolling Input
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      this.scrollY += deltaY * 0.5;
      this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
      this.scrollContainer.y = 40 - this.scrollY;
    });

    // Dragging Logic for the entire Panel
    this.input.setDraggable(this.panel);
    this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: any, dragX: number, dragY: number) => {
      if (gameObject === this.panel) {
        panelContainer.x = dragX;
        panelContainer.y = dragY;

        // Update mask position to follow the panel
        maskShape.clear();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(panelContainer.x, panelContainer.y + 40, panelW, this.panelH - 70);
      }
    });

    // Bind event handlers
    this.onUpgradePurchased = () => {
      if (this.scene.isActive()) {
        this.refreshRows();
        const gs = this.scene.get('GameScene') as any;
        if (gs && gs.economySystem) {
          creditsTextStr.setText(`CREDITS: ${gs.economySystem.getGold()}`);
        }
      }
    };
    this.onGoldChanged = () => {
      if (this.scene.isActive()) {
        this.refreshRows();
        const gs = this.scene.get('GameScene') as any;
        if (gs && gs.economySystem) {
          creditsTextStr.setText(`CREDITS: ${gs.economySystem.getGold()}`);
        }
      }
    };

    EventBus.on('upgrade-purchased', this.onUpgradePurchased);
    EventBus.on('gold-changed', this.onGoldChanged);

    this.events.once('shutdown', () => {
      EventBus.off('upgrade-purchased', this.onUpgradePurchased);
      EventBus.off('gold-changed', this.onGoldChanged);
    });
  }

  private closeScene() {
    UpgradeScene.instance = null;
    this.scene.stop();
  }

  private buildUpgradeRows(startY: number, panelW: number) {
    const gameScene = this.scene.get('GameScene') as any;
    if (!gameScene || !gameScene.upgradeSystem) return;

    const upgrades = gameScene.upgradeSystem.getUpgradeList();
    const rowH = 75;
    const padding = 10;
    const startX = 0; // Relative to scrollContainer

    // Add extra padding at bottom so scrolling shows bottom row clearly
    const bottomScrollBuffer = 10;

    for (let i = 0; i < upgrades.length; i++) {
      const u = upgrades[i];
      const y = startY + padding + i * (rowH + padding);

      const rowContainer = this.add.container(0, 0);

      // Semi-transparent gradient-like bg
      const bg = this.add.graphics();
      bg.fillStyle(UI_THEME.panelBgLight, 0.8);
      bg.fillRoundedRect(startX + 14, y, panelW - 28, rowH, 8);
      bg.lineStyle(2, UI_THEME.accent);
      bg.strokeRoundedRect(startX + 14, y, panelW - 28, rowH, 8);
      rowContainer.add(bg);

      // Icon Box
      const iconBg = this.add.rectangle(startX + 38, y + rowH / 2, 40, 40, UI_THEME.progressBg);
      iconBg.setStrokeStyle(2, UI_THEME.accent);
      rowContainer.add(iconBg);

      // Neon Vector Logos Drawn with Graphics instead of sprites
      const iconGfx = this.add.graphics();
      this.drawVectorIcon(iconGfx, u.id, startX + 38, y + rowH / 2);
      rowContainer.add(iconGfx);

      // Temporary stub for 'icon' in the returned UpgradeRow to match interface
      const icon = this.add.image(0, 0, '__DEFAULT').setVisible(false);

      // Title & Level text
      const titleText = this.add.text(startX + 70, y + 8, u.name.toUpperCase(), {
        fontSize: '14px',
        fontFamily: 'Impact, sans-serif',
        color: '#ffffff',
      });
      rowContainer.add(titleText);

      const levelText = this.add.text(startX + panelW - 24, y + 8, `${u.currentLevel}/${u.maxLevel}`, {
        fontSize: '12px',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        color: '#66ccff',
      }).setOrigin(1, 0);
      rowContainer.add(levelText);

      // Inline Progress bar background
      const progWidth = panelW - 100;
      const progBg = this.add.graphics();
      progBg.fillStyle(UI_THEME.panelBgDark, 1);
      progBg.fillRoundedRect(startX + 70, y + 26, progWidth, 6, 3);
      rowContainer.add(progBg);

      // Progress bar fill (cyan gradient equivalent)
      const fillRatio = u.maxLevel > 0 ? (u.currentLevel / u.maxLevel) : 1;
      const progressBarFill = this.add.rectangle(startX + 70, y + 26, progWidth * fillRatio, 6, UI_THEME.accent).setOrigin(0, 0);
      rowContainer.add(progressBarFill);

      // Small Desc
      const descText = this.add.text(startX + 70, y + 42, u.description, {
        fontSize: '10px',
        fontFamily: 'sans-serif',
        color: '#aaccff',
        wordWrap: { width: progWidth - 60 }
      });
      rowContainer.add(descText);

      // Right Side UPGRADE button pill
      const btnW = 55;
      const btnH = 26;
      const btnX = startX + panelW - btnW / 2 - 20;

      const costStr = u.isMaxed ? 'MAX LVL' : `UPGRADE\n(${formatNumber(u.cost)} CR)`;
      const canAffordColor = u.canAfford && !u.isMaxed ? UI_THEME.accent : UI_THEME.textDisabled;
      const textColor = u.canAfford && !u.isMaxed ? '#0a192f' : '#333333';

      const costPill = this.add.graphics();
      costPill.fillStyle(canAffordColor, 1);
      costPill.fillRoundedRect(btnX - btnW / 2, y + 40, btnW, btnH, 6);
      rowContainer.add(costPill);

      const costText = this.add.text(btnX, y + 40 + btnH / 2, costStr, {
        fontSize: '8px',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        align: 'center',
        color: textColor,
      }).setOrigin(0.5, 0.5);
      rowContainer.add(costText);

      // Hit Zone covering the whole row
      const hitZone = this.add.zone(startX + 14, y, panelW - 28, rowH).setOrigin(0, 0);
      hitZone.setInteractive({ useHandCursor: true });
      rowContainer.add(hitZone);

      const upgradeId = u.id;
      hitZone.on('pointerover', () => {
        if (u.canAfford && !u.isMaxed) {
          bg.clear();
          bg.fillStyle(UI_THEME.panelBgHover, 0.9); // Highlight
          bg.lineStyle(2, UI_THEME.textPrimary); // Bright border
          bg.fillRoundedRect(startX + 14, y, panelW - 28, rowH, 8);
          bg.strokeRoundedRect(startX + 14, y, panelW - 28, rowH, 8);
        }
      });

      hitZone.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(UI_THEME.panelBgLight, 0.8);
        bg.lineStyle(2, UI_THEME.accent);
        bg.fillRoundedRect(startX + 14, y, panelW - 28, rowH, 8);
        bg.strokeRoundedRect(startX + 14, y, panelW - 28, rowH, 8);
      });

      hitZone.on('pointerdown', () => {
        const gs = this.scene.get('GameScene') as any;
        if (gs?.upgradeSystem) {
          gs.upgradeSystem.purchase(upgradeId);
        }
      });

      this.scrollContainer.add(rowContainer);
      this.rows.push({ id: u.id, bg, icon, titleText, descText, levelText, costText, hitZone, progressBarFill });
    }

    // Calculate scroll bounds: we only scroll via the scrollContainer y offset now
    const totalHeight = upgrades.length * (rowH + padding) + padding + bottomScrollBuffer;
    // viewHeight = panelH - 70 (40px title bar + 30px credits bar)
    const viewHeight = this.panelH - 70;
    this.maxScroll = Math.max(0, totalHeight - viewHeight);
  }

  private drawVectorIcon(gfx: Phaser.GameObjects.Graphics, type: string, x: number, y: number) {
    gfx.lineStyle(2, UI_THEME.accent, 1);

    switch (type) {
      case 'damage':
        // Crosshair / bullet
        gfx.strokeCircle(x, y, 10);
        gfx.beginPath(); gfx.moveTo(x - 14, y); gfx.lineTo(x - 6, y); gfx.strokePath();
        gfx.beginPath(); gfx.moveTo(x + 6, y); gfx.lineTo(x + 14, y); gfx.strokePath();
        gfx.beginPath(); gfx.moveTo(x, y - 14); gfx.lineTo(x, y - 6); gfx.strokePath();
        gfx.beginPath(); gfx.moveTo(x, y + 6); gfx.lineTo(x, y + 14); gfx.strokePath();
        gfx.fillStyle(UI_THEME.accent, 1);
        gfx.fillCircle(x, y, 3);
        break;
      case 'firerate':
        // Lightning bolt / arrows
        gfx.beginPath();
        gfx.moveTo(x - 5, y - 10);
        gfx.lineTo(x + 5, y - 2);
        gfx.lineTo(x - 2, y + 2);
        gfx.lineTo(x + 5, y + 10);
        gfx.strokePath();
        break;
      case 'range':
        // Concentric radar arcs
        gfx.beginPath(); gfx.arc(x - 8, y + 8, 18, -Math.PI / 2, 0); gfx.strokePath();
        gfx.beginPath(); gfx.arc(x - 8, y + 8, 10, -Math.PI / 2, 0); gfx.strokePath();
        gfx.fillStyle(UI_THEME.accent, 1); gfx.fillCircle(x - 8, y + 8, 3);
        break;
      case 'knockback':
        // Waves / Force push
        gfx.beginPath(); gfx.moveTo(x - 10, y); gfx.lineTo(x - 2, y); gfx.strokePath();
        gfx.beginPath(); gfx.moveTo(x, y - 8); gfx.lineTo(x + 8, y - 12); gfx.strokePath();
        gfx.beginPath(); gfx.moveTo(x, y + 8); gfx.lineTo(x + 8, y + 12); gfx.strokePath();
        gfx.beginPath(); gfx.moveTo(x + 4, y - 4); gfx.lineTo(x + 12, y - 6); gfx.strokePath();
        gfx.beginPath(); gfx.moveTo(x + 4, y + 4); gfx.lineTo(x + 12, y + 6); gfx.strokePath();
        break;
      case 'max_health':
        // Shield
        gfx.beginPath();
        gfx.moveTo(x - 10, y - 8);
        gfx.lineTo(x + 10, y - 8);
        gfx.lineTo(x + 10, y + 2);
        gfx.lineTo(x, y + 12);
        gfx.lineTo(x - 10, y + 2);
        gfx.closePath();
        gfx.strokePath();
        break;
      case 'regen':
        // Plus sign with ascending particles
        gfx.beginPath(); gfx.moveTo(x - 6, y); gfx.lineTo(x + 6, y); gfx.strokePath();
        gfx.beginPath(); gfx.moveTo(x, y - 6); gfx.lineTo(x, y + 6); gfx.strokePath();
        gfx.fillStyle(UI_THEME.accent, 1);
        gfx.fillCircle(x + 8, y - 6, 2);
        gfx.fillCircle(x - 6, y - 10, 1.5);
        break;
      case 'gold_bonus':
        // Coin stack / Diamond
        gfx.strokeRect(x - 6, y - 6, 12, 12);
        gfx.beginPath(); gfx.moveTo(x - 4, y - 10); gfx.lineTo(x + 8, y - 10); gfx.lineTo(x + 10, y - 6); gfx.strokePath();
        gfx.fillStyle(UI_THEME.accent, 1); gfx.fillCircle(x, y, 3);
        break;
      case 'crit_chance':
        // Star / Spark
        gfx.beginPath();
        gfx.moveTo(x, y - 10); gfx.lineTo(x + 3, y - 3); gfx.lineTo(x + 10, y); gfx.lineTo(x + 3, y + 3);
        gfx.lineTo(x, y + 10); gfx.lineTo(x - 3, y + 3); gfx.lineTo(x - 10, y); gfx.lineTo(x - 3, y - 3);
        gfx.closePath();
        gfx.strokePath();
        break;
      default:
        // Default box
        gfx.strokeRect(x - 8, y - 8, 16, 16);
        break;
    }
  }

  private refreshRows() {
    const gameScene = this.scene.get('GameScene') as any;
    if (!gameScene?.upgradeSystem) return;

    const upgrades = gameScene.upgradeSystem.getUpgradeList();

    const panelW = 280;

    for (const row of this.rows) {
      const u = upgrades.find((up: any) => up.id === row.id);
      if (!u) continue;

      row.levelText.setText(`${u.currentLevel}/${u.maxLevel}`);

      const fillRatio = u.maxLevel > 0 ? (u.currentLevel / u.maxLevel) : 1;
      const progWidth = panelW - 100;
      row.progressBarFill.setSize(progWidth * fillRatio, 6);

      const costStr = u.isMaxed ? 'MAX LVL' : `UPGRADE\n(${formatNumber(u.cost)} CR)`;
      const canAffordColor = u.canAfford && !u.isMaxed ? UI_THEME.accent : UI_THEME.textDisabled;
      const textColor = u.canAfford && !u.isMaxed ? '#0a192f' : '#333333';

      row.costText.setText(costStr);
      row.costText.setColor(textColor);

      // Update Cost Pill Button graphics
      const container = row.bg.parentContainer;
      if (container) {
        const btnW = 55;
        const btnH = 26;
        const btnX = 0 + panelW - btnW / 2 - 20;
        const padding = 10;
        const rowH = 75;
        const i = this.rows.findIndex(r => r.id === row.id);
        const y = 0 + padding + i * (rowH + padding);

        const costPill = container.list.find(obj => obj instanceof Phaser.GameObjects.Graphics && obj !== row.bg) as Phaser.GameObjects.Graphics;
        if (costPill) {
          costPill.clear();
          costPill.fillStyle(canAffordColor, 1);
          costPill.fillRoundedRect(btnX - btnW / 2, y + 40, btnW, btnH, 6);
        }
      }
    }
  }
}
