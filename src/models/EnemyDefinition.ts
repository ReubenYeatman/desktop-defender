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
];
