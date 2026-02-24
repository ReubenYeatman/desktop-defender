/**
 * Hardcoding Checker Script
 *
 * Scans game logic files for hardcoded values that should be in config files.
 * Run with: npx tsx scripts/check-hardcoding.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Violation {
  file: string;
  line: number;
  pattern: string;
  match: string;
  severity: 'error' | 'warning';
}

// Patterns to detect hardcoded values
const PATTERNS: { regex: RegExp; name: string; severity: 'error' | 'warning' }[] = [
  // Hardcoded damage assignments (high priority)
  {
    regex: /\bdamage\s*[=:]\s*(?!config|this\.|TURRET|Math)\d+(?:\.\d+)?/gi,
    name: 'Hardcoded damage value',
    severity: 'warning',
  },
  // Hardcoded health assignments
  {
    regex: /\bhealth\s*[=:]\s*(?!config|this\.|getWaveConfig|Math)\d+(?:\.\d+)?/gi,
    name: 'Hardcoded health value',
    severity: 'warning',
  },
  // Hardcoded timer delays (4+ digits likely ms)
  {
    regex: /(?:delayedCall|delay|duration)\s*[(:]\s*\d{4,}/gi,
    name: 'Hardcoded timer/delay (should use config)',
    severity: 'warning',
  },
  // Raw hex colors outside Constants.ts
  {
    regex: /(?<!COLOR_\w*\s*=\s*)0x[0-9a-fA-F]{6}\b/g,
    name: 'Raw hex color (should use COLOR_ constant)',
    severity: 'warning',
  },
  // Hardcoded speed values
  {
    regex: /\bspeed\s*[=:]\s*(?!config|this\.|ENEMY_BEHAVIOR|getWaveConfig)\d{2,}/gi,
    name: 'Hardcoded speed value',
    severity: 'warning',
  },
  // Hardcoded multiplier patterns
  {
    regex: /\*\s*(?:0\.[1-9]\d*|[2-9](?:\.\d+)?)\s*[;,)]/g,
    name: 'Hardcoded multiplier (consider config)',
    severity: 'warning',
  },
];

// Files/directories to scan
const SCAN_DIRS = ['src/entities', 'src/systems', 'src/scenes'];

// Files to skip (config files are allowed to have hardcoded values)
const SKIP_PATTERNS = [
  /config\//i,
  /\.d\.ts$/,
  /BootScene\.ts$/, // Texture generation has many valid hex colors
];

function shouldSkipFile(filePath: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(filePath));
}

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }

    // Skip lines with config imports/references
    if (/(?:import|from|config|Config|CONSTANT|BEHAVIOR|ELITE_CONFIG|UI_THEME|TIMING|GAMEPLAY_MULTIPLIERS|ASCENSION_MULTIPLIERS|LOOT_MULTIPLIERS|UI_LAYOUT)/i.test(line)) {
      continue;
    }

    for (const pattern of PATTERNS) {
      const matches = line.match(pattern.regex);
      if (matches) {
        for (const match of matches) {
          // Additional filtering for common false positives
          if (match.includes('0x000000') || match.includes('0xffffff')) {
            continue; // Black and white are commonly okay
          }

          violations.push({
            file: filePath,
            line: lineNum,
            pattern: pattern.name,
            match: match.trim(),
            severity: pattern.severity,
          });
        }
      }
    }
  }

  return violations;
}

function scanDirectory(dir: string): Violation[] {
  const violations: Violation[] = [];

  if (!fs.existsSync(dir)) {
    return violations;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      violations.push(...scanDirectory(fullPath));
    } else if (entry.name.endsWith('.ts') && !shouldSkipFile(fullPath)) {
      violations.push(...scanFile(fullPath));
    }
  }

  return violations;
}

function main() {
  console.log('Scanning for hardcoded values...\n');

  const allViolations: Violation[] = [];

  for (const dir of SCAN_DIRS) {
    const fullDir = path.join(process.cwd(), dir);
    allViolations.push(...scanDirectory(fullDir));
  }

  if (allViolations.length === 0) {
    console.log('No hardcoding violations found.');
    process.exit(0);
  }

  // Group by file
  const byFile = new Map<string, Violation[]>();
  for (const v of allViolations) {
    const existing = byFile.get(v.file) || [];
    existing.push(v);
    byFile.set(v.file, existing);
  }

  // Print results
  let errorCount = 0;
  let warningCount = 0;

  for (const [file, violations] of byFile) {
    const relPath = path.relative(process.cwd(), file);
    console.log(`\n${relPath}:`);

    for (const v of violations) {
      const icon = v.severity === 'error' ? '✖' : '⚠';
      console.log(`  ${icon} Line ${v.line}: ${v.pattern}`);
      console.log(`    Found: ${v.match}`);

      if (v.severity === 'error') errorCount++;
      else warningCount++;
    }
  }

  console.log(`\n${errorCount} error(s), ${warningCount} warning(s)`);
  console.log('\nTip: Move these values to src/config/ files.');

  // Exit with error if any errors found
  // For now, warnings don't fail CI (set to 'error' severity for must-fix items)
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
