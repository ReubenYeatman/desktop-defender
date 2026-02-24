// Enemy behavior configuration - extracted from hardcoded values
// Centralizes timing, distances, and multipliers for special enemy behaviors

export const ENEMY_BEHAVIOR = {
  glitch: {
    teleportInterval: 1500,    // ms between teleports
    teleportDistance: 50,      // pixels to teleport toward turret
    minTeleportRange: 60,      // won't teleport if closer than this
  },
  seeker: {
    beamInterval: 3000,        // ms between beam attacks
    orbitDistance: 180,        // pixels from turret to orbit at
  },
  boss: {
    orbitDistance: 200,        // pixels from turret during orbit phase
    knockbackReduction: 0.3,   // multiplier (0.3 = 70% reduction)
    recoveryDuration: 3000,    // ms of recovery state
    recoveryFlickerSpeed: 100, // ms per flicker cycle
    recoveryFlickerCount: 30,  // number of flicker cycles
    vulnerableSlowdown: 0.5,   // speed multiplier when vulnerable
  },
};
