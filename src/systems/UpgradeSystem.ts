import { UPGRADES } from '../config/UpgradeData';
import type { UpgradeEffects } from '../models/UpgradeDefinition';
import type { Turret } from '../entities/Turret';
import type { EconomySystem } from './EconomySystem';
import { TURRET_BASE_HP, TURRET_BASE_DAMAGE, TURRET_BASE_FIRE_RATE, TURRET_BASE_RANGE, TURRET_BASE_KNOCKBACK } from '../config/Constants';
import { EventBus } from '../managers/EventBus';

export class UpgradeSystem {
  private upgradeLevels: Map<string, number> = new Map();
  private turret: Turret;
  private economy: EconomySystem;
  private regenTimer: number = 0;
  private regenInterval: number = 5000; // 5 seconds

  constructor(turret: Turret, economy: EconomySystem) {
    this.turret = turret;
    this.economy = economy;

    // Initialize all upgrades at level 0
    for (const upgrade of UPGRADES) {
      this.upgradeLevels.set(upgrade.id, 0);
    }
  }

  getLevel(upgradeId: string): number {
    return this.upgradeLevels.get(upgradeId) || 0;
  }

  getCost(upgradeId: string): number {
    const def = UPGRADES.find(u => u.id === upgradeId);
    if (!def) return Infinity;
    const level = this.getLevel(upgradeId);
    return Math.floor(def.baseCost * Math.pow(def.costMultiplier, level));
  }

  isMaxed(upgradeId: string): boolean {
    const def = UPGRADES.find(u => u.id === upgradeId);
    if (!def) return true;
    return this.getLevel(upgradeId) >= def.maxLevel;
  }

  purchase(upgradeId: string): boolean {
    const def = UPGRADES.find(u => u.id === upgradeId);
    if (!def) return false;
    if (this.isMaxed(upgradeId)) return false;

    const cost = this.getCost(upgradeId);
    if (this.economy.spendGold(cost)) {
      this.upgradeLevels.set(upgradeId, this.getLevel(upgradeId) + 1);
      this.recalculateStats();
      EventBus.emit('upgrade-purchased', {
        id: upgradeId,
        newLevel: this.getLevel(upgradeId),
      });
      return true;
    }
    return false;
  }

  recalculateStats() {
    const effects = this.getComputedEffects();

    this.turret.baseDamage = Math.floor(TURRET_BASE_DAMAGE * (effects.damageMultiplier || 1));
    this.turret.fireRate = TURRET_BASE_FIRE_RATE * (effects.fireRateMultiplier || 1);
    this.turret.knockback = TURRET_BASE_KNOCKBACK + (effects.knockbackForce || 0);
    this.turret.range = TURRET_BASE_RANGE + (effects.rangeBonus || 0);
    this.turret.critChance = effects.critChance || 0;

    const newMaxHealth = TURRET_BASE_HP + (effects.maxHealthBonus || 0);
    const healthDiff = newMaxHealth - this.turret.maxHealth;
    this.turret.maxHealth = newMaxHealth;
    if (healthDiff > 0) {
      this.turret.currentHealth += healthDiff; // Gain the new HP
    }

    this.economy.setGoldMultiplier(effects.goldMultiplier || 1);
  }

  getComputedEffects(): Partial<UpgradeEffects> {
    const result: Partial<UpgradeEffects> = {};
    for (const [id, level] of this.upgradeLevels) {
      if (level === 0) continue;
      const def = UPGRADES.find(u => u.id === id);
      if (!def) continue;
      const effect = def.effect(level);
      for (const [key, value] of Object.entries(effect)) {
        const k = key as keyof UpgradeEffects;
        if (result[k] === undefined) {
          (result as any)[k] = value;
        } else {
          // For multipliers, they're already computed per-upgrade
          (result as any)[k] = value;
        }
      }
    }
    return result;
  }

  update(_time: number, delta: number) {
    // HP regen
    const regenLevel = this.getLevel('regen');
    if (regenLevel > 0 && this.turret.currentHealth < this.turret.maxHealth) {
      this.regenTimer += delta;
      if (this.regenTimer >= this.regenInterval) {
        this.regenTimer = 0;
        this.turret.heal(regenLevel);
      }
    }
  }

  getUpgradeList() {
    return UPGRADES.map(def => ({
      ...def,
      currentLevel: this.getLevel(def.id),
      cost: this.getCost(def.id),
      isMaxed: this.isMaxed(def.id),
      canAfford: this.economy.canAfford(this.getCost(def.id)),
    }));
  }
}
