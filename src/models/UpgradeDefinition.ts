export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  unlockLevel: number;
  effect: (level: number) => Partial<UpgradeEffects>;
}

export interface UpgradeEffects {
  fireRateMultiplier: number;
  damageMultiplier: number;
  knockbackForce: number;
  maxHealthBonus: number;
  goldMultiplier: number;
  critChance: number;
  rangeBonus: number;
  regenPerTick: number;
  multishot: number;
}
