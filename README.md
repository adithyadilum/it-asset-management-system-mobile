# EITAMS Mobile Companion App

The official React Native mobile companion for the EITAMS (Enterprise IT Asset Management System) platform. Built using Expo, this application acts as a high-speed utility for IT Operators and Admins to manage and audit physical hardware in the field.

---

## Key Capabilities

* **Tethered Data Entry (Barcode Injection)**: Scan manufacturer 1D barcodes (Code 128, Code 39, UPC, EAN) using the camera to instantly inject values into the active input field on your EITAMS desktop screen via Pusher WebSockets.
* **Remote Control & Sync**: Scanning a TIQRI asset QR code automatically slides open the Asset Details Panel on your active desktop monitor.
* **Standalone Lookup**: Scan QR codes on-the-go to load live asset metadata (Model, Custodian, Location, and Warranty details) in a native bottom-sheet overlay.
* **Identity Handshake**: Link the mobile client securely to EITAMS desktop sessions using encrypted JWT keys with `expo-secure-store` and `expo-camera` for scan handshake.

---

## Tech Stack

* **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 54](https://expo.dev/)
* **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based native routing)
* **Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS engine for React Native)
* **Language**: TypeScript
* **Real-time & Sync**: Pusher WebSockets
* **Hardware Integration**: `expo-camera` (viewfinder scanning) and `expo-haptics` (vibration feedback)
* **Secure Storage**: `expo-secure-store` for native keychain token encryption

---

## Project Structure

```text
├── app/                  # Expo Router screens (UI Navigation)
│   ├── _layout.tsx       # Root layout & Font loading
│   └── index.tsx         # Entry screen / Scan auth handshake
├── src/                  # Application core
│   ├── components/       # Reusable UI (Buttons, BottomSheets, Camera Reticles)
│   ├── hooks/            # Custom React Hooks (useAuth, useScanner)
│   ├── services/         # External API fetch calls & Pusher connection configs
│   ├── types/            # Strict TypeScript Interfaces
│   ├── utils/            # Haptics, formatting, and helper utilities
│   └── constants/        # Static app-wide configurations & Theme colors
├── global.css            # NativeWind tailwind configurations & variables
└── tailwind.config.js    # Tailwind configuration
```

---

## Local Development Setup

### 1. Prerequisites

- **Node.js**: 20.x or higher
- **Expo Go**: Installed on your physical iOS/Android device (or local simulator)
- **Backend**: EITAMS Next.js Server running locally (or via Ngrok)

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
   npx expo start -c
   ```
   - Press **`s`** to switch to development build.
   - Press **`w`** to test basic UI layouts in a web browser.
   - **Scan the QR code** printed in your terminal using your phone's camera (iOS) or the Expo Go app (Android) to run the application natively.

---

Developed for **TIQRI Corporation**. All rights reserved.
