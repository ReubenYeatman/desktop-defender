import Phaser from 'phaser';
import { Turret } from '../entities/Turret';
import { EnemyPool } from '../systems/EnemyPool';
import { ProjectilePool } from '../systems/ProjectilePool';
import { DamageNumberPool } from '../systems/DamageNumberPool';
import { WeaponSystem } from '../systems/WeaponSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { LevelingSystem } from '../systems/LevelingSystem';
import { LootSystem } from '../systems/LootSystem';
import { AscensionSystem } from '../systems/AscensionSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { SaveManager } from '../managers/SaveManager';
import { EventBus } from '../managers/EventBus';
import type { PlayerProfile } from '../models/GameState';
import { createDefaultProfile } from '../models/GameState';
import { COLOR_BACKGROUND, COLOR_BACKGROUND_LIGHT } from '../config/Constants';
import { UI_THEME } from '../config/UITheme';
import { TIMING } from '../config/TimingData';
import { GAMEPLAY_MULTIPLIERS } from '../config/BalanceData';

export class GameScene extends Phaser.Scene {
  private turret!: Turret;
  private enemyPool!: EnemyPool;
  private projectilePool!: ProjectilePool;
  private damageNumberPool!: DamageNumberPool;
  private weaponSystem!: WeaponSystem;
  private combatSystem!: CombatSystem;
  private waveSystem!: WaveSystem;
  private economySystem!: EconomySystem;
  public upgradeSystem!: UpgradeSystem;
  private levelingSystem!: LevelingSystem;
  public lootSystem!: LootSystem;
  private particleSystem!: ParticleSystem;
  private profile!: PlayerProfile;
  private enemiesKilled: number = 0;
  private autoSaveTimer: number = 0;
  private gameOver: boolean = false;

  private bgGraphics!: Phaser.GameObjects.Graphics;
  private redVignette!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { profile?: PlayerProfile }) {
    this.profile = data.profile || createDefaultProfile();
    this.enemiesKilled = 0;
    this.gameOver = false;
  }

  create() {
    EventBus.removeAll();

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Initialize entity pools
    this.enemyPool = new EnemyPool(this);
    this.projectilePool = new ProjectilePool(this);
    this.damageNumberPool = new DamageNumberPool(this);

    // Initialize turret
    this.turret = new Turret(this, centerX, centerY);

    this.createCheckeredBackground();

    // Apply ascension bonuses
    const ascensionSystem = new AscensionSystem();
    const bonuses = ascensionSystem.getStartingBonuses(this.profile);
    this.turret.baseDamage += bonuses.baseDamageBonus;
    this.turret.maxHealth += bonuses.maxHealthBonus;
    this.turret.currentHealth = this.turret.maxHealth;

    // Initialize systems
    this.economySystem = new EconomySystem();
    if (bonuses.startingGold > 0) {
      this.economySystem.earnGold(bonuses.startingGold);
    }

    this.upgradeSystem = new UpgradeSystem(this.turret, this.economySystem);
    this.levelingSystem = new LevelingSystem();
    this.lootSystem = new LootSystem();
    this.waveSystem = new WaveSystem(this, this.enemyPool, centerX, centerY);
    this.weaponSystem = new WeaponSystem(this, this.turret, this.projectilePool);
    this.weaponSystem.setEnemyPool(this.enemyPool);
    this.combatSystem = new CombatSystem(this, this.turret);

    // Set up collisions
    this.physics.add.overlap(
      this.projectilePool.group,
      this.enemyPool.group,
      this.combatSystem.onProjectileHitEnemy.bind(this.combatSystem) as any
    );

    const turretZone = this.turret.body.gameObject;
    this.physics.add.overlap(
      turretZone,
      this.enemyPool.group,
      this.combatSystem.onEnemyReachTurret.bind(this.combatSystem) as any
    );

    // Initialize particle system (event-driven, self-wiring)
    this.particleSystem = new ParticleSystem(this);

    // Launch HUD
    this.scene.launch('HUDScene');

    // Create the red vignette overlay for damage
    this.redVignette = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, UI_THEME.vignetteColor, 1);
    this.redVignette.setAlpha(0);
    this.redVignette.setDepth(999);
    this.redVignette.setBlendMode('ADD');

    // Track kills and spawn credits
    EventBus.on('enemy-killed', (data: { x: number; y: number; goldValue: number; enemyType: string }) => {
      this.enemiesKilled++;

      if (data.goldValue > 0) {
        const numCredits = data.enemyType === 'boss' ? GAMEPLAY_MULTIPLIERS.bossKillCredits : Phaser.Math.Between(GAMEPLAY_MULTIPLIERS.normalKillCreditsMin, GAMEPLAY_MULTIPLIERS.normalKillCreditsMax);
        for (let i = 0; i < numCredits; i++) {
          this.spawnFloatingCredit(data.x, data.y);
        }
      }
    });

    // Track wave for loot and grid pulse
    EventBus.on('wave-started', (data: { wave: number }) => {
      this.lootSystem.setCurrentWave(data.wave);
      this.pulseBackground();
    });

    // Relay level-up to VFX system with turret position
    EventBus.on('level-up', () => {
      EventBus.emit('level-up-vfx', { x: this.turret.x, y: this.turret.y });
    });

    // Screen shake, Red Vignette, and Grid pulse on turret damage
    EventBus.on('turret-damaged', (data: { current: number; max: number }) => {
      if (data.current > 0 && data.current < data.max) {
        const ratio = data.current / data.max;
        const intensity = ratio < 0.25 ? 0.008 : 0.004;
        this.shakeCamera(intensity, 80);

        // Flash red vignette
        this.redVignette.setAlpha(UI_THEME.vignetteAlpha);
        this.tweens.add({
          targets: this.redVignette,
          alpha: 0,
          duration: TIMING.vignetteFade,
        });
      }
    });

    // Heal at the end of every wave (e.g. 15% of max HP)
    EventBus.on('wave-heal', () => {
      if (this.turret && this.turret.currentHealth > 0) {
        const healAmt = Math.floor(this.turret.maxHealth * GAMEPLAY_MULTIPLIERS.waveHealPercent);
        this.turret.heal(healAmt);
      }
    });

    // Screen shake on boss events
    EventBus.on('boss-spawned', () => {
      this.shakeCamera(0.01, 200);
    });

    EventBus.on('boss-killed', () => {
      this.shakeCamera(0.015, 300);
      this.pulseBackground();
    });

    // Pause functionality
    const pauseFunc = () => {
      if (!this.gameOver && !this.scene.isPaused('GameScene')) {
        this.scene.pause('GameScene');
        this.scene.pause('HUDScene');
        this.scene.launch('PauseScene', { profile: this.profile });
      }
    };

    this.input.keyboard?.on('keydown-ESC', pauseFunc);
    this.input.keyboard?.on('keydown-P', pauseFunc);

    // Handle window resize
    this.scale.on('resize', this.onResize, this);

    // Handle game over
    EventBus.on('turret-damaged', (data: { current: number; max: number }) => {
      if (data.current <= 0 && !this.gameOver) {
        this.gameOver = true;
        this.handleGameOver();
      }
    });
  }

  update(time: number, delta: number) {
    if (this.gameOver) return;

    this.waveSystem.update(time, delta);

    this.turret.currentTarget = this.enemyPool.getNearest(
      this.turret.x, this.turret.y, this.turret.range
    );

    this.turret.update(time, delta);
    this.weaponSystem.update(time, delta);
    this.upgradeSystem.update(time, delta);

    // Auto-save every 30 seconds
    this.autoSaveTimer += delta;
    if (this.autoSaveTimer >= 30000) {
      this.autoSaveTimer = 0;
      this.autoSave();
    }
  }

  private shakeCamera(intensity: number = 0.005, duration: number = 100): void {
    if (this.profile.settings.screenShake) {
      this.cameras.main.shake(duration, intensity);
    }
  }

  private pulseBackground() {
    if (!this.bgGraphics) return;
    this.bgGraphics.setAlpha(1.5);
    this.tweens.add({
      targets: this.bgGraphics,
      alpha: 1,
      duration: 600,
      ease: 'Power2'
    });
  }

  private spawnFloatingCredit(x: number, y: number) {
    const minOff = -40;
    const maxOff = 40;
    const dropX = x + Phaser.Math.Between(minOff, maxOff);
    const dropY = y + Phaser.Math.Between(minOff, maxOff);

    // Make the credit visual
    const credit = this.add.image(x, y, 'particle-yellow');
    credit.setDepth(10);
    credit.setScale(1.8);

    // 1) Scatter out
    this.tweens.add({
      targets: credit,
      x: dropX,
      y: dropY,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        // Wait 0.5s then magnetize
        this.time.delayedCall(500, () => {
          // 2) Magnetize to turret with EaseIn
          this.tweens.add({
            targets: credit,
            x: this.turret.x,
            y: this.turret.y,
            duration: 500,
            ease: 'Expo.easeIn',
            onComplete: () => {
              credit.destroy();
            }
          });
        });
      }
    });
  }

  private createCheckeredBackground() {
    const squareSize = 64;
    const cols = Math.ceil(this.scale.width / squareSize);
    const rows = Math.ceil(this.scale.height / squareSize);

    // Create a graphics object to draw the pattern
    this.bgGraphics = this.add.graphics();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Alternate colors
        const isLight = (row + col) % 2 === 0;
        this.bgGraphics.fillStyle(isLight ? COLOR_BACKGROUND_LIGHT : COLOR_BACKGROUND, 1);

        this.bgGraphics.fillRect(
          col * squareSize,
          row * squareSize,
          squareSize,
          squareSize
        );
      }
    }

    // Put it at the very bottom
    this.bgGraphics.setDepth(-1);
  }

  private handleGameOver() {
    this.particleSystem.destroy();
    this.scene.stop('HUDScene');
    this.scene.stop('UpgradeScene');

    const runStats = {
      highestWave: this.waveSystem.wave,
      totalGoldEarned: this.economySystem.getTotalGoldEarned(),
      enemiesKilled: this.enemiesKilled,
      runDuration: 0,
    };

    // Clear saved run
    SaveManager.save({
      version: 1,
      lastSaved: Date.now(),
      profile: this.profile,
      run: null,
    });

    EventBus.removeAll();

    this.scene.start('GameOverScene', {
      runStats,
      profile: this.profile,
    });
  }

  private async autoSave() {
    await SaveManager.save({
      version: 1,
      lastSaved: Date.now(),
      profile: this.profile,
      run: {
        currentWave: this.waveSystem.wave,
        turretHealth: this.turret.currentHealth,
        turretMaxHealth: this.turret.maxHealth,
        gold: this.economySystem.getGold(),
        totalGoldEarned: this.economySystem.getTotalGoldEarned(),
        level: this.levelingSystem.getLevel(),
        currentXP: this.levelingSystem.getXP(),
        upgradeLevels: {},
        equippedGear: this.lootSystem.getEquipped(),
        inventory: this.lootSystem.getInventory(),
        activeWeaponId: 'basic',
        enemiesKilledThisRun: this.enemiesKilled,
        runStartTime: Date.now(),
        runDuration: 0,
      },
    });
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    const centerX = gameSize.width / 2;
    const centerY = gameSize.height / 2;
    this.turret.setPosition(centerX, centerY);
    this.waveSystem.updateTurretPosition(centerX, centerY);
  }
}
