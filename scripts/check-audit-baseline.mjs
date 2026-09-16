#!/usr/bin/env node
/**
 * Fails when the dependency audit gets worse than a recorded baseline.
 *
 * `npm audit --audit-level=high` cannot pass on this project. Every current
 * advisory arrives through the Expo SDK toolchain — metro, @expo/cli, tar,
 * shell-quote and friends — and `expo` is a production dependency, so
 * `--omit=dev` removes only one of twenty-six. The single remediation npm
 * offers is `--force`, which installs a new major SDK.
 *
 * A gate that can never pass is a gate people delete. This one instead fails
 * only when the counts rise above the committed baseline, so a pull request
 * that introduces a new vulnerable dependency is caught while the known SDK
 * backlog does not block every build. Lowering the baseline after an upgrade is
 * a visible, reviewed diff.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASELINE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'audit-baseline.json'
);

/** Severities that gate the build. Moderate and below are reported only. */
const GATED = ['critical', 'high'];

function runAudit() {
  // `npm audit` exits non-zero whenever it finds anything, and the report is
  // still on stdout — that report is the whole point, so spawnSync (which
  // returns stdout regardless of exit status) rather than a throwing variant.
  //
  // Passed as one shell string rather than a command plus an args array:
  // Node refuses to spawn `npm.cmd` directly on Windows, and supplying args
  // alongside `shell: true` triggers DEP0190. The command is a constant, so
  // there is nothing to inject.
  const result = spawnSync('npm audit --json', {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  const raw = result.stdout?.trim();
  if (!raw) {
    throw new Error(
      `npm audit produced no output (exit ${result.status}): ${result.stderr ?? ''}`
    );
  }

  return JSON.parse(raw).metadata.vulnerabilities;
}

const current = runAudit();

if (process.argv.includes('--update')) {
  writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify({ updated: new Date().toISOString().slice(0, 10), vulnerabilities: current }, null, 2)}\n`
  );
  console.log('Baseline updated:', JSON.stringify(current));
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  console.error(
    `No baseline at ${BASELINE_PATH}. Create one with ` +
      '`node scripts/check-audit-baseline.mjs --update`.'
  );
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).vulnerabilities;

const rows = Object.keys(current)
  .filter((severity) => severity !== 'total')
  .map((severity) => ({
    severity,
    current: current[severity] ?? 0,
    baseline: baseline[severity] ?? 0,
    gated: GATED.includes(severity),
  }));

console.log('Dependency audit vs baseline\n');
for (const row of rows) {
  const delta = row.current - row.baseline;
  const marker = row.gated ? (delta > 0 ? 'FAIL' : 'ok') : '    ';
  console.log(
    `  ${marker}  ${row.severity.padEnd(9)} current ${String(row.current).padStart(3)}   baseline ${String(row.baseline).padStart(3)}   ${delta > 0 ? `+${delta}` : delta}`
  );
}

const regressions = rows.filter((row) => row.gated && row.current > row.baseline);

if (regressions.length > 0) {
  console.error(
    `\nNew high or critical advisories since the baseline: ${regressions
      .map((row) => `${row.severity} +${row.current - row.baseline}`)
      .join(', ')}`
  );
  console.error(
    'Run `npm audit` to see them. If they cannot be resolved, update the ' +
      'baseline deliberately with `node scripts/check-audit-baseline.mjs --update` ' +
      'and say why in the commit message.'
  );
  process.exit(1);
}

const improvements = rows.filter(
  (row) => row.gated && row.current < row.baseline
);
if (improvements.length > 0) {
  console.log(
    '\nThe audit improved. Lower the baseline with ' +
      '`node scripts/check-audit-baseline.mjs --update` to lock the gain in.'
  );
}

console.log('\nNo new high or critical advisories.');
