import Phaser from 'phaser';
import { SaveManager } from '../managers/SaveManager';
import type { PlayerProfile } from '../models/GameState';
import { EventBus } from '../managers/EventBus';
import { UI_THEME } from '../config/UITheme';

export class PauseScene extends Phaser.Scene {
    private profile!: PlayerProfile;

    constructor() {
        super({ key: 'PauseScene' });
    }

    init(data: { profile: PlayerProfile }) {
        this.profile = data.profile;
    }

    create() {
        // Glassmorphism background effect (semi-transparent darkened overlay)
        const w = this.scale.width;
        const h = this.scale.height;

        const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.75);
        bg.setOrigin(0, 0);
        bg.setInteractive(); // Blocks clicks behind it

        // Menu Container
        const menuWidth = 300;
        const menuHeight = 250;
        const cx = w / 2;
        const cy = h / 2;

        const panel = this.add.graphics();
        panel.fillStyle(UI_THEME.sceneBgMid, 0.95);
        panel.fillRoundedRect(cx - menuWidth / 2, cy - menuHeight / 2, menuWidth, menuHeight, 16);
        panel.lineStyle(2, UI_THEME.accent, 1);
        panel.strokeRoundedRect(cx - menuWidth / 2, cy - menuHeight / 2, menuWidth, menuHeight, 16);

        const title = this.add.text(cx, cy - menuHeight / 2 + 40, 'PAUSED', {
            fontSize: '32px',
            fontFamily: 'Impact, sans-serif',
            color: '#4a9eff',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        // --- BUTTONS ---
        const resumeBtn = this.createButton(cx, cy, 'RESUME GAME', UI_THEME.accent, () => {
            this.resumeGame();
        });

        const abandonBtn = this.createButton(cx, cy + 60, 'LEAVE ROUND', UI_THEME.buttonDanger, () => {
            this.promptAbandonRun();
        });

        // ESC to unpause
        this.input.keyboard?.on('keydown-ESC', () => {
            this.resumeGame();
        });
        this.input.keyboard?.on('keydown-P', () => {
            this.resumeGame();
        });
    }



    private createButton(x: number, y: number, text: string, color: number, onClick: () => void) {
        const btnWidth = 200;
        const btnHeight = 44;

        const bg = this.add.rectangle(x, y, btnWidth, btnHeight, color).setInteractive({ cursor: 'pointer' });
        bg.setStrokeStyle(2, 0xffffff);

        const txt = this.add.text(x, y, text, {
            fontSize: '20px',
            fontFamily: 'Impact, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setAlpha(0.8));
        bg.on('pointerout', () => bg.setAlpha(1.0));
        bg.on('pointerdown', () => {
            bg.setAlpha(0.6);
            onClick();
        });
        bg.on('pointerup', () => bg.setAlpha(0.8));
    }



    private resumeGame() {
        this.scene.resume('GameScene');
        this.scene.resume('HUDScene');
        this.scene.stop();
    }

    private promptAbandonRun() {
        // Create confirmation overlay
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8).setOrigin(0);
        overlay.setInteractive(); // Block underlying UI

        const promptBox = this.add.rectangle(cx, cy, 320, 160, UI_THEME.pauseSliderBg);
        promptBox.setStrokeStyle(2, UI_THEME.buttonDanger);

        this.add.text(cx, cy - 40, 'Are you sure?', { fontSize: '24px', fontFamily: 'Impact, sans-serif', color: '#ff4444' }).setOrigin(0.5);
        this.add.text(cx, cy - 10, 'Progress will be lost.', { fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa' }).setOrigin(0.5);

        this.createButton(cx - 80, cy + 40, 'CANCEL', UI_THEME.pauseSliderKnob, () => {
            this.scene.restart(); // Simple way to clear the prompt
        });

        this.createButton(cx + 80, cy + 40, 'QUIT', UI_THEME.buttonDanger, () => {
            // Fade to black and abandon
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // Halt systems and save null run
                EventBus.removeAll();
                SaveManager.load().then(state => {
                    state.run = null;
                    SaveManager.save(state).then(() => {
                        this.scene.stop('GameScene');
                        this.scene.stop('HUDScene');
                        this.scene.stop('UpgradeScene');
                        this.scene.start('MainMenuScene');
                    });
                });
            });
        });
    }
}
