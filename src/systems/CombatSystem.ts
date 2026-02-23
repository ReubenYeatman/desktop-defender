import Phaser from 'phaser';
import type { Turret } from '../entities/Turret';
import type { Enemy } from '../entities/Enemy';
import type { Projectile } from '../entities/Projectile';

export class CombatSystem {
  private scene: Phaser.Scene;
  private turret: Turret;

  constructor(scene: Phaser.Scene, turret: Turret) {
    this.scene = scene;
    this.turret = turret;
  }

  onProjectileHitEnemy(
    projectile: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const proj = projectile as unknown as Projectile;
    const e = enemy as unknown as Enemy;

    if (!proj.active || !e.active) return;

    e.takeDamage(proj.damage, proj.knockback);

    if (proj.piercing > 0) {
      proj.piercing--;
    } else {
      proj.deactivate();
    }
  }

  onEnemyReachTurret(
    turretZone: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const e = enemy as unknown as Enemy;
    if (!e.active) return;

    // Enemy deals damage to turret and dies
    this.turret.takeDamage(e.damage);
    e.deactivate(); // consumed on hit, no kill reward
  }
}
