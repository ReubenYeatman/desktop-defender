import Phaser from 'phaser';
import {
  COLOR_TURRET,
  COLOR_TURRET_BARREL,
  COLOR_ENEMY_GRUNT,
  COLOR_ENEMY_RUNNER,
  COLOR_ENEMY_TANK,
  COLOR_ENEMY_SWARM,
  COLOR_ENEMY_SHIELD,
  COLOR_ENEMY_HEALER,
  COLOR_BOSS,
  COLOR_PROJECTILE,
  COLOR_PARTICLE_WHITE,
  COLOR_PARTICLE_YELLOW,
  COLOR_PARTICLE_ORANGE,
  COLOR_HIT_SPARK,
  COLOR_MUZZLE_FLASH,
} from '../config/Constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.createPixelArtTextures();
  }

  create() {
    this.scene.start('MainMenuScene');
  }

  private createPixelArtTextures() {
    // === TURRET ===
    this.createTurretBase();
    this.createTurretBarrel();

    // === ENEMIES ===
    this.createEnemyGrunt();
    this.createEnemyRunner();
    this.createEnemyTank();
    this.createEnemySwarm();
    this.createEnemyShield();
    this.createEnemyHealer();
    this.createBoss();

    // === PROJECTILE ===
    this.createProjectile();

    // === LOOT DROPS ===
    this.createLootDrop('loot-common', 0xaaaaaa, 0x888888);
    this.createLootDrop('loot-uncommon', 0x44ff44, 0x228822);
    this.createLootDrop('loot-rare', 0x4488ff, 0x224488);
    this.createLootDrop('loot-epic', 0xaa44ff, 0x662288);
    this.createLootDrop('loot-legendary', 0xff8800, 0x884400);

    // === PARTICLES ===
    this.generateCircleTexture('particle-white', 2, COLOR_PARTICLE_WHITE);
    this.generateCircleTexture('particle-yellow', 2, COLOR_PARTICLE_YELLOW);
    this.generateCircleTexture('particle-orange', 2, COLOR_PARTICLE_ORANGE);
    this.generateCircleTexture('particle-spark', 1, COLOR_HIT_SPARK);
    this.generateCircleTexture('muzzle-flash', 4, COLOR_MUZZLE_FLASH);

    // === DEBRIS ===
    this.generateRectTexture('debris-small', 3, 3, 0xaaaaaa);
    this.generateRectTexture('debris-medium', 4, 4, 0x888888);
  }

  // --- TURRET BASE: Hexagonal with glow ring ---
  private createTurretBase() {
    const size = 32;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Outer glow ring
    gfx.fillStyle(0x2a5e9f, 0.3);
    gfx.fillCircle(cx, cy, 15);

    // Dark outline
    gfx.fillStyle(0x1a3a6e, 1);
    gfx.fillCircle(cx, cy, 12);

    // Inner body
    gfx.fillStyle(COLOR_TURRET, 1);
    gfx.fillCircle(cx, cy, 10);

    // Highlight arc
    gfx.fillStyle(0x7bbcff, 0.6);
    gfx.fillCircle(cx - 3, cy - 3, 5);

    // Center dot
    gfx.fillStyle(0xaaddff, 1);
    gfx.fillCircle(cx, cy, 3);

    // Inner core glow
    gfx.fillStyle(0xffffff, 0.4);
    gfx.fillCircle(cx, cy, 1.5);

    gfx.generateTexture('turret-base', size, size);
    gfx.destroy();
  }

  // --- TURRET BARREL: Gradient with muzzle tip ---
  private createTurretBarrel() {
    const w = 6;
    const h = 16;
    const gfx = this.add.graphics();

    // Dark outline
    gfx.fillStyle(0x1a3a6e, 1);
    gfx.fillRect(0, 0, w, h);

    // Inner barrel
    gfx.fillStyle(COLOR_TURRET_BARREL, 1);
    gfx.fillRect(1, 1, w - 2, h - 2);

    // Highlight stripe
    gfx.fillStyle(0xaaddff, 0.5);
    gfx.fillRect(1, 1, 1, h - 2);

    // Muzzle tip
    gfx.fillStyle(0xccddff, 1);
    gfx.fillRect(1, 0, w - 2, 2);

    gfx.generateTexture('turret-barrel', w, h);
    gfx.destroy();
  }

  // --- ENEMY: Grunt - with eyes ---
  private createEnemyGrunt() {
    const size = 16;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    gfx.fillStyle(0x881111, 1);
    gfx.fillCircle(cx, cy, 7);
    gfx.fillStyle(COLOR_ENEMY_GRUNT, 1);
    gfx.fillCircle(cx, cy, 6);

    // Eye slit
    gfx.fillStyle(0x220000, 1);
    gfx.fillRect(cx - 4, cy - 1, 8, 2);

    // Eye dots
    gfx.fillStyle(0xffff00, 1);
    gfx.fillRect(cx - 3, cy - 1, 2, 2);
    gfx.fillRect(cx + 1, cy - 1, 2, 2);

    // Highlight
    gfx.fillStyle(0xff8888, 0.5);
    gfx.fillCircle(cx - 2, cy - 3, 2);

    gfx.generateTexture('enemy-grunt', size, size);
    gfx.destroy();
  }

  // --- ENEMY: Runner - small, streaky ---
  private createEnemyRunner() {
    const size = 12;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    gfx.fillStyle(0x884400, 1);
    gfx.fillCircle(cx, cy, 5);
    gfx.fillStyle(COLOR_ENEMY_RUNNER, 1);
    gfx.fillCircle(cx, cy, 4);

    // Speed streak
    gfx.fillStyle(0xffcc88, 0.7);
    gfx.fillRect(cx - 3, cy, 6, 1);

    // Eyes
    gfx.fillStyle(0xffff00, 1);
    gfx.fillRect(cx - 2, cy - 2, 1, 1);
    gfx.fillRect(cx + 1, cy - 2, 1, 1);

    gfx.generateTexture('enemy-runner', size, size);
    gfx.destroy();
  }

  // --- ENEMY: Tank - big, armored ---
  private createEnemyTank() {
    const size = 24;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Outer armor
    gfx.fillStyle(0x442222, 1);
    gfx.fillCircle(cx, cy, 11);

    // Armor plating (squared look)
    gfx.fillStyle(0x663333, 1);
    gfx.fillRect(cx - 9, cy - 9, 18, 18);

    // Inner body
    gfx.fillStyle(COLOR_ENEMY_TANK, 1);
    gfx.fillCircle(cx, cy, 8);

    // Armor cross
    gfx.fillStyle(0x553333, 1);
    gfx.fillRect(cx - 1, cy - 9, 2, 18);
    gfx.fillRect(cx - 9, cy - 1, 18, 2);

    // Eye slit
    gfx.fillStyle(0xff2222, 1);
    gfx.fillRect(cx - 3, cy - 1, 6, 2);

    gfx.generateTexture('enemy-tank', size, size);
    gfx.destroy();
  }

  // --- ENEMY: Swarm - tiny with eye ---
  private createEnemySwarm() {
    const size = 10;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    gfx.fillStyle(0x882222, 1);
    gfx.fillCircle(cx, cy, 4);
    gfx.fillStyle(COLOR_ENEMY_SWARM, 1);
    gfx.fillCircle(cx, cy, 3);

    // Single eye
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(cx - 1, cy - 1, 2, 2);

    gfx.generateTexture('enemy-swarm', size, size);
    gfx.destroy();
  }

  // --- ENEMY: Shield - with shield ring ---
  private createEnemyShield() {
    const size = 18;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Shield ring
    gfx.lineStyle(2, 0x88ccff, 0.6);
    gfx.strokeCircle(cx, cy, 8);

    // Body
    gfx.fillStyle(0x224488, 1);
    gfx.fillCircle(cx, cy, 6);
    gfx.fillStyle(COLOR_ENEMY_SHIELD, 1);
    gfx.fillCircle(cx, cy, 5);

    // Shield cross icon
    gfx.fillStyle(0xaaddff, 0.8);
    gfx.fillRect(cx - 2, cy - 3, 4, 6);
    gfx.fillRect(cx - 3, cy - 2, 6, 4);

    // Eyes
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(cx - 2, cy - 1, 1, 1);
    gfx.fillRect(cx + 1, cy - 1, 1, 1);

    gfx.generateTexture('enemy-shield', size, size);
    gfx.destroy();
  }

  // --- ENEMY: Healer - with heal cross ---
  private createEnemyHealer() {
    const size = 18;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Heal aura
    gfx.fillStyle(0x228844, 0.3);
    gfx.fillCircle(cx, cy, 8);

    // Body
    gfx.fillStyle(0x228844, 1);
    gfx.fillCircle(cx, cy, 6);
    gfx.fillStyle(COLOR_ENEMY_HEALER, 1);
    gfx.fillCircle(cx, cy, 5);

    // Heal cross
    gfx.fillStyle(0xffffff, 0.9);
    gfx.fillRect(cx - 1, cy - 3, 2, 6);
    gfx.fillRect(cx - 3, cy - 1, 6, 2);

    gfx.generateTexture('enemy-healer', size, size);
    gfx.destroy();
  }

  // --- BOSS: Large with skull face and crown ---
  private createBoss() {
    const size = 40;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Danger aura
    gfx.fillStyle(0xff0000, 0.15);
    gfx.fillCircle(cx, cy, 19);

    // Outer ring
    gfx.fillStyle(0x660000, 1);
    gfx.fillCircle(cx, cy, 16);

    // Body
    gfx.fillStyle(COLOR_BOSS, 1);
    gfx.fillCircle(cx, cy, 14);

    // Inner dark
    gfx.fillStyle(0xcc0000, 1);
    gfx.fillCircle(cx, cy, 10);

    // Eye sockets
    gfx.fillStyle(0x220000, 1);
    gfx.fillRect(cx - 6, cy - 4, 4, 4);
    gfx.fillRect(cx + 2, cy - 4, 4, 4);

    // Eyes
    gfx.fillStyle(0xffff00, 1);
    gfx.fillRect(cx - 5, cy - 3, 2, 2);
    gfx.fillRect(cx + 3, cy - 3, 2, 2);

    // Mouth
    gfx.fillStyle(0x220000, 1);
    gfx.fillRect(cx - 4, cy + 2, 8, 2);
    gfx.fillRect(cx - 2, cy + 4, 4, 2);

    // Crown spikes
    gfx.fillStyle(0xffaa00, 1);
    gfx.fillRect(cx - 8, cy - 14, 2, 4);
    gfx.fillRect(cx - 1, cy - 16, 2, 6);
    gfx.fillRect(cx + 6, cy - 14, 2, 4);

    gfx.generateTexture('enemy-boss', size, size);
    gfx.destroy();
  }

  // --- PROJECTILE: Glowing bullet ---
  private createProjectile() {
    const size = 8;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Outer glow
    gfx.fillStyle(COLOR_PROJECTILE, 0.3);
    gfx.fillCircle(cx, cy, 3.5);

    // Core
    gfx.fillStyle(COLOR_PROJECTILE, 1);
    gfx.fillCircle(cx, cy, 2);

    // Hot center
    gfx.fillStyle(0xffffff, 0.8);
    gfx.fillCircle(cx, cy, 1);

    gfx.generateTexture('projectile-basic', size, size);
    gfx.destroy();
  }

  // --- LOOT DROP: Gem with shine ---
  private createLootDrop(key: string, color: number, darkColor: number) {
    const size = 12;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Glow
    gfx.fillStyle(color, 0.3);
    gfx.fillCircle(cx, cy, 5);

    // Dark base
    gfx.fillStyle(darkColor, 1);
    gfx.fillRect(cx - 3, cy - 3, 6, 6);

    // Main gem
    gfx.fillStyle(color, 1);
    gfx.fillRect(cx - 2, cy - 2, 4, 4);

    // Shine
    gfx.fillStyle(0xffffff, 0.6);
    gfx.fillRect(cx - 2, cy - 2, 2, 2);

    gfx.generateTexture(key, size, size);
    gfx.destroy();
  }

  // --- Utility ---
  private generateCircleTexture(key: string, radius: number, color: number) {
    const gfx = this.add.graphics();
    gfx.fillStyle(color, 1);
    gfx.fillCircle(radius, radius, radius);
    gfx.generateTexture(key, radius * 2, radius * 2);
    gfx.destroy();
  }

  private generateRectTexture(key: string, width: number, height: number, color: number) {
    const gfx = this.add.graphics();
    gfx.fillStyle(color, 1);
    gfx.fillRect(0, 0, width, height);
    gfx.generateTexture(key, width, height);
    gfx.destroy();
  }
}
