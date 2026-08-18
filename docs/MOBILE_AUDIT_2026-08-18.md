# Mobile Companion App — Audit and Roadmap

- **Project:** EITAMS Mobile Companion (Expo / React Native)
- **Audit date:** 2026-08-18
- **Baseline:** `main` @ `c635202` ("chore: remove deprecated setting from tsconfig file")
- **Paired backend:** `it-asset-management-system` @ `dev` `845a754` + the 2026-08-18 remediation pass
- **Scope:** API contract with the web app, security, reliability, performance, build readiness, code quality, and feature roadmap

## Executive summary

The app is small and coherent — 44 source files, TypeScript `strict` on, and `tsc --noEmit` passes clean. The
pairing flow is genuinely well built: QR handshake, `expo-secure-store` for the token, a client-side role
check as defence in depth, and a live Pusher listener for remote revocation. The visual layer is polished.

What it is not yet is a shippable product. Three things stand out:

1. **A core feature has never worked.** `acknowledgeAssignment` sends `PATCH` to an endpoint the web app
   only exports as `POST`. Next.js answers 405, so acknowledging a pending assignment fails every time.
2. **It cannot be released.** `app.json` has no `ios.bundleIdentifier`, no `android.package`, and — despite
   the whole product being a camera scanner — no `expo-camera` config plugin, so a standalone iOS build has
   no camera usage description. It runs in Expo Go and nowhere else.
3. **The transport is plaintext by default.** `.env.example` points at `http://192.168.x.x:3000`, nothing
   validates the scheme, and a 30-day GlobalAdmin JWT rides over it.

There is also a live integration gap: the backend remediation pass added rate limiting to five of the
endpoints this app calls. The app has no 429 handling, so a user who scans quickly will see a bare
"Rate limit exceeded" alert with no backoff.

### Findings by severity

| Severity | Count | IDs |
| -------- | ----- | --- |
| High | 4 | M-01, M-02, M-03, M-04 |
| Medium | 6 | M-05, M-06, M-07, M-08, M-09, M-10 |
| Low | 7 | M-11, M-12, M-13, M-14, M-15, M-16, M-17 |

> **Status: all 17 findings remediated on 2026-08-18.** One (M-11) turned out to be incorrect on
> investigation and is recorded as such rather than "fixed". See the remediation log at the end of
> this document. Feature roadmap items F-1 … F-12 are deliberately **not** implemented.

Plus 12 roadmap proposals (F-1 … F-12), each grounded in a backend capability that already exists.

---

## Integration correctness

### M-01 — High — Assignment acknowledgment sends the wrong HTTP method

**Evidence:** `src/services/assets.ts` sends `PATCH`:

```ts
const response = await fetch(
  `${API_URL}/api/v1/assets/assignments/${assignmentId}/acknowledge`,
  { method: 'PATCH', ... }
);
```

The backend route exports only `POST`:

```ts
// it-asset-management-system/src/app/api/v1/assets/assignments/[id]/acknowledge/route.ts
export const POST = withMobileAuth<{ params: Promise<{ id: string }> }>(...)
```

Confirmed against the backend at `HEAD` before the remediation pass as well — the route has always been
`POST`, so this has never worked. Next.js returns **405 Method Not Allowed** for an unexported method.

**Impact:** Every acknowledgment attempt fails. `AcknowledgmentSheet` surfaces the generic error, the
assignment stays in `pending approval`, and the backend's escalation engine keeps sending 24h/48h reminders
and eventually the 72h admin escalation for an assignment the user has already tried to accept. The failure
is silent from the operator's side — the web dashboard simply shows an unacknowledged assignment.

**Fix:** one word in `src/services/assets.ts`.

```ts
const response = await fetch(
  `${API_URL}/api/v1/assets/assignments/${assignmentId}/acknowledge`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }
);
```

Also correct the doc comment above the function, which currently states "Calls PATCH". Fix the mobile side
rather than adding `PATCH` to the backend: `POST` is the correct verb for a state transition that is not
idempotent (the route rejects a second attempt with 409), and the server owns the contract.

**Prevention:** this class of bug is invisible until runtime. See F-11 for the generated-client proposal —
the backend already publishes an OpenAPI document at `/api/openapi.json` built from its Zod registry.

---

### M-06 — Medium — No handling for the rate limiting the backend now applies

**Evidence:** the 2026-08-18 backend remediation added `withRateLimit` to endpoints this app calls:

| Endpoint | Used by |
| --- | --- |
| `/api/auth/mobile-exchange` | `services/auth.ts` — pairing |
| `/api/auth/check-qr-status` | web side of pairing |
| `/api/v1/scan` | `services/scan.ts` — asset lookup |
| `/api/v1/inject-barcode` | `services/scan.ts` — tethered entry |
| `/api/v1/issues` | `services/issues.ts` — issue reporting |

A limited request returns **429** with `{ "error": "Rate limit exceeded" }` and
`X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset` headers.

The app treats every non-2xx identically — `fetchApi` throws `new Error(errorData.error)`, and the scan
services return `{ success: false, error }`. The user sees an alert reading "Rate limit exceeded" with no
explanation and no retry.

**Impact:** barcode injection is the fastest-firing endpoint in the app — an operator scanning a shelf of
hardware will hit the limiter. Today that produces a wall of modal alerts.

**Fix:** teach the shared client about 429 and honour the reset header.

```ts
// src/constants/api.ts
export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Too many requests. Try again in ${retryAfterSeconds}s.`);
    this.name = 'RateLimitError';
  }
}

if (response.status === 429) {
  const reset = Number(response.headers.get('X-RateLimit-Reset') ?? 0);
  const retryAfter = Math.max(1, reset - Math.floor(Date.now() / 1000));
  throw new RateLimitError(retryAfter);
}
```

In the scanner, pause the viewfinder for `retryAfterSeconds` and show an inline banner rather than an
`Alert`, so scanning resumes on its own. Depends on M-08 (one shared client) to be worth doing once.

---

### M-09 — Medium — A 401 never returns the user to pairing

**Evidence:** `fetchApi` and all six hand-rolled services throw a generic `Error` on any non-2xx. Nothing
inspects the status, clears `secure_admin_api_key`, or flips `setIsAuthenticated(false)`.

**Impact:** once a token is revoked server-side without the Pusher event landing — device offline at the
time, app killed, Pusher not configured — the app stays on the dashboard and every screen shows an error.
There is no path back to the pairing screen short of reinstalling.

**Fix:** centralize it in the shared client (M-08). On 401, clear the token and signal the auth context:

```ts
if (response.status === 401) {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  onUnauthenticated();   // provided by AuthContext; flips state, root layout redirects
  throw new SessionExpiredError();
}
```

This requires `AuthContext` to expose more than `setIsAuthenticated` — see M-08.

---

## Security

### M-02 — High — Plaintext HTTP is the documented default

**Evidence:** `.env.example`:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

Nothing validates the scheme. `API_URL` is read in eight places and concatenated straight into `fetch`.

**Impact:** the pairing exchange returns a **30-day GlobalAdmin JWT**, and every subsequent request carries
it in an `Authorization` header. Over `http://` on a shared office or hotel network, that token is readable
by anyone on the segment, and it grants full administrative API access for a month with no refresh or
rotation. The blast radius is the entire asset system.

There is a second, more mundane consequence: Android blocks cleartext traffic by default from API 28
onward, and iOS App Transport Security blocks it too. So this configuration also simply will not work in a
production build — the failure is deferred to release rather than caught now.

**Fix:** make HTTPS the default and the local exception explicit.

```ts
// src/constants/api.ts
function resolveApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error('EXPO_PUBLIC_API_URL is not configured.');

  const parsed = new URL(url);
  const isLoopback = ['localhost', '127.0.0.1'].includes(parsed.hostname);
  const isPrivateLan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname);

  if (parsed.protocol !== 'https:' && !__DEV__) {
    throw new Error('The API URL must use HTTPS in release builds.');
  }
  if (parsed.protocol !== 'https:' && !(isLoopback || isPrivateLan)) {
    throw new Error('Plaintext HTTP is only permitted for local development hosts.');
  }
  return url;
}
```

Update `.env.example` to show `https://` as the norm with the LAN address as a commented development
alternative, and note that a tunnel (the README already mentions ngrok) gives HTTPS for device testing.

---

### M-03 — High — The stored token is never checked for expiry

**Evidence:** `src/app/_layout.tsx`:

```ts
const payload = decodeJwt(key);
if (payload?.role !== 'GlobalAdmin') {
  await SecureStore.deleteItemAsync('secure_admin_api_key');
  setIsAuthenticated(false);
} else {
  setIsAuthenticated(true);
}
```

`JwtPayload` already declares `exp`, and `decodeJwt` already returns it. It is never read.

**Impact:** the backend signs mobile tokens with `.setExpirationTime('30d')`. On day 31 the app still
believes it is authenticated: it renders the dashboard, then every request fails `jose.jwtVerify` and
returns 401, which — per M-09 — leaves the user stuck. The check runs once on mount, so an app kept warm in
memory never re-evaluates at all.

**Fix:** validate expiry in the same guard, and re-run it when the app returns to the foreground.

```ts
function isTokenUsable(payload: JwtPayload | null): boolean {
  if (!payload) return false;
  if (payload.role !== 'GlobalAdmin') return false;
  if (typeof payload.exp !== 'number') return false;
  // 60s skew so a token about to die does not start a screen it cannot finish.
  return payload.exp * 1000 > Date.now() + 60_000;
}
```

Then subscribe to `AppState` and re-run `checkAuth` on `active`, which also gives M-07 its pause/resume
hook. Longer term, F-8 removes the 30-day cliff entirely.

---

### M-05 — Medium — Remote revocation rides on a public Pusher channel

**Evidence:** `src/app/_layout.tsx` subscribes to `device-${payload.jti}`, and the backend publishes with
`pusher.trigger(\`device-${device.jwtId}\`, 'device_unlinked', ...)`. Neither name carries the `private-`
or `presence-` prefix, so both are **public channels** — Pusher performs no subscription authorization on
them.

The backend has the same pattern on the barcode path: `pusher.trigger(\`user-${userId}\`, 'barcode_scanned', ...)`.
The web source even comments "Using a private channel format or just a user-specific channel", acknowledging
the ambiguity.

**Impact:** the Pusher app key is public by construction (`EXPO_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_KEY`),
so anyone holding it can subscribe to any channel name they can construct. Two consequences:

- **Barcode interception.** A party who learns a user id — a UUID, so not guessable, but it appears in
  audit payloads and support material — can subscribe to `user-<id>` and receive every barcode that user
  scans, live. Serial numbers and asset tags are the payload.
- **Forged revocation.** The app acts on `device_unlinked` from an unauthenticated channel. The practical
  ceiling is a nuisance sign-out, not privilege escalation, but the app should not trust an unauthenticated
  message to mutate its auth state.

The JTI and user id are both high-entropy, which is why this is Medium rather than High. It is obscurity,
not authorization.

**Fix:** move both channels to Pusher private channels. Rename to `private-device-${jti}` and
`private-user-${userId}`, add a `/api/v1/pusher/auth` route on the backend that authenticates the caller
(the `withMobileAuth` / `withAuth` wrappers added in the 2026-08-18 pass already give it a principal) and
authorizes the channel only when the requested id matches that principal. On the client, set
`channelAuthorization: { endpoint, headers: { Authorization: \`Bearer ${token}\` } }` in the Pusher
constructor. This is a coordinated change across both repositories.

---

## Reliability and performance

### M-07 — Medium — Unconditional 30-second polling, with the offline library installed but unused

**Evidence:** `src/context/notifications-context.tsx`:

```ts
useEffect(() => {
  loadUnreadCount();
  const interval = setInterval(() => { loadUnreadCount(); }, 30000);
  return () => clearInterval(interval);
}, [loadUnreadCount]);
```

There is no `AppState` check and no connectivity check. `@react-native-community/netinfo` is a declared
dependency and is **never imported anywhere in `src/`**. A second effect fires an additional
`loadNotifications(30, 0)` whenever the unread count rises.

**Impact:** the app wakes the radio every 30 seconds for as long as it is resident, foreground or not. This
is the single largest battery and cellular-data cost in the app, and it runs hardest when the user is not
looking at it. It is also stricter than the web client it mirrors: the web app deliberately floors its
notification polling at 60 seconds and pauses on `refreshWhenHidden: false` / `refreshWhenOffline: false` —
the mobile client does the opposite of its own platform's guidance.

**Fix:** gate the interval on foreground and connectivity, and widen it.

```ts
useEffect(() => {
  let interval: ReturnType<typeof setInterval> | null = null;

  const start = () => {
    if (interval) return;
    loadUnreadCount();
    interval = setInterval(loadUnreadCount, 60_000);
  };
  const stop = () => { if (interval) { clearInterval(interval); interval = null; } };

  const appSub = AppState.addEventListener('change', (s) => (s === 'active' ? start() : stop()));
  const netSub = NetInfo.addEventListener((state) => (state.isConnected ? start() : stop()));

  start();
  return () => { stop(); appSub.remove(); netSub(); };
}, [loadUnreadCount]);
```

F-2 (push notifications) removes the need for polling almost entirely; this is the interim fix.

---

### M-08 — Medium — Six of seven services bypass the shared client, in two different error styles

**Evidence:** `src/constants/api.ts` documents itself as the "Centralized API configuration and fetching
utility". Exactly one caller uses it — `services/activity.ts`. The other six (`auth`, `assets`, `scan`,
`issues`, `notifications`, `dashboard`) each re-implement the same block: read `EXPO_PUBLIC_API_URL`, read
`SecureStore`, build the two headers, check `response.ok`, parse an error envelope.

They also disagree on how failure is reported:

| Convention | Services |
| --- | --- |
| `throw new Error(...)` | `auth`, `assets`, `notifications`, `dashboard`, `activity` |
| `return { success: false, error }` | `scan`, `issues` |

**Impact:** this is the reason M-01, M-06, and M-09 are each three separate pieces of work instead of one.
Every cross-cutting concern — rate limiting, 401 recovery, retry, timeout, logging — has to be written seven
times or not at all. Today it is not at all.

**Fix:** finish the abstraction that already exists. Extend `fetchApi` with the token key constant, 401 and
429 handling, and a timeout; then convert the six services to call it and settle on thrown errors as the
single convention (`scan` and `issues` currently swallow failures into a success-shaped object, which is why
their callers cannot distinguish "asset not found" from "network down").

```ts
export const TOKEN_KEY = 'secure_admin_api_key';

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  // resolveApiUrl() from M-02, token read, 401 -> SessionExpiredError,
  // 429 -> RateLimitError, AbortSignal.timeout(15_000)
}
```

---

### M-10 — Medium — No tests, no lint, no CI, no quality scripts

**Evidence:** `package.json` declares four scripts — `start`, `android`, `ios`, `web`. There is no
`typecheck`, no `lint`, no `test`. There is no ESLint configuration file, no test framework, and no
`.github/` directory.

`npx tsc --noEmit` does pass cleanly today, which is worth stating — but nothing enforces that it keeps
passing.

**Impact:** M-01 is the concrete cost. A contract test, or even a typed client generated from the backend's
OpenAPI document, would have caught a wrong HTTP verb the day it was written. Instead it shipped and stayed
broken across the 37 commits that followed the file's introduction.

**Fix:** the cheap 80% first.

```jsonc
"scripts": {
  "start": "expo start",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "test": "jest"
}
```

Add `eslint-config-expo`, then `jest-expo` with `@testing-library/react-native`. Start with tests for the
three pure modules that carry real logic and need no native mocks: `lib/jwt.ts` (including an expired-token
case, which would have caught M-03), the token-expiry guard, and the service-layer response parsing. Then a
GitHub Actions workflow running `npm ci && npm run typecheck && npm run lint && npm test`, matching the gate
set the backend repository already enforces.

---

## Build and release readiness

### M-04 — High — The app cannot be built as a standalone binary

**Evidence:** `app.json`:

- No `ios.bundleIdentifier` and no `android.package`. Both are required for any native build.
- `plugins` lists `expo-secure-store`, `expo-router`, `expo-font`, `expo-splash-screen` — but **not
  `expo-camera`**, even though the camera is the app's core function.
- No `eas.json` anywhere in the repository, so there is no build profile.
- No `runtimeVersion` and no `updates` block, so there is no OTA update channel.

**Impact:** the app runs only in Expo Go, which is why the omission has gone unnoticed — Expo Go ships its
own bundle identifier and its own pre-declared permission strings. The first real build fails, and on iOS an
app that requests camera access without an `NSCameraUsageDescription` is rejected at review and crashes on
the permission prompt.

**Fix:**

```jsonc
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.tiqri.eitams.mobile",
      "supportsTablet": true
    },
    "android": {
      "package": "com.tiqri.eitams.mobile",
      "predictiveBackGestureEnabled": false
    },
    "plugins": [
      "expo-secure-store",
      "expo-router",
      "expo-font",
      "expo-splash-screen",
      [
        "expo-camera",
        {
          "cameraPermission": "EITAMS uses the camera to scan asset QR codes and hardware barcodes."
        }
      ]
    ],
    "runtimeVersion": { "policy": "appVersion" }
  }
}
```

Then add `eas.json` with `development`, `preview`, and `production` profiles, and verify with
`npx expo prebuild --clean` followed by an EAS build. Note the permission string is user-facing copy at
review time — it should say what the camera is for, not that the app needs it.

---

## Code quality

### M-11 — Low — Four declared dependencies are never imported

`@react-native-community/netinfo`, `react-native-svg`, `react-native-web`, and `expo-linking` appear in
`package.json` and in zero files under `src/`.

Two of them are load-bearing for work this report recommends rather than dead weight: `netinfo` is exactly
what M-07 needs, and `expo-linking` is what F-1 needs — the `tiqri-assets` scheme is already registered in
`app.json`, so deep linking is half-configured and entirely unimplemented. Either wire them up or remove
them; leaving them installed makes the dependency list stop describing the app.

### M-12 — Low — The `@/*` path alias is configured but unused

`tsconfig.json` maps `@/*` to `./src/*`. Every import in the codebase uses relative paths instead, up to
`../../components/ui/Button`. Adopt the alias (Metro resolves it through `babel-plugin-module-resolver` or
Expo's built-in support) or drop the mapping.

### M-13 — Low — `AGENTS.md` points at the wrong SDK

```
Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.
```

`package.json` pins `expo: ~54.0.35`. The instruction sends contributors — and coding agents — to
documentation two majors ahead of the installed SDK.

### M-14 — Low — The SecureStore key is a string literal in eight files

`'secure_admin_api_key'` is written out in `_layout.tsx`, `connect.tsx`, `constants/api.ts`, and the
`auth`, `assets`, `scan`, `issues`, `notifications`, and `dashboard` services. A typo in any one of them
fails silently as "not authenticated". Export it once (M-08 folds this in).

### M-15 — Low — Unconditional console logging, including a remote-wipe payload

`console.log('⚠️ Remote wipe triggered by Global Admin!', data)` in `_layout.tsx`, plus `console.error` /
`console.warn` across services and `decodeJwt`. React Native keeps these in release builds unless stripped.
Route them through a small `logger` gated on `__DEV__`, and drop the payloads that carry identifiers.

### M-16 — Low — `any` at every error boundary

Ten files use `catch (error: any)`, and `fetchApi<T = any>` defaults its own return type to `any`. With
`strict: true` otherwise enabled, these are the only places the type system is switched off — and they are
precisely the paths that decide what the user is told when something fails. Use `unknown` with a narrowing
helper.

### M-17 — Low — The README's project structure does not match the repository

The README documents `app/` at the root and an `src/utils/` directory, and names hooks `useAuth` and
`useScanner`. The actual tree is `src/app/`, there is no `src/utils/`, and the hooks are `useDashboardStats`
and `useRecentActivity`. It also describes the audience as "IT Operators and Admins" while pairing is
GlobalAdmin-only (see F-4), and advertises warranty details that the scanner does not render (see F-12).

---

## Feature roadmap

Each proposal below is grounded in a backend capability that already exists, so the work is mostly on the
mobile side.

### F-1 — Make notifications tappable (deep links)

**Already available:** `app_notifications.target_url` is populated by the backend and is already returned in
the mobile payload — `services/notifications.ts` types it as `targetUrl: string | null`. The value is never
read. The `tiqri-assets` URL scheme is registered in `app.json` and `expo-linking` is installed.

**Proposal:** map `targetUrl` to a mobile route and navigate on tap. A notification about a pending
assignment should open that assignment; one about an overdue return should open the asset. This is the
smallest gap between "data we already receive" and "feature the user gets" in the entire app.

### F-2 — Real push notifications

**Already available:** the backend runs a full notification engine — `notification_rules`,
`notification_queue`, a QStash cron that fires warranty, overdue-return, license-renewal, and escalation
checks, and per-channel delivery for in-app, email, and Teams.

**Proposal:** add `expo-notifications`, register the Expo push token at pairing time, and store it on the
existing `linked_devices` row (one nullable `push_token` column). Add `push` alongside `in_app`, `email`,
and `teams` in the dispatcher. This turns a 30-second poll into an event, which retires most of M-07 and
makes the app useful when it is closed — currently it is only useful when open.

**Backend dependency:** `linked_devices` is one of the nine tables that migration history does not create
(NEW-5 in the backend audit). Adding a column to it should wait until that is resolved.

### F-3 — Offline queue for scans and issue reports

**Already available:** `@react-native-community/netinfo` is installed (M-11).

**Proposal:** a field technician in a server room or basement store has no signal. Queue `reportAssetIssue`
and scan lookups locally, show a pending badge, and flush on reconnect. Cache the last successful
`my-assets` and `dashboard/stats` payloads so the app opens to content rather than a spinner. This is the
difference between an app that works in the field and one that works at a desk.

### F-4 — Open the app to the roles the backend already permits

**Already available:** `canAccessMobile` in the backend grants mobile access to **GlobalAdmin, ITOperator,
and FinancialAuditor**. But `/api/auth/generate-qr` and `/api/auth/mobile-exchange` both require
`isGlobalAdmin`, so only one of those three roles can ever pair. The 2026-08-18 backend pass now enforces
`canAccessMobile` on the mobile routes themselves, so the route layer is already ready for the other two.

**Proposal:** decide the intended audience and make the two layers agree. The README already claims the app
is "for IT Operators and Admins", which today is not true. Relaxing pairing to `canAccessMobile` and
removing the hardcoded `payload?.role !== 'GlobalAdmin'` checks in `_layout.tsx` and `connect.tsx` would
match the stated intent.

**Note:** the backend's `/api/v1/scan` redaction (SEC-A) strips purchase cost, vendor, and license keys for
non-financial roles, so an ITOperator paired under this change would receive a reduced payload. The mobile
side already tolerates this — `types/asset.ts` types `purchase` and `vendor` as nullable, and the scanner
screen renders neither (see F-12). No mobile change is required for the redaction itself.

### F-5 — Employee self-service

**Already available:** the backend has an entire employee portal — `/my-assets`, `/api/v1/portal/notifications`,
digital acceptance, and the return-request flow.

**Proposal:** the largest product gap is that ordinary employees, who outnumber administrators by orders of
magnitude, cannot use the app at all. An employee build — view my assets, acknowledge an assignment, request
a return, report a fault, receive push reminders — is the highest-value addition available and reuses
endpoints that already exist. It depends on F-4.

### F-6 — Asset actions from a scan

**Already available:** the backend supports assignment, return, maintenance dispatch, and disposal requests
as server actions and API routes.

**Proposal:** today a scan is read-only plus "report issue". Scanning an asset should offer the actions the
scanner's role permits — assign to a user, accept a return, dispatch to maintenance, request disposal. A
scanner that can only look things up is a barcode reader; one that can act is an asset management tool.

### F-7 — Stocktake mode

**Proposal:** a session-based bulk scan that records every asset seen in a location, then reconciles against
the expected inventory for that location and reports missing and unexpected items. This is the one workflow
where a phone is strictly better than a desktop, and the backend already has the location and registry data
to support it. No existing web feature covers it.

### F-8 — Biometric lock and shorter-lived tokens

**Proposal:** the app currently holds a 30-day non-renewable GlobalAdmin token behind nothing but the device
lock screen. Add `expo-local-authentication` to gate app launch, and pair it with a refresh flow — a short
access token plus a refresh token — so a lost device stops being a month-long administrative credential. The
backend already has a `user_refresh_tokens` table, though it is one of the nine untracked by migrations.
This is the durable fix for M-03.

### F-9 — Search

**Already available:** `/api/v1/search` is live, role-filtered, and backed by the trigram indexes added in
backend migration `0006`. It searches assets, users, and reports.

**Proposal:** the app has no search at all — an asset can only be reached by physically scanning it. Adding
search makes the app usable when the tag is damaged, unreachable, or the asset is not in front of you.

### F-12 — Surface the asset data the scan already returns

**Already available:** `/api/v1/scan` returns model, brand, category, location, purchase (date, cost,
warranty expiry, invoice URL), vendor, owner, assignment, and software licence detail — the full
`AssetDetailsData` shape, already typed in `src/types/asset.ts`.

**Proposal:** the scanner renders five fields of it: asset tag, status, model name, location, and current
custodian. Warranty expiry in particular is the field a technician standing in front of a failing machine
most needs, and the README already advertises it ("Model, Custodian, Location, and Warranty details") — the
UI simply never added it. This is presentation work against data already on the device, gated by role so
the redacted payload degrades cleanly.

### F-10 — Dark mode

`app.json` pins `userInterfaceStyle: "light"` and the status bar is hardcoded `style="dark"`. The web app
ships `next-themes`. A scanner is often used in dim server rooms and storage areas; the colour tokens
already exist in `constants/colors.ts` and `global.css`.

### F-11 — Generate the API client from the backend's OpenAPI document

**Already available:** the backend serves `/api/openapi.json`, compiled from a Zod registry
(`src/lib/api-docs/registry.ts`).

**Proposal:** generate mobile types and a client from that document instead of hand-writing seven services.
M-01 — a wrong HTTP verb, live for months — is exactly what this eliminates, and it keeps the response
shapes honest as the backend evolves. Pair it with F-8's client and M-08's shared fetch layer so the
generated code has one place to live.

---

## Verification performed

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **Passed** — no errors |
| API contract review | 14 endpoints cross-checked against the backend routes; **1 mismatch** (M-01) |
| Dependency usage sweep | 4 declared dependencies never imported (M-11) |
| Secret handling | `.env` is gitignored; token stored in `expo-secure-store`; no secrets committed |
| Test suite | **None exists** — no test files, no framework, no runner |
| Lint | **None configured** — no ESLint config in the repository |
| Build | **Not attempted** — `app.json` lacks the identifiers a native build requires (M-04) |

Not performed: no device or simulator run, no EAS build, no runtime profiling, and no penetration testing.
Findings are from source review and cross-repository contract comparison.

## What is working well

- The pairing handshake is careful: single-use QR token, `expo-secure-store` for storage, a client-side role
  check documented as defence in depth over the server's authoritative check, and a live revocation listener.
- The stale-token eviction in `_layout.tsx` shows the RBAC tightening was applied retroactively to already
  paired devices, which is the right instinct.
- TypeScript is `strict` and passes clean.
- Device-name normalization in `services/auth.ts` handles the Android build-fingerprint and emulator cases
  that usually produce unreadable entries in a device list.
- Optimistic updates with server re-sync on failure in `notifications-context.tsx` are correctly implemented.
- The UI layer is consistent and componentized, with haptics and animation used deliberately rather than
  decoratively.

## Suggested sequence

**First — make it correct**

1. M-01, one word, restores a broken core feature
2. M-08, the shared client, which the next three fixes all depend on
3. M-09 and M-06, 401 and 429 handling, once there is one place to put them
4. M-03, token expiry validation

**Second — make it shippable**

5. M-04, build configuration and EAS profiles
6. M-02, HTTPS enforcement
7. M-10, typecheck, lint, and CI

**Third — make it safe and cheap to run**

8. M-05, private Pusher channels (coordinated with the backend)
9. M-07, foreground and connectivity gated polling
10. M-11 through M-17

**Then the roadmap** — F-1 first (smallest gap between existing data and user value), then F-2, then F-4 and
F-5 together as the product decision they represent.

---

# Addendum — Remediation log

Added 2026-08-18, after the audit above. Findings were fixed in dependency order rather than by
number, following the sequence this report proposed. No roadmap item (F-1 … F-12) was implemented.

## Status

| ID | Status | What changed |
| --- | --- | --- |
| M-01 | **Fixed** | `acknowledgeAssignment` now sends `POST`. A contract test asserts the method and URL, so the mismatch cannot silently return. |
| M-02 | **Fixed** | `getApiUrl()` rejects non-HTTPS URLs in release builds, and in development allows plaintext only for loopback and RFC1918 hosts. `.env.example` now leads with HTTPS and documents the tunnel workflow. |
| M-03 | **Fixed** | New `isTokenUsable` / `isStoredTokenUsable` in `lib/jwt.ts` validate the `exp` claim with a 60-second skew allowance alongside the role. The guard re-runs on every return to the foreground via `AppState`, not only at mount. |
| M-04 | **Fixed** | `app.json` gained `ios.bundleIdentifier`, `android.package`, the `expo-camera` plugin with a user-facing camera permission string, and `runtimeVersion`. Added `eas.json` with development, preview, and production profiles. |
| M-05 | **Fixed** (both repos) | Channels moved to `private-user-<id>` and `private-device-<jti>`, authorized by a new backend route `POST /api/v1/pusher/auth`. Device authorization is a `linked_devices` lookup rather than a token-claim comparison, so it works for web sessions and mobile tokens alike, and a revoked device loses its subscription immediately. |
| M-06 | **Fixed** | The client raises `RateLimitError` carrying `retryAfterSeconds` derived from `X-RateLimit-Reset` (clamped to 60s against clock skew). The scanner pauses the viewfinder for that long and shows an inline countdown instead of stacking modal alerts. |
| M-07 | **Fixed** | Notification polling widened to 60s and is now started and stopped by `AppState` and `NetInfo` listeners, so it runs only while the app is foregrounded and connected. |
| M-08 | **Fixed** | All seven services now go through `fetchApi`. It owns the token, JSON serialization, a 15s timeout, and distinguishes a network failure from a server rejection. `scan` and `issues` no longer return success-shaped objects — every service reports failure by throwing. |
| M-09 | **Fixed** | A 401 clears the stored token and invokes a registered handler that returns the app to pairing. `AuthContext` gained a real `signOut`, which the header's unlink flow now uses. |
| M-10 | **Fixed** | Added `typecheck`, `lint`, `test`, and `check` scripts; ESLint (flat config, `eslint-config-expo`) with `no-console`; Jest via `jest-expo`; and a CI workflow running all of it plus `npm audit`. 31 tests across three suites. |
| M-11 | **Not a defect — corrected** | See below. |
| M-12 | **Fixed** | The unused `@/*` mapping was removed from `tsconfig.json`. See the note below on why the alias was dropped rather than adopted. |
| M-13 | **Fixed** | `AGENTS.md` now points at the SDK 54 documentation and asks that the link be updated alongside any SDK upgrade. |
| M-14 | **Fixed** | `'secure_admin_api_key'` now appears exactly once, as `TOKEN_KEY` in the client. All reads and writes go through `getStoredToken` / `setStoredToken` / `clearStoredToken`. |
| M-15 | **Fixed** | Added `lib/logger.ts` as the single logging surface — `debug` is dropped outside development, `warn`/`error` are always kept. 17 direct `console` calls were routed through it, and the remote-wipe payload log was removed outright. |
| M-16 | **Fixed** | Every `catch (error: any)` replaced with an untyped catch plus a `toMessage` narrowing helper. `fetchApi` is generic rather than `any`-defaulted, and the Pusher client reference is structurally typed. |
| M-17 | **Fixed** | The README's project tree now matches the repository, the audience is stated as GlobalAdmin with a pointer to F-4, the scan capability lists the fields actually rendered, and the quality gates and EAS build commands are documented. |

## M-11 was wrong

The audit listed `@react-native-community/netinfo`, `react-native-svg`, `react-native-web`, and
`expo-linking` as unused dependencies that should be removed. Checking what actually depends on them:

| Package | Required by |
| --- | --- |
| `react-native-svg` | peer dependency of `lucide-react-native`, the icon set used throughout the UI |
| `react-native-web` | peer dependency of `expo-camera` **and** `expo-router` |
| `expo-linking` | peer dependency of `expo-router` |

Only `netinfo` was genuinely unreferenced, and M-07 now uses it. The other three are required peers
that Expo expects to be declared directly; removing them would have broken the build. The finding is
recorded as incorrect rather than quietly dropped — "unused import" and "undeclared peer dependency"
look identical from a source grep, and that is the lesson worth keeping.

## Notes on how two fixes were implemented

**M-12 — the alias was dropped, not adopted.** The report offered both options. Expo SDK 54's Metro
does resolve `tsconfig` paths, but that resolution could not be verified here without running the
app, and rewriting roughly forty files' imports on an unverified assumption would pass `tsc` while
risking a runtime resolution failure. Removing the unused mapping makes the configuration honest at
zero risk. Adopting the alias remains a reasonable follow-up for someone who can run the app.

**M-16 — the scanner keeps a local geometry type.** Typing `handleBarCodeScanned` with expo-camera's
published `BarcodeScanningResult` broke compilation, because the handler deliberately probes four
different shapes (`bounds.origin`/`bounds.size`, a flat `bounds` box, `boundingBox`, and
`cornerPoints` as either objects or `[x, y]` tuples) that vary by platform and SDK version. The
published type describes only one of them. A local `ScanGeometry` type modelling the union the
handler actually reads replaces the `any` without asserting a shape the runtime does not guarantee.

## Verification after remediation

| Gate | Result |
| --- | --- |
| `npm run typecheck` | **Passed** — no errors |
| `npm run lint` | **Passed** — 0 errors (19 pre-existing warnings, mostly `react-hooks/exhaustive-deps`) |
| `npm test` | **Passed** — 31 tests across 3 suites |
| Backend `npm run check` | **Passed** — the M-05 channel change is clean |
| Backend `vitest run` | **Passed** — 211 files, 1204 tests |
| Backend `npm run build` | **Passed** — `/api/v1/pusher/auth` registered |

Still not performed: no device or simulator run, no EAS build, and no end-to-end pairing test against
a live backend. The M-05 channel migration in particular changes runtime behaviour on both sides and
should be exercised against a real Pusher app before release — a subscription that fails
authorization is silent from the user's perspective.

## Remaining lint warnings

19 warnings remain, deliberately unaddressed: mostly `react-hooks/exhaustive-deps` on animation and
navigation effects, where adding the suggested dependencies would re-trigger animations on every
render. These want individual review rather than a blanket fix, and none is a defect this audit
identified.
