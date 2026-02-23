import Phaser from 'phaser';
import { DamageNumber } from '../entities/DamageNumber';
import { DAMAGE_NUMBER_POOL_SIZE } from '../config/Constants';
import { EventBus } from '../managers/EventBus';

export class DamageNumberPool {
  private pool: DamageNumber[] = [];

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < DAMAGE_NUMBER_POOL_SIZE; i++) {
      this.pool.push(new DamageNumber(scene));
    }

    EventBus.on('damage-dealt', (data: { x: number; y: number; amount: number; isCrit: boolean }) => {
      this.show(data.x, data.y, data.amount, data.isCrit);
    });
  }

  show(x: number, y: number, amount: number, isCrit: boolean = false) {
    const dmgNum = this.pool.find(d => !d.active);
    if (dmgNum) {
      dmgNum.show(x, y, amount, isCrit);
    }
  }
}
