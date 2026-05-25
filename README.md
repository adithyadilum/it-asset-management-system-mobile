# EITAMS Mobile Companion App

The official React Native (Expo) mobile companion for the EITAMS (IT Asset Management System) platform. This app serves as a dedicated, high-speed utility tool for IT Admins, enabling real-time hardware scanning, cross-device desktop synchronization, and barcode data injection.

## Key Features

- **Secure QR Authentication:** Link your mobile device to your EITAMS desktop session via a one-time 5-minute QR code handshake (utilizing `expo-secure-store` for native keychain encryption).
- **Standalone Asset Lookup:** Instantly view asset details, assignee status, and location via native bottom-sheet overlays using `expo-camera`.
- **Desktop Remote Control (Sync Mode):** Scan a QR tag on the mobile app to automatically slide open the Asset Details panel on your active desktop monitor via Pusher WebSockets.
- **Tethered Data Entry:** Use the mobile device as a wireless 1D barcode scanner to inject 15-character serial numbers directly into active desktop registration forms.
- **Haptic Feedback:** Native device vibration (`expo-haptics`) for successful scans and error states.

## Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) / [Expo SDK 56+](https://expo.dev/)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling:** [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS)
- **Language:** TypeScript
- **Real-time:** Pusher WebSockets
- **Fonts:** Noto Sans (via `@expo-google-fonts/noto-sans`)

## Architecture

This project strictly follows an industry-standard separation of concerns, ensuring UI components are isolated from backend API logic.

```text
it-asset-management-system-mobile/
├── app/                  # Expo Router screens (UI Navigation)
│   ├── _layout.tsx       # Root layout & Font loading
│   └── index.tsx         # Entry screen / QR Handshake
├── src/                  # Core Application Logic
│   ├── components/       # Reusable UI (Buttons, BottomSheets, Camera Reticles)
│   ├── hooks/            # Custom React Hooks (useAuth, useScanner)
│   ├── services/         # External API fetch calls & Pusher WebSocket connections
│   ├── types/            # Strict TypeScript Interfaces
│   ├── utils/            # Helper functions (Haptics, formatting)
│   └── constants/        # Static app-wide variables & Colors
├── global.css            # Tailwind CSS variables & custom color tokens
└── tailwind.config.js    # NativeWind configuration

```

## Local Development Setup

### 1. Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/en/) (LTS Version)
- [Expo Go](https://www.google.com/search?q=https://expo.dev/client) app installed on your physical iOS/Android device (or a configured local simulator).
- The **EITAMS Next.js Backend** running locally (or accessible via Ngrok).

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone [https://github.com/your-org/it-asset-management-system-mobile.git](https://github.com/your-org/it-asset-management-system-mobile.git)
cd it-asset-management-system-mobile
npm install

```

### 3. Environment Variables

Create a `.env` file in the root directory and configure your connection strings. _(Note: Do not use `localhost` if testing on a physical device. Use your machine's local IPv4 address or an Ngrok tunnel)._

```env
EXPO_PUBLIC_API_URL=[http://192.168.](http://192.168.)x.x:3000/api/v1
EXPO_PUBLIC_PUSHER_KEY=your_pusher_key
EXPO_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster

```

### 4. Start the Bundler

Boot up the Expo Metro bundler:

```bash
npx expo start -c

```

- Press **`s`** to switch to development build.
- Press **`w`** to test basic UI layouts in a web browser.
- **Scan the QR code** in the terminal using your phone's camera (iOS) or the Expo Go app (Android) to run the app natively with full hardware support.

## Contributing & Workflow

This repository supports **Epic 11: Mobile Companion Tag Scanning**. Development is split across targeted Task Issues on GitHub.

**Branching Strategy:**

1. Check out a new branch from `main` using the issue number: `git checkout -b feature/US-11.3-scanner-ui`
2. Ensure all UI styling utilizes NativeWind `className` strings synced with our Next.js design tokens.
3. Keep all API `fetch` and database logic strictly within the `src/services/` directory.
4. Submit a Pull Request and request a review from the Project Lead before merging.
