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
        const menuWidth = 400;
        const menuHeight = 500;
        const cx = w / 2;
        const cy = h / 2;

        const panel = this.add.graphics();
        panel.fillStyle(UI_THEME.sceneBgMid, 0.95);
        panel.fillRoundedRect(cx - menuWidth / 2, cy - menuHeight / 2, menuWidth, menuHeight, 16);
        panel.lineStyle(2, UI_THEME.accent, 1);
        panel.strokeRoundedRect(cx - menuWidth / 2, cy - menuHeight / 2, menuWidth, menuHeight, 16);

        const title = this.add.text(cx, cy - menuHeight / 2 + 30, 'SETTINGS', {
            fontSize: '32px',
            fontFamily: 'Impact, sans-serif',
            color: '#4a9eff',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        let currentY = cy - 140;

        // --- AUDIO SLIDERS ---
        this.add.text(cx - 150, currentY, 'MUSIC VOLUME', { fontSize: '18px', fontFamily: 'monospace', color: '#fff' }).setOrigin(0, 0.5);
        this.createSlider(cx + 10, currentY, this.profile.settings.musicVolume, (val) => {
            this.profile.settings.musicVolume = val;
            this.saveSettings();
        });

        currentY += 50;
        this.add.text(cx - 150, currentY, 'SFX VOLUME', { fontSize: '18px', fontFamily: 'monospace', color: '#fff' }).setOrigin(0, 0.5);
        this.createSlider(cx + 10, currentY, this.profile.settings.sfxVolume, (val) => {
            this.profile.settings.sfxVolume = val;
            this.saveSettings();
        });

        // --- GRAPHICS TOGGLES ---
        currentY += 60;
        this.createToggle(cx, currentY, 'SCREEN SHAKE', this.profile.settings.screenShake, (val) => {
            this.profile.settings.screenShake = val;
            this.saveSettings();
        });

        currentY += 50;
        this.createToggle(cx, currentY, 'GLOW / BLOOM', this.profile.settings.bloom, (val) => {
            this.profile.settings.bloom = val;
            this.saveSettings();
        });

        currentY += 50;
        this.createToggle(cx, currentY, 'ALWAYS ON TOP', this.profile.settings.alwaysOnTop || false, (val) => {
            this.profile.settings.alwaysOnTop = val;
            this.saveSettings();
            if ((window as any).electronAPI) {
                (window as any).electronAPI.toggleAlwaysOnTop();
            }
        });

        // --- BUTTONS ---
        const resumeBtn = this.createButton(cx, cy + 120, 'RESUME GAME', UI_THEME.accent, () => {
            this.resumeGame();
        });

        const abandonBtn = this.createButton(cx, cy + 180, 'LEAVE ROUND', UI_THEME.buttonDanger, () => {
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

    private createSlider(x: number, y: number, initialValue: number, onChange: (val: number) => void) {
        const width = 140;
        const track = this.add.rectangle(x + width / 2, y, width, 6, UI_THEME.pauseSliderBg).setOrigin(0.5);
        const fill = this.add.rectangle(x, y, width * initialValue, 6, UI_THEME.accent).setOrigin(0, 0.5);
        const knob = this.add.circle(x + width * initialValue, y, 10, UI_THEME.pauseSliderKnob).setInteractive({ cursor: 'pointer' });

        this.input.setDraggable(knob);

        let isDragging = false;
        knob.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
            let boundedX = Phaser.Math.Clamp(dragX, x, x + width);
            knob.x = boundedX;
            fill.width = boundedX - x;
            const normalizedValue = (boundedX - x) / width;
            onChange(normalizedValue);
        });
    }

    private createToggle(x: number, y: number, label: string, initialValue: boolean, onChange: (val: boolean) => void) {
        const text = this.add.text(x - 20, y, label, { fontSize: '18px', fontFamily: 'monospace', color: '#fff' }).setOrigin(1, 0.5);

        const boxSize = 24;
        const box = this.add.rectangle(x + 20, y, boxSize, boxSize, initialValue ? UI_THEME.accent : UI_THEME.pauseToggleBg).setInteractive({ cursor: 'pointer' });
        box.setStrokeStyle(2, 0xffffff);

        const check = this.add.text(x + 20, y, initialValue ? '✓' : '', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        let state = initialValue;
        box.on('pointerdown', () => {
            state = !state;
            box.fillColor = state ? UI_THEME.accent : UI_THEME.pauseToggleBg;
            check.setText(state ? '✓' : '');
            onChange(state);
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

    private saveSettings() {
        // Only save settings portion, we'll fetch full state first to be safe
        SaveManager.load().then(state => {
            state.profile.settings = this.profile.settings;
            SaveManager.save(state);
        });
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
