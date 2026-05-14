# 🅿️ Smart Parking System - Backend Architecture Documentation

---

## 1. Backend Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Frontend / Mobile)                  │
│                    (React, Angular, Flutter, etc.)                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTP/HTTPS (REST API)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      🔒 SECURITY LAYER (JWT)                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  JWT Auth Filter  │  │  Security Config │  │  Token Provider  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │  Auth EntryPoint │  │ UserDetailsService│                        │
│  └──────────────────┘  └──────────────────┘                        │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     🎮 CONTROLLER LAYER (REST)                      │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│  │AuthController  │ │ParkingCtrl    │ │ParkingSlotCtrl│             │
│  └───────────────┘ └───────────────┘ └───────────────┘             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│  │ReservationCtrl│ │PaymentCtrl    │ │AdminController │             │
│  └───────────────┘ └───────────────┘ └───────────────┘             │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 📦 DTO LAYER (Request / Response)                    │
│  ┌─────────────────────────┐  ┌─────────────────────────┐          │
│  │  Request DTOs            │  │  Response DTOs           │          │
│  │  • RegisterRequest       │  │  • AuthResponse          │          │
│  │  • LoginRequest          │  │  • ParkingResponse       │          │
│  │  • ParkingRequest        │  │  • ParkingSlotResponse   │          │
│  │  • ParkingSlotRequest    │  │  • ReservationResponse   │          │
│  │  • ReservationRequest    │  │  • PaymentResponse       │          │
│  │                          │  │  • DashboardResponse     │          │
│  │                          │  │  • ApiResponse<T>        │          │
│  └─────────────────────────┘  └─────────────────────────┘          │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ⚙️ SERVICE LAYER (Business Logic)                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│  │ AuthService   │ │ParkingService │ │ParkingSlotSvc │             │
│  └───────────────┘ └───────────────┘ └───────────────┘             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│  │ReservationSvc │ │PaymentService │ │ AdminService  │             │
│  └───────────────┘ └───────────────┘ └───────────────┘             │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   🗃️ REPOSITORY LAYER (Data Access)                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│  │UserRepository │ │ParkingRepo    │ │ParkingSlotRepo│             │
│  └───────────────┘ └───────────────┘ └───────────────┘             │
│  ┌───────────────┐ ┌───────────────┐                               │
│  │ReservationRepo│ │PaymentRepo    │   (Spring Data JPA)           │
│  └───────────────┘ └───────────────┘                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     🏗️ ENTITY LAYER (JPA/Hibernate)                  │
│  ┌───────┐ ┌─────────┐ ┌────────────┐ ┌─────────────┐ ┌─────────┐│
│  │ User  │ │ Parking │ │ParkingSlot │ │ Reservation │ │ Payment ││
│  └───┬───┘ └────┬────┘ └─────┬──────┘ └──────┬──────┘ └────┬────┘│
│      │          │             │                │             │      │
│      │    1:N   │      1:N    │         N:1    │      1:1    │      │
│      └──────────┴─────────────┴────────────────┴─────────────┘      │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        🛢️ MySQL Database                             │
│                       smartparking_db                                │
│  ┌────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ users  │ │ parkings │ │parking_slots │ │ reservations │        │
│  └────────┘ └──────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────┐                                                      │
│  │ payments │                                                      │
│  └──────────┘                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Project Folder Structure

```
smartparking/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/org/example/smartparking/
│   │   │   ├── SmartparkingApplication.java          # Main entry point
│   │   │   │
│   │   │   ├── controller/                            # REST Controllers
│   │   │   │   ├── AuthController.java                # Auth endpoints
│   │   │   │   ├── ParkingController.java             # Parking CRUD
│   │   │   │   ├── ParkingSlotController.java         # Slot management
│   │   │   │   ├── ReservationController.java         # Reservations
│   │   │   │   ├── PaymentController.java             # Payments
│   │   │   │   └── AdminController.java               # Admin dashboard
│   │   │   │
│   │   │   ├── dto/                                   # Data Transfer Objects
│   │   │   │   ├── request/
│   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── ParkingRequest.java
│   │   │   │   │   ├── ParkingSlotRequest.java
│   │   │   │   │   └── ReservationRequest.java
│   │   │   │   └── response/
│   │   │   │       ├── ApiResponse.java               # Generic wrapper
│   │   │   │       ├── AuthResponse.java
│   │   │   │       ├── UserResponse.java
│   │   │   │       ├── ParkingResponse.java
│   │   │   │       ├── ParkingSlotResponse.java
│   │   │   │       ├── ReservationResponse.java
│   │   │   │       ├── PaymentResponse.java
│   │   │   │       └── DashboardResponse.java
│   │   │   │
│   │   │   ├── entity/                                # JPA Entities
│   │   │   │   ├── User.java
│   │   │   │   ├── Role.java                          # Enum
│   │   │   │   ├── Parking.java
│   │   │   │   ├── ParkingSlot.java
│   │   │   │   ├── SlotStatus.java                    # Enum
│   │   │   │   ├── SlotType.java                      # Enum
│   │   │   │   ├── Reservation.java
│   │   │   │   ├── ReservationStatus.java             # Enum
│   │   │   │   ├── Payment.java
│   │   │   │   ├── PaymentStatus.java                 # Enum
│   │   │   │   └── PaymentMethod.java                 # Enum
│   │   │   │
│   │   │   ├── exception/                             # Exception Handling
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   ├── BadRequestException.java
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   │
│   │   │   ├── repository/                            # Data Access Layer
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── ParkingRepository.java
│   │   │   │   ├── ParkingSlotRepository.java
│   │   │   │   ├── ReservationRepository.java
│   │   │   │   └── PaymentRepository.java
│   │   │   │
│   │   │   ├── security/                              # JWT Security
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   ├── JwtAuthenticationEntryPoint.java
│   │   │   │   └── CustomUserDetailsService.java
│   │   │   │
│   │   │   └── service/                               # Business Logic
│   │   │       ├── AuthService.java                   # Interface
│   │   │       ├── ParkingService.java                # Interface
│   │   │       ├── ParkingSlotService.java            # Interface
│   │   │       ├── ReservationService.java            # Interface
│   │   │       ├── PaymentService.java                # Interface
│   │   │       ├── AdminService.java                  # Interface
│   │   │       └── impl/
│   │   │           ├── AuthServiceImpl.java
│   │   │           ├── ParkingServiceImpl.java
│   │   │           ├── ParkingSlotServiceImpl.java
│   │   │           ├── ReservationServiceImpl.java
│   │   │           ├── PaymentServiceImpl.java
│   │   │           └── AdminServiceImpl.java
│   │   │
│   │   └── resources/
│   │       ├── application.properties                 # App configuration
│   │       └── schema.sql                             # DB schema + sample data
│   │
│   └── test/java/org/example/smartparking/
│       └── SmartparkingApplicationTests.java
│
└── ARCHITECTURE.md                                    # This file
```

---

## 3. Entity Relationship Diagram (ERD)

```
┌──────────────────┐       ┌──────────────────────┐
│      USERS       │       │      PARKINGS         │
├──────────────────┤       ├──────────────────────┤
│ id (PK)          │       │ id (PK)              │
│ full_name        │       │ name                 │
│ email (UNIQUE)   │       │ address              │
│ password         │       │ description          │
│ phone            │       │ total_slots          │
│ role (ENUM)      │       │ price_per_hour       │
│ created_at       │       │ active               │
│ updated_at       │       │ created_at           │
└──────┬───────────┘       │ updated_at           │
       │                   └──────────┬───────────┘
       │ 1:N                          │ 1:N
       ▼                              ▼
┌──────────────────────┐   ┌──────────────────────┐
│    RESERVATIONS      │   │    PARKING_SLOTS      │
├──────────────────────┤   ├──────────────────────┤
│ id (PK)              │   │ id (PK)              │
│ user_id (FK) ────────┤   │ slot_number          │
│ parking_slot_id (FK)─┼──▶│ status (ENUM)        │
│ start_time           │   │ slot_type (ENUM)     │
│ end_time             │   │ floor                │
│ status (ENUM)        │   │ parking_id (FK) ─────┤
│ total_price          │   │ created_at           │
│ created_at           │   │ updated_at           │
│ updated_at           │   └──────────────────────┘
└──────────┬───────────┘
           │ 1:1
           ▼
┌──────────────────────┐
│      PAYMENTS        │
├──────────────────────┤
│ id (PK)              │
│ reservation_id (FK)  │ (UNIQUE)
│ user_id (FK)         │
│ amount               │
│ status (ENUM)        │
│ payment_method (ENUM)│
│ paid_at              │
└──────────────────────┘
```

### Relationships:
| Relationship | Type | Description |
|---|---|---|
| User → Reservation | OneToMany | A user can have many reservations |
| User → Payment | OneToMany | A user can have many payments |
| Parking → ParkingSlot | OneToMany | A parking area has many slots |
| ParkingSlot → Reservation | OneToMany | A slot can have many reservations |
| Reservation → Payment | OneToOne | Each reservation has one payment |

---

## 4. Database Schema

See `src/main/resources/schema.sql` for the complete MySQL schema with:
- All 5 tables with proper constraints
- Foreign key relationships with CASCADE delete
- Indexes for performance optimization
- Sample data for testing

---

## 5. REST API Endpoints

### 🔓 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/register-admin` | Register admin | Public |

### 🅿️ Parkings (`/api/parkings`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/parkings` | Get all parkings | Public |
| GET | `/api/parkings/{id}` | Get parking by ID | Public |
| GET | `/api/parkings/active` | Get active parkings | Public |
| GET | `/api/parkings/search?name=xxx` | Search parkings | Public |
| POST | `/api/parkings` | Create parking | Admin |
| PUT | `/api/parkings/{id}` | Update parking | Admin |
| DELETE | `/api/parkings/{id}` | Delete parking | Admin |

### 🔲 Parking Slots (`/api/parking-slots`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/parking-slots/{id}` | Get slot by ID | Authenticated |
| GET | `/api/parking-slots/parking/{parkingId}` | Get slots by parking | Authenticated |
| GET | `/api/parking-slots/available/{parkingId}` | Get available slots | Public |
| POST | `/api/parking-slots` | Create slot | Admin |
| PUT | `/api/parking-slots/{id}` | Update slot | Admin |
| DELETE | `/api/parking-slots/{id}` | Delete slot | Admin |

### 📋 Reservations (`/api/reservations`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/reservations` | Create reservation | Authenticated |
| GET | `/api/reservations/{id}` | Get reservation by ID | Authenticated |
| GET | `/api/reservations/my-reservations` | Get user's reservations | Authenticated |
| PUT | `/api/reservations/{id}/cancel` | Cancel reservation | Authenticated |

### 💳 Payments (`/api/payments`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/payments/reservation/{id}` | Get payment by reservation | Authenticated |
| GET | `/api/payments/my-payments` | Get user's payments | Authenticated |

### 👑 Admin Dashboard (`/api/admin`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/dashboard` | Dashboard statistics | Admin |
| GET | `/api/admin/users` | List all users | Admin |
| GET | `/api/admin/reservations` | List all reservations | Admin |
| GET | `/api/admin/payments` | List all payments | Admin |

---

## 6. Security Layer with JWT

### Authentication Flow:
```
1. User sends POST /api/auth/login with {email, password}
2. Server validates credentials via AuthenticationManager
3. On success, JwtTokenProvider generates a JWT token
4. Token is returned in AuthResponse
5. Client stores token and sends it in Authorization header:
   Authorization: Bearer <jwt_token>
6. JwtAuthenticationFilter intercepts each request:
   - Extracts token from Authorization header
   - Validates token signature and expiration
   - Loads UserDetails from database
   - Sets SecurityContext authentication
7. SecurityConfig authorizes based on roles (USER, ADMIN)
```

### Security Components:
| Component | Purpose |
|-----------|---------|
| `SecurityConfig` | Configures HTTP security, CORS, session policy, URL access rules |
| `JwtTokenProvider` | Generates and validates JWT tokens using HMAC-SHA |
| `JwtAuthenticationFilter` | OncePerRequestFilter that intercepts and validates JWT |
| `JwtAuthenticationEntryPoint` | Returns 401 JSON response for unauthenticated requests |
| `CustomUserDetailsService` | Loads user from DB for Spring Security authentication |

### JWT Token Structure:
```json
{
  "sub": "user@example.com",     // Subject (email)
  "iat": 1709510400,             // Issued at
  "exp": 1709596800              // Expiration (24h default)
}
```

### Role-Based Access Control:
```
PUBLIC:        /api/auth/**, GET /api/parkings/**, GET /api/parking-slots/available/**
AUTHENTICATED: /api/reservations/**, /api/payments/**
ADMIN ONLY:    /api/admin/**, POST|PUT|DELETE /api/parkings/**, /api/parking-slots/**
```

---

## 7. Best Practices for Scalability

### ✅ Architecture Best Practices Applied:
1. **Layered Architecture** — Clear separation: Controller → Service → Repository → Entity
2. **Interface-based Services** — All services defined as interfaces with `impl` classes for loose coupling
3. **DTOs for Data Transfer** — Request/Response DTOs prevent entity exposure and enable validation
4. **Generic API Response Wrapper** — `ApiResponse<T>` standardizes all API responses
5. **Global Exception Handling** — `@RestControllerAdvice` centralizes error handling
6. **Input Validation** — Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Future`, etc.)
7. **Stateless JWT Authentication** — No server-side sessions, horizontally scalable
8. **Transaction Management** — `@Transactional` with `readOnly` for queries
9. **CORS Configuration** — Configurable cross-origin support
10. **Database Indexing** — Indexes on frequently queried columns

### 🚀 Scalability Recommendations:
1. **Connection Pooling** — Use HikariCP (Spring Boot default) with proper pool sizing
2. **Caching** — Add Redis/Caffeine caching for parking availability queries
3. **Pagination** — Implement `Pageable` for list endpoints as data grows
4. **Async Processing** — Use `@Async` for email notifications, payment processing
5. **Rate Limiting** — Add `Bucket4j` or Spring Cloud Gateway rate limiting
6. **API Versioning** — Prefix routes with `/api/v1/` for future versions
7. **Database Read Replicas** — Route `readOnly` transactions to replicas
8. **Message Queue** — Use RabbitMQ/Kafka for reservation events
9. **Docker/K8s** — Containerize for horizontal scaling
10. **Monitoring** — Add Spring Actuator + Prometheus + Grafana

### 📝 Sample API Calls:

**Register:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Ahmed Khalil",
  "email": "ahmed@example.com",
  "password": "password123",
  "phone": "+212612345678"
}
```

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "password123"
}
```

**Create Reservation (Authenticated):**
```bash
POST /api/reservations
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "parkingSlotId": 1,
  "startTime": "2026-03-05T09:00:00",
  "endTime": "2026-03-05T12:00:00"
}
```

**Get Dashboard (Admin):**
```bash
GET /api/admin/dashboard
Authorization: Bearer <admin_jwt_token>
```

