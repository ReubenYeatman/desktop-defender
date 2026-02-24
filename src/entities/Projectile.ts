import Phaser from 'phaser';
import { UI_THEME } from '../config/UITheme';

export interface ProjectileConfig {
  x: number;
  y: number;
  angle: number;
  speed: number;
  damage: number;
  knockback: number;
  piercing: number;
  lifetime: number;
  weaponType: string;
  textureKey: string;
  isCrit: boolean;
}

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 0;
  public knockback: number = 0;
  public piercing: number = 0;
  public weaponType: string = '';
  public isCrit: boolean = false;
  private lifetimeTimer?: Phaser.Time.TimerEvent;
  private trailEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'projectile-basic');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;

    this.trailEmitter = scene.add.particles(0, 0, 'particle-white', {
      speed: 0,
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 150,
      tint: UI_THEME.laserBeam,
      blendMode: 'ADD',
      emitting: false
    });
    this.trailEmitter.startFollow(this);
    this.trailEmitter.setDepth(this.depth - 1);
  }

  fire(config: ProjectileConfig) {
    this.setTexture(config.textureKey);
    this.setPosition(config.x, config.y);
    this.setActive(true);
    this.setVisible(true);

    const pBody = this.body as Phaser.Physics.Arcade.Body;
    pBody.enable = true;

    // Expand hitbox slightly bounds to prevent tunneling
    pBody.setCircle(6, -2, -2); // Using a bigger circle relative to size=8

    this.damage = config.damage;
    this.knockback = config.knockback;
    this.piercing = config.piercing;
    this.weaponType = config.weaponType;
    this.isCrit = config.isCrit;

    pBody.setVelocity(
      Math.cos(config.angle) * config.speed,
      Math.sin(config.angle) * config.speed
    );
    this.setRotation(config.angle);

    this.trailEmitter.start();

    // Auto-deactivate after lifetime
    this.lifetimeTimer = this.scene.time.delayedCall(config.lifetime, () => {
      if (this.active) this.deactivate();
    });
  }

  deactivate() {
    if (this.lifetimeTimer) {
      this.lifetimeTimer.destroy();
      this.lifetimeTimer = undefined;
    }
    this.setActive(false);
    this.setVisible(false);
    this.trailEmitter.stop();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
  }
}
