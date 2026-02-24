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
      this.setColor('#ff4444');
      this.setFontSize(20);
      this.setStroke('#ffff00', 3);
      this.setScale(1.3);
    } else {
      this.setText(Math.floor(amount).toString());
      this.setColor('#ffffff');
      this.setFontSize(14);
      this.setStroke('#000000', 2);
      this.setScale(1.0);
    }

    this.setAlpha(1);

    this.scene.tweens.add({
      targets: this,
      y: this.y - (isCrit ? 40 : 30),
      alpha: 0,
      scale: isCrit ? 0.8 : 0.6,
      duration: isCrit ? 800 : 600,
      ease: 'Power2',
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
        this.setScale(1);
      },
    });
  }
}
