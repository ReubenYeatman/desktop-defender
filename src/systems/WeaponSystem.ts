import Phaser from 'phaser';
import type { Turret } from '../entities/Turret';
import type { Enemy } from '../entities/Enemy';
import type { ProjectilePool } from './ProjectilePool';
import type { EnemyPool } from './EnemyPool';
import { WEAPONS, type WeaponDefinition } from '../config/WeaponData';
import { EventBus } from '../managers/EventBus';

export class WeaponSystem {
  private scene: Phaser.Scene;
  private turret: Turret;
  private projectilePool: ProjectilePool;
  private enemyPool: EnemyPool | null = null;
  private fireCooldown: number = 0;
  private activeWeapon: WeaponDefinition;

  constructor(scene: Phaser.Scene, turret: Turret, projectilePool: ProjectilePool) {
    this.scene = scene;
    this.turret = turret;
    this.projectilePool = projectilePool;
    this.activeWeapon = WEAPONS['basic'];
  }

  setEnemyPool(pool: EnemyPool) {
    this.enemyPool = pool;
  }

  setWeapon(weaponId: string) {
    const weapon = WEAPONS[weaponId];
    if (weapon) {
      this.activeWeapon = weapon;
    }
  }

  getActiveWeapon(): WeaponDefinition {
    return this.activeWeapon;
  }

  update(_time: number, delta: number) {
    if (!this.turret.currentTarget || !this.turret.currentTarget.active) return;

    this.fireCooldown -= delta;
    if (this.fireCooldown <= 0) {
      this.fire();
      const effectiveFireRate = this.activeWeapon.baseFireRate * (this.turret.fireRate / 1.0);
      this.fireCooldown = 1000 / effectiveFireRate;
    }
  }

  private fire() {
    const target = this.turret.currentTarget!;
    const angle = Phaser.Math.Angle.Between(
      this.turret.x, this.turret.y,
      target.x, target.y
    );

    // Calculate barrel tip position for muzzle flash
    const barrelLength = 14;
    const flashX = this.turret.x + Math.cos(angle) * barrelLength;
    const flashY = this.turret.y + Math.sin(angle) * barrelLength;

    switch (this.activeWeapon.pattern) {
      case 'single':
        this.fireSingle(angle);
        break;
      case 'spread':
        this.fireSpread(angle);
        break;
      case 'chain':
        this.fireChain(target);
        break;
    }

    EventBus.emit('weapon-fired', this.activeWeapon.id);
    EventBus.emit('weapon-fired-vfx', { x: flashX, y: flashY });
  }

  private fireSingle(angle: number) {
    const { damage, isCrit } = this.turret.getEffectiveDamage();
    this.projectilePool.fire({
      x: this.turret.x,
      y: this.turret.y,
      angle,
      speed: this.activeWeapon.projectileSpeed,
      damage,
      knockback: this.activeWeapon.knockback + this.turret.knockback,
      piercing: this.activeWeapon.piercing,
      lifetime: this.activeWeapon.projectileLifetime,
      weaponType: this.activeWeapon.id,
      textureKey: this.activeWeapon.textureKey,
      isCrit,
    });
  }

  private fireSpread(baseAngle: number) {
    const count = this.activeWeapon.spreadCount || 5;
    const totalArc = Phaser.Math.DegToRad(this.activeWeapon.spreadAngle || 30);
    const startAngle = baseAngle - totalArc / 2;
    const step = count > 1 ? totalArc / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const { damage, isCrit } = this.turret.getEffectiveDamage();
      this.projectilePool.fire({
        x: this.turret.x,
        y: this.turret.y,
        angle: startAngle + step * i,
        speed: this.activeWeapon.projectileSpeed,
        damage,
        knockback: this.activeWeapon.knockback + this.turret.knockback,
        piercing: 0,
        lifetime: this.activeWeapon.projectileLifetime,
        weaponType: this.activeWeapon.id,
        textureKey: this.activeWeapon.textureKey,
        isCrit,
      });
    }
  }

  private fireChain(target: Enemy) {
    if (!this.enemyPool) return;

    const chainCount = this.activeWeapon.chainCount || 3;
    const chainRange = this.activeWeapon.chainRange || 80;
    const decay = this.activeWeapon.chainDamageDecay || 0.7;

    const { damage: baseDmg, isCrit } = this.turret.getEffectiveDamage();
    let damage = baseDmg;
    let currentTarget: Enemy | null = target;
    const hit = new Set<Enemy>();

    for (let i = 0; i <= chainCount && currentTarget; i++) {
      currentTarget.takeDamage(damage, 0, i === 0 ? isCrit : false);
      hit.add(currentTarget);

      // Draw lightning line visual
      if (i > 0) {
        const prev = [...hit][hit.size - 2];
        if (prev) {
          const line = this.scene.add.line(
            0, 0,
            prev.x, prev.y,
            currentTarget.x, currentTarget.y,
            0x88ccff, 0.8
          );
          line.setOrigin(0, 0);
          this.scene.tweens.add({
            targets: line,
            alpha: 0,
            duration: 200,
            onComplete: () => line.destroy(),
          });
        }
      }

      damage = Math.floor(damage * decay);

      // Find next nearest enemy not yet hit
      const enemies = this.enemyPool.getActiveEnemies();
      let nearest: Enemy | null = null;
      let nearestDist = chainRange * chainRange;
      for (const e of enemies) {
        if (hit.has(e) || !e.active) continue;
        const dx = currentTarget.x - e.x;
        const dy = currentTarget.y - e.y;
        const dist = dx * dx + dy * dy;
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = e;
        }
      }
      currentTarget = nearest;
    }
  }
}
