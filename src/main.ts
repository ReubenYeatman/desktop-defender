import Phaser from 'phaser';
import { GAME_CONFIG } from './config/GameConfig';

const game = new Phaser.Game(GAME_CONFIG);

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
