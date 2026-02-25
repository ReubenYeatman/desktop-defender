import type { GearItem, GearSlot } from './GearItem';

export interface GameState {
  version: number;
  lastSaved: number;
  profile: PlayerProfile;
  run: RunState | null;
}

export interface PlayerProfile {
  totalAscendium: number;
  ascensionCount: number;
  highestWaveEver: number;
  totalEnemiesKilled: number;
  totalPlayTime: number;
  ascensionUpgradeLevels: Record<string, number>;
  unlockedWeapons: string[];
  settings: GameSettings;
}

export interface RunState {
  currentWave: number;
  turretHealth: number;
  turretMaxHealth: number;
  gold: number;
  totalGoldEarned: number;
  level: number;
  currentXP: number;
  upgradeLevels: Record<string, number>;
  equippedGear: Partial<Record<GearSlot, GearItem>>;
  inventory: GearItem[];
  activeWeaponId: string;
  enemiesKilledThisRun: number;
  runStartTime: number;
  runDuration: number;
}

export interface GameSettings {
  // Audio
  musicVolume: number;
  sfxVolume: number;
  muteAll: boolean;

  // Visual
  screenShake: boolean;
  bloom: boolean;
  particleQuality: 'low' | 'medium' | 'high';
  vignette: boolean;
  showDamageNumbers: boolean;

  // Window (Electron)
  alwaysOnTop: boolean;
  windowOpacity: number;
  windowSize: 300 | 400 | 500 | 600 | 700 | 800;
}

export function createDefaultProfile(): PlayerProfile {
  return {
    totalAscendium: 0,
    ascensionCount: 0,
    highestWaveEver: 0,
    totalEnemiesKilled: 0,
    totalPlayTime: 0,
    ascensionUpgradeLevels: {},
    unlockedWeapons: ['basic'],
    settings: {
      // Audio
      musicVolume: 0.5,
      sfxVolume: 0.7,
      muteAll: false,
      // Visual
      screenShake: true,
      bloom: true,
      particleQuality: 'high',
      vignette: true,
      showDamageNumbers: true,
      // Window
      alwaysOnTop: false,
      windowOpacity: 1.0,
      windowSize: 300,
    },
  };
}

export function createDefaultGameState(): GameState {
  return {
    version: 1,
    lastSaved: Date.now(),
    profile: createDefaultProfile(),
    run: null,
  };
}
