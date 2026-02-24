import Phaser from 'phaser';
import {
  TURRET_BASE_HP,
  TURRET_BASE_DAMAGE,
  TURRET_BASE_FIRE_RATE,
  TURRET_BASE_RANGE,
  TURRET_BASE_KNOCKBACK,
} from '../config/Constants';
import { EventBus } from '../managers/EventBus';
import type { Enemy } from './Enemy';

export class Turret {
  public scene: Phaser.Scene;
  public base: Phaser.GameObjects.Image;
  public barrel: Phaser.GameObjects.Image;
  public body: Phaser.Physics.Arcade.Body;

  public currentHealth: number;
  public maxHealth: number;
  public baseDamage: number;
  public fireRate: number;
  public range: number;
  public knockback: number;
  public critChance: number = 0;
  public critMultiplier: number = 2.0;

  public currentTarget: Enemy | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create sprites
    this.base = scene.add.image(x, y, 'turret-base');
    this.barrel = scene.add.image(x, y - 2, 'turret-barrel');
    this.barrel.setOrigin(0.5, 1);

    // Create a physics body via a zone
    const zone = scene.add.zone(x, y, 32, 32);
    scene.physics.add.existing(zone, true); // static body
    this.body = zone.body as Phaser.Physics.Arcade.Body;

    // Base stats
    this.maxHealth = TURRET_BASE_HP;
    this.currentHealth = this.maxHealth;
    this.baseDamage = TURRET_BASE_DAMAGE;
    this.fireRate = TURRET_BASE_FIRE_RATE;
    this.range = TURRET_BASE_RANGE;
    this.knockback = TURRET_BASE_KNOCKBACK;
  }

  get x(): number { return this.base.x; }
  get y(): number { return this.base.y; }

  setPosition(x: number, y: number) {
    this.base.setPosition(x, y);
    this.barrel.setPosition(x, y - 2);
    this.body.reset(x - 16, y - 16);
  }

  update(_time: number, _delta: number) {
    if (this.currentTarget && this.currentTarget.active) {
      const angle = Phaser.Math.Angle.Between(
        this.x, this.y,
        this.currentTarget.x, this.currentTarget.y
      );
      this.barrel.setRotation(angle + Math.PI / 2); // offset since barrel points up
    }
  }

  takeDamage(amount: number) {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    EventBus.emit('turret-damaged', {
      current: this.currentHealth,
      max: this.maxHealth,
    });
  }

  heal(amount: number) {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    EventBus.emit('turret-damaged', {
      current: this.currentHealth,
      max: this.maxHealth,
    });
  }

  getEffectiveDamage(): { damage: number; isCrit: boolean } {
    let damage = this.baseDamage;
    const isCrit = Math.random() < this.critChance;
    if (isCrit) {
      damage *= this.critMultiplier;
    }
    return { damage: Math.floor(damage), isCrit };
  }

  isAlive(): boolean {
    return this.currentHealth > 0;
  }
}
