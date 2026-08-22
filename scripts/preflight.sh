#!/usr/bin/env bash
#
# Pre-demo check: is the deployed server actually reachable and serving the
# endpoints the installed APK depends on?
#
# Run this from a network the phone will be on (or just tethered to it) before
# handing the device to anyone.
#
#   ./scripts/preflight.sh https://your-app.vercel.app
#
# Falls back to EXPO_PUBLIC_API_URL when no argument is given.

set -uo pipefail

BASE_URL="${1:-${EXPO_PUBLIC_API_URL:-}}"

if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 <base-url>   (or set EXPO_PUBLIC_API_URL)" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"

# PREFLIGHT_ALLOW_HTTP=1 exists to check a local server while developing. It is
# deliberately not the default: an HTTPS-only check is the whole point before a
# demo, since the APK will refuse a plaintext URL and Android blocks cleartext
# in release builds regardless.
if [[ "$BASE_URL" != https://* && "${PREFLIGHT_ALLOW_HTTP:-}" != "1" ]]; then
  echo "REFUSED: $BASE_URL is not HTTPS." >&2
  echo "A release APK cannot talk to it: the app rejects plaintext, and Android" >&2
  echo "blocks cleartext traffic in release builds regardless." >&2
  echo "To check a local server anyway: PREFLIGHT_ALLOW_HTTP=1 $0 $BASE_URL" >&2
  exit 2
fi

failures=0

# $1 label, $2 path, $3 expected status, $4 note shown on failure
check() {
  local label="$1" path="$2" expected="$3" note="${4:-}"
  local out status body elapsed

  out=$(curl -sS -m 15 -o /tmp/preflight_body -w '%{http_code} %{time_total}' \
        "${BASE_URL}${path}" 2>/tmp/preflight_err) || {
    printf '  FAIL  %-34s %s\n' "$label" "$(tr -d '\n' < /tmp/preflight_err)"
    failures=$((failures + 1))
    return
  }

  status="${out%% *}"
  elapsed="${out##* }"
  body=$(head -c 120 /tmp/preflight_body)

  if [[ "$status" == "$expected" ]]; then
    printf '  ok    %-34s %s in %ss\n' "$label" "$status" "$elapsed"
  else
    printf '  FAIL  %-34s got %s, expected %s\n' "$label" "$status" "$expected"
    [[ -n "$body" ]] && printf '        %s\n' "$body"
    [[ -n "$note" ]] && printf '        %s\n' "$note"
    failures=$((failures + 1))
  fi
}

echo "Preflight against $BASE_URL"
echo

# The server is up at all. No dependencies, so a failure here is DNS, TLS or a
# dead deployment.
check "health/live"          "/api/health/live"            200

# The database is reachable from the deployment. 503 here means the app is up
# but DATABASE_URL is wrong or the database is unreachable/asleep.
check "health/ready (database)" "/api/health/ready"        200 \
  "Check DATABASE_URL in Vercel, and that the Neon instance is awake."

# Unauthenticated calls must be refused, not error. A 401 proves the route
# exists and the auth wrapper is running; a 500 means it is misconfigured.
check "profile rejects anon"    "/api/v1/profile"          401 \
  "Anything other than 401 means the mobile auth wrapper is not working."

check "my-assets rejects anon"  "/api/v1/assets/my-assets" 401

# The pairing exchange must be reachable without a token. A GET is not allowed,
# so 405 is the healthy answer -- it proves routing works without minting
# anything. A 404 means the route is missing from the deployment.
check "pairing endpoint routed"  "/api/auth/mobile-exchange" 405 \
  "404 here means the deployment is missing the mobile pairing route."

echo
if (( failures == 0 )); then
  echo "All checks passed. The APK should be able to reach this server."
  echo
  echo "Still worth confirming by hand:"
  echo "  - the QR pairing screen renders on the web app (needs Upstash Redis)"
  echo "  - the phone is off wifi, on mobile data, and can still load $BASE_URL"
  exit 0
fi

echo "$failures check(s) failed. Fix these before demoing."
exit 1
