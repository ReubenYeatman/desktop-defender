export const GAME_WIDTH = 500;
export const GAME_HEIGHT = 500;

// Turret base stats
export const TURRET_BASE_HP = 100;
export const TURRET_BASE_DAMAGE = 10;
export const TURRET_BASE_FIRE_RATE = 1.0; // shots per second
export const TURRET_BASE_RANGE = 200;
export const TURRET_BASE_KNOCKBACK = 0;

// Pool sizes
export const ENEMY_POOL_SIZE = 80;
export const PROJECTILE_POOL_SIZE = 150;
export const LOOT_POOL_SIZE = 20;
export const DAMAGE_NUMBER_POOL_SIZE = 30;

// Wave timing
export const WAVE_BREAK_DURATION = 3000; // ms
export const BOSS_WAVE_BREAK_DURATION = 4000;
export const BOSS_WAVE_INTERVAL = 5; // boss every N waves

// Colors
export const COLOR_BACKGROUND = 0x1a1a2e;
export const COLOR_TURRET = 0x4a9eff;
export const COLOR_TURRET_BARREL = 0x7bbcff;
export const COLOR_ENEMY_GRUNT = 0xff4444;
export const COLOR_ENEMY_RUNNER = 0xff8844;
export const COLOR_ENEMY_TANK = 0x884444;
export const COLOR_ENEMY_SWARM = 0xff6666;
export const COLOR_ENEMY_SHIELD = 0x44aaff;
export const COLOR_ENEMY_HEALER = 0x44ff88;
export const COLOR_BOSS = 0xff0000;
export const COLOR_PROJECTILE = 0xffff44;
export const COLOR_HP_BAR = 0x44ff44;
export const COLOR_HP_BAR_BG = 0x442222;
export const COLOR_XP_BAR = 0x4488ff;
export const COLOR_XP_BAR_BG = 0x222244;
export const COLOR_GOLD = 0xffd700;

// Rarity colors
export const RARITY_COLORS = {
  common: 0xaaaaaa,
  uncommon: 0x44ff44,
  rare: 0x4488ff,
  epic: 0xaa44ff,
  legendary: 0xff8800,
} as const;
