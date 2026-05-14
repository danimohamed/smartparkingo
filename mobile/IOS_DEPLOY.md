# SmartParking — iOS Build & Deploy Guide

The Flutter mobile app now ships with a full iOS configuration that talks to the **production API at `https://api.parkingo.app/api`** by default.

## 1. Prerequisites (macOS only)

- macOS 13+ with **Xcode 15+** installed
- **CocoaPods** ≥ 1.13: `sudo gem install cocoapods`
- **Flutter** ≥ 3.11 with iOS toolchain: `flutter doctor`
- Apple Developer account (free for simulator, paid for device / TestFlight / App Store)

## 2. One-time setup

```bash
cd mobile
flutter pub get
cd ios
pod install --repo-update
cd ..
```

If you intend to use Firebase Cloud Messaging (push notifications) on iOS:

1. Go to <https://console.firebase.google.com> → your project → iOS app.
2. Register the bundle id (default: `app.parkingo.mobile` — change in Xcode → Runner → Signing & Capabilities if needed).
3. Download `GoogleService-Info.plist` and **drop it into `mobile/ios/Runner/`** in Xcode (check "Copy items if needed", target = Runner).
4. Enable **Push Notifications** and **Background Modes → Remote notifications** capabilities in Xcode.

> Without `GoogleService-Info.plist` the app still runs — push notifications are silently disabled (handled in `lib/main.dart`).

## 3. Run

```bash
# iOS simulator (uses production API)
flutter run -d ios

# Real device (sign in Xcode first)
flutter run -d <device-id>

# Force a local backend during development
flutter run --dart-define=USE_LOCAL_API=true

# Override API base completely
flutter run --dart-define=API_BASE_URL=https://api.parkingo.app/api
```

## 4. Build for distribution

```bash
# IPA for TestFlight / App Store
flutter build ipa --release \
  --dart-define=API_BASE_URL=https://api.parkingo.app/api

# Open the generated archive in Xcode for upload
open build/ios/archive/Runner.xcarchive
```

Then in Xcode → Window → Organizer → **Distribute App** → App Store Connect.

## 5. What changed for iOS readiness

| File | Change |
|---|---|
| `lib/utils/constants.dart` | Default API → `https://api.parkingo.app/api`; `--dart-define=API_BASE_URL` / `USE_LOCAL_API` overrides. |
| `lib/main.dart` | Firebase init wrapped in try/catch so the app boots without `GoogleService-Info.plist`. |
| `lib/services/call_signaling_service.dart` | Already derives `wss://api.parkingo.app/ws/call` automatically from the API URL. |
| `ios/Runner/Info.plist` | Added all required usage descriptions (location, camera, mic, photos, speech), `UIBackgroundModes` (push, location, VoIP, audio, fetch), strict App Transport Security exception for `api.parkingo.app`, `ITSAppUsesNonExemptEncryption=false`, friendlier display name. |
| `ios/Runner.xcodeproj/project.pbxproj` | `IPHONEOS_DEPLOYMENT_TARGET` bumped 13.0 → **14.0** (required by `firebase_messaging 16`, `flutter_webrtc 0.14`, `mobile_scanner 7`). |
| `ios/Podfile` | Created — pins all pods to iOS 14, sets `permission_handler` preprocessor flags for Location / Camera / Microphone / Notifications. |

## 6. Smoke test checklist

- [ ] App launches on iOS simulator.
- [ ] Sign-in hits `https://api.parkingo.app/api/auth/login` (verify in Charles / Xcode network log).
- [ ] Map tiles load (Mapbox).
- [ ] QR scanner opens the camera (permission prompt appears once).
- [ ] Voice assistant prompts for microphone + speech recognition.
- [ ] Reservation invoice opens the system print/share sheet.

## 7. Troubleshooting

- **`Firebase app named '[DEFAULT]' not configured`** → drop in `GoogleService-Info.plist` (see step 2).
- **`PERMISSION_*` not set** → re-run `pod install` from `mobile/ios`.
- **App Transport Security block** → make sure the request is `https://api.parkingo.app/...` (HTTP is intentionally blocked).
- **WebRTC build fails** → ensure deployment target is 14.0 in both Xcode and `Podfile`.

