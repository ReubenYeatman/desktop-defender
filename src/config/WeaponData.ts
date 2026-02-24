export interface WeaponDefinition {
  id: string;
  name: string;
  description: string;
  textureKey: string;
  baseFireRate: number;
  baseDamage: number;
  projectileSpeed: number;
  projectileLifetime: number;
  piercing: number;
  knockback: number;
  pattern: 'single' | 'spread' | 'beam' | 'chain';
  spreadCount?: number;
  spreadAngle?: number;
  splashRadius?: number;
  chainCount?: number;
  chainRange?: number;
  chainDamageDecay?: number;
}

export const WEAPONS: Record<string, WeaponDefinition> = {
  blaster: {
    id: 'blaster',
    name: 'Projectile Blaster',
    description: 'Reliable single-target shots',
    textureKey: 'projectile-basic',
    baseFireRate: 1.0,
    baseDamage: 10,
    projectileSpeed: 300,
    projectileLifetime: 2000,
    piercing: 0,
    knockback: 0,
    pattern: 'single',
  },
  cannon: {
    id: 'cannon',
    name: 'Spread-Shot Cannon',
    description: '5 pellets in a spread',
    textureKey: 'projectile-basic',
    baseFireRate: 0.5,
    baseDamage: 5,
    projectileSpeed: 250,
    projectileLifetime: 800,
    piercing: 0,
    knockback: 30,
    pattern: 'spread',
    spreadCount: 5,
    spreadAngle: 30,
  },
  laser: {
    id: 'laser',
    name: 'Continuous Neon Laser',
    description: 'Continuous beam, pierces all',
    textureKey: 'particle-white',
    baseFireRate: 5.0,
    baseDamage: 3,
    projectileSpeed: 0,
    projectileLifetime: 300,
    piercing: 999,
    knockback: 0,
    pattern: 'beam',
  },
};
