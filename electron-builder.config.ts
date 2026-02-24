import type { Configuration } from 'electron-builder';

const config: Configuration = {
  appId: 'com.desktopdefender.app',
  productName: 'Desktop Defender',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    'dist-electron/**/*',
  ],
  mac: {
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] },
      { target: 'zip', arch: ['x64', 'arm64'] },
    ],
    category: 'public.app-category.games',
    icon: 'build/icon.icns',
    darkModeSupport: true,
  },
  dmg: {
    title: 'Desktop Defender',
    iconSize: 80,
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: 'link', path: '/Applications' },
    ],
  },
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'portable', arch: ['x64'] },
    ],
    icon: 'build/icon.png',
    signAndEditExecutable: false,
  },
  nsis: {
    oneClick: true,
    shortcutName: 'Desktop Defender',
  },
  linux: {
    target: ['AppImage'],
    category: 'Game',
    icon: 'build/icon.png',
  },
};

export default config;
