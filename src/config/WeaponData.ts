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
  basic: {
    id: 'basic',
    name: 'Auto Cannon',
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
  shotgun: {
    id: 'shotgun',
    name: 'Scattershot',
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
    name: 'Laser Beam',
    description: 'Continuous beam, pierces all',
    textureKey: 'projectile-basic',
    baseFireRate: 10.0,
    baseDamage: 3,
    projectileSpeed: 600,
    projectileLifetime: 500,
    piercing: 999,
    knockback: 0,
    pattern: 'single', // Uses fast projectile with high pierce
  },
  missile: {
    id: 'missile',
    name: 'Missile Launcher',
    description: 'Slow missiles, splash damage',
    textureKey: 'projectile-basic',
    baseFireRate: 0.3,
    baseDamage: 50,
    projectileSpeed: 150,
    projectileLifetime: 3000,
    piercing: 0,
    knockback: 60,
    pattern: 'single',
    splashRadius: 50,
  },
  tesla: {
    id: 'tesla',
    name: 'Tesla Coil',
    description: 'Chains between enemies',
    textureKey: 'projectile-basic',
    baseFireRate: 0.8,
    baseDamage: 15,
    projectileSpeed: 0,
    projectileLifetime: 0,
    piercing: 0,
    knockback: 0,
    pattern: 'chain',
    chainCount: 3,
    chainRange: 80,
    chainDamageDecay: 0.7,
  },
};
