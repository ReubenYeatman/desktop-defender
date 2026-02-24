import Phaser from 'phaser';
import { EventBus } from '../managers/EventBus';
import { formatNumber } from '../utils/FormatUtils';
import {
  COLOR_HP_BAR, COLOR_HP_BAR_BG, COLOR_XP_BAR, COLOR_XP_BAR_BG,
  COLOR_LEVEL_BAR, COLOR_LEVEL_BAR_BG, COLOR_BOSS_HP_BAR, COLOR_BOSS_HP_BAR_BG,
} from '../config/Constants';

export class HUDScene extends Phaser.Scene {
  // HP bar
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;

  // XP bar
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private levelText!: Phaser.GameObjects.Text;

  // Level progress bar
  private levelProgressBg!: Phaser.GameObjects.Rectangle;
  private levelProgressFill!: Phaser.GameObjects.Rectangle;
  private levelPercentText!: Phaser.GameObjects.Text;

  // Wave display
  private waveText!: Phaser.GameObjects.Text;

  // Wave announcement
  private waveAnnounceText!: Phaser.GameObjects.Text;

  // Gold display
  private goldText!: Phaser.GameObjects.Text;

  // Boss HP bar
  private bossHPBarBg!: Phaser.GameObjects.Rectangle;
  private bossHPBarFill!: Phaser.GameObjects.Rectangle;
  private bossHPText!: Phaser.GameObjects.Text;
  private bossHPContainer!: Phaser.GameObjects.Container;

  // State
  private currentHP: number = 100;
  private maxHP: number = 100;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Wave text (top-left, below drag bar) — enhanced with stroke
    this.waveText = this.add.text(10, 32, 'Wave 1', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
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

    // Level progress bar (below XP bar)
    const levelBarY = xpY + 10;
    this.levelProgressBg = this.add.rectangle(barX, levelBarY, barWidth, 4, COLOR_LEVEL_BAR_BG);
    this.levelProgressBg.setOrigin(0, 0);
    this.levelProgressFill = this.add.rectangle(barX, levelBarY, barWidth, 4, COLOR_LEVEL_BAR);
    this.levelProgressFill.setOrigin(0, 0);
    this.levelProgressFill.setScale(0, 1);

    this.levelPercentText = this.add.text(barX + barWidth + 6, levelBarY - 3, '0%', {
      fontSize: '9px',
      fontFamily: 'monospace',
      color: '#8866ff',
    });

    // Wave announcement text (centered, hidden by default)
    this.waveAnnounceText = this.add.text(w / 2, h / 2, '', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    });
    this.waveAnnounceText.setOrigin(0.5, 0.5);
    this.waveAnnounceText.setAlpha(0);
    this.waveAnnounceText.setDepth(200);

    // Gold (bottom-left)
    this.goldText = this.add.text(10, h - 24, 'Gold: 0', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#ffd700',
    });

    // Upgrade button (bottom-right)
    const btnX = w - 80;
    const btnY = h - 28;
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

    // Boss HP bar (bottom center, hidden by default)
    const bossBarWidth = 160;
    const bossBarX = w / 2 - bossBarWidth / 2;

    this.bossHPBarBg = this.add.rectangle(0, 0, bossBarWidth, 8, COLOR_BOSS_HP_BAR_BG);
    this.bossHPBarBg.setOrigin(0, 0);
    this.bossHPBarFill = this.add.rectangle(0, 0, bossBarWidth, 8, COLOR_BOSS_HP_BAR);
    this.bossHPBarFill.setOrigin(0, 0);
    this.bossHPText = this.add.text(bossBarWidth / 2, -12, 'BOSS', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.bossHPText.setOrigin(0.5, 0.5);

    this.bossHPContainer = this.add.container(bossBarX, h - 50, [
      this.bossHPBarBg,
      this.bossHPBarFill,
      this.bossHPText,
    ]);
    this.bossHPContainer.setVisible(false);

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
      // Level progress percentage
      this.levelProgressFill.setScale(ratio, 1);
      this.levelPercentText.setText(`${Math.floor(ratio * 100)}%`);
    };

    const onLevelUp = (data: { level: number }) => {
      if (!this.scene.isActive()) return;
      this.levelText.setText(`Lv.${data.level}`);
      this.levelText.setColor('#ffff00');

      // Scale punch on level text
      this.tweens.add({
        targets: this.levelText,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 200,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          if (this.scene.isActive()) {
            this.levelText.setColor('#4488ff');
            this.levelText.setScale(1);
          }
        },
      });

      // XP bar scale punch
      this.tweens.add({
        targets: this.xpBarFill,
        scaleY: 2.0,
        duration: 150,
        yoyo: true,
        ease: 'Bounce',
        onComplete: () => {
          if (this.scene.isActive()) {
            this.xpBarFill.setScale(0, 1);
          }
        },
      });

      // "LEVEL X!" announcement
      const levelUpText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 40,
        `LEVEL ${data.level}!`,
        {
          fontSize: '24px',
          fontFamily: 'monospace',
          color: '#44ddff',
          stroke: '#000000',
          strokeThickness: 3,
        }
      );
      levelUpText.setOrigin(0.5, 0.5);
      levelUpText.setDepth(201);

      this.tweens.add({
        targets: levelUpText,
        y: levelUpText.y - 30,
        alpha: 0,
        scale: 1.3,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => levelUpText.destroy(),
      });
    };

    const onWaveStarted = (data: { wave: number; isBossWave: boolean }) => {
      if (!this.scene.isActive()) return;

      // Update persistent wave label
      const label = data.isBossWave ? `BOSS Wave ${data.wave}` : `Wave ${data.wave}`;
      this.waveText.setText(label);
      this.waveText.setColor(data.isBossWave ? '#ff4444' : '#ffffff');

      // Big centered announcement
      const announceText = data.isBossWave
        ? `-- BOSS --\nWave ${data.wave}`
        : `Wave ${data.wave}`;
      const announceColor = data.isBossWave ? '#ff4444' : '#ffffff';

      this.waveAnnounceText.setText(announceText);
      this.waveAnnounceText.setColor(announceColor);
      this.waveAnnounceText.setAlpha(0);
      this.waveAnnounceText.setScale(0.5);

      this.tweens.add({
        targets: this.waveAnnounceText,
        alpha: 1,
        scale: 1,
        duration: 300,
        ease: 'Back.easeOut',
        hold: 800,
        yoyo: true,
        onComplete: () => {
          if (this.scene.isActive()) {
            this.waveAnnounceText.setAlpha(0);
          }
        },
      });
    };

    const onBossSpawned = () => {
      if (!this.scene.isActive()) return;
      this.bossHPContainer.setVisible(true);
      this.bossHPBarFill.setScale(1, 1);
    };

    const onBossDamaged = (data: { current: number; max: number }) => {
      if (!this.scene.isActive()) return;
      const ratio = Math.max(0, data.current / data.max);
      this.bossHPBarFill.setScale(ratio, 1);
    };

    const onBossKilled = () => {
      if (!this.scene.isActive()) return;
      this.bossHPContainer.setVisible(false);
    };

    EventBus.on('turret-damaged', onTurretDamaged);
    EventBus.on('gold-changed', onGoldChanged);
    EventBus.on('xp-changed', onXPChanged);
    EventBus.on('level-up', onLevelUp);
    EventBus.on('wave-started', onWaveStarted);
    EventBus.on('boss-spawned', onBossSpawned);
    EventBus.on('boss-damaged', onBossDamaged);
    EventBus.on('boss-killed', onBossKilled);

    this.events.once('shutdown', () => {
      EventBus.off('turret-damaged', onTurretDamaged);
      EventBus.off('gold-changed', onGoldChanged);
      EventBus.off('xp-changed', onXPChanged);
      EventBus.off('level-up', onLevelUp);
      EventBus.off('wave-started', onWaveStarted);
      EventBus.off('boss-spawned', onBossSpawned);
      EventBus.off('boss-damaged', onBossDamaged);
      EventBus.off('boss-killed', onBossKilled);
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
    // Reposition boss HP bar on resize
    const bossBarWidth = 160;
    this.bossHPContainer.setPosition(
      gameSize.width / 2 - bossBarWidth / 2,
      gameSize.height - 50
    );
    // Reposition wave announcement
    this.waveAnnounceText.setPosition(gameSize.width / 2, gameSize.height / 2);
  }
}
