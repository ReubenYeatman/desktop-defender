import Phaser from 'phaser';
import { EventBus } from '../managers/EventBus';
import { formatNumber } from '../utils/FormatUtils';
import { COLOR_HP_BAR, COLOR_HP_BAR_BG, COLOR_XP_BAR, COLOR_XP_BAR_BG } from '../config/Constants';

export class HUDScene extends Phaser.Scene {
  // HP bar
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;

  // XP bar
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private levelText!: Phaser.GameObjects.Text;

  // Wave display
  private waveText!: Phaser.GameObjects.Text;

  // Gold display
  private goldText!: Phaser.GameObjects.Text;

  // State
  private currentHP: number = 100;
  private maxHP: number = 100;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create() {
    const w = this.scale.width;

    // Wave text (top-left, below drag bar)
    this.waveText = this.add.text(10, 32, 'Wave 1', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
    });

    // HP bar (top center)
    const barWidth = 120;
    const barHeight = 10;
    const barX = w / 2 - barWidth / 2;
    const barY = 34;

    this.hpBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, COLOR_HP_BAR_BG);
    this.hpBarBg.setOrigin(0, 0);
    this.hpBarFill = this.add.rectangle(barX, barY, barWidth, barHeight, COLOR_HP_BAR);
    this.hpBarFill.setOrigin(0, 0);

    this.hpText = this.add.text(barX + barWidth + 6, barY - 2, '100/100', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#44ff44',
    });

    // XP bar (below HP bar)
    const xpY = barY + barHeight + 4;
    this.xpBarBg = this.add.rectangle(barX, xpY, barWidth, 6, COLOR_XP_BAR_BG);
    this.xpBarBg.setOrigin(0, 0);
    this.xpBarFill = this.add.rectangle(barX, xpY, barWidth, 6, COLOR_XP_BAR);
    this.xpBarFill.setOrigin(0, 0);
    this.xpBarFill.setScale(0, 1);

    this.levelText = this.add.text(barX + barWidth + 6, xpY - 2, 'Lv.1', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#4488ff',
    });

    // Gold (bottom-left)
    this.goldText = this.add.text(10, this.scale.height - 24, 'Gold: 0', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#ffd700',
    });

    // Upgrade button (bottom-right)
    const btnX = this.scale.width - 80;
    const btnY = this.scale.height - 28;
    const upgradeBtn = this.add.rectangle(btnX, btnY, 70, 22, 0x335577);
    upgradeBtn.setOrigin(0, 0);
    upgradeBtn.setInteractive({ useHandCursor: true });
    this.add.text(btnX + 8, btnY + 3, 'Upgrades', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
    });

    upgradeBtn.on('pointerdown', () => {
      if (this.scene.isActive('UpgradeScene')) {
        this.scene.stop('UpgradeScene');
      } else {
        this.scene.launch('UpgradeScene');
      }
    });

    // Listen for events (guard with scene.isActive check)
    const onTurretDamaged = (data: { current: number; max: number }) => {
      if (!this.scene.isActive()) return;
      this.currentHP = data.current;
      this.maxHP = data.max;
      this.updateHPBar();
    };

    const onGoldChanged = (gold: number) => {
      if (!this.scene.isActive()) return;
      this.goldText.setText(`Gold: ${formatNumber(gold)}`);
    };

    const onXPChanged = (data: { current: number; required: number; level: number }) => {
      if (!this.scene.isActive()) return;
      const ratio = data.current / data.required;
      this.xpBarFill.setScale(ratio, 1);
      this.levelText.setText(`Lv.${data.level}`);
    };

    const onLevelUp = (data: { level: number }) => {
      if (!this.scene.isActive()) return;
      this.levelText.setText(`Lv.${data.level}`);
      this.levelText.setColor('#ffff00');
      this.time.delayedCall(500, () => {
        if (this.scene.isActive()) this.levelText.setColor('#4488ff');
      });
    };

    const onWaveStarted = (data: { wave: number; isBossWave: boolean }) => {
      if (!this.scene.isActive()) return;
      const label = data.isBossWave ? `BOSS Wave ${data.wave}` : `Wave ${data.wave}`;
      this.waveText.setText(label);
      this.waveText.setColor(data.isBossWave ? '#ff4444' : '#ffffff');
    };

    EventBus.on('turret-damaged', onTurretDamaged);
    EventBus.on('gold-changed', onGoldChanged);
    EventBus.on('xp-changed', onXPChanged);
    EventBus.on('level-up', onLevelUp);
    EventBus.on('wave-started', onWaveStarted);

    this.events.once('shutdown', () => {
      EventBus.off('turret-damaged', onTurretDamaged);
      EventBus.off('gold-changed', onGoldChanged);
      EventBus.off('xp-changed', onXPChanged);
      EventBus.off('level-up', onLevelUp);
      EventBus.off('wave-started', onWaveStarted);
    });

    this.scale.on('resize', this.onResize, this);
  }

  private updateHPBar() {
    const ratio = Math.max(0, this.currentHP / this.maxHP);
    this.hpBarFill.setScale(ratio, 1);
    this.hpText.setText(`${Math.floor(this.currentHP)}/${Math.floor(this.maxHP)}`);

    if (ratio > 0.5) {
      this.hpBarFill.setFillStyle(0x44ff44);
    } else if (ratio > 0.25) {
      this.hpBarFill.setFillStyle(0xffaa00);
    } else {
      this.hpBarFill.setFillStyle(0xff4444);
    }
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    this.goldText.setY(gameSize.height - 24);
  }
}
