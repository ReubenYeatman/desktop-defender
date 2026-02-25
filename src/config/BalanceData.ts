import { BOSS_WAVE_INTERVAL, WAVE_BREAK_DURATION, BOSS_WAVE_BREAK_DURATION } from './Constants';

export interface WaveConfig {
  waveNumber: number;
  isBossWave: boolean;
  enemyCount: number;
  baseHealth: number;
  baseSpeed: number;
  baseDamage: number;
  spawnInterval: number;
  goldValue: number;
  xpValue: number;
  breakTime: number;
  bossHealthMultiplier: number;
  bossGoldMultiplier: number;
  bossXpMultiplier: number;
  bossNumber?: number; // Added to determine the shape of the boss
  maxConcurrent: number;
}

export function getWaveConfig(waveNumber: number): WaveConfig {
  let isBossWave = false;
  let bossNumber = 0;

  // Boss intervals: 5, 12, 20, 30, and every 10 after
  if (waveNumber === 5) {
    isBossWave = true;
    bossNumber = 1;
  } else if (waveNumber === 12) {
    isBossWave = true;
    bossNumber = 2;
  } else if (waveNumber === 20) {
    isBossWave = true;
    bossNumber = 3;
  } else if (waveNumber >= 30 && waveNumber % 10 === 0) {
    isBossWave = true;
    bossNumber = 3 + Math.floor((waveNumber - 20) / 10);
  }

  // Enemy count: polynomial growth, infinite
  // Considerably reduced base count to ensure a smooth, easy start
  const baseCount = 2 + Math.floor(waveNumber * 0.8 + Math.pow(waveNumber, 1.3) * 0.3);

  // Health: compounding +12% per wave
  const healthMultiplier = Math.pow(1.12, Math.max(0, waveNumber - 1));

  // Speed: compounding +5% per wave, capped at 120
  const speed = Math.min(40 * Math.pow(1.05, Math.max(0, waveNumber - 1)), 120);

  // Max Concurrent (spawn density)
  let maxConcurrent = 10 + Math.floor(waveNumber / 2);
  if (waveNumber > 10) {
    maxConcurrent += (waveNumber - 10) * 2;
  }

  // Spawn interval: starts much slower (e.g. 2000ms), decreases to a floor of 400ms
  const spawnInterval = Math.max(2000 - waveNumber * 40, 400);

  // Gold/XP scale with wave
  const goldValue = Math.floor(5 + waveNumber * 2 + Math.pow(waveNumber, 1.2));
  const xpValue = Math.floor(10 + waveNumber * 3);

  const breakTime = isBossWave ? BOSS_WAVE_BREAK_DURATION : WAVE_BREAK_DURATION;

  return {
    waveNumber,
    isBossWave,
    enemyCount: isBossWave ? baseCount + 1 : baseCount, // +1 for the boss
    baseHealth: Math.floor(20 * healthMultiplier),
    baseSpeed: speed,
    baseDamage: Math.floor(5 + waveNumber * 0.5),
    spawnInterval,
    goldValue,
    xpValue,
    breakTime,
    bossHealthMultiplier: isBossWave ? Math.pow(1.5, bossNumber - 1) : 1,
    bossGoldMultiplier: isBossWave ? 10 + (bossNumber * 5) : 10,
    bossXpMultiplier: isBossWave ? 5 + (bossNumber * 2) : 5,
    bossNumber: isBossWave ? bossNumber : undefined,
    maxConcurrent,
  };
}

// Elite enemy configuration
export const ELITE_CONFIG = {
  unlockWave: 8,
  spawnChance: 0.1,
  healthMultiplier: 3,
  xpMultiplier: 2,
  goldMultiplier: 2,
  excludedTypes: ['boss', 'boss-minion', 'swarm', 'scout'],
};

// Gameplay multipliers for balance tuning
export const GAMEPLAY_MULTIPLIERS = {
  // Wave mechanics
  waveHealPercent: 0.15,

  // Boss
  bossSpeedMultiplier: 0.6,
  bossVulnerableSpeed: 0.5,
  bossDamageMultiplier: 2,
  bossVulnerableDamageMultiplier: 2.0,
  bossScalePerGeneration: 0.15,

  // Enemy movement
  runnerWaveAmplitude: 0.8,
  bossErraticAmplitude: 0.5,
  tankArmorCrackThreshold: 0.5,
  eliteScale: 1.25,

  // Weapon spread
  multishotSpreadBase: 5,
  multishotSpreadPerShot: 2.5,
  cannonSpreadPerMultishot: 5,
  beamDamageMultiplier: 0.5,

  // Economy
  bossKillCredits: 10,
  normalKillCreditsMin: 1,
  normalKillCreditsMax: 3,
  goldPerKill: 5,
};

// Ascension/prestige multipliers
export const ASCENSION_MULTIPLIERS = {
  damagePerPoint: 0.5,
  healthPerPoint: 0.10,
  goldBonusPerPrestige: 3,
};

// Loot rarity multipliers
export const LOOT_MULTIPLIERS = {
  uncommonChance: 0.3,
  rareStatBonus: 2,
  epicChanceReduction: 0.2,
  legendaryChanceReduction: 0.15,
  legendaryStatBonus: 2,
  maxStatMultiplier: 3,
};

// UI layout multipliers
export const UI_LAYOUT = {
  panelWidthRatio: 0.15,
  panelHeightRatio: 0.85,
  buttonYRatio: 0.35,
  buttonYRatioAlt: 0.50,
  scrollDeltaMultiplier: 0.5,
};
