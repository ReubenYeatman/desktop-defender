import Phaser from 'phaser';
import { Enemy, type EnemySpawnConfig } from '../entities/Enemy';
import { ENEMY_POOL_SIZE } from '../config/Constants';

export class EnemyPool {
  public group: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({
      classType: Enemy,
      maxSize: ENEMY_POOL_SIZE,
      runChildUpdate: false,
      active: false,
      visible: false,
    });

    // Pre-populate
    for (let i = 0; i < ENEMY_POOL_SIZE; i++) {
      const enemy = new Enemy(scene, -100, -100);
      this.group.add(enemy, true);
    }
  }

  spawn(config: EnemySpawnConfig): Enemy | null {
    const enemy = this.group.getFirstDead(false) as Enemy | null;
    if (enemy) {
      enemy.spawn(config);
    }
    return enemy;
  }

  getNearest(x: number, y: number, range: number): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDistSq = range * range;

    const children = this.group.getChildren() as Enemy[];
    for (const enemy of children) {
      if (!enemy.active) continue;
      const dx = x - enemy.x;
      const dy = y - enemy.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = enemy;
      }
    }
    return nearest;
  }

  getActiveCount(): number {
    return this.group.countActive(true);
  }

  getActiveEnemies(): Enemy[] {
    return (this.group.getChildren() as Enemy[]).filter(e => e.active);
  }
}
