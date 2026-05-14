# Get a SmartParking `.ipa` for your iPhone

> **Why you can't build it on Windows:** Apple's `xcodebuild` and code-signing toolchain are macOS-only. There is no legal way to compile an iOS `.ipa` from a Windows PC. Below are three working paths — pick the one that fits.

The Flutter app already targets the production API at **`https://api.parkingo.app/api`** so the IPA you produce will work out of the box.

---

## ✅ Option A — GitHub Actions (free, no Mac needed) — RECOMMENDED

A workflow has been added at `.github/workflows/build-ios-ipa.yml`. It spins up a **macOS-14 GitHub-hosted runner**, builds the Flutter app with `--no-codesign`, and uploads the resulting **unsigned `.ipa`** as a downloadable artifact.

### Trigger the build

1. **Push** any change inside `mobile/**` to `main`, **or**
2. Go to the repo on GitHub → **Actions** tab → **"Build iOS IPA (unsigned)"** → **Run workflow**.

### Download the IPA

1. Wait ~10–15 min for the run to finish (green check).
2. Open the run → scroll to **Artifacts** → download **`SmartParking-iOS-unsigned-ipa`** (a zip).
3. Inside the zip you'll find **`SmartParking-unsigned.ipa`**.

### Install on your iPhone (no paid Apple account needed)

You **must sign** the IPA before iOS will run it. Easiest free options:

#### Method 1 — Sideloadly (Windows / macOS, easiest)
1. Install **Sideloadly**: <https://sideloadly.io>.
2. Connect your iPhone via USB, trust the computer.
3. Drag `SmartParking-unsigned.ipa` into Sideloadly.
4. Sign in with **your free Apple ID**.
5. Click **Start**. Sideloadly re-signs and installs the IPA.
6. On iPhone: **Settings → General → VPN & Device Management → trust your Apple ID developer profile**.
7. Open **SmartParking** from your home screen.

> Free Apple-ID signed apps expire after **7 days** — re-sign with Sideloadly to renew.

#### Method 2 — AltStore (longer-lived, requires AltServer running)
1. Install **AltServer** on a PC/Mac: <https://altstore.io>.
2. Install **AltStore** on your iPhone via AltServer.
3. Open AltStore → **My Apps** → **+** → pick the IPA → sign with Apple ID.

#### Method 3 — TestFlight (requires paid $99/yr Apple Developer account)
Use **Option B** below to get a *signed* IPA you can upload to App Store Connect → TestFlight, then install via the TestFlight app.

---

## 🍎 Option B — Build a signed IPA on GitHub Actions (paid Apple Developer)

If you have an Apple Developer Program membership you can produce a signed IPA ready for TestFlight / App Store. Add these secrets to the repo:

| Secret | What it is |
|---|---|
| `IOS_DIST_CERT_P12_BASE64` | Base64 of your Apple distribution `.p12` certificate |
| `IOS_DIST_CERT_PASSWORD` | Password of that `.p12` |
| `IOS_PROVISION_PROFILE_BASE64` | Base64 of your `.mobileprovision` |
| `KEYCHAIN_PASSWORD` | Any random string |
| `APP_STORE_CONNECT_API_KEY_ID` | (optional) for `xcrun altool` upload |
| `APP_STORE_CONNECT_ISSUER_ID` | (optional) |
| `APP_STORE_CONNECT_API_KEY_BASE64` | (optional) |

Then ask me to add a `build-ios-signed.yml` workflow that uses [`apple-actions/import-codesign-certs`](https://github.com/Apple-Actions/import-codesign-certs) and `flutter build ipa --export-options-plist=...`.

---

## 💻 Option C — Build locally on a Mac

If you have access to a Mac (or rent one cheap at <https://www.macincloud.com>):

```bash
git clone <repo>
cd smart-parking/mobile
flutter pub get
cd ios && pod install --repo-update && cd ..

# Unsigned (then re-sign with Sideloadly):
flutter build ios --release --no-codesign \
  --dart-define=API_BASE_URL=https://api.parkingo.app/api
mkdir -p build/ios/ipa/Payload
cp -r build/ios/iphoneos/Runner.app build/ios/ipa/Payload/
cd build/ios/ipa && zip -qr SmartParking-unsigned.ipa Payload

# OR signed for TestFlight (open Xcode first to set Team & bundle id):
flutter build ipa --release \
  --dart-define=API_BASE_URL=https://api.parkingo.app/api
open build/ios/archive/Runner.xcarchive   # → Distribute App in Xcode
```

---

## ❓ FAQ

- **Q: Can you compile the `.ipa` for me directly here?**
  A: No. I run on Windows in this workspace and have no macOS / Xcode access. The GitHub Actions workflow above is the equivalent — push, wait 10 min, download.

- **Q: Will the unsigned IPA install if I just AirDrop it?**
  A: No. iOS rejects any unsigned binary. You **must** re-sign it with Sideloadly / AltStore / Xcode.

- **Q: My iPhone is on iOS < 14?**
  A: You must lower `IPHONEOS_DEPLOYMENT_TARGET` in `mobile/ios/Podfile` and `mobile/ios/Runner.xcodeproj/project.pbxproj`. Note Firebase 4.x and `flutter_webrtc` 0.14 require iOS 14+.

