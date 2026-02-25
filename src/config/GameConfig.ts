import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import { HUDScene } from '../scenes/HUDScene';
import { UpgradeScene } from '../scenes/UpgradeScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { AscensionScene } from '../scenes/AscensionScene';
import { PauseScene } from '../scenes/PauseScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_BACKGROUND } from './Constants';

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLOR_BACKGROUND,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
      fps: 120, // Increased physics frequency for CCD simulation
    },
  },
  scene: [BootScene, GameScene, HUDScene, UpgradeScene, GameOverScene, AscensionScene, PauseScene, SettingsScene],
};
