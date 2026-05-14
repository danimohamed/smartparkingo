# Smart Parking Mobile App

A Flutter mobile application for finding, reserving, and navigating to parking spots. Inspired by Uber and inDrive.

## Architecture

```
lib/
├── main.dart                    # App entry point with providers
├── app.dart                     # MaterialApp configuration
├── models/                      # Data models matching backend DTOs
│   ├── user.dart                # User & AuthResponse
│   ├── parking.dart             # Parking model
│   ├── parking_slot.dart        # ParkingSlot model
│   ├── reservation.dart         # Reservation model
│   ├── payment.dart             # Payment model
│   └── api_response.dart        # Generic API response wrapper
├── services/                    # API layer (Dio HTTP client)
│   ├── dio_client.dart          # Configured Dio singleton with JWT interceptor
│   ├── auth_service.dart        # Login / Register / Logout
│   ├── parking_service.dart     # CRUD + search + active parkings
│   ├── parking_slot_service.dart# Slots by parking / available
│   ├── reservation_service.dart # Create / Cancel / My reservations
│   ├── payment_service.dart     # My payments
│   └── location_service.dart    # GPS location + stream
├── providers/                   # State management (ChangeNotifier + Provider)
│   ├── auth_provider.dart       # Auth state, login, register, logout
│   ├── parking_provider.dart    # Parkings list, slots, location, search
│   ├── reservation_provider.dart# Reservations CRUD
│   └── payment_provider.dart    # Payments list
├── screens/                     # Full-page screens
│   ├── splash_screen.dart       # Animated splash → auth check
│   ├── auth/
│   │   ├── login_screen.dart    # Email + password login
│   │   └── register_screen.dart # Full registration form
│   ├── home/
│   │   └── home_screen.dart     # Map + bottom sheet + drawer
│   ├── parking/
│   │   └── parking_detail_screen.dart # Parking info + slot grid + reserve
│   ├── reservations/
│   │   └── my_reservations_screen.dart # Reservation history + cancel
│   └── payments/
│       └── my_payments_screen.dart     # Payment history + total
├── widgets/                     # Reusable components
│   ├── app_drawer.dart          # Uber-style side drawer
│   ├── parking_card.dart        # Parking list item card
│   ├── parking_bottom_sheet.dart# Draggable bottom sheet with parking list
│   ├── slot_grid.dart           # Color-coded slot grid
│   ├── reservation_bottom_sheet.dart # Date/time picker + price calculator
│   └── loading_skeleton.dart    # Shimmer loading placeholders
└── utils/
    ├── constants.dart           # API endpoints, app constants
    ├── theme.dart               # Material Design theme (light + dark)
    └── helpers.dart             # Distance, price, date formatters
```

## Setup

### Prerequisites

- Flutter SDK >= 3.27.0
- Android Studio / Xcode
- Mapbox account with access token

### 1. Mapbox Configuration

The Mapbox access token is already configured in `lib/utils/constants.dart`:

```dart
class AppConstants {
  static const String mapboxAccessToken = 'pk.eyJ1Ijo...'; // your token
}
```

No platform-specific API key setup is needed — Mapbox tiles are loaded via HTTP.

### 2. Configure Backend URL

Edit `lib/utils/constants.dart`:

```dart
class ApiConstants {
  // Android emulator:
  static const String baseUrl = 'http://10.0.2.2:8080/api';

  // iOS simulator:
  // static const String baseUrl = 'http://localhost:8080/api';

  // Real device (use your machine's IP):
  // static const String baseUrl = 'http://192.168.x.x:8080/api';
}
```

### 3. Install & Run

```bash
cd mobile
flutter pub get
flutter run \
  --dart-define=GEMINI_API_KEY=YOUR_GEMINI_KEY \
  --dart-define=MAPBOX_TOKEN=pk.YOUR_MAPBOX_TOKEN
```

> **Required `--dart-define` secrets** (no longer hardcoded in the source):
> - `GEMINI_API_KEY` — Google Generative Language API key (powers the ParkBot assistant).
> - `MAPBOX_TOKEN` — Mapbox public access token (raster tiles + Directions API).
> - `API_BASE_URL` *(optional)* — overrides the default `https://api.parkingo.app/api`.
> - `USE_LOCAL_API=true` *(optional)* — points to `http://10.0.2.2:8080` (Android emulator) or `http://localhost:8080` (iOS / web) for local backend dev.
>
> The app still launches without these defines, but AI / map features will be disabled and a warning is printed at startup.

#### Release builds (Android)

Create `mobile/android/key.properties` (gitignored) to enable upload-key signing:

```properties
storeFile=/absolute/path/to/upload-keystore.jks
storePassword=...
keyAlias=...
keyPassword=...
```

Without this file the release build falls back to debug signing keys.

### 4. Backend

Make sure the Spring Boot backend is running on port 8080 with the MySQL database set up.

## Features

| Feature | Description |
|---------|-------------|
| **Map View** | Full-screen Mapbox map with custom parking markers (green = available, red = full) |
| **Bottom Sheet** | Uber-style draggable panel listing nearby parkings sorted by distance |
| **Search** | Debounced parking search by name |
| **Parking Detail** | Slot grid with color-coded status, slot type icons |
| **Reservation** | Date/time picker, price calculator, one-tap booking |
| **Navigation** | Route drawing on map + deep-link to Google Maps turn-by-turn |
| **My Reservations** | History with cancel support for active reservations |
| **My Payments** | Payment history with total spent summary |
| **Auth** | JWT login + registration + Google Sign-In with secure token storage |
| **Drawer** | Uber-style side menu with all navigation items |

## Google Sign-In (Android)

If sign-in fails with **`ApiException: 10`** (`DEVELOPER_ERROR`), the Android app is not registered correctly in Google/Firebase for package **`app.parkingo.mobile`**.

1. **SHA-1 fingerprints** — In [Firebase Console](https://console.firebase.google.com/) open project **`parkingo-94f9e`** (must match `android/app/google-services.json`) → Project settings → Your apps → Android app → **Add fingerprint**.  
   Print local debug SHA-1:

   ```bash
   cd mobile/android && ./gradlew :app:signingReport
   ```

   Copy the **SHA1** under `Variant: debug` and paste it into Firebase. Add your **release** keystore SHA-1 for Play Store builds.

2. **Re-download `google-services.json`** after adding SHA-1 so `oauth_client` is no longer empty, and replace `mobile/android/app/google-services.json`.

3. **Web client ID** — The app no longer ships a default `serverClientId` from another GCP project (that caused error 10). If you need an explicit Web OAuth client, create it in **Google Cloud Console** for the **same** project as Firebase, then run:

   ```bash
   flutter run --dart-define=GOOGLE_SERVER_CLIENT_ID=YOUR_WEB_CLIENT.apps.googleusercontent.com
   ```

   For many setups, sign-in works **without** `GOOGLE_SERVER_CLIENT_ID` once SHA-1 and `google-services.json` are correct.

## Tech Stack

- **Flutter** with Material Design 3
- **Provider** for state management
- **Dio** for HTTP with JWT interceptor
- **flutter_map** + **Mapbox** tiles for map display
- **Geolocator** for GPS tracking
- **Flutter Secure Storage** for JWT tokens
- **Shimmer** for loading states
- **Google Fonts** (Inter) for typography
