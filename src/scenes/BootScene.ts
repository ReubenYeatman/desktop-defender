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
    this.load.image('icon_damage', 'assets/ui/icon_damage.png');
    this.load.image('icon_firerate', 'assets/ui/icon_firerate.png');
    this.load.image('icon_speed', 'assets/ui/icon_speed.png');
    this.load.image('icon_knockback', 'assets/ui/icon_knockback.png');
    this.load.image('icon_fortify', 'assets/ui/icon_fortify.png');
    this.load.image('icon_greed', 'assets/ui/icon_greed.png');
    this.load.image('icon_crit', 'assets/ui/icon_crit.png');
    this.load.image('icon_scope', 'assets/ui/icon_scope.png');
    this.load.image('icon_regen', 'assets/ui/icon_regen.png');
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

    // Geometric Anomalies
    this.createEnemyGlitch();
    this.createEnemyTrojan();
    this.createEnemyFirewall();
    this.createEnemySeeker();
    this.createEnemyScout();

    this.createBoss();
    this.createBossMinion();

    // === PROJECTILE ===
    this.createProjectile();

    // Data fragments
    this.generateRectTexture('particle-data', 4, 4, 0xff2222);

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

  // --- TURRET BASE: Diamond shaped frame ---
  private createTurretBase() {
    const size = 48; // A bit larger to fit everything
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Diamond frame
    const hw = 16;
    gfx.lineStyle(3, 0x4a9eff, 1);
    gfx.strokePoints([
      { x: cx, y: cy - hw },
      { x: cx + hw, y: cy },
      { x: cx, y: cy + hw },
      { x: cx - hw, y: cy },
      { x: cx, y: cy - hw }
    ]);
    // Inner pulse glow (faint)
    gfx.fillStyle(0x4a9eff, 0.2);
    gfx.fillPath();

    gfx.generateTexture('turret-base', size, size);
    gfx.destroy();
  }

  // --- TURRET BARREL: Represents the inner rotating square ---
  private createTurretBarrel() {
    const size = 16;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    gfx.lineStyle(2, 0xffffff, 1);
    gfx.strokeRect(cx - 6, cy - 6, 12, 12);

    // Directional indicator
    gfx.fillStyle(0xaaddff, 1);
    gfx.fillRect(cx - 2, cy - 8, 4, 4);

    gfx.generateTexture('turret-barrel', size, size);
    gfx.destroy();
  }

  // --- ENEMY: Grunt - Hollow Ring with glowing core && Digital gear ---
  private createEnemyGrunt() {
    const size = 24;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Glowing core
    gfx.fillStyle(COLOR_ENEMY_GRUNT, 1);
    gfx.fillCircle(cx, cy, 4);

    // Hollow Ring
    gfx.lineStyle(2, COLOR_ENEMY_GRUNT, 1);
    gfx.strokeCircle(cx, cy, 8);

    gfx.generateTexture('enemy-grunt', size, size);
    gfx.clear();

    // Digital Gear (Broken lines)
    gfx.lineStyle(2, 0xff8888, 1);
    // Draw 4 dashed arcs
    for (let i = 0; i < 4; i++) {
      gfx.beginPath();
      gfx.arc(cx, cy, 11, Phaser.Math.DegToRad(i * 90 + 10), Phaser.Math.DegToRad(i * 90 + 80), false);
      gfx.strokePath();
    }
    gfx.generateTexture('enemy-grunt-gear', size, size);

    gfx.destroy();
  }

  // --- ENEMY: Runner - sharp, spinning triangle ---
  private createEnemyRunner() {
    const size = 16;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Inner bright triangle
    gfx.fillStyle(COLOR_ENEMY_RUNNER, 1);
    gfx.fillTriangle(
      cx, cy - 8,   // Top
      cx + 8, cy + 6, // Bottom right
      cx - 8, cy + 6  // Bottom left
    );

    // Inner core glow
    gfx.fillStyle(0xffffff, 0.8);
    gfx.fillTriangle(
      cx, cy - 4,
      cx + 4, cy + 3,
      cx - 4, cy + 3
    );

    gfx.generateTexture('enemy-runner', size, size);
    gfx.destroy();
  }

  // --- ENEMY: Tank - Double-Outlined Square ---
  private createEnemyTank() {
    const size = 32;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Inner Square
    gfx.lineStyle(2, COLOR_ENEMY_TANK, 1);
    gfx.strokeRect(cx - 8, cy - 8, 16, 16);
    gfx.fillStyle(0x663333, 0.8);
    gfx.fillRect(cx - 8, cy - 8, 16, 16);

    gfx.generateTexture('enemy-tank', size, size);
    gfx.clear();

    // Outer Outline (Cracks when health drops)
    gfx.lineStyle(3, 0xaa5555, 1);
    gfx.strokeRect(cx - 12, cy - 12, 24, 24);
    gfx.generateTexture('enemy-tank-armor', size, size);

    // Cracked Outline
    gfx.clear();
    gfx.lineStyle(3, 0xaa5555, 1);
    // Draw broken rect
    gfx.beginPath();
    gfx.moveTo(cx - 12, cy - 12);
    gfx.lineTo(cx + 0, cy - 12); // Gap
    gfx.moveTo(cx + 12, cy - 12);
    gfx.lineTo(cx + 12, cy + 0); // Gap
    gfx.moveTo(cx + 12, cy + 12);
    gfx.lineTo(cx + 0, cy + 12); // Gap
    gfx.moveTo(cx - 12, cy + 12);
    gfx.lineTo(cx - 12, cy + 0); // Gap
    gfx.strokePath();

    // Add some inner crack lines
    gfx.lineStyle(1, 0xaa5555, 1);
    gfx.moveTo(cx - 12, cy - 4);
    gfx.lineTo(cx - 4, cy - 4);
    gfx.moveTo(cx + 4, cy + 12);
    gfx.lineTo(cx + 4, cy + 6);
    gfx.strokePath();

    gfx.generateTexture('enemy-tank-armor-cracked', size, size);

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

  // --- ENEMY: Glitch - Flickering Isosceles Triangle ---
  private createEnemyGlitch() {
    const size = 20;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    gfx.fillStyle(0x00ffcc, 1);
    gfx.fillTriangle(
      cx, cy - 10,
      cx + 8, cy + 8,
      cx - 8, cy + 8
    );
    gfx.generateTexture('enemy-glitch', size, size);
    gfx.destroy();
  }

  // --- ENEMY: Trojan - Nested Concentric Circles ---
  private createEnemyTrojan() {
    const size = 32;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    gfx.fillStyle(0x660066, 1);
    gfx.fillCircle(cx, cy, 14);

    gfx.lineStyle(2, 0xff00ff, 1);
    gfx.strokeCircle(cx, cy, 14);
    gfx.strokeCircle(cx, cy, 9);
    gfx.strokeCircle(cx, cy, 4);

    gfx.generateTexture('enemy-trojan', size, size);
    gfx.destroy();
  }

  // --- ENEMY: Firewall - Wide Neon Rectangle ---
  private createEnemyFirewall() {
    const width = 64;
    const height = 16;
    const gfx = this.add.graphics();
    const cx = width / 2;
    const cy = height / 2;

    gfx.fillStyle(0xcc3300, 0.8);
    gfx.fillRect(0, 0, width, height);

    gfx.lineStyle(2, 0xff5500, 1);
    gfx.strokeRect(0, 0, width, height);

    // Grid pattern
    gfx.lineStyle(1, 0xffaa00, 0.5);
    for (let i = 4; i < width; i += 8) {
      gfx.moveTo(i, 0);
      gfx.lineTo(i, height);
    }
    gfx.strokePath();

    gfx.generateTexture('enemy-firewall', width, height);
    gfx.destroy();
  }

  // --- ENEMY: Seeker - Rotating Octagon ---
  private createEnemySeeker() {
    const size = 24;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    const radius = 10;
    gfx.lineStyle(2, 0xffff00, 1);
    gfx.fillStyle(0x444400, 0.9);

    const path = [];
    for (let i = 0; i <= 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      path.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      });
    }

    gfx.beginPath();
    gfx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) gfx.lineTo(path[i].x, path[i].y);
    gfx.closePath();
    gfx.fillPath();
    gfx.strokePath();

    // Inner eye
    gfx.fillStyle(0xff0000, 1);
    gfx.fillCircle(cx, cy, 3);

    gfx.generateTexture('enemy-seeker', size, size);
    gfx.destroy();
  }

  // --- ENEMY: Scout - Small diamond (From Trojan) ---
  private createEnemyScout() {
    const size = 12;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    gfx.fillStyle(0xff00ff, 1);
    gfx.beginPath();
    gfx.moveTo(cx, cy - 6);
    gfx.lineTo(cx + 6, cy);
    gfx.lineTo(cx, cy + 6);
    gfx.lineTo(cx - 6, cy);
    gfx.closePath();
    gfx.fillPath();

    gfx.generateTexture('enemy-scout', size, size);
    gfx.destroy();
  }

  // --- BOSS: Geometric shapes (Hexagon, Octagon, Star) with nested outlines ---
  private createBoss() {
    const size = 80;
    const cx = size / 2;
    const cy = size / 2;

    // Base texture (empty, invisible) just for physics
    const gfx = this.add.graphics();
    gfx.fillStyle(0x000000, 0);
    gfx.fillCircle(cx, cy, 20);
    gfx.generateTexture('enemy-boss', size, size);

    // Boss 1: Hexagon Parts
    const createPolygon = (key: string, points: number, radius: number, color: number, lineWidth: number) => {
      gfx.clear();
      gfx.lineStyle(lineWidth, color, 1);
      const angleStep = (Math.PI * 2) / points;
      const path = [];
      for (let i = 0; i <= points; i++) {
        path.push({
          x: cx + Math.cos(i * angleStep) * radius,
          y: cy + Math.sin(i * angleStep) * radius
        });
      }
      gfx.strokePoints(path);
      gfx.generateTexture(key, size, size);
    };

    // Hexagon (Boss 1)
    createPolygon('boss-hex-outer', 6, 30, 0xff2222, 4);
    createPolygon('boss-hex-mid', 6, 22, 0xff5555, 3);
    createPolygon('boss-hex-inner', 6, 14, 0xff8888, 2);

    // Octagon (Boss 2)
    createPolygon('boss-oct-outer', 8, 35, 0xff00ff, 4);
    createPolygon('boss-oct-mid', 8, 25, 0xff44ff, 3);
    createPolygon('boss-oct-inner', 8, 15, 0xff88ff, 2);

    // Star (Boss 3)
    gfx.clear();
    const createStar = (key: string, outerRadius: number, innerRadius: number, color: number, lineWidth: number) => {
      gfx.clear();
      gfx.lineStyle(lineWidth, color, 1);
      const points = 5;
      const angleStep = Math.PI / points;
      const path = [];
      for (let i = 0; i <= points * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        path.push({
          x: cx + Math.cos(i * angleStep) * r,
          y: cy + Math.sin(i * angleStep) * r
        });
      }
      gfx.strokePoints(path);
      gfx.generateTexture(key, size, size);
    };

    createStar('boss-star-outer', 38, 15, 0xffaa00, 4);
    createStar('boss-star-mid', 28, 10, 0xffcc00, 3);
    createStar('boss-star-inner', 18, 5, 0xffff00, 2);

    gfx.destroy();
  }

  // --- BOSS MINION: Small spinning diamond ---
  private createBossMinion() {
    const size = 16;
    const gfx = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    gfx.fillStyle(0xff8800, 1);
    gfx.fillTriangle(
      cx, cy - 6,
      cx + 6, cy,
      cx, cy + 6
    );
    gfx.fillTriangle(
      cx, cy - 6,
      cx - 6, cy,
      cx, cy + 6
    );

    gfx.generateTexture('enemy-boss-minion', size, size);
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
