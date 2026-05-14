# Stitch (stitch.withgoogle.com) — Prompt Pack for Smart Parking Mobile App

> Copy **Section 0 (Master Brief)** into Stitch first, then paste **one screen prompt at a time** (Sections 2.x). Stitch generates the cleanest UI when each prompt focuses on a single screen and reuses the global style guide.

---

## 0. MASTER BRIEF — paste this once at the top of every Stitch session

> **Project:** Parkingo — a Smart Parking mobile app (Flutter, Material 3) inspired by Uber and inDrive.
> **Platform:** Android + iOS, portrait only, mobile-first (no tablet layout).
> **Design system:**
> - Style: clean, modern, Uber-like, lots of whitespace, soft 16px rounded corners, subtle shadows, no gradients except for the splash.
> - Typography: **Inter** (Google Font), 14sp body, 18sp section titles, 24sp page titles, 32sp display.
> - Colors:
>   - Primary `#2A85FF` (blue) — CTAs, active icons, links
>   - Secondary `#1A1D1F` (almost-black) — primary text
>   - Accent / success `#83BF6E` (green) — available slots, completed payments
>   - Warning `#FFBC99` (peach) — reserved slots, pending payments
>   - Error `#FF6A55` (coral) — occupied slots, errors, cancel
>   - Surface `#F4F4F4` (light grey) — page background
>   - Card `#FFFFFF` with 1px `#EFEFEF` divider, no border
>   - Dark mode: scaffold `#111315`, card `#1A1D1F`, text white
> - Buttons: filled rounded-12 primary, outlined rounded-12 secondary, 14px vertical padding.
> - Inputs: filled white, rounded-12, grey divider border, blue focus border.
> - Icons: Material Symbols Rounded.
> - Bottom sheets: top corners rounded 20, drag handle, white background.
> - Map style: Mapbox Streets v12 with custom pin markers (green pin = available, red pin = full, with a numeric badge for free slots).
>
> **User roles** (from JWT): `USER` (driver), `GUARD` (parking-lot agent), `OWNER`, `ADMIN`. Mobile app focuses on **USER** and **GUARD** flows.
>
> **Bottom navigation (USER):** Map · Bookings · Wallet · Profile + a floating circular **AI ParkBot** FAB (indigo `#6366F1`, robot icon) above the nav bar.
>
> **Guard role** has its own home (no bottom nav): a list of action tiles (QR Scan, Plate Scan, Active Bookings, Walk-Ins, Chats).

---

## 1. ARCHITECTURE & API CONTEXT (background — Stitch doesn't draw this, but keep it pinned)

**Backend:** Spring Boot REST API at `https://api.parkingo.app/api`, JWT bearer auth, MySQL.
**Real-time:** WebSocket for guard↔user chat + WebRTC signaling for in-app audio calls.
**External:** Mapbox tiles + Directions, Gemini (Google Generative Language) for the AI assistant, ALPR (license-plate OCR) microservice for guards.

### Endpoints the screens consume
| Domain | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register`, `POST /auth/oauth-login` |
| Parkings | `GET /parkings`, `GET /parkings/active`, `GET /parkings/{id}`, `GET /parkings/search?name=` |
| Slots | `GET /parking-slots/parking/{id}`, `GET /parking-slots/available/{id}` |
| Reservations | `POST /reservations`, `GET /reservations/my-reservations`, `POST /reservations/{id}/cancel`, `GET /reservations/{id}/qr` |
| Payments | `GET /payments/my-payments`, `GET /payments/reservation/{id}` |
| Wallet | `GET /wallet/balance`, `POST /wallet/top-up`, `POST /wallet/pay`, `GET /wallet/transactions` |
| Navigation | `GET /navigation/route?userLat&userLng&parkingLat&parkingLng` |
| User | `GET /users/me`, `PUT /users/me/fcm-token` |
| Chat | `GET /chats`, `GET /chats/{id}/messages` |
| Guard | `POST /guard/validate-entry`, `POST /guard/validate-exit`, `POST /guard/plate/scan`, `GET /guard/parking/{id}/active-bookings`, `GET /guard/parking/{id}/active-walk-ins`, manual occupy/free, etc. |

### Domain entities (drive the UI shapes)
- **Parking**: `id, name, address, lat, lng, totalSlots, availableSlots, hourlyPrice, isActive, hasGuard, photoUrl`
- **ParkingSlot**: `id, slotNumber, floor, type (CAR/MOTO/EV/HANDICAP), status (AVAILABLE/OCCUPIED/RESERVED/MAINTENANCE)`
- **Reservation**: `id, parkingName, slotNumber, startTime, endTime, status (ACTIVE/COMPLETED/CANCELLED/NO_SHOW), totalPrice, qrCode`
- **Payment**: `id, amount, method (WALLET/CARD), status (PENDING/COMPLETED/FAILED/REFUNDED), createdAt, reservationId`
- **Wallet**: `balance, currency (MAD), transactions[{type: TOP_UP/PAYMENT/REFUND, amount, createdAt, label}]`
- **GuardChat / ChatMessage**: `chatId, otherUserName, lastMessage, unreadCount, messages[{senderId, text, sentAt, kind: TEXT/AUDIO}]`

---

## 2. SCREEN-BY-SCREEN PROMPTS

> **How to use:** in Stitch, start a new design, paste **Section 0** as the global brief, then paste **one** of the prompts below as the screen prompt. Repeat for each screen.

### 2.1 Splash
```
Design a splash screen for "Parkingo".
- Full-bleed gradient background from #2A85FF (top) to #1565D8 (bottom).
- Centered white "P" logo inside a 96dp white rounded-square (24 corner radius) with a soft shadow.
- Below the logo: app name "Parkingo" in 32sp Inter Bold white, then tagline "Park smarter, drive easier" in 14sp Inter Regular white80%.
- A thin circular progress indicator (white, 24dp) anchored 64dp from the bottom.
```

### 2.2 Onboarding (3 pages — optional)
```
Design a 3-page onboarding carousel:
1) "Find parking instantly" — illustration of a phone over a city map with green pins.
2) "Reserve in seconds" — illustration of a calendar + parking slot grid.
3) "Pay with your wallet" — illustration of a credit card flying into a wallet.
Each page: top illustration (60% height), title 24sp bold, subtitle 14sp grey, page indicator dots (active = #2A85FF, inactive = #E0E0E0), "Skip" text-button top-right, primary "Next" button bottom-right; on the last page replace "Next" with "Get Started".
```

### 2.3 Login
```
Design a login screen.
- AppBar transparent, back arrow only.
- Title "Welcome back" 28sp bold, subtitle "Sign in to continue" 14sp grey.
- Email input (filled, mail icon prefix), Password input (filled, lock icon prefix, eye toggle suffix).
- "Forgot password?" link aligned right under password field, color #2A85FF.
- Primary full-width "Sign In" button (#2A85FF, rounded-12, 52dp height).
- Divider with "or continue with" centered.
- Two outlined social buttons side by side: Google (G icon) and Apple (apple icon).
- Bottom centered text: "Don't have an account? Sign up" with "Sign up" in #2A85FF.
```

### 2.4 Register
```
Design a registration screen with the same style as login.
Fields stacked: Full name, Email, Phone (with country flag prefix), Password, Confirm password.
A small checkbox row: "I agree to the Terms & Privacy Policy" (links in #2A85FF).
Primary full-width "Create account" button.
Bottom: "Already have an account? Sign in".
```

### 2.5 Home (Map + Bottom Sheet) — main USER screen
```
Design the home screen of a parking app, Uber-style.
Top layer: full-screen Mapbox map showing Marrakech with multiple custom pins:
- Green rounded pin with a small white "12" badge (available slots)
- Red rounded pin with white "0" badge (full)
- The user's position is a blue dot with a soft halo.
Floating elements over the map:
- Top-left: circular white 44dp icon button with a hamburger menu (opens drawer), soft shadow.
- Top-center: a pill-shaped white search bar "Search parking…" with a magnifier icon, full-width minus 64dp side margin, shadow.
- Top-right under the search: horizontal scrollable filter chips: "All", "Available", "Cheapest", "Nearest", "EV", "Covered" (active chip = filled #2A85FF white text, others = white with grey border).
- Bottom-right above bottom sheet: circular FAB "Recenter" (white, location icon, blue tint).
Bottom sheet (draggable, snapped at 30%): drag handle, title "Nearby Parkings (24)", below it a horizontally-scrollable row of large parking cards.
Each card (240dp wide): image header (parking photo) with a green badge "12 free", body has parking name (16sp bold), address (12sp grey, location icon prefix), distance "1.2 km" + price "8 MAD/h" in a row, a small "Reserve" outlined button.
Bottom navigation bar: 4 items (Map active blue, Bookings, Wallet, Profile) + center FAB ParkBot (indigo, robot icon, raised).
```

### 2.6 Side Drawer
```
Design a side navigation drawer (Uber-style).
Top header: avatar (circular 64dp), full name "Yassine A." 18sp bold, email "yassine@parkingo.app" 12sp grey, a small chip showing role "DRIVER" in #2A85FF tinted background.
Menu items, each row 56dp with icon + label + chevron:
- My Bookings
- Payment History
- Wallet
- Notifications (with red dot)
- Language
- Dark mode (toggle switch on the right)
- Help & Support
- About
Bottom: outlined "Sign out" button full width with logout icon, color #FF6A55.
```

### 2.7 Parking Detail
```
Design a parking detail screen.
- Hero image (240dp) of a parking lot with a back arrow + share icon overlaid (white circular buttons, top corners).
- Sliding sheet starting under the hero, white, rounded-top 24:
  - Parking name "Carrefour Gueliz" 22sp bold, address with map-pin icon below, "Open 24/7" green chip + "Guarded" blue chip.
  - Quick stats row: 4 stat tiles (Free 18, Total 60, Price 8 MAD/h, Floors 3) — each tile soft grey background, icon top, value bold, label grey.
  - Tabs: "Slots" | "Info" | "Reviews" with underline indicator.
  - Slots tab content: floor selector chips (G, 1, 2), then a 6-column grid of slot tiles, each 48dp square rounded-8:
    - Green = available (icon: car outline)
    - Red = occupied
    - Peach = reserved
    - Grey = maintenance
    - Selected slot has a 2dp blue border.
  - Legend row under the grid.
- Sticky bottom bar with selected slot summary "Slot B-12 · CAR" + big primary "Reserve this slot" button.
```

### 2.8 Reservation Bottom Sheet
```
Design a reservation bottom sheet that slides up from the parking detail screen.
- Drag handle, title "Reserve Slot B-12" with close X.
- Date picker row: horizontal scrollable day chips (Today, Tomorrow, Sun 26, Mon 27…) with active = blue filled.
- Two time pickers side-by-side: "Start" and "End" (each shows time in big 24sp + edit icon).
- Duration calculator chip "Duration: 2h 30min".
- Price breakdown card (light grey background): rows "Hourly rate × 2.5h = 20.00 MAD", "Service fee 1.00 MAD", divider, total "21.00 MAD" bold.
- Payment method selector: two pill buttons "Wallet (124 MAD)" (selected, green check) and "Card".
- Sticky primary button "Confirm reservation · 21 MAD" full width.
```

### 2.9 My Bookings (list + detail)
```
Design "My Bookings" screen with a top tab bar: "Active" | "Past" | "Cancelled" (underline indicator blue).
Each booking card (rounded-16 white, 12dp gap):
- Left: square 56dp parking thumbnail rounded-12.
- Middle: parking name 16sp bold, slot "Slot B-12 · Floor 1" 12sp grey, datetime row "Apr 24, 14:00 → 16:30" 12sp.
- Right column: status pill (ACTIVE=blue, COMPLETED=green, CANCELLED=red, NO_SHOW=peach), price below.
- Footer row inside card: outlined "Show QR" button + outlined "Cancel" (red text) for active.
Empty state for "Past": centered illustration + "No past bookings yet" text.
```

### 2.10 Reservation QR Ticket
```
Design a QR ticket screen.
- White scaffold, AppBar "Your Ticket" with back arrow.
- Centered card (rounded-24, soft shadow), full width minus 32dp:
  - Top section: parking name big bold + slot "B-12" with floor.
  - Date + time range, status pill.
  - Big QR code (240dp) centered.
  - Dashed horizontal divider with two small notches on the sides (like a ticket).
  - Bottom section: "Show this code to the guard at entry/exit", a small countdown "Valid for 14:32".
- Below the card: outlined "Download PDF" button + filled "Open in Maps" button.
```

### 2.11 Wallet
```
Design a wallet screen.
- Top hero card (full-width, rounded-24, gradient blue #2A85FF→#1565D8, height 180dp):
  - Label "Available balance" white80%.
  - Big balance "248.50 MAD" 36sp bold white.
  - Two pill buttons "Top up" (white filled, blue text) and "Withdraw" (white outlined).
- Below: section title "Recent transactions" + "See all" link.
- Transaction list rows: circular icon (green ↑ for top-up, red ↓ for payment, grey ↺ for refund), label "Reservation at Carrefour" + date below, amount right (green +50 / red −21).
- Floating "Top up" bottom sheet variant: amount input with quick-pick chips 50/100/200/500 MAD + payment method selector + confirm button.
```

### 2.12 Payment History
```
Design "Payment History".
Top summary card: "Total spent" 28sp bold + "in 30 days · 184 MAD" subtitle.
Filter chips: "All", "Wallet", "Card", "Refunded".
List of payment rows: parking name + reservation date, status pill on right (Completed green / Pending peach / Failed red / Refunded grey), amount big at right.
Tapping a row opens a bottom sheet with full receipt detail and a "Download invoice" button.
```

### 2.13 Profile
```
Design a profile screen.
- Top: large circular avatar (96dp) centered with a small camera FAB to edit, name 22sp bold below, email grey, role chip.
- Settings list grouped in cards (rounded-16 white):
  - Account: Personal info, Vehicles (with car icon), Saved places.
  - Preferences: Language, Theme (light/dark/system selector), Notifications.
  - Security: Change password, Biometric login (toggle), Two-factor (toggle).
  - Support: Help center, Contact us, Rate the app.
- Bottom outlined red "Sign out" button.
```

### 2.14 Navigation (Turn-by-Turn)
```
Design a turn-by-turn navigation screen.
- Full-screen map with a thick blue polyline from user (blue dot) to parking (green pin).
- Top instruction card (rounded-24, white, shadow): big arrow icon left ("Turn right"), distance "in 200 m" 22sp bold, street "Avenue Mohammed VI" 14sp grey.
- Left edge: vertical mute/unmute voice button (circular white).
- Bottom card: ETA "8 min · 2.4 km" big bold, "Arriving at Carrefour Gueliz" subtitle, two buttons "End" (red outlined) and "Open in Google Maps" (blue filled).
```

### 2.15 AI ParkBot Chat
```
Design an AI assistant chat screen.
- AppBar: avatar + "ParkBot" title + green dot "Online", back arrow.
- Background: very light blue tint.
- Chat bubbles:
  - User: right-aligned, #2A85FF filled, white text, rounded-20 with sharp bottom-right corner.
  - Bot: left-aligned, white card with shadow, dark text, robot avatar 32dp on the left.
- Quick suggestion chips above the input: "Cheapest near me", "Reserve for tomorrow 9am", "Cancel my booking".
- Input bar bottom: rounded text field "Ask anything…" + mic button + send button (blue circular).
```

### 2.16 Guard ↔ User Chat (1:1) + Audio Call
```
Design a 1:1 chat screen between a driver and a parking guard.
- AppBar: avatar + name "Guard · Mehdi" + status "At Carrefour Gueliz", trailing icons: phone (audio call) and info.
- Same chat bubble style as ParkBot. Add support for audio messages: bubble shows waveform + play button + duration.
- Input bar: + (attach), text field, mic (long-press to record showing red recording indicator and timer).
Also design the in-call screen:
- Full-screen dark gradient, large circular avatar centered with pulsing ring, name + "Calling…" / "00:42", four circular controls bottom: mute, speaker, keypad, end-call (red).
```

### 2.17 GUARD — Home Dashboard
```
Design a guard home dashboard (no bottom nav).
- Top header: greeting "Good evening, Mehdi", assigned parking chip "Carrefour Gueliz" with switch icon.
- Big stats row (3 cards): "Free 18", "Occupied 42", "Reserved 6" — each large number + label.
- Action grid (2 columns of square tiles, rounded-20, white, icon top, label bottom):
  - QR Scan (qr icon)
  - Plate Scan (camera icon)
  - Active Bookings (calendar icon, badge count)
  - Walk-Ins (walk icon, badge)
  - Manual Slot Control (grid icon)
  - Chats (chat icon, unread badge)
- Bottom strip: small "End shift" outlined button.
```

### 2.18 GUARD — QR Scanner
```
Design a QR scanner screen for the guard.
- Full-screen camera preview.
- Dark overlay with a centered transparent square (260dp) and animated horizontal scan line.
- Top AppBar transparent: back arrow + flashlight toggle.
- Below the square: instruction "Align the driver's QR code".
- Bottom sheet snippet (peeking 96dp): "Manual entry" link + segmented control "Entry" / "Exit".
After scan, show a result modal: green check, "Welcome, Yassine A.", parking + slot, big primary "Open Gate" button, secondary "Reject".
```

### 2.19 GUARD — License Plate Scan (ALPR)
```
Design a plate scan screen.
- Camera preview with a horizontal rectangular cutout for the plate (16:5 ratio) centered.
- Detected plate live overlay: white badge "12345-A-67" with confidence "98%".
- Bottom sheet result: plate string big bold, lookup status:
  - GREEN if matched: shows reservation card (driver name, slot, time window) + "Validate Entry" button.
  - PEACH if walk-in: shows "No reservation found — register walk-in" + form fields (slot picker, expected duration) + "Start session".
  - RED if blacklisted: red banner "Access denied" + "Notify owner" button.
```

### 2.20 GUARD — Active Bookings & Walk-Ins
```
Design an "Active Bookings" tab + "Walk-Ins" tab screen for the guard.
Active Bookings list rows: driver avatar, name + plate, slot + time window, status pill (Awaiting / Inside / Overdue red), trailing kebab menu.
Walk-Ins list rows: plate big bold, started "1h 20min ago", running cost "12.50 MAD" green, "Mark paid" small button.
Top: search bar + status filter chips.
```

### 2.21 GUARD — Manual Slot Control
```
Design a manual slot management screen.
- Floor selector chips at top.
- 6-column grid of slot tiles same color rules as the user side, but each tile is tappable and shows a bottom sheet:
  - Slot details, current status, action buttons "Mark Occupied" / "Mark Free" / "Set Maintenance".
- Top-right action: "Sync" icon button.
```

### 2.22 Notifications
```
Design a notifications list screen.
- Tabs: "All" | "Bookings" | "Payments" | "Chat".
- Each notification row: circular tinted icon (blue for booking, green for payment, peach for guard, red for alert), title 14sp bold, body 12sp grey, time right.
- Unread rows have a faint blue background and a 6dp blue dot on the right.
- Top-right "Mark all as read" text button.
```

### 2.23 Empty / Error / Loading states (one screen with 3 variants)
```
Design 3 reusable state variants stacked side by side at phone size:
1) Empty — illustration of an empty parking lot, title "Nothing here yet", subtitle, primary CTA "Explore parkings".
2) Error — illustration of a broken sign, title "Something went wrong", subtitle "Please try again", outlined "Retry" button.
3) Loading — shimmer skeletons of a parking card list (3 rows), no spinner.
```

---

## 3. STYLE-LOCKING TIP for Stitch

After your first generation in Stitch, click **"Add to design system"** on the colors, typography, and the parking card / slot tile components. Subsequent prompts will then automatically reuse them, keeping all 23 screens visually consistent.

## 4. Export checklist

For each generated screen, in Stitch click **Export → Figma** (or **Code → Flutter**) so you can drop the widgets straight into:
- `mobile/lib/screens/...` (matching the folder names already present)
- `mobile/lib/widgets/...` for reusable cards/tiles.

