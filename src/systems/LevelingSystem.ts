import { EventBus } from '../managers/EventBus';

export class LevelingSystem {
  private currentXP: number = 0;
  private currentLevel: number = 1;

  constructor() {
    EventBus.on('enemy-killed', (data: { xpValue: number }) => {
      this.addXP(data.xpValue);
    });
  }

  getLevel(): number {
    return this.currentLevel;
  }

  getXP(): number {
    return this.currentXP;
  }

  getXPForLevel(level: number): number {
    return Math.floor(50 * Math.pow(level, 1.8));
  }

  getXPRequired(): number {
    return this.getXPForLevel(this.currentLevel);
  }

  getXPProgress(): number {
    return this.currentXP / this.getXPRequired();
  }

  addXP(amount: number) {
    this.currentXP += amount;
    let required = this.getXPRequired();

    while (this.currentXP >= required) {
      this.currentXP -= required;
      this.currentLevel++;
      this.onLevelUp();
      required = this.getXPRequired();
    }

    EventBus.emit('xp-changed', {
      current: this.currentXP,
      required: this.getXPRequired(),
      level: this.currentLevel,
    });
  }

  private onLevelUp() {
    EventBus.emit('level-up', { level: this.currentLevel });
  }
}
