import Phaser from 'phaser';
import { Projectile, type ProjectileConfig } from '../entities/Projectile';
import { PROJECTILE_POOL_SIZE } from '../config/Constants';

export class ProjectilePool {
  public group: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({
      classType: Projectile,
      maxSize: PROJECTILE_POOL_SIZE,
      runChildUpdate: false,
      active: false,
      visible: false,
    });

    // Pre-populate
    for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) {
      const proj = new Projectile(scene, -100, -100);
      this.group.add(proj, true);
    }
  }

  fire(config: ProjectileConfig): Projectile | null {
    const proj = this.group.getFirstDead(false) as Projectile | null;
    if (proj) {
      proj.fire(config);
    }
    return proj;
  }
}
