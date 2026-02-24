import Phaser from 'phaser';
import { EventBus } from '../managers/EventBus';
import { ENEMY_BEHAVIOR } from '../config/EnemyBehaviorData';
import { GAMEPLAY_MULTIPLIERS } from '../config/BalanceData';
import { TIMING } from '../config/TimingData';
import { UI_THEME } from '../config/UITheme';

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
  bossNumber?: number; // Used for boss shape
  isElite?: boolean;
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
  private spawnTime: number = 0;
  private originalSpeed: number = 0;

  public invulnerable: boolean = false;
  private visualLayers: Phaser.GameObjects.Sprite[] = [];
  private bossNumber: number = 1;
  private isFlashed: boolean = false;
  private bossHpThresholds: number[] = [0.75, 0.5, 0.25];
  private behaviorTimer?: Phaser.Time.TimerEvent;
  public isElite: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy-grunt');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  isTargetable(): boolean {
    return !this.invulnerable;
  }

  private clearVisualLayers() {
    for (const layer of this.visualLayers) {
      layer.destroy();
    }
    this.visualLayers = [];
  }

  spawn(config: EnemySpawnConfig) {
    this.clearVisualLayers();
    this.setTexture(config.textureKey);
    this.setPosition(config.x, config.y);
    this.setActive(true);
    this.setVisible(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;

    this.health = config.health;
    this.maxHealth = config.health;
    this.speed = config.speed;
    this.originalSpeed = config.speed;
    this.damage = config.damage;
    this.xpValue = config.xpValue;
    this.goldValue = config.goldValue;
    this.enemyType = config.type;
    this.turretX = config.turretX;
    this.turretY = config.turretY;
    this.spawnTime = this.scene.time.now;
    this.invulnerable = false; // Reset by default
    this.bossNumber = config.bossNumber || 1;
    this.bossHpThresholds = [0.75, 0.5, 0.25]; // Reset thresholds for new spawns
    this.isElite = config.isElite || false;
    this.setScale(this.isElite ? GAMEPLAY_MULTIPLIERS.eliteScale : 1);
    this.clearTint();
    if (this.isElite) {
      this.setTint(UI_THEME.eliteTint);
    }

    // Initialize visual layers based on enemy type
    if (this.enemyType === 'grunt') {
      const gear = this.scene.add.sprite(this.x, this.y, 'enemy-grunt-gear');
      gear.setDepth(this.depth + 1);
      this.visualLayers.push(gear);
    } else if (this.enemyType === 'tank') {
      const armor = this.scene.add.sprite(this.x, this.y, 'enemy-tank-armor');
      armor.setDepth(this.depth + 1);
      this.visualLayers.push(armor);
    } else if (this.enemyType === 'boss') {
      const bossTypeCount = 3;
      const typeIndex = ((this.bossNumber - 1) % bossTypeCount); // 0=hex, 1=oct, 2=star
      let outerKey = 'boss-hex-outer';
      let midKey = 'boss-hex-mid';
      let innerKey = 'boss-hex-inner';

      if (typeIndex === 1) {
        outerKey = 'boss-oct-outer';
        midKey = 'boss-oct-mid';
        innerKey = 'boss-oct-inner';
      } else if (typeIndex === 2) {
        outerKey = 'boss-star-outer';
        midKey = 'boss-star-mid';
        innerKey = 'boss-star-inner';
      }

      this.setTexture('enemy-boss'); // Base invisible physics geometry
      // Scale boss based on generation
      const scaleMultiplier = 1 + (this.bossNumber - 1) * GAMEPLAY_MULTIPLIERS.bossScalePerGeneration;

      const outer = this.scene.add.sprite(this.x, this.y, outerKey).setScale(scaleMultiplier);
      const mid = this.scene.add.sprite(this.x, this.y, midKey).setScale(scaleMultiplier);
      const inner = this.scene.add.sprite(this.x, this.y, innerKey).setScale(scaleMultiplier);

      this.visualLayers.push(outer, mid, inner);
    }

    if (this.enemyType === 'glitch') {
      this.behaviorTimer = this.scene.time.addEvent({
        delay: ENEMY_BEHAVIOR.glitch.teleportInterval,
        loop: true,
        callback: () => {
          if (this.active && !this.invulnerable) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.turretX, this.turretY);
            if (dist > ENEMY_BEHAVIOR.glitch.minTeleportRange) {
              const ang = Phaser.Math.Angle.Between(this.x, this.y, this.turretX, this.turretY);
              this.setPosition(
                this.x + Math.cos(ang) * ENEMY_BEHAVIOR.glitch.teleportDistance,
                this.y + Math.sin(ang) * ENEMY_BEHAVIOR.glitch.teleportDistance
              );
              this.setTintFill(UI_THEME.glitchTint);
              this.scene.time.delayedCall(TIMING.glitchTintDuration, () => {
                if (this.active) this.clearTint();
              });
            }
          }
        }
      });
    } else if (this.enemyType === 'seeker') {
      this.behaviorTimer = this.scene.time.addEvent({
        delay: ENEMY_BEHAVIOR.seeker.beamInterval,
        loop: true,
        callback: () => {
          if (this.active && !this.invulnerable) {
            // Seeker beam attack
            const line = this.scene.add.line(0, 0, this.x, this.y, this.turretX, this.turretY, UI_THEME.seekerBeam, 0.8);
            line.setOrigin(0, 0);
            line.setLineWidth(4);
            line.setBlendMode('ADD');
            this.scene.tweens.add({
              targets: line,
              alpha: 0,
              lineWidth: 0,
              duration: TIMING.seekerBeamFade,
              onComplete: () => line.destroy()
            });
            // Direct damage to turret
            EventBus.emit('enemy-beam-attack', { damage: this.damage });
          }
        }
      });
    }

    this.moveTowardTurret();
  }

  preUpdate(time: number, delta: number) {
    if (!this.active) return;
    super.preUpdate(time, delta);
    this.moveTowardTurret();

    if (this.isFlashed) {
      this.clearTint();
      this.isFlashed = false;
    }

    // Sync visual layers
    const dtSeconds = delta / 1000;
    for (let i = 0; i < this.visualLayers.length; i++) {
      const layer = this.visualLayers[i];
      layer.setPosition(this.x, this.y);

      // Custom rotations
      if (this.enemyType === 'grunt') {
        layer.rotation += 2.0 * dtSeconds; // gear rotates
      } else if (this.enemyType === 'tank') {
        layer.rotation = this.rotation; // Match body
      } else if (this.enemyType === 'boss') {
        // Boss has 3 layers: outer(0), mid(1), inner(2)
        if (i === 0) layer.rotation += 1.0 * dtSeconds;
        if (i === 1) layer.rotation -= 1.5 * dtSeconds;
        if (i === 2) layer.rotation += 2.0 * dtSeconds;
      }
    }

    if (this.enemyType === 'glitch') {
      this.alpha = 0.3 + 0.7 * Math.abs(Math.sin((this.scene.time.now - this.spawnTime) * 0.01));
    } else {
      this.alpha = 1;
    }
  }

  moveTowardTurret() {
    let angle = Phaser.Math.Angle.Between(
      this.x, this.y,
      this.turretX, this.turretY
    );
    const body = this.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;

    if (this.enemyType === 'boss' && this.invulnerable) {
      // Orbital behavior: approach until a certain distance, then circle
      const distSq = Phaser.Math.Distance.Squared(this.x, this.y, this.turretX, this.turretY);
      const targetDist = ENEMY_BEHAVIOR.boss.orbitDistance;

      if (distSq > targetDist * targetDist + 1000) {
        vx = Math.cos(angle) * this.speed;
        vy = Math.sin(angle) * this.speed;
      } else if (distSq < targetDist * targetDist - 1000) {
        vx = -Math.cos(angle) * this.speed;
        vy = -Math.sin(angle) * this.speed;
      } else {
        const tangentAngle = angle + Math.PI / 2;
        vx = Math.cos(tangentAngle) * this.speed;
        vy = Math.sin(tangentAngle) * this.speed;
      }
      this.rotation = Math.atan2(vy, vx) + Math.PI / 2;
    } else {
      // Default behavior
      vx = Math.cos(angle) * this.speed;
      vy = Math.sin(angle) * this.speed;

      const timeAlive = this.scene.time.now - this.spawnTime;
      const perpAngle = angle + Math.PI / 2;

      if (this.enemyType === 'runner') {
        const wave = Math.sin(timeAlive * 0.01) * (this.speed * GAMEPLAY_MULTIPLIERS.runnerWaveAmplitude);
        vx += Math.cos(perpAngle) * wave;
        vy += Math.sin(perpAngle) * wave;
        this.rotation += 0.2;
      } else if (this.enemyType === 'boss') {
        // Enraged boss moves erratically
        const wave = Math.sin(timeAlive * 0.005) * (this.speed * GAMEPLAY_MULTIPLIERS.bossErraticAmplitude);
        vx += Math.cos(perpAngle) * wave;
        vy += Math.sin(perpAngle) * wave;
        this.rotation = angle + Math.PI / 2;
      } else if (this.enemyType === 'tank' || this.enemyType === 'firewall') {
        this.rotation = angle + Math.PI / 2;
      } else if (this.enemyType === 'boss-minion') {
        this.rotation += 0.1;
      } else if (this.enemyType === 'glitch' || this.enemyType === 'scout') {
        this.rotation = angle + Math.PI / 2;
      } else if (this.enemyType === 'seeker') {
        // Seeker: Orbits at configured distance
        const targetDist = ENEMY_BEHAVIOR.seeker.orbitDistance;
        const distSq = Phaser.Math.Distance.Squared(this.x, this.y, this.turretX, this.turretY);
        // Reset default velocity so we don't double up
        vx = 0; vy = 0;
        if (distSq > targetDist * targetDist + 1000) {
          vx = Math.cos(angle) * this.speed;
          vy = Math.sin(angle) * this.speed;
        } else if (distSq < targetDist * targetDist - 1000) {
          vx = -Math.cos(angle) * this.speed;
          vy = -Math.sin(angle) * this.speed;
        } else {
          const tangentAngle = angle + Math.PI / 2;
          vx = Math.cos(tangentAngle) * this.speed;
          vy = Math.sin(tangentAngle) * this.speed;
        }
        this.rotation += 0.05;
      }
    }

    body.setVelocity(vx, vy);
  }

  takeDamage(amount: number, knockbackForce: number = 0, isCrit: boolean = false) {
    if (this.invulnerable) return;

    this.health -= amount;

    // White flash on hit
    this.setTintFill(UI_THEME.textPrimary);
    this.scene.time.delayedCall(TIMING.damageFlashDuration, () => {
      if (this.active && !this.invulnerable) {
        this.clearTint();
        if (this.isElite) this.setTint(UI_THEME.eliteTint);
      }
    });

    // Spawn Impact Spark
    EventBus.emit('weapon-fired-vfx', { x: this.x, y: this.y, key: 'particle-spark' });

    if (this.enemyType === 'tank' && this.health < this.maxHealth * GAMEPLAY_MULTIPLIERS.tankArmorCrackThreshold) {
      if (this.visualLayers.length > 0) {
        const armor = this.visualLayers[0];
        if (armor && armor.texture.key === 'enemy-tank-armor') {
          armor.setTexture('enemy-tank-armor-cracked');
          // Emit some debris
          EventBus.emit('enemy-killed', { x: this.x, y: this.y, xpValue: 0, goldValue: 0, enemyType: 'tank-armor' });
        }
      }
    }

    EventBus.emit('damage-dealt', {
      x: this.x,
      y: this.y,
      amount,
      isCrit,
    });

    // Boss HP tracking and Thresholds
    if (this.enemyType === 'boss') {
      const currentRatio = this.health / this.maxHealth;

      // Check for recovery state thresholds
      if (this.bossHpThresholds.length > 0 && currentRatio <= this.bossHpThresholds[0]) {
        this.bossHpThresholds.shift(); // Remove passed threshold
        this.triggerBossRecoveryState();
      }

      EventBus.emit('boss-damaged', {
        current: Math.max(0, this.health),
        max: this.maxHealth,
      });
    }

    if (knockbackForce > 0) {
      let appliedForce = knockbackForce;
      if (this.enemyType === 'boss') {
        appliedForce *= ENEMY_BEHAVIOR.boss.knockbackReduction;
      }

      const vec = new Phaser.Math.Vector2(this.x - this.turretX, this.y - this.turretY).normalize();
      const body = this.body as Phaser.Physics.Arcade.Body;

      // Apply as physics impulse
      body.velocity.x += vec.x * appliedForce;
      body.velocity.y += vec.y * appliedForce;

      this.scene.time.delayedCall(TIMING.knockbackRecovery, () => {
        if (this.active) this.moveTowardTurret();
      });
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  private triggerBossRecoveryState() {
    this.invulnerable = true;
    this.speed = 0; // Stationary

    // Recovery Visuals (white flicker loop)
    const originalTint = this.tintTopLeft;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    // Play charging/flickering tween
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: ENEMY_BEHAVIOR.boss.recoveryFlickerSpeed,
      yoyo: true,
      repeat: ENEMY_BEHAVIOR.boss.recoveryFlickerCount,
      onUpdate: (tween) => {
        if (this.active) {
          const val = tween.getValue();
          if (val !== null) {
            this.setTintFill(val > 0.5 ? UI_THEME.recoveryFlickerLight : UI_THEME.recoveryFlickerDark);
          }
        }
      },
      onComplete: () => {
        if (this.active) {
          this.clearTint();
          if (originalTint !== 0xffffff) {
            this.setTint(originalTint);
          }
          this.invulnerable = false;
          // Restore original speed
          this.speed = this.originalSpeed;
          if (this.active) this.moveTowardTurret();
        }
      }
    });

    // Notify WaveSystem that boss is recovering (so it stops shooting, etc if applicable)
    EventBus.emit('boss-recovery-state');
  }

  die() {
    if (this.enemyType === 'boss') {
      EventBus.emit('boss-killed', { x: this.x, y: this.y });
    } else if (this.enemyType === 'trojan') {
      EventBus.emit('spawn-scouts', { x: this.x, y: this.y, count: 4 });
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
    if (this.behaviorTimer) {
      this.behaviorTimer.destroy();
      this.behaviorTimer = undefined;
    }
    this.setActive(false);
    this.setVisible(false);
    this.clearVisualLayers();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.enable = false;
  }
}
