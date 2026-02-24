export interface EnemyDefinition {
  type: string;
  textureKey: string;
  healthMultiplier: number;
  speedMultiplier: number;
  damageMultiplier: number;
  goldMultiplier: number;
  xpMultiplier: number;
  unlocksAtWave: number;
}

export const ENEMY_TYPES: EnemyDefinition[] = [
  {
    type: 'grunt',
    textureKey: 'enemy-grunt',
    healthMultiplier: 1.0,
    speedMultiplier: 1.0,
    damageMultiplier: 1.0,
    goldMultiplier: 1.0,
    xpMultiplier: 1.0,
    unlocksAtWave: 1,
  },
  {
    type: 'runner',
    textureKey: 'enemy-runner',
    healthMultiplier: 0.5,
    speedMultiplier: 2.0,
    damageMultiplier: 0.7,
    goldMultiplier: 0.8,
    xpMultiplier: 0.8,
    unlocksAtWave: 5,
  },
  {
    type: 'tank',
    textureKey: 'enemy-tank',
    healthMultiplier: 3.0,
    speedMultiplier: 0.5,
    damageMultiplier: 2.0,
    goldMultiplier: 2.0,
    xpMultiplier: 2.0,
    unlocksAtWave: 10,
  },
  {
    type: 'swarm',
    textureKey: 'enemy-swarm',
    healthMultiplier: 0.3,
    speedMultiplier: 1.3,
    damageMultiplier: 0.4,
    goldMultiplier: 0.4,
    xpMultiplier: 0.4,
    unlocksAtWave: 15,
  },
  {
    type: 'shield',
    textureKey: 'enemy-shield',
    healthMultiplier: 1.5,
    speedMultiplier: 0.8,
    damageMultiplier: 1.2,
    goldMultiplier: 1.5,
    xpMultiplier: 1.5,
    unlocksAtWave: 20,
  },
  {
    type: 'healer',
    textureKey: 'enemy-healer',
    healthMultiplier: 1.0,
    speedMultiplier: 0.7,
    damageMultiplier: 0.8,
    goldMultiplier: 1.8,
    xpMultiplier: 1.8,
    unlocksAtWave: 25,
  },
  {
    type: 'glitch',
    textureKey: 'enemy-glitch',
    healthMultiplier: 0.8,
    speedMultiplier: 2.2,
    damageMultiplier: 1.5,
    goldMultiplier: 1.2,
    xpMultiplier: 1.2,
    unlocksAtWave: 6,
  },
  {
    type: 'seeker',
    textureKey: 'enemy-seeker',
    healthMultiplier: 1.2,
    speedMultiplier: 0.9,
    damageMultiplier: 1.5,
    goldMultiplier: 1.5,
    xpMultiplier: 1.5,
    unlocksAtWave: 8,
  },
  {
    type: 'trojan',
    textureKey: 'enemy-trojan',
    healthMultiplier: 3.5,
    speedMultiplier: 0.4,
    damageMultiplier: 2.0,
    goldMultiplier: 3.0,
    xpMultiplier: 3.0,
    unlocksAtWave: 12,
  },
  {
    type: 'firewall',
    textureKey: 'enemy-firewall',
    healthMultiplier: 5.0,
    speedMultiplier: 0.3,
    damageMultiplier: 3.0,
    goldMultiplier: 2.5,
    xpMultiplier: 2.5,
    unlocksAtWave: 14,
  },
  {
    type: 'scout',
    textureKey: 'enemy-scout',
    healthMultiplier: 0.2, // very weak, spawned from trojan
    speedMultiplier: 3.0,
    damageMultiplier: 0.5,
    goldMultiplier: 0.1,
    xpMultiplier: 0.1,
    unlocksAtWave: 999, // Unlocks via Trojan death
  },
  {
    type: 'boss-minion',
    textureKey: 'enemy-boss-minion',
    healthMultiplier: 0.5,
    speedMultiplier: 1.2,
    damageMultiplier: 0.5,
    goldMultiplier: 0.2,
    xpMultiplier: 0.2,
    unlocksAtWave: 999, // Only spawned by boss
  },
];
