import Phaser from 'phaser';
import { EventBus } from '../managers/EventBus';
import { formatNumber } from '../utils/FormatUtils';
import {
  COLOR_HP_BAR, COLOR_HP_BAR_BG, COLOR_XP_BAR, COLOR_XP_BAR_BG,
  COLOR_LEVEL_BAR, COLOR_LEVEL_BAR_BG, COLOR_BOSS_HP_BAR, COLOR_BOSS_HP_BAR_BG,
} from '../config/Constants';
import { UI_THEME } from '../config/UITheme';
import { TIMING } from '../config/TimingData';

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

  // System Notification (Wave Transition) - Removed in favor of Splash

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

    // Wave text (top-left) — bold and chunky
    this.waveText = this.add.text(14, 14, 'WAVE 1', {
      fontSize: '24px',
      fontFamily: 'Impact, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });

    // Right-aligned top HUD group (HP and Gold)
    // Gold Text
    this.goldText = this.add.text(w - 14, 14, '$0', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#44ff44', // Green gold text
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.goldText.setOrigin(1, 0); // Right-aligned

    // HP Bar Setup (top-right, below gold or directly left)
    const barWidth = 140;
    const barHeight = 12;
    // Positioned below the gold text, right aligned
    const barX = w - barWidth - 14;
    const barY = 40;

    this.hpBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, COLOR_HP_BAR_BG);
    this.hpBarBg.setOrigin(0, 0);
    this.hpBarFill = this.add.rectangle(barX, barY, barWidth, barHeight, UI_THEME.textDanger); // Red HP
    this.hpBarFill.setOrigin(0, 0);

    // HP Text is placed inside the bar, centered
    this.hpText = this.add.text(barX + barWidth / 2, barY + barHeight / 2 - 1, '100 / 100', {
      fontSize: '12px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.hpText.setOrigin(0.5, 0.5);

    // Bottom HUD area (Level / XP)
    const bottomBarWidth = w - 100;
    const bottomBarY = h - 20;
    const bottomBarX = 14;

    this.levelText = this.add.text(bottomBarX, bottomBarY - 22, 'Lv. 1', {
      fontSize: '18px',
      fontFamily: 'Impact, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });

    this.levelPercentText = this.add.text(bottomBarX + bottomBarWidth + 4, bottomBarY - 20, '[0%] 0 / 100', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.levelPercentText.setOrigin(1, 0); // Right-aligned to bar edge

    // XP Bar (yellow)
    this.xpBarBg = this.add.rectangle(bottomBarX, bottomBarY, bottomBarWidth, 8, COLOR_XP_BAR_BG);
    this.xpBarBg.setOrigin(0, 0);
    this.xpBarFill = this.add.rectangle(bottomBarX, bottomBarY, bottomBarWidth, 8, UI_THEME.textGold); // Yellow XP
    this.xpBarFill.setOrigin(0, 0);
    this.xpBarFill.setScale(0, 1);

    // Upgrade button (bottom-right, orange rounded button)
    const btnSize = 42;
    const btnX = w - btnSize - 14;
    const btnY = h - btnSize - 14;

    const upgradeBg = this.add.graphics();
    upgradeBg.fillStyle(UI_THEME.buttonUpgrade, 1);
    upgradeBg.fillRoundedRect(btnX, btnY, btnSize, btnSize, 10);
    upgradeBg.lineStyle(2, UI_THEME.buttonUpgradePressed);
    upgradeBg.strokeRoundedRect(btnX, btnY, btnSize, btnSize, 10);

    // Thick white chevron pointing down/up
    const upgradeChevron = this.add.text(btnX + btnSize / 2, btnY + btnSize / 2 - 2, 'v', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);
    // Flatten it to look more like a wide chevron
    upgradeChevron.scaleY = 0.6;
    upgradeChevron.scaleX = 1.4;

    const upgradeBtn = this.add.zone(btnX, btnY, btnSize, btnSize).setOrigin(0, 0);
    upgradeBtn.setInteractive({ useHandCursor: true });

    let upgradeDebounce = false;

    upgradeBtn.on('pointerdown', () => {
      if (upgradeDebounce) return;
      upgradeDebounce = true;
      this.time.delayedCall(200, () => upgradeDebounce = false);

      // Button press visual feedback
      upgradeBg.clear();
      upgradeBg.fillStyle(UI_THEME.buttonUpgradePressed, 1);
      upgradeBg.fillRoundedRect(btnX, btnY, btnSize, btnSize, 10);

      this.time.delayedCall(100, () => {
        if (this.scene.isActive()) {
          upgradeBg.clear();
          upgradeBg.fillStyle(UI_THEME.buttonUpgrade, 1);
          upgradeBg.lineStyle(2, UI_THEME.buttonUpgradePressed);
          upgradeBg.fillRoundedRect(btnX, btnY, btnSize, btnSize, 10);
          upgradeBg.strokeRoundedRect(btnX, btnY, btnSize, btnSize, 10);
        }
      });

      if (this.scene.isActive('UpgradeScene')) {
        this.scene.stop('UpgradeScene');
      } else {
        this.scene.launch('UpgradeScene');
      }
    });

    // Settings Gear Icon (top-left under wave)
    const gearBtn = this.add.text(14, 50, '⚙ SETTINGS', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0, 0);
    gearBtn.setInteractive({ useHandCursor: true });

    gearBtn.on('pointerover', () => gearBtn.setColor('#ffffff'));
    gearBtn.on('pointerout', () => gearBtn.setColor('#aaaaaa'));
    gearBtn.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene') as any;
      if (gameScene && !this.scene.isPaused('GameScene')) {
        this.scene.pause('GameScene');
        this.scene.pause('HUDScene');
        this.scene.launch('PauseScene', { profile: gameScene.profile });
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
      this.goldText.setText(`$${formatNumber(gold)}`);
    };

    const onXPChanged = (data: { current: number; required: number; level: number }) => {
      if (!this.scene.isActive()) return;
      const ratio = data.current / data.required;
      this.xpBarFill.setScale(ratio, 1);
      this.levelText.setText(`Lv. ${data.level}`);
      // Level progress percentage
      this.levelPercentText.setText(`[${(ratio * 100).toFixed(1)}%] ${Math.floor(data.current)} / ${data.required}`);
    };

    const onLevelUp = (data: { level: number }) => {
      if (!this.scene.isActive()) return;
      this.levelText.setText(`Lv. ${data.level}`);
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
        duration: TIMING.levelUpAnimation,
        ease: 'Power2',
        onComplete: () => levelUpText.destroy(),
      });
    };

    const onWaveStarted = (data: { wave: number; isBossWave: boolean }) => {
      if (!this.scene.isActive()) return;

      // Update persistent wave label
      const label = data.isBossWave ? `BOSS WAVE ${data.wave}` : `WAVE ${data.wave}`;
      this.waveText.setText(label);
      this.waveText.setColor(data.isBossWave ? '#ff4444' : '#ffffff');

      // Center-Screen Splash Text
      const centerX = this.scale.width / 2;
      const centerY = this.scale.height / 2;

      const splashText = this.add.text(centerX, centerY - 50, data.isBossWave ? `BOSS WAVE ${data.wave}` : `WAVE ${data.wave}`, {
        fontSize: '48px',
        fontFamily: 'Impact, sans-serif',
        color: data.isBossWave ? '#ff4444' : '#4a9eff',
        stroke: '#000000',
        strokeThickness: 6,
      }).setOrigin(0.5);

      splashText.setScale(0); // scale 0%
      splashText.setAlpha(0); // transparent

      this.tweens.add({
        targets: splashText,
        scale: 1.2, // scale 120%
        alpha: 1, // fade in
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.time.delayedCall(TIMING.titleFadeIn, () => {
            this.tweens.add({
              targets: splashText,
              alpha: 0,
              scale: 0.8,
              duration: 300,
              ease: 'Power2',
              onComplete: () => splashText.destroy()
            });
          });
        }
      });
    };

    const onBossSpawned = () => {
      if (!this.scene.isActive()) return;
      this.bossHPContainer.setVisible(true);
      this.bossHPBarFill.setScale(1, 1);
      this.bossHPText.setText('BOSS');
    };

    const onBossPhaseStarted = (data: { total: number }) => {
      if (!this.scene.isActive()) return;
      this.bossHPText.setText(`DEFLECTING! DESTROY ${data.total} MINIONS!`);
      this.bossHPText.setColor('#ffff00');
    };

    const onBossMinionKilled = (data: { remaining: number; total: number }) => {
      if (!this.scene.isActive()) return;
      if (data.remaining > 0) {
        this.bossHPText.setText(`DEFLECTING! DESTROY ${data.remaining} MINIONS!`);
      } else {
        this.bossHPText.setText('SYSTEM OVERLOAD...');
        this.bossHPText.setColor('#ffff00');
      }
    };

    const onBossVulnerableStarted = () => {
      if (!this.scene.isActive()) return;
      this.bossHPText.setText('BOSS VULNERABLE!');
      this.bossHPText.setColor('#ff4444');
    };

    const onBossRecoveryState = () => {
      if (!this.scene.isActive()) return;
      this.bossHPText.setText('SYSTEM RECOVERY...');
      this.bossHPText.setColor('#ffffff');
    };

    const onBossDamaged = (data: { current: number; max: number }) => {
      if (!this.scene.isActive()) return;
      const ratio = Math.max(0, data.current / data.max);
      this.bossHPBarFill.setScale(ratio, 1);
      // Give a brief hit indicator if we haven't overwritten it with phase info
      if (['BOSS VULNERABLE!', 'SYSTEM OVERLOAD...', 'SYSTEM RECOVERY...'].includes(this.bossHPText.text)) {
        // stay vulnerable text
      } else if (!this.bossHPText.text.includes('DEFLECTING')) {
        this.bossHPText.setText('BOSS');
        this.bossHPText.setColor('#ff4444');
      }
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
    EventBus.on('boss-phase-started', onBossPhaseStarted);
    EventBus.on('boss-minion-killed', onBossMinionKilled);
    EventBus.on('boss-vulnerable-started', onBossVulnerableStarted);
    EventBus.on('boss-recovery-state', onBossRecoveryState);
    EventBus.on('boss-damaged', onBossDamaged);
    EventBus.on('boss-killed', onBossKilled);

    this.events.once('shutdown', () => {
      EventBus.off('turret-damaged', onTurretDamaged);
      EventBus.off('gold-changed', onGoldChanged);
      EventBus.off('xp-changed', onXPChanged);
      EventBus.off('level-up', onLevelUp);
      EventBus.off('wave-started', onWaveStarted);
      EventBus.off('boss-spawned', onBossSpawned);
      EventBus.off('boss-phase-started', onBossPhaseStarted);
      EventBus.off('boss-minion-killed', onBossMinionKilled);
      EventBus.off('boss-vulnerable-started', onBossVulnerableStarted);
      EventBus.off('boss-recovery-state', onBossRecoveryState);
      EventBus.off('boss-damaged', onBossDamaged);
      EventBus.off('boss-killed', onBossKilled);
    });

    this.scale.on('resize', this.onResize, this);
  }

  private updateHPBar() {
    const ratio = Math.max(0, this.currentHP / this.maxHP);
    this.hpBarFill.setScale(ratio, 1);
    this.hpText.setText(`${Math.floor(this.currentHP)} / ${Math.floor(this.maxHP)}`);

    // We can keep it red or scale it, for now we will just scale the UI
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    const w = gameSize.width;
    const h = gameSize.height;

    // Reposition Text/Bars
    this.goldText.setPosition(w - 14, 14);

    const barWidth = 140;
    this.hpBarBg.setPosition(w - barWidth - 14, 40);
    this.hpBarFill.setPosition(w - barWidth - 14, 40);
    this.hpText.setPosition(w - barWidth - 14 + barWidth / 2, 40 + 6);

    const bottomBarWidth = w - 100;
    const bottomBarY = h - 20;
    const bottomBarX = 14;

    this.levelText.setPosition(bottomBarX, bottomBarY - 22);
    this.levelPercentText.setPosition(bottomBarX + bottomBarWidth + 4, bottomBarY - 20);

    this.xpBarBg.setPosition(bottomBarX, bottomBarY);
    this.xpBarBg.setSize(bottomBarWidth, 8);
    this.xpBarFill.setPosition(bottomBarX, bottomBarY);
    this.xpBarFill.setSize(bottomBarWidth, 8);

    // Reposition boss HP bar on resize
    const bossBarWidth = 160;
    this.bossHPContainer.setPosition(
      w / 2 - bossBarWidth / 2,
      h - 50
    );
  }
}
