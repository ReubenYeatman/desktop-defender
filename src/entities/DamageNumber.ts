import Phaser from 'phaser';

export class DamageNumber extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    scene.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setDepth(100);
  }

  show(x: number, y: number, amount: number, isCrit: boolean = false) {
    this.setPosition(x, y - 10);
    this.setText(Math.floor(amount).toString());
    this.setActive(true);
    this.setVisible(true);

    if (isCrit) {
      this.setColor('#ffff00');
      this.setFontSize(18);
    } else {
      this.setColor('#ffffff');
      this.setFontSize(14);
    }

    this.setAlpha(1);

    this.scene.tweens.add({
      targets: this,
      y: this.y - 30,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
      },
    });
  }
}
