#!/usr/bin/env node
/**
 * Pre-demo check: is the deployed server reachable and serving the endpoints
 * the installed APK depends on?
 *
 *   npm run preflight -- https://your-app.vercel.app
 *   node scripts/preflight.mjs https://your-app.vercel.app
 *
 * Falls back to EXPO_PUBLIC_API_URL when no argument is given.
 *
 * Node rather than a shell script so it runs the same way in PowerShell, Git
 * Bash and CI. Windows cannot execute a .sh file directly, and the failure mode
 * there is silence rather than an error, which is exactly what you do not want
 * from a check you are trusting before a demo.
 */

const args = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const baseInput = args[0] ?? process.env.EXPO_PUBLIC_API_URL ?? '';

if (!baseInput) {
  console.error(
    'Usage: node scripts/preflight.mjs <base-url>   (or set EXPO_PUBLIC_API_URL)'
  );
  process.exit(2);
}

const BASE_URL = baseInput.replace(/\/+$/, '');
const ALLOW_HTTP = process.env.PREFLIGHT_ALLOW_HTTP === '1';

// PREFLIGHT_ALLOW_HTTP=1 exists to check a local server while developing. It is
// deliberately not the default: the APK refuses a plaintext URL, and Android
// blocks cleartext in release builds regardless, so an HTTPS-only check is the
// whole point before a demo.
if (!BASE_URL.startsWith('https://') && !ALLOW_HTTP) {
  console.error(`REFUSED: ${BASE_URL} is not HTTPS.`);
  console.error(
    'A release APK cannot talk to it: the app rejects plaintext, and Android'
  );
  console.error('blocks cleartext traffic in release builds regardless.');
  console.error(
    `To check a local server anyway: PREFLIGHT_ALLOW_HTTP=1 node scripts/preflight.mjs ${BASE_URL}`
  );
  process.exit(2);
}

/**
 * Each check names the status that proves the endpoint is wired correctly —
 * including the 401s, which show the auth wrapper is running rather than the
 * route being absent or throwing.
 */
const CHECKS = [
  {
    label: 'health/live',
    path: '/api/health/live',
    expect: 200,
    note: 'The deployment is not answering at all: check DNS, TLS and that it is deployed.',
  },
  {
    label: 'health/ready (database)',
    path: '/api/health/ready',
    expect: 200,
    note: 'App is up but the database is not reachable. Check DATABASE_URL in Vercel, and that Neon is awake.',
  },
  {
    label: 'profile rejects anon',
    path: '/api/v1/profile',
    expect: 401,
    note: 'Anything other than 401 means the mobile auth wrapper is not working.',
  },
  {
    label: 'my-assets rejects anon',
    path: '/api/v1/assets/my-assets',
    expect: 401,
    note: 'Anything other than 401 means the mobile auth wrapper is not working.',
  },
  {
    // GET is not allowed on the pairing exchange, so 405 proves routing works
    // without minting anything. A 404 means the route is missing.
    label: 'pairing endpoint routed',
    path: '/api/auth/mobile-exchange',
    expect: 405,
    note: '404 here means the deployment is missing the mobile pairing route.',
  },
];

const pad = (text, width) => String(text).padEnd(width);

async function run() {
  console.log(`Preflight against ${BASE_URL}\n`);

  let failures = 0;

  for (const check of CHECKS) {
    const started = Date.now();
    let status;
    let body = '';

    try {
      const response = await fetch(`${BASE_URL}${check.path}`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(15_000),
      });
      status = response.status;
      body = (await response.text()).slice(0, 120).replace(/\s+/g, ' ');
    } catch (error) {
      const reason =
        error?.name === 'TimeoutError'
          ? 'timed out after 15s'
          : (error?.cause?.code ?? error?.message ?? 'request failed');
      console.log(`  FAIL  ${pad(check.label, 26)} ${reason}`);
      console.log(`        ${check.note}`);
      failures += 1;
      continue;
    }

    const elapsed = `${((Date.now() - started) / 1000).toFixed(2)}s`;

    if (status === check.expect) {
      console.log(`  ok    ${pad(check.label, 26)} ${status} in ${elapsed}`);
    } else {
      console.log(
        `  FAIL  ${pad(check.label, 26)} got ${status}, expected ${check.expect}`
      );
      if (body) console.log(`        ${body}`);
      console.log(`        ${check.note}`);
      failures += 1;
    }
  }

  console.log();

  if (failures === 0) {
    console.log('All checks passed. The APK should be able to reach this server.');
    console.log();
    console.log('Still worth confirming by hand:');
    console.log('  - the QR pairing screen renders on the web app (needs Upstash Redis)');
    console.log('  - you are pairing with a GlobalAdmin account, within 60 seconds');
    console.log(`  - the phone is off wifi, on mobile data, and can still load ${BASE_URL}`);
    process.exit(0);
  }

  console.log(`${failures} check(s) failed. Fix these before demoing.`);
  process.exit(1);
}

run();
