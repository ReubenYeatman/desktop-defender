import Phaser from 'phaser';
import { EventBus } from '../managers/EventBus';

export interface EnemySpawnConfig {
  x: number;
  y: number;
  turretX: number;
  turretY: number;
  health: number;
  speed: number;
  damage: number;
  xpValue: number;
  goldValue: number;
  type: string;
  textureKey: string;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public health: number = 0;
  public maxHealth: number = 0;
  public speed: number = 0;
  public damage: number = 0;
  public xpValue: number = 0;
  public goldValue: number = 0;
  public enemyType: string = '';
  private turretX: number = 0;
  private turretY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy-grunt');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  spawn(config: EnemySpawnConfig) {
    this.setTexture(config.textureKey);
    this.setPosition(config.x, config.y);
    this.setActive(true);
    this.setVisible(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;

    this.health = config.health;
    this.maxHealth = config.health;
    this.speed = config.speed;
    this.damage = config.damage;
    this.xpValue = config.xpValue;
    this.goldValue = config.goldValue;
    this.enemyType = config.type;
    this.turretX = config.turretX;
    this.turretY = config.turretY;

    this.moveTowardTurret();
  }

  moveTowardTurret() {
    const angle = Phaser.Math.Angle.Between(
      this.x, this.y,
      this.turretX, this.turretY
    );
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );
  }

  takeDamage(amount: number, knockbackForce: number = 0, isCrit: boolean = false) {
    this.health -= amount;

    // White flash on hit
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.clearTint();
    });

    EventBus.emit('damage-dealt', {
      x: this.x,
      y: this.y,
      amount,
      isCrit,
    });

    // Boss HP tracking
    if (this.enemyType === 'boss') {
      EventBus.emit('boss-damaged', {
        current: Math.max(0, this.health),
        max: this.maxHealth,
      });
    }

    if (knockbackForce > 0) {
      const angle = Phaser.Math.Angle.Between(
        this.turretX, this.turretY,
        this.x, this.y
      );
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(angle) * knockbackForce,
        Math.sin(angle) * knockbackForce
      );
      this.scene.time.delayedCall(150, () => {
        if (this.active) this.moveTowardTurret();
      });
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    if (this.enemyType === 'boss') {
      EventBus.emit('boss-killed', { x: this.x, y: this.y });
    }
    EventBus.emit('enemy-killed', {
      x: this.x,
      y: this.y,
      xpValue: this.xpValue,
      goldValue: this.goldValue,
      enemyType: this.enemyType,
    });
    this.deactivate();
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
  }
}
