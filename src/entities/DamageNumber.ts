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
    const offsetX = Phaser.Math.Between(-5, 5);
    this.setPosition(x + offsetX, y - 10);
    this.setActive(true);
    this.setVisible(true);

    if (isCrit) {
      this.setText('CRIT ' + Math.floor(amount).toString() + '!');
      this.setColor('#ffd700');
      this.setFontSize(22);
      this.setStroke('#aa6600', 3);
      this.setScale(0); // Start at 0 for pop-in effect
    } else {
      this.setText(Math.floor(amount).toString());
      this.setColor('#ffffff');
      this.setFontSize(16);
      this.setStroke('#000000', 2);
      this.setScale(0); // Start at 0
    }

    this.setAlpha(1);

    this.scene.tweens.add({
      targets: this,
      y: this.y - (isCrit ? 40 : 30),
      alpha: { start: 1, end: 0, ease: 'Expo.easeIn' },
      scale: { start: 0, end: (isCrit ? 1.2 : 1.0) },
      duration: isCrit ? 800 : 700,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
        this.setScale(1);
      },
    });
  }
}
