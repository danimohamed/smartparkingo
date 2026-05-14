# 🅿️ Smart Parking – Frontend

A modern **Smart Parking web application** that helps users find the nearest available parking spots, navigate to them, and reserve a parking slot in real time.

The application provides an experience similar to **Uber / Google Maps**, where users can see nearby parking locations on an interactive map, view availability, and get live navigation to the selected parking.

---

# 🚀 Features

### 🗺️ Interactive Map

* Displays parking locations on a map
* Shows available parking slots
* Shows parking name, price, and distance

### 📍 User Geolocation

* Detects the user's current location
* Centers the map on the user's position
* Continuously updates position while moving

### 🧭 Live Navigation

* Calculates the shortest route to the selected parking
* Draws a route line on the map
* Shows real-time movement while navigating
* Updates the route dynamically if the user changes direction

### 🔎 Smart Parking Search

* Automatically displays the **nearest parking spots**
* Sorts parkings by **distance**
* Shows **available slots only**

### 🎛️ Intelligent Filters

Users can filter parkings by:

* Distance
* Price per hour
* Parking type (Covered / Outdoor / EV)
* Availability

### 📋 Parking Details

Each parking card shows:

* Parking name
* Distance from user
* Available slots
* Price per hour
* Reserve button

### 💳 Reservation System

Users can:

* Select a parking slot
* Choose start and end time
* Reserve directly from the interface

### 📱 Responsive Design

* Optimized for mobile devices
* Smooth UI similar to ride-hailing apps
* Modern card-based interface

---

# 🧰 Tech Stack

| Technology        | Purpose               |
| ----------------- | --------------------- |
| **Next.js 14**    | Frontend framework    |
| **TypeScript**    | Type-safe development |
| **TailwindCSS**   | Modern UI styling     |
| **Mapbox GL JS**  | Interactive maps      |
| **React Query**   | API data fetching     |
| **Framer Motion** | Animations            |
| **Axios**         | HTTP requests         |

---

# 🏗️ Project Structure

```
frontend/
│
├── app/
│   ├── page.tsx
│   ├── map/
│   │   └── MapView.tsx
│
├── components/
│   ├── ParkingCard.tsx
│   ├── ParkingList.tsx
│   ├── Filters.tsx
│   ├── NavigationPanel.tsx
│
├── services/
│   ├── api.ts
│   ├── parkingService.ts
│   └── reservationService.ts
│
├── hooks/
│   ├── useUserLocation.ts
│   └── useParkings.ts
│
├── types/
│   ├── parking.ts
│   └── reservation.ts
│
└── styles/
```

---

# ⚙️ Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/smart-parking-frontend.git
```

### 2️⃣ Navigate to the project

```bash
cd smart-parking-frontend
```

### 3️⃣ Install dependencies

```bash
npm install
```

### 4️⃣ Create environment variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### 5️⃣ Run the development server

```bash
npm run dev
```

Open in browser:

```
http://localhost:3000
```

---

# 🔌 Backend API

This frontend connects to the **Smart Parking Spring Boot Backend**.

Example endpoints:

### Get parkings

```
GET /api/parkings
```

### Get available slots

```
GET /api/parking-slots/available/{parkingId}
```

### Create reservation

```
POST /api/reservations
```

### Get navigation route

```
GET /api/navigation/route
```

---

# 🧭 Navigation System

The navigation system works as follows:

1. User selects a parking location
2. The application calculates the shortest route
3. The route is drawn on the map
4. The user’s position is tracked live using the Geolocation API
5. The route updates dynamically if the user moves

---

# 📸 Screenshots

(You can add screenshots here)

```
Map View
Parking List
Navigation Route
Reservation UI
```

---

# 🌟 Future Improvements

* Real-time parking availability using WebSockets
* Traffic-aware navigation
* Payment integration (Stripe / PayPal)
* Mobile app version (React Native / Flutter)
* AI-based parking prediction

---

# 👨‍💻 Author

**Mohamed Dani**

* 💼 LinkedIn: [https://linkedin.com](https://www.linkedin.com/in/mohamed-dani/)
* 📧 Email: [mohameddani993@gmail.com](mailto:mohameddani993@gmail.com)

---

# 📄 License

This project is open-source and available under the **MIT License**.
