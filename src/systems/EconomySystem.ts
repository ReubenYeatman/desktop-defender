import { EventBus } from '../managers/EventBus';

export class EconomySystem {
  private gold: number = 0;
  private totalGoldEarned: number = 0;
  private goldMultiplier: number = 1.0;

  constructor() {
    EventBus.on('enemy-killed', (data: { goldValue: number }) => {
      this.earnGold(data.goldValue);
    });

    EventBus.on('wave-complete', (data: { wave: number }) => {
      // Bonus: 10 base + 5 per wave
      const bonus = 10 + (data.wave * 5);
      this.earnGold(bonus);
    });
  }

  getGold(): number {
    return this.gold;
  }

  getTotalGoldEarned(): number {
    return this.totalGoldEarned;
  }

  setGoldMultiplier(multiplier: number) {
    this.goldMultiplier = multiplier;
  }

  earnGold(amount: number) {
    const actual = Math.floor(amount * this.goldMultiplier);
    this.gold += actual;
    this.totalGoldEarned += actual;
    EventBus.emit('gold-changed', this.gold);
  }

  spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      EventBus.emit('gold-changed', this.gold);
      return true;
    }
    return false;
  }

  canAfford(amount: number): boolean {
    return this.gold >= amount;
  }
}
