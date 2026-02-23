import Phaser from 'phaser';
import { EventBus } from '../managers/EventBus';
import type { GearItem, GearSlot, Rarity, GearStats } from '../models/GearItem';
import { GEAR_SLOTS } from '../models/GearItem';

const STAT_POOL = [
  'damageFlat', 'damagePercent', 'fireRatePercent', 'critChance',
  'critDamage', 'knockback', 'healthFlat', 'goldPercent', 'xpPercent', 'range',
] as const;

const SLOT_NAMES: Record<GearSlot, string[]> = {
  barrel: ['Barrel', 'Cannon', 'Muzzle', 'Bore'],
  chassis: ['Chassis', 'Plating', 'Armor', 'Shell'],
  scope: ['Scope', 'Optic', 'Lens', 'Tracker'],
  ammo: ['Ammo', 'Rounds', 'Shells', 'Cartridge'],
  core: ['Core', 'Crystal', 'Cell', 'Reactor'],
};

const RARITY_PREFIXES: Record<Rarity, string[]> = {
  common: ['Worn', 'Basic', 'Simple'],
  uncommon: ['Sturdy', 'Refined', 'Solid'],
  rare: ['Superior', 'Fine', 'Keen'],
  epic: ['Exquisite', 'Masterwork', 'Prime'],
  legendary: ['Mythic', 'Godforged', 'Eternal'],
};

export class LootSystem {
  private baseDropChance = 0.08;
  private inventory: GearItem[] = [];
  private equipped: Partial<Record<GearSlot, GearItem>> = {};
  private maxInventory = 20;

  constructor() {
    EventBus.on('enemy-killed', (data: { x: number; y: number; goldValue: number; enemyType: string }) => {
      const isBoss = data.enemyType === 'boss';
      const waveNumber = this.getCurrentWave();
      const item = this.rollDrop(waveNumber, isBoss);
      if (item) {
        this.addToInventory(item);
        EventBus.emit('loot-dropped', { x: data.x, y: data.y, item });
      }
    });
  }

  private getCurrentWave(): number {
    // Will be set by GameScene
    return (this as any)._currentWave || 1;
  }

  setCurrentWave(wave: number) {
    (this as any)._currentWave = wave;
  }

  rollDrop(waveNumber: number, isBoss: boolean): GearItem | null {
    const dropChance = isBoss ? 1.0 : this.baseDropChance;
    if (Math.random() > dropChance) return null;

    const rarity = this.rollRarity(waveNumber, isBoss);
    const slot = GEAR_SLOTS[Math.floor(Math.random() * GEAR_SLOTS.length)];
    const stats = this.generateStats(rarity, waveNumber);
    const name = this.generateName(slot, rarity);

    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      slot,
      rarity,
      level: waveNumber,
      stats,
    };
  }

  private rollRarity(wave: number, isBoss: boolean): Rarity {
    const roll = Math.random();
    if (isBoss) {
      if (roll < 0.05 && wave >= 25) return 'legendary';
      if (roll < 0.20 && wave >= 18) return 'epic';
      return 'rare';
    }
    if (roll < 0.01 && wave >= 25) return 'legendary';
    if (roll < 0.05 && wave >= 18) return 'epic';
    if (roll < 0.15 && wave >= 12) return 'rare';
    if (roll < 0.40) return 'uncommon';
    return 'common';
  }

  private generateStats(rarity: Rarity, wave: number): GearStats {
    const statCount = { common: 1, uncommon: 2, rare: 2, epic: 3, legendary: 4 }[rarity];
    const magnitude = { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 }[rarity];

    const stats: GearStats = {};
    const shuffled = [...STAT_POOL].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, statCount);

    for (const stat of chosen) {
      stats[stat] = this.rollStatValue(stat, wave, magnitude);
    }
    return stats;
  }

  private rollStatValue(stat: string, wave: number, magnitude: number): number {
    const base = 1 + wave * 0.3;
    switch (stat) {
      case 'damageFlat': return Math.floor(base * magnitude * 2);
      case 'damagePercent': return Math.floor(3 * magnitude + wave * 0.2);
      case 'fireRatePercent': return Math.floor(2 * magnitude + wave * 0.15);
      case 'critChance': return Math.floor(magnitude * 2);
      case 'critDamage': return Math.floor(5 * magnitude);
      case 'knockback': return Math.floor(5 * magnitude);
      case 'healthFlat': return Math.floor(base * magnitude * 3);
      case 'goldPercent': return Math.floor(3 * magnitude);
      case 'xpPercent': return Math.floor(3 * magnitude);
      case 'range': return Math.floor(5 * magnitude);
      default: return Math.floor(magnitude);
    }
  }

  private generateName(slot: GearSlot, rarity: Rarity): string {
    const prefixes = RARITY_PREFIXES[rarity];
    const names = SLOT_NAMES[slot];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    return `${prefix} ${name}`;
  }

  addToInventory(item: GearItem): boolean {
    if (this.inventory.length >= this.maxInventory) {
      // Replace lowest rarity item
      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      this.inventory.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));
      if (rarityOrder.indexOf(item.rarity) > rarityOrder.indexOf(this.inventory[0].rarity)) {
        this.inventory.shift();
      } else {
        return false;
      }
    }
    this.inventory.push(item);
    EventBus.emit('inventory-changed', this.inventory);
    return true;
  }

  equip(itemId: string): boolean {
    const idx = this.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return false;

    const item = this.inventory[idx];

    // Unequip current item in slot
    const currentEquipped = this.equipped[item.slot];
    if (currentEquipped) {
      this.inventory.push(currentEquipped);
    }

    // Equip new item
    this.equipped[item.slot] = item;
    this.inventory.splice(idx, 1);

    EventBus.emit('gear-changed', this.equipped);
    EventBus.emit('inventory-changed', this.inventory);
    return true;
  }

  unequip(slot: GearSlot): boolean {
    const item = this.equipped[slot];
    if (!item) return false;
    if (this.inventory.length >= this.maxInventory) return false;

    delete this.equipped[slot];
    this.inventory.push(item);

    EventBus.emit('gear-changed', this.equipped);
    EventBus.emit('inventory-changed', this.inventory);
    return true;
  }

  scrapItem(itemId: string): number {
    const idx = this.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return 0;

    const item = this.inventory[idx];
    const { getScrapValue } = require('../models/GearItem');
    const value = getScrapValue(item);
    this.inventory.splice(idx, 1);

    EventBus.emit('inventory-changed', this.inventory);
    return value;
  }

  getInventory(): GearItem[] {
    return this.inventory;
  }

  getEquipped(): Partial<Record<GearSlot, GearItem>> {
    return this.equipped;
  }

  getEquippedStats(): GearStats {
    const total: GearStats = {};
    for (const item of Object.values(this.equipped)) {
      if (!item) continue;
      for (const [key, value] of Object.entries(item.stats)) {
        const k = key as keyof GearStats;
        total[k] = (total[k] || 0) + (value || 0);
      }
    }
    return total;
  }
}
