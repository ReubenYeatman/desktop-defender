import Phaser from 'phaser';
import type { Turret } from '../entities/Turret';
import type { Enemy } from '../entities/Enemy';
import type { ProjectilePool } from './ProjectilePool';
import type { EnemyPool } from './EnemyPool';
import { WEAPONS, type WeaponDefinition } from '../config/WeaponData';
import { EventBus } from '../managers/EventBus';
import { GAMEPLAY_MULTIPLIERS } from '../config/BalanceData';
import { UI_THEME } from '../config/UITheme';

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
    this.activeWeapon = WEAPONS['blaster'];
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

    // Predictive Aiming: lead the target based on projectile speed
    let aimX = target.x;
    let aimY = target.y;
    const projSpeed = this.activeWeapon.projectileSpeed;

    if (projSpeed > 0 && target.body) {
      const dist = Phaser.Math.Distance.Between(this.turret.x, this.turret.y, target.x, target.y);
      const timeToHit = dist / projSpeed;
      const tBody = target.body as Phaser.Physics.Arcade.Body;
      aimX += tBody.velocity.x * timeToHit;
      aimY += tBody.velocity.y * timeToHit;
    }

    const angle = Phaser.Math.Angle.Between(
      this.turret.x, this.turret.y,
      aimX, aimY
    );

    // Calculate barrel tip position for muzzle flash
    const barrelLength = 14;
    const flashX = this.turret.x + Math.cos(angle) * barrelLength;
    const flashY = this.turret.y + Math.sin(angle) * barrelLength;

    const multishot = this.turret.multishot || 1;

    switch (this.activeWeapon.pattern) {
      case 'single':
        if (multishot > 1) {
          // Tight exactly 10-degree spread for multishot
          const spreadArc = 10;
          this.fireSpread(angle, multishot, spreadArc);
        } else {
          this.fireSingle(angle);
        }
        break;
      case 'spread':
        // Cannon weapon gets slightly wider with multishot
        const cannonBaseSpread = this.activeWeapon.spreadAngle || 30;
        const cannonSpreadArc = cannonBaseSpread + (multishot - 1) * GAMEPLAY_MULTIPLIERS.cannonSpreadPerMultishot;
        this.fireSpread(angle, (this.activeWeapon.spreadCount || 5) + (multishot - 1) * 2, cannonSpreadArc);
        break;
      case 'beam':
        this.fireBeam(angle, target, multishot);
        break;
      case 'chain':
        this.fireChain(target);
        break;
    }

    this.turret.applyRecoil(angle);

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

  private fireSpread(baseAngle: number, count: number, totalArcDeg: number) {
    const totalArc = Phaser.Math.DegToRad(totalArcDeg);
    const startAngle = baseAngle - totalArc / 2;
    const step = count > 1 ? totalArc / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      // Small offset to ensure exact mathematical centering
      // If count is even (e.g., 2), we want to shoot on either side of the center.
      // If count is odd (e.g., 3), one shot goes straight down the middle.
      let finalAngle = startAngle + step * i;
      if (count === 1) finalAngle = baseAngle;
      const { damage, isCrit } = this.turret.getEffectiveDamage();
      this.projectilePool.fire({
        x: this.turret.x,
        y: this.turret.y,
        angle: finalAngle,
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

  private fireBeam(baseAngle: number, target: Enemy, multishot: number) {
    // Continuous Neon Laser - raycast mock
    const { damage, isCrit } = this.turret.getEffectiveDamage();
    const length = 1000;

    // Create laser visuals
    const count = multishot;
    const totalArc = Phaser.Math.DegToRad(multishot > 1 ? 20 : 0);
    const startAngle = baseAngle - totalArc / 2;
    const step = count > 1 ? totalArc / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + step * i;
      const endX = this.turret.x + Math.cos(angle) * length;
      const endY = this.turret.y + Math.sin(angle) * length;

      const line = this.scene.add.line(0, 0, this.turret.x, this.turret.y, endX, endY, UI_THEME.laserBeam, 0.8);
      line.setOrigin(0, 0);
      line.setLineWidth(4);
      line.setBlendMode('ADD');

      this.scene.tweens.add({
        targets: line,
        alpha: 0,
        lineWidth: 0,
        duration: 200,
        onComplete: () => line.destroy()
      });

      // Apply damage immediately to targets in a ray (mocking a line intersection)
      if (this.enemyPool) {
        const enemies = this.enemyPool.getActiveEnemies();
        const lineSeg = new Phaser.Geom.Line(this.turret.x, this.turret.y, endX, endY);
        for (const e of enemies) {
          if (!e.active) continue;
          const circle = new Phaser.Geom.Circle(e.x, e.y, 20); // rough hitbox
          if (Phaser.Geom.Intersects.LineToCircle(lineSeg, circle)) {
            e.takeDamage(damage * GAMEPLAY_MULTIPLIERS.beamDamageMultiplier, this.turret.knockback, isCrit);
          }
        }
      }
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
            UI_THEME.chainLightning, 0.8
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
