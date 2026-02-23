import { ASCENSION_UPGRADES } from '../config/AscensionData';
import type { PlayerProfile } from '../models/GameState';

export interface RunStats {
  highestWave: number;
  totalGoldEarned: number;
  enemiesKilled: number;
  runDuration: number;
}

export class AscensionSystem {
  calculateAscendium(runStats: RunStats, profile: PlayerProfile): number {
    const waveComponent = Math.sqrt(runStats.highestWave);
    const goldComponent = Math.log2(runStats.totalGoldEarned + 1);
    let base = Math.floor(waveComponent * goldComponent * 0.5);

    // Apply ascendium boost
    const boostLevel = profile.ascensionUpgradeLevels['ascendium_boost'] || 0;
    if (boostLevel > 0) {
      base = Math.floor(base * (1 + boostLevel * 0.10));
    }

    return Math.max(1, base);
  }

  getUpgradeCost(upgradeId: string, profile: PlayerProfile): number {
    const def = ASCENSION_UPGRADES.find(u => u.id === upgradeId);
    if (!def) return Infinity;
    const level = profile.ascensionUpgradeLevels[upgradeId] || 0;
    return Math.floor(def.baseCost * Math.pow(def.costMultiplier, level));
  }

  isMaxed(upgradeId: string, profile: PlayerProfile): boolean {
    const def = ASCENSION_UPGRADES.find(u => u.id === upgradeId);
    if (!def) return true;
    return (profile.ascensionUpgradeLevels[upgradeId] || 0) >= def.maxLevel;
  }

  purchaseUpgrade(upgradeId: string, profile: PlayerProfile): boolean {
    const def = ASCENSION_UPGRADES.find(u => u.id === upgradeId);
    if (!def) return false;
    if (this.isMaxed(upgradeId, profile)) return false;

    const cost = this.getUpgradeCost(upgradeId, profile);
    if (profile.totalAscendium < cost) return false;

    profile.totalAscendium -= cost;
    profile.ascensionUpgradeLevels[upgradeId] = (profile.ascensionUpgradeLevels[upgradeId] || 0) + 1;

    // Handle weapon unlocks
    if (upgradeId.startsWith('weapon_unlock_')) {
      const weaponId = upgradeId.replace('weapon_unlock_', '');
      if (!profile.unlockedWeapons.includes(weaponId)) {
        profile.unlockedWeapons.push(weaponId);
      }
    }

    return true;
  }

  getStartingBonuses(profile: PlayerProfile) {
    const levels = profile.ascensionUpgradeLevels;
    return {
      startingGold: (levels['starting_gold'] || 0) * 50,
      xpMultiplier: 1 + (levels['xp_boost'] || 0) * 0.05,
      baseDamageBonus: (levels['starting_damage'] || 0) * 3,
      maxHealthBonus: (levels['starting_health'] || 0) * 15,
      dropRateMultiplier: 1 + (levels['drop_rate'] || 0) * 0.08,
    };
  }

  getUpgradeList(profile: PlayerProfile) {
    return ASCENSION_UPGRADES.map(def => ({
      ...def,
      currentLevel: profile.ascensionUpgradeLevels[def.id] || 0,
      cost: this.getUpgradeCost(def.id, profile),
      isMaxed: this.isMaxed(def.id, profile),
      canAfford: profile.totalAscendium >= this.getUpgradeCost(def.id, profile),
    }));
  }
}
