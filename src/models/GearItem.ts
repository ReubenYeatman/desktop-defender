export type GearSlot = 'barrel' | 'chassis' | 'scope' | 'ammo' | 'core';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface GearStats {
  damageFlat?: number;
  damagePercent?: number;
  fireRatePercent?: number;
  critChance?: number;
  critDamage?: number;
  knockback?: number;
  healthFlat?: number;
  goldPercent?: number;
  xpPercent?: number;
  range?: number;
}

export interface GearItem {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: Rarity;
  level: number;
  stats: GearStats;
}

export const GEAR_SLOTS: GearSlot[] = ['barrel', 'chassis', 'scope', 'ammo', 'core'];

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function getScrapValue(item: GearItem): number {
  const rarityMultiplier = { common: 1, uncommon: 3, rare: 8, epic: 20, legendary: 50 };
  return Math.floor((5 + item.level * 2) * rarityMultiplier[item.rarity]);
}
