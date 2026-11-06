# EITAMS Mobile Companion App

The official React Native mobile companion for the EITAMS (Enterprise IT Asset Management System) platform. Built using Expo, this application acts as a high-speed utility for IT Operators and Global Administrators to manage and audit physical hardware in the field.

> **Access:** desktop QR pairing is required. Both **GlobalAdmin** and **ITOperator** can pair devices, manage their linked devices, and use the companion app. FinancialAuditors and Employees cannot pair.

---

## Key Capabilities

- **Tethered Data Entry (Barcode Injection)**: Scan manufacturer 1D barcodes (Code 128, Code 39, UPC, EAN) using the camera to instantly inject values into the active input field on your EITAMS desktop screen via Pusher WebSockets.
- **Standalone Lookup**: Scan QR codes on-the-go to load live asset metadata (Asset Tag, Status, Model, Location, and current Custodian) in a native bottom-sheet overlay.
- **Identity Handshake**: Link the mobile client securely to EITAMS desktop sessions using encrypted JWT keys with `expo-secure-store` and `expo-camera` for scan handshake.
- **My Assets**: Review assigned equipment, accept pending handovers, and report a fault from the asset sheet. Reporting starts the existing repair workflow and closes custody; it is restricted to asset-management roles.
- **Actionable Alerts**: Load older alerts, mark them read, and open My Assets natively. Other supported alert links open the trusted web deployment using its normal browser sign-in.
- **Honest Dashboard States**: Metrics show loading and retry states when the API is unavailable. Unknown asset statuses keep their actual labels.

---

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based native routing)
- **Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS engine for React Native)
- **Language**: TypeScript
- **Real-time & Sync**: Pusher WebSockets
- **Hardware Integration**: `expo-camera` (viewfinder scanning) and `expo-haptics` (vibration feedback)
- **Secure Storage**: `expo-secure-store` for native keychain token encryption

---

## Project Structure

```text
├── src/
│   ├── app/                # Expo Router screens (file-based navigation)
│   │   ├── _layout.tsx     # Root layout: fonts, auth guard, revocation listener
│   │   ├── (auth)/         # Pairing handshake
│   │   └── (dashboard)/    # Dashboard, my-assets, scanner, notifications
│   ├── components/         # Reusable UI (cards, sheets, camera reticle)
│   ├── constants/          # API client, theme colors
│   ├── context/            # Auth and notifications providers
│   ├── hooks/              # useDashboardStats, useRecentActivity
│   ├── lib/                # JWT decoding, logger, error narrowing
│   ├── services/           # Typed API calls, one per backend area
│   └── types/              # Shared TypeScript interfaces
├── docs/                   # Audit report and engineering notes
├── global.css              # NativeWind theme variables
└── tailwind.config.js      # Tailwind configuration
```

---

## Local Development Setup

### 1. Prerequisites

- **Node.js**: 22.13 or higher (Node 22 LTS is used in CI)
- **Expo Go**: Installed on your physical iOS/Android device (or local simulator)
- **Backend**: EITAMS Next.js Server running locally (or via Ngrok)
- **Local pairing**: set `EXPO_PUBLIC_API_URL` to the computer's active Wi-Fi IPv4 address (the adapter with a default gateway). Avoid VirtualBox/VMware host-only addresses and `localhost` on a physical phone. Restart Expo with `npx expo start --go --clear` after changing `.env`.

### 2. Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/adithyadilum/it-asset-management-system-mobile.git
   cd it-asset-management-system-mobile
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to create your local `.env` file (do not use `localhost` when testing on physical mobile devices; use your local IPv4 machine address or Ngrok tunnel URL):

   ```bash
   cp .env.example .env
   ```

   Open `.env` and configure your API endpoint and Pusher keys.

4. **Start the Metro Bundler**:
   ```bash
   npx expo start --clear
   ```
   - Press **`s`** to switch to development build.
   - Press **`w`** to test basic UI layouts in a web browser.
   - **Scan the QR code** printed in your terminal using your phone's camera (iOS) or the Expo Go app (Android) to run the application natively.

### 3. Quality Gates

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # jest
npm run check       # all three, as CI runs them
```

CI runs the same gates on every push and pull request to `main` and `dev`.

### 4. Native Builds

The app runs in Expo Go for day-to-day development. Camera permission changes (including removal of Android microphone access) require a fresh native build. Standalone builds go through EAS:

```bash
npx eas build --profile development --platform android
npx eas build --profile production --platform all
# Local bundle check without publishing:
npx expo export --platform android --output-dir dist
```

---

Developed for **TIQRI Corporation**. All rights reserved.

## Inventory and asset profiles

The Inventory tab browses the shared registry for paired IT operators and administrators. Search by asset tag, serial number, name, brand, model, category or location; combine asset type, category, status and location filters. Results load in pages of 20 with pull-to-refresh and retry controls.

Tap an asset or choose **View full asset profile** after a QR scan to view its image, specifications, current custody, warranty, software seat usage, recent maintenance and activity. Profiles use an operational API payload without purchase prices, invoices, licence keys or internal assignment notes. Missing information is shown as unrecorded. Repair reporting uses the existing maintenance workflow.

Backend routes required: `GET /api/v1/inventory` and `GET /api/v1/inventory/:assetId`. Both require registry access and accept the existing mobile bearer token. The backend API documentation describes query limits and response fields.

Validation: `npm run check`, `node scripts/check-audit-baseline.mjs`, `npx expo-doctor`, and `npx expo export --platform android --platform ios`. The CI workflow also exports both native bundles.

## Home, Tasks, handovers and returns

Home now opens live team queues instead of static counters. Tasks support search, queue filters, prioritized due dates, pagination, refresh and retry. Disposal approval tasks are visible to Global Administrators only.

Start a handover or receive equipment from Home, from an asset profile, or by scanning its code. Handover recipients can be active employees or locations. Employees still accept or decline in My Assets; operators cannot accept on their behalf. Location custody starts immediately. Pending handovers support an in-app reminder with a five-minute cooldown.

Receiving equipment ends custody and moves it to Returned. The condition check then releases it to Available, opens an internal repair ticket, or creates a Pending Disposal request for administrator approval. Forms retain inputs after errors and guard against repeated submissions. The server checks the latest asset timestamp and assignment identity, with transaction locks for receiving and return requests.

Required backend routes: `GET /api/v1/operations/tasks`, `GET /api/v1/operations/recipients`, `POST /api/v1/operations/handovers`, `POST /api/v1/operations/assignments/:id`, and `POST /api/v1/operations/inspections`. All require a paired mobile bearer token with IT operator or GlobalAdmin access.
