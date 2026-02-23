export interface AscensionUpgradeDefinition {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
}

export const ASCENSION_UPGRADES: AscensionUpgradeDefinition[] = [
  {
    id: 'starting_gold',
    name: 'Trust Fund',
    description: 'Start with +50 gold per level',
    baseCost: 5,
    costMultiplier: 1.5,
    maxLevel: 20,
  },
  {
    id: 'xp_boost',
    name: 'Wisdom',
    description: '+5% XP per level',
    baseCost: 8,
    costMultiplier: 1.6,
    maxLevel: 15,
  },
  {
    id: 'starting_damage',
    name: 'Armory',
    description: '+3 base damage per level',
    baseCost: 10,
    costMultiplier: 1.7,
    maxLevel: 15,
  },
  {
    id: 'starting_health',
    name: 'Fortification',
    description: '+15 max HP per level',
    baseCost: 8,
    costMultiplier: 1.5,
    maxLevel: 20,
  },
  {
    id: 'drop_rate',
    name: 'Scavenger',
    description: '+8% loot drop rate per level',
    baseCost: 15,
    costMultiplier: 1.8,
    maxLevel: 10,
  },
  {
    id: 'ascendium_boost',
    name: 'Recursion',
    description: '+10% Ascendium per level',
    baseCost: 25,
    costMultiplier: 2.0,
    maxLevel: 10,
  },
  {
    id: 'weapon_unlock_shotgun',
    name: 'Shotgun',
    description: 'Unlock the Scattershot weapon',
    baseCost: 30,
    costMultiplier: 1,
    maxLevel: 1,
  },
  {
    id: 'weapon_unlock_laser',
    name: 'Laser Beam',
    description: 'Unlock the Laser weapon',
    baseCost: 60,
    costMultiplier: 1,
    maxLevel: 1,
  },
  {
    id: 'weapon_unlock_missile',
    name: 'Missile Launcher',
    description: 'Unlock the Missile Launcher',
    baseCost: 100,
    costMultiplier: 1,
    maxLevel: 1,
  },
  {
    id: 'weapon_unlock_tesla',
    name: 'Tesla Coil',
    description: 'Unlock the Tesla Coil weapon',
    baseCost: 150,
    costMultiplier: 1,
    maxLevel: 1,
  },
];
