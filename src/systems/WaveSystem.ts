import Phaser from 'phaser';
import { EnemyPool } from './EnemyPool';
import { getWaveConfig, type WaveConfig } from '../config/BalanceData';
import { ENEMY_TYPES, type EnemyDefinition } from '../models/EnemyDefinition';
import { EventBus } from '../managers/EventBus';
import type { EnemySpawnConfig } from '../entities/Enemy';

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
  private bossSpawned: boolean = false;

  constructor(scene: Phaser.Scene, enemyPool: EnemyPool, turretX: number, turretY: number) {
    this.scene = scene;
    this.enemyPool = enemyPool;
    this.turretX = turretX;
    this.turretY = turretY;

    // Start first wave after a short delay
    this.waveBreakTimer = 1500;
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
      this.spawnEnemy();
      this.spawnTimer = this.waveConfig.spawnInterval;
    }

    // Check wave completion: all spawned and all dead
    if (this.enemiesSpawned >= this.waveConfig.enemyCount && this.enemyPool.getActiveCount() === 0) {
      this.onWaveComplete();
    }
  }

  private startNextWave() {
    this.currentWave++;
    this.waveConfig = getWaveConfig(this.currentWave);
    this.enemiesSpawned = 0;
    this.bossSpawned = false;
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
  }

  private spawnEnemy() {
    const pos = this.getSpawnPosition();

    // Decide if this should be the boss
    if (this.waveConfig.isBossWave && !this.bossSpawned && this.enemiesSpawned === this.waveConfig.enemyCount - 1) {
      this.spawnBoss(pos);
      this.bossSpawned = true;
      this.enemiesSpawned++;
      return;
    }

    // Pick a random enemy type available at this wave
    const enemyDef = this.pickEnemyType();

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
    };

    // Swarm: spawn 3 in a cluster
    if (enemyDef.type === 'swarm') {
      for (let i = 0; i < 3; i++) {
        const offset = { x: pos.x + (i - 1) * 12, y: pos.y + (i - 1) * 8 };
        this.enemyPool.spawn({ ...config, x: offset.x, y: offset.y });
      }
    } else {
      this.enemyPool.spawn(config);
    }

    this.enemiesSpawned++;
  }

  private spawnBoss(pos: { x: number; y: number }) {
    const config: EnemySpawnConfig = {
      x: pos.x,
      y: pos.y,
      turretX: this.turretX,
      turretY: this.turretY,
      health: Math.floor(this.waveConfig.baseHealth * this.waveConfig.bossHealthMultiplier),
      speed: Math.floor(this.waveConfig.baseSpeed * 0.6),
      damage: Math.floor(this.waveConfig.baseDamage * 2),
      xpValue: Math.floor(this.waveConfig.xpValue * this.waveConfig.bossXpMultiplier),
      goldValue: Math.floor(this.waveConfig.goldValue * this.waveConfig.bossGoldMultiplier),
      type: 'boss',
      textureKey: 'enemy-boss',
    };

    this.enemyPool.spawn(config);
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
