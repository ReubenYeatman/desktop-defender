import Phaser from 'phaser';
import { EventBus } from '../managers/EventBus';
import {
  COLOR_ENEMY_GRUNT,
  COLOR_ENEMY_RUNNER,
  COLOR_ENEMY_TANK,
  COLOR_ENEMY_SWARM,
  COLOR_ENEMY_SHIELD,
  COLOR_ENEMY_HEALER,
  COLOR_BOSS,
} from '../config/Constants';

export class ParticleSystem {
  private scene: Phaser.Scene;

  // Persistent emitters (created once, explode() on demand)
  private deathEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private debrisEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hitSparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private muzzleFlashEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private critEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private levelUpEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private coreDamageEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Bound listener references for cleanup
  private listeners: Array<{ event: string; fn: (...args: any[]) => void }> = [];

  private enemyColors: Record<string, number> = {
    grunt: COLOR_ENEMY_GRUNT,
    runner: COLOR_ENEMY_RUNNER,
    tank: COLOR_ENEMY_TANK,
    swarm: COLOR_ENEMY_SWARM,
    shield: COLOR_ENEMY_SHIELD,
    healer: COLOR_ENEMY_HEALER,
    boss: COLOR_BOSS,
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createEmitters();
    this.bindEvents();
  }

  private createEmitters(): void {
    // Death explosion — orange/colored particles on enemy death
    this.deathEmitter = this.scene.add.particles(0, 0, 'particle-data', {
      speed: { min: 80, max: 200 }, // Punchier
      scale: { start: 1.5, end: 0 }, // Shrink over time
      alpha: { start: 1, end: 0 },
      lifespan: { min: 400, max: 500 }, // 0.5s approx
      frequency: -1,
      emitting: false,
    });
    this.deathEmitter.setDepth(50);

    // Debris — small square fragments that scatter and litter the ground
    this.debrisEmitter = this.scene.add.particles(0, 0, 'debris-small', {
      speed: { min: 20, max: 200 },
      accelerationX: { random: [-30, 30] }, // Adds small bit of varied drag feel
      accelerationY: { random: [-30, 30] },
      scale: { start: 1.0, end: 0.2 },
      alpha: { start: 0.8, end: 0, ease: 'Expo.easeIn' }, // Fade rapidly at the very end
      lifespan: 10000, // 10 seconds
      angle: { min: 0, max: 360 },
      rotate: { random: [0, 360] },
      frequency: -1,
      emitting: false
    });
    this.debrisEmitter.setDepth(1); // Put debris under player and enemies
    this.debrisEmitter.particleBringToTop = false; // Add older debris to bottom

    this.scene.events.on('update', (time: number, delta: number) => {
      // @ts-ignore - Accessing private particles array since Phaser 3 types don't expose it
      const particles = this.debrisEmitter.particles?.list || this.debrisEmitter.alive || [];
      for (const p of particles) {
        if (p.life > 9500) {
          p.velocityX *= 0.92;
          p.velocityY *= 0.92;
        } else {
          p.velocityX = 0;
          p.velocityY = 0;
          p.accelerationX = 0;
          p.accelerationY = 0;
        }
      }
    });

    // Hit sparks — tiny bright particles on projectile impact
    this.hitSparkEmitter = this.scene.add.particles(0, 0, 'particle-spark', {
      speed: { min: 20, max: 60 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 80, max: 150 },
      frequency: -1,
      emitting: false,
    });
    this.hitSparkEmitter.setDepth(51);

    // Muzzle flash — brief flash at barrel tip
    this.muzzleFlashEmitter = this.scene.add.particles(0, 0, 'muzzle-flash', {
      speed: { min: 5, max: 20 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 100,
      frequency: -1,
      emitting: false,
    });
    this.muzzleFlashEmitter.setDepth(48);

    // Crit burst — larger yellow particles on critical hit
    this.critEmitter = this.scene.add.particles(0, 0, 'particle-yellow', {
      speed: { min: 40, max: 100 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 200, max: 350 },
      frequency: -1,
      emitting: false,
    });
    this.critEmitter.setDepth(52);

    // Level up — radial burst of blue/white particles
    this.levelUpEmitter = this.scene.add.particles(0, 0, 'particle-white', {
      speed: { min: 60, max: 120 },
      scale: { start: 1.0, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 400, max: 700 },
      angle: { min: 0, max: 360 },
      frequency: -1,
      emitting: false,
      tint: [0x44ddff, 0x4488ff, 0xffffff],
    });
    this.levelUpEmitter.setDepth(53);

    // Core Damage Burst
    this.coreDamageEmitter = this.scene.add.particles(0, 0, 'particle-spark', {
      speed: { min: 100, max: 250 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 300, max: 400 },
      tint: [0xff0000, 0xff8800],
      frequency: -1,
      emitting: false,
    });
    this.coreDamageEmitter.setDepth(55);
  }

  private bindEvents(): void {
    const onEnemyKilled = (data: { x: number; y: number; enemyType: string }) => {
      this.emitDeathExplosion(data.x, data.y, data.enemyType);
    };

    const onProjectileHit = (data: { x: number; y: number; isCrit: boolean; weaponType: string }) => {
      this.emitHitSpark(data.x, data.y, data.weaponType);
      if (data.isCrit) {
        this.critEmitter.explode(8, data.x, data.y);
      }
    };

    const onWeaponFiredVfx = (data: { x: number; y: number }) => {
      this.muzzleFlashEmitter.explode(3, data.x, data.y);
    };

    const onLevelUpVfx = (data: { x: number; y: number }) => {
      this.levelUpEmitter.explode(20, data.x, data.y);
    };

    const onTurretDamaged = (data: { current: number; max: number; x: number; y: number }) => {
      // 8-12 red/orange sparks shooting outward
      this.coreDamageEmitter.explode(Phaser.Math.Between(8, 12), data.x, data.y);
    };

    EventBus.on('enemy-killed', onEnemyKilled);
    EventBus.on('projectile-hit', onProjectileHit);
    EventBus.on('weapon-fired-vfx', onWeaponFiredVfx);
    EventBus.on('level-up-vfx', onLevelUpVfx);
    EventBus.on('turret-damaged', onTurretDamaged);

    this.listeners.push(
      { event: 'enemy-killed', fn: onEnemyKilled },
      { event: 'projectile-hit', fn: onProjectileHit },
      { event: 'weapon-fired-vfx', fn: onWeaponFiredVfx },
      { event: 'level-up-vfx', fn: onLevelUpVfx },
      { event: 'turret-damaged', fn: onTurretDamaged }
    );
  }

  private emitDeathExplosion(x: number, y: number, enemyType: string): void {
    const color = this.enemyColors[enemyType] ?? 0xff4444;
    this.deathEmitter.setParticleTint(color);

    const count = enemyType === 'boss' ? 30 : Phaser.Math.Between(8, 12); // Data fragments
    const debrisCount = enemyType === 'boss' ? 25 : Phaser.Math.Between(8, 15);

    this.deathEmitter.explode(count, x, y);
    this.debrisEmitter.explode(debrisCount, x, y);
  }

  private emitHitSpark(x: number, y: number, weaponType: string): void {
    switch (weaponType) {
      case 'laser':
        this.hitSparkEmitter.explode(2, x, y);
        break;
      case 'missile':
        this.hitSparkEmitter.explode(8, x, y);
        this.deathEmitter.setParticleTint(0xff8844);
        this.deathEmitter.explode(6, x, y);
        break;
      default:
        this.hitSparkEmitter.explode(4, x, y);
        break;
    }
  }

  destroy(): void {
    for (const { event, fn } of this.listeners) {
      EventBus.off(event, fn);
    }
    this.listeners = [];
    this.deathEmitter.destroy();
    this.debrisEmitter.destroy();
    this.hitSparkEmitter.destroy();
    this.muzzleFlashEmitter.destroy();
    this.critEmitter.destroy();
    this.levelUpEmitter.destroy();
    this.coreDamageEmitter.destroy();
  }
}
