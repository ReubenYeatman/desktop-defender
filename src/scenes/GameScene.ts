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
import { SaveManager } from '../managers/SaveManager';
import { EventBus } from '../managers/EventBus';
import type { PlayerProfile } from '../models/GameState';
import { createDefaultProfile } from '../models/GameState';

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
  private profile!: PlayerProfile;
  private enemiesKilled: number = 0;
  private autoSaveTimer: number = 0;
  private gameOver: boolean = false;

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
      this.combatSystem.onProjectileHitEnemy.bind(this.combatSystem)
    );

    const turretZone = this.turret.body.gameObject;
    this.physics.add.overlap(
      turretZone,
      this.enemyPool.group,
      this.combatSystem.onEnemyReachTurret.bind(this.combatSystem)
    );

    // Launch HUD
    this.scene.launch('HUDScene');

    // Track kills
    EventBus.on('enemy-killed', () => {
      this.enemiesKilled++;
    });

    // Track wave for loot
    EventBus.on('wave-started', (data: { wave: number }) => {
      this.lootSystem.setCurrentWave(data.wave);
    });

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

  private handleGameOver() {
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
