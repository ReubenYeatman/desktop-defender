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
}

export function getWaveConfig(waveNumber: number): WaveConfig {
  const isBossWave = waveNumber % BOSS_WAVE_INTERVAL === 0 && waveNumber > 0;

  // Enemy count: polynomial growth, infinite
  const baseCount = 5 + Math.floor(waveNumber * 1.5 + Math.pow(waveNumber, 1.3) * 0.5);

  // Health: polynomial growth, always increasing
  const healthMultiplier = 1 + (waveNumber - 1) * 0.15 + Math.pow(waveNumber, 1.4) * 0.02;

  // Speed: capped at 120 to stay playable
  const speed = Math.min(40 + waveNumber * 1.5, 120);

  // Spawn interval: decreases to a floor of 300ms
  const spawnInterval = Math.max(1200 - waveNumber * 30, 300);

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
    bossHealthMultiplier: 5 + waveNumber * 0.5,
    bossGoldMultiplier: 10,
    bossXpMultiplier: 5,
  };
}
