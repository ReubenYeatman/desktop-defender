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

  public originalX: number = 0;
  public originalY: number = 0;
  public baseDamage: number;
  public fireRate: number;
  public range: number;
  public knockback: number;
  public critChance: number = 0;
  public critMultiplier: number = 2.0;
  public multishot: number = 1;

  public currentTarget: Enemy | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.originalX = x;
    this.originalY = y;

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
    this.originalX = x;
    this.originalY = y;
    this.base.setPosition(x, y);
    this.barrel.setPosition(x, y - 2);
    this.body.reset(x - 16, y - 16);
  }

  update(_time: number, delta: number) {
    // Inner square points to mouse cursor per request
    if (this.scene.input.activePointer) {
      const pointer = this.scene.input.activePointer;
      const angle = Phaser.Math.Angle.Between(
        this.originalX, this.originalY,
        pointer.worldX, pointer.worldY
      );
      this.barrel.setRotation(angle + Math.PI / 2);
    }

    // Recoil recovery lerp
    const lerpFactor = 1 - Math.pow(0.01, delta / 1000);
    this.base.x += (this.originalX - this.base.x) * lerpFactor;
    this.base.y += (this.originalY - this.base.y) * lerpFactor;
    this.barrel.x += (this.originalX - this.barrel.x) * lerpFactor;
    this.barrel.y += ((this.originalY - 2) - this.barrel.y) * lerpFactor;
  }

  applyRecoil(fireAngle: number) {
    const recoilDist = 6;
    const dx = Math.cos(fireAngle + Math.PI) * recoilDist;
    const dy = Math.sin(fireAngle + Math.PI) * recoilDist;

    this.base.x += dx;
    this.base.y += dy;
    this.barrel.x += dx;
    this.barrel.y += dy;
  }

  takeDamage(amount: number) {
    this.currentHealth = Math.max(0, this.currentHealth - amount);

    // 3-frame Neon Red flash (approx 50ms at 60fps)
    if (this.base && this.base.active) {
      this.base.setTintFill(0xff0000);
      this.barrel.setTintFill(0xff0000);
      this.scene.time.delayedCall(50, () => {
        if (this.base && this.base.active) {
          this.base.clearTint();
          this.barrel.clearTint();
        }
      });
    }

    EventBus.emit('turret-damaged', {
      current: this.currentHealth,
      max: this.maxHealth,
      x: this.x,
      y: this.y
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
