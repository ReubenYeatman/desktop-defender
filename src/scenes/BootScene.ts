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
} from '../config/Constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Generate placeholder textures (colored rectangles)
    this.createPlaceholderTextures();
  }

  create() {
    this.scene.start('MainMenuScene');
  }

  private createPlaceholderTextures() {
    // Turret base - blue circle
    this.generateCircleTexture('turret-base', 16, COLOR_TURRET);
    // Turret barrel - lighter blue rectangle
    this.generateRectTexture('turret-barrel', 4, 14, COLOR_TURRET_BARREL);

    // Enemy types - colored circles at different sizes
    this.generateCircleTexture('enemy-grunt', 8, COLOR_ENEMY_GRUNT);
    this.generateCircleTexture('enemy-runner', 6, COLOR_ENEMY_RUNNER);
    this.generateCircleTexture('enemy-tank', 12, COLOR_ENEMY_TANK);
    this.generateCircleTexture('enemy-swarm', 5, COLOR_ENEMY_SWARM);
    this.generateCircleTexture('enemy-shield', 8, COLOR_ENEMY_SHIELD);
    this.generateCircleTexture('enemy-healer', 8, COLOR_ENEMY_HEALER);

    // Boss - big red circle
    this.generateCircleTexture('enemy-boss', 20, COLOR_BOSS);

    // Projectile - small yellow circle
    this.generateCircleTexture('projectile-basic', 3, COLOR_PROJECTILE);

    // Loot drop - small colored squares (one per rarity)
    this.generateRectTexture('loot-common', 8, 8, 0xaaaaaa);
    this.generateRectTexture('loot-uncommon', 8, 8, 0x44ff44);
    this.generateRectTexture('loot-rare', 8, 8, 0x4488ff);
    this.generateRectTexture('loot-epic', 8, 8, 0xaa44ff);
    this.generateRectTexture('loot-legendary', 8, 8, 0xff8800);
  }

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
