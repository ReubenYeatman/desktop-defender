import Phaser from 'phaser';

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

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'projectile-basic');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  fire(config: ProjectileConfig) {
    this.setTexture(config.textureKey);
    this.setPosition(config.x, config.y);
    this.setActive(true);
    this.setVisible(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;

    this.damage = config.damage;
    this.knockback = config.knockback;
    this.piercing = config.piercing;
    this.weaponType = config.weaponType;
    this.isCrit = config.isCrit;

    body.setVelocity(
      Math.cos(config.angle) * config.speed,
      Math.sin(config.angle) * config.speed
    );
    this.setRotation(config.angle);

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
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
  }
}
