import Phaser from 'phaser';
import { EnemyPool } from './EnemyPool';
import { getWaveConfig, ELITE_CONFIG, GAMEPLAY_MULTIPLIERS, type WaveConfig } from '../config/BalanceData';
import { ENEMY_TYPES, type EnemyDefinition } from '../models/EnemyDefinition';
import { EventBus } from '../managers/EventBus';
import type { EnemySpawnConfig } from '../entities/Enemy';
import { TIMING } from '../config/TimingData';
import { UI_THEME } from '../config/UITheme';

export class WaveSystem {
  private scene: Phaser.Scene;
  private enemyPool: EnemyPool;
  private turretX: number;
  private turretY: number;

  private currentWave: number = 0;
  private waveConfig!: WaveConfig;
  private enemiesSpawned: number = 0;
  private spawnTimer: number = 0;
  private waveBreakTimer: number = 0;
  private isInWaveBreak: boolean = true; // Start with a brief break

  // Boss Phase state
  private bossSpawned: boolean = false;
  private activeBoss: import('../entities/Enemy').Enemy | null = null;
  private bossPhase: 'none' | 'orbit' | 'vulnerable' = 'none';
  private bossMinionsToKill: number = 0;
  private initialBossMinions: number = 0;

  constructor(scene: Phaser.Scene, enemyPool: EnemyPool, turretX: number, turretY: number) {
    this.scene = scene;
    this.enemyPool = enemyPool;
    this.turretX = turretX;
    this.turretY = turretY;

    // Start first wave after a short delay
    this.waveBreakTimer = TIMING.bossSpawnDelay;

    // Listen for enemy kills to track minion deaths
    EventBus.on('enemy-killed', (data: { enemyType: string }) => {
      if (this.bossPhase === 'orbit' && data.enemyType === 'boss-minion') {
        this.bossMinionsToKill--;
        // Fire event to update HUD later
        EventBus.emit('boss-minion-killed', {
          remaining: Math.max(0, this.bossMinionsToKill),
          total: this.initialBossMinions
        });

        if (this.bossMinionsToKill <= 0) {
          this.transitionBossToVulnerable();
        }
      }
    });

    // Handle Trojan death spawns
    EventBus.on('spawn-scouts', (data: { x: number; y: number; count: number }) => {
      const enemyDef = ENEMY_TYPES.find(e => e.type === 'scout');
      if (!enemyDef) return;

      for (let i = 0; i < data.count; i++) {
        const angle = (Math.PI * 2 / data.count) * i;
        const offset = 20;
        const config: EnemySpawnConfig = {
          x: data.x + Math.cos(angle) * offset,
          y: data.y + Math.sin(angle) * offset,
          turretX: this.turretX,
          turretY: this.turretY,
          health: Math.floor(this.waveConfig.baseHealth * enemyDef.healthMultiplier),
          speed: Math.floor(this.waveConfig.baseSpeed * enemyDef.speedMultiplier),
          damage: Math.floor(this.waveConfig.baseDamage * enemyDef.damageMultiplier),
          xpValue: Math.floor(this.waveConfig.xpValue * enemyDef.xpMultiplier),
          goldValue: Math.floor(this.waveConfig.goldValue * enemyDef.goldMultiplier),
          type: enemyDef.type,
          textureKey: enemyDef.textureKey,
        };
        this.enemyPool.spawn(config);
      }
    });
  }

  get wave(): number {
    return this.currentWave;
  }

  updateTurretPosition(x: number, y: number) {
    this.turretX = x;
    this.turretY = y;
  }

  update(_time: number, delta: number) {
    if (this.isInWaveBreak) {
      this.waveBreakTimer -= delta;
      if (this.waveBreakTimer <= 0) {
        this.startNextWave();
      }
      return;
    }

    // Spawn enemies on interval
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0 && this.enemiesSpawned < this.waveConfig.enemyCount) {
      if (this.enemyPool.getActiveCount() < this.waveConfig.maxConcurrent) {
        this.spawnEnemy();
        this.spawnTimer = this.waveConfig.spawnInterval;
      }
    }

    // Check wave completion: all spawned and all dead
    // Note: Boss runs have their own win condition in that the boss itself needs to die
    if (this.enemiesSpawned >= this.waveConfig.enemyCount && this.enemyPool.getActiveCount() === 0) {
      this.onWaveComplete();
    } else if (this.bossPhase === 'vulnerable' && !this.activeBoss?.active) {
      // For a Boss wave, winning implies killing the boss!
      this.onWaveComplete();
    }
  }

  private startNextWave() {
    this.currentWave++;
    this.waveConfig = getWaveConfig(this.currentWave);
    this.enemiesSpawned = 0;
    this.bossSpawned = false;
    this.activeBoss = null;
    this.bossPhase = 'none';
    this.isInWaveBreak = false;
    this.spawnTimer = 0; // Spawn first enemy immediately

    EventBus.emit('wave-started', {
      wave: this.currentWave,
      isBossWave: this.waveConfig.isBossWave,
    });

    if (this.waveConfig.isBossWave) {
      EventBus.emit('boss-spawned', { wave: this.currentWave });
    }
  }

  private onWaveComplete() {
    this.isInWaveBreak = true;
    this.waveBreakTimer = this.waveConfig.breakTime;

    EventBus.emit('wave-complete', {
      wave: this.currentWave,
    });

    // Wave heal event
    EventBus.emit('wave-heal');
  }

  private spawnEnemy() {
    const pos = this.getSpawnPosition();

    // Decide if this should be the boss. In orbital mechanics, boss spawns at the very start of the wave!
    if (this.waveConfig.isBossWave && !this.bossSpawned) {
      this.spawnBoss(pos);
      this.bossSpawned = true;
      this.enemiesSpawned++; // Boss counts as an enemy
      return;
    }

    // Pick a random enemy type available at this wave
    let enemyDef = this.pickEnemyType();

    // If in boss orbit phase, only spawn minions!
    if (this.bossPhase === 'orbit') {
      const minionDef = ENEMY_TYPES.find(e => e.type === 'boss-minion');
      if (minionDef) {
        enemyDef = minionDef;
      }
    } else if (this.bossPhase === 'vulnerable') {
      // Stop spawning enemies once boss is vulnerable
      this.enemiesSpawned = this.waveConfig.enemyCount;
      return;
    }

    let isElite = false;
    if (this.currentWave >= ELITE_CONFIG.unlockWave && Math.random() < ELITE_CONFIG.spawnChance) {
      if (!ELITE_CONFIG.excludedTypes.includes(enemyDef.type)) {
        isElite = true;
      }
    }

    const config: EnemySpawnConfig = {
      x: pos.x,
      y: pos.y,
      turretX: this.turretX,
      turretY: this.turretY,
      health: Math.floor(this.waveConfig.baseHealth * enemyDef.healthMultiplier),
      speed: Math.floor(this.waveConfig.baseSpeed * enemyDef.speedMultiplier),
      damage: Math.floor(this.waveConfig.baseDamage * enemyDef.damageMultiplier),
      xpValue: Math.floor(this.waveConfig.xpValue * enemyDef.xpMultiplier),
      goldValue: Math.floor(this.waveConfig.goldValue * enemyDef.goldMultiplier),
      type: enemyDef.type,
      textureKey: enemyDef.textureKey,
      isElite
    };

    if (isElite) {
      config.health *= ELITE_CONFIG.healthMultiplier;
      config.xpValue *= ELITE_CONFIG.xpMultiplier;
      config.goldValue *= ELITE_CONFIG.goldMultiplier;
    }

    // Swarm: spawn 3 in a cluster
    if (enemyDef.type === 'swarm') {
      for (let i = 0; i < 3; i++) {
        const offset = { x: pos.x + (i - 1) * 12, y: pos.y + (i - 1) * 8 };
        this.enemyPool.spawn({ ...config, x: offset.x, y: offset.y });
      }
    } else {
      this.enemyPool.spawn(config);
    }

    // Minions don't count towards the wave limit in orbit phase, the Boss does.
    if (this.bossPhase !== 'orbit') {
      this.enemiesSpawned++;
    }
  }

  private transitionBossToVulnerable() {
    if (!this.activeBoss) return;
    this.bossPhase = 'vulnerable';

    // 1. Enter Overheated/Vulnerable stationary phase for 3 seconds
    this.activeBoss.invulnerable = true;
    this.activeBoss.speed = 0; // Stationary
    this.activeBoss.clearTint();
    this.activeBoss.setTintFill(UI_THEME.bossVulnerable); // Yellow System Overload flash

    // Fire event to notify HUD of Overload
    EventBus.emit('boss-vulnerable-started');

    // 2. Transition to slower pursuit
    this.scene.time.delayedCall(TIMING.bossVulnerableDelay, () => {
      if (this.activeBoss?.active) {
        this.activeBoss.clearTint();
        this.activeBoss.setTint(UI_THEME.bossAngry); // Angry reddish tint
        this.activeBoss.invulnerable = false;

        // Resume pursuit but at a slowed pace
        this.activeBoss.speed = this.waveConfig.baseSpeed * GAMEPLAY_MULTIPLIERS.bossVulnerableSpeed;
      }
    });
  }

  private spawnBoss(pos: { x: number; y: number }) {
    const config: EnemySpawnConfig = {
      x: pos.x,
      y: pos.y,
      turretX: this.turretX,
      turretY: this.turretY,
      health: Math.floor(this.waveConfig.baseHealth * this.waveConfig.bossHealthMultiplier),
      speed: Math.floor(this.waveConfig.baseSpeed * GAMEPLAY_MULTIPLIERS.bossSpeedMultiplier),
      damage: Math.floor(this.waveConfig.baseDamage * GAMEPLAY_MULTIPLIERS.bossDamageMultiplier),
      xpValue: Math.floor(this.waveConfig.xpValue * this.waveConfig.bossXpMultiplier),
      goldValue: Math.floor(this.waveConfig.goldValue * this.waveConfig.bossGoldMultiplier),
      type: 'boss',
      textureKey: 'enemy-boss',
    };

    const boss = this.enemyPool.spawn(config);
    if (boss) {
      boss.invulnerable = true;
      this.bossPhase = 'orbit';
      this.activeBoss = boss;

      // Minion quota: heavily dependent on wave
      this.initialBossMinions = 5 + Math.floor(this.waveConfig.waveNumber * 1.5);
      this.bossMinionsToKill = this.initialBossMinions;

      // Notify HUD
      EventBus.emit('boss-phase-started', {
        total: this.initialBossMinions
      });
    }
  }

  private pickEnemyType(): EnemyDefinition {
    const available = ENEMY_TYPES.filter(e => e.unlocksAtWave <= this.currentWave);
    return available[Phaser.Math.Between(0, available.length - 1)];
  }

  private getSpawnPosition(): { x: number; y: number } {
    const side = Phaser.Math.Between(0, 3);
    const margin = 20;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    switch (side) {
      case 0: return { x: Phaser.Math.Between(0, w), y: -margin };
      case 1: return { x: w + margin, y: Phaser.Math.Between(0, h) };
      case 2: return { x: Phaser.Math.Between(0, w), y: h + margin };
      case 3: return { x: -margin, y: Phaser.Math.Between(0, h) };
      default: return { x: -margin, y: Phaser.Math.Between(0, h) };
    }
  }
}
