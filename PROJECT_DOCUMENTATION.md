# SmartTransportPooling — Complete Project Documentation
### For Interview Preparation | Full Stack (Spring Boot + Angular 19)

---

## TABLE OF CONTENTS

1. [Project Overview & Purpose](#1-project-overview--purpose)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Schema & Entity Relationships](#4-database-schema--entity-relationships)
5. [Backend — Deep Dive](#5-backend--deep-dive)
   - 5.1 Entry Point & Configuration
   - 5.2 Security Layer (JWT + Filter)
   - 5.3 WebSocket Configuration
   - 5.4 Controllers
   - 5.5 Services
   - 5.6 Repositories
   - 5.7 DTOs
   - 5.8 Models & Enums
6. [Frontend — Deep Dive](#6-frontend--deep-dive)
   - 6.1 Architecture & Setup
   - 6.2 Routing & Guards
   - 6.3 Services
   - 6.4 Pages (Components)
   - 6.5 Models
   - 6.6 Interceptor
7. [End-to-End Application Flow](#7-end-to-end-application-flow)
8. [Key Features Explanation](#8-key-features-explanation)
9. [API Reference Summary](#9-api-reference-summary)
10. [Common Interview Questions & Answers](#10-common-interview-questions--answers)

---

## 1. Project Overview & Purpose

**SmartTransportPooling** is a corporate ride-sharing web application designed for employees of organizations to pool rides to and from their workplace. 

### Why It Was Built
Corporate commuting often causes:
- Traffic congestion from single-occupancy vehicles
- High fuel costs for employees
- Environmental waste

SmartTransportPooling solves this by allowing employees to **offer rides** (as drivers) or **book rides** (as passengers) within their organization, verified by email domain whitelisting.

### Core Concepts
| Concept | Explanation |
|---|---|
| **Organization Whitelisting** | Only emails from approved domains (e.g. @cognizant.com) can register |
| **Driver** | Any registered user can create a trip offering seats |
| **Passenger** | Any user can search and book seats on available trips |
| **Approval Mode** | Driver chooses MANUAL (they approve each booking) or AUTO (instant booking) |
| **Booking Flow** | Passenger requests → Driver approves/rejects → Email notification sent |
| **Real-time** | WebSockets push notifications and chat messages live |

---

## 2. Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 17+ | Programming language |
| Spring Boot | 3.x | Application framework |
| Spring Data JPA | 3.x | ORM for database operations |
| Hibernate | 6.x | JPA implementation |
| MySQL | 8.x | Relational database |
| JWT (jjwt) | 0.12.x | Stateless authentication tokens |
| BCrypt (jbcrypt) | 0.4 | Password hashing |
| JavaMailSender | Built-in | Sending emails via SMTP |
| Spring WebSocket / STOMP | Built-in | Real-time chat & notifications |
| Lombok | Latest | Boilerplate reduction (@Builder, @Getter, etc.) |
| Maven | 3.x | Build tool |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Angular | 19 (Zoneless) | SPA framework |
| TypeScript | 5.x | Typed JavaScript |
| Bootstrap 5 | 5.3 | CSS framework for layout |
| Bootstrap Icons | 1.x | Icon library |
| Leaflet.js | 1.x | Interactive maps |
| SockJS + STOMP | Latest | WebSocket client |
| RxJS | 7.x | Reactive programming |
| Angular Signals | Built-in | Reactive state management |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ANGULAR FRONTEND                      │
│   (Port 4200 — ng serve)                                │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Pages   │  │ Services │  │  Guards  │              │
│  │(Components│  │(HTTP +   │  │(Route    │              │
│  │+ Templates│  │WebSocket)│  │Protection│              │
│  └────┬─────┘  └────┬─────┘  └──────────┘              │
│       │              │                                   │
│       └──── Angular Signals ──── Change Detection ─────│
└─────────────────┬───────────────────────────────────────┘
                  │  HTTP (REST API) + WebSocket (STOMP)
                  │  Authorization: Bearer <JWT Token>
┌─────────────────▼───────────────────────────────────────┐
│                   SPRING BOOT BACKEND                    │
│   (Port 8081)                                           │
│                                                         │
│  ┌─────────────┐                                        │
│  │CORS Filter  │ ← Allows requests from localhost:4200  │
│  └──────┬──────┘                                        │
│         ▼                                               │
│  ┌─────────────┐                                        │
│  │JWT Auth     │ ← Validates Bearer token on all /api/* │
│  │Filter       │   Sets userEmail as request attribute  │
│  └──────┬──────┘                                        │
│         ▼                                               │
│  ┌──────────────────────────────────────────┐          │
│  │           REST Controllers               │          │
│  │  /api/auth  /api/trips  /api/bookings    │          │
│  │  /api/admin  /api/chat  /api/vehicles    │          │
│  │  /api/notifications                      │          │
│  └──────────────┬───────────────────────────┘          │
│                 ▼                                       │
│  ┌──────────────────────────────────────────┐          │
│  │              Service Layer               │          │
│  │  Business Logic, Validation, Email       │          │
│  └──────────────┬───────────────────────────┘          │
│                 ▼                                       │
│  ┌──────────────────────────────────────────┐          │
│  │          Repository Layer (JPA)          │          │
│  │  CRUD + Custom JPQL Queries              │          │
│  └──────────────┬───────────────────────────┘          │
└─────────────────┼───────────────────────────────────────┘
                  │  JDBC / Hibernate
┌─────────────────▼───────────────────────────────────────┐
│                     MySQL Database                      │
│   Database: smart_transport                             │
│   Tables: users, trips, bookings, vehicles,             │
│           organizations, notifications, chat_messages,  │
│           trip_stops, password_reset_tokens,            │
│           email_verification_tokens                     │
└─────────────────────────────────────────────────────────┘
```

### Communication Patterns
- **REST**: Standard HTTP for all CRUD operations
- **WebSocket (STOMP)**: Real-time push for notifications (`/topic/user/{id}/notifications`) and chat (`/topic/chat/{tripId}`)
- **Async Email**: `@Async` annotation so email sending never blocks API responses

---

## 4. Database Schema & Entity Relationships

### Tables & Their Purpose

#### `users`
Stores all registered users (drivers & passengers are the same user — roles are flexible).
| Column | Type | Purpose |
|---|---|---|
| id | BIGINT PK | Auto-increment ID |
| name | VARCHAR | Full name |
| email | VARCHAR UNIQUE | Login credential + org verification |
| password | VARCHAR | BCrypt hashed |
| phone | VARCHAR | Optional contact |
| gender | ENUM(MALE,FEMALE,OTHER) | For gender-filter search |
| role | ENUM(USER,DRIVER,ADMIN) | Access control |
| organization_domain | VARCHAR | Extracted from email (e.g. cognizant.com) |
| department | VARCHAR | Optional |
| city | VARCHAR | Used to filter trips by city |
| profile_pic | VARCHAR | Stored filename |
| enabled | BOOLEAN | Account enabled flag |
| email_verified | BOOLEAN | Email verification status |
| created_at | DATETIME | Timestamp |

#### `organizations`
Controls which email domains are allowed to register.
| Column | Type | Purpose |
|---|---|---|
| id | BIGINT PK | |
| name | VARCHAR | e.g. "Cognizant" |
| email_domain | VARCHAR UNIQUE | e.g. "cognizant.com" |
| whitelisted | BOOLEAN | Only whitelisted=true allows registration |
| created_at | DATETIME | |

#### `trips`
Each trip offering by a driver.
| Column | Type | Purpose |
|---|---|---|
| id | BIGINT PK | |
| driver_id | FK → users | Who is offering the ride |
| vehicle_id | FK → vehicles | Optional vehicle linked |
| origin | VARCHAR | Pickup location name |
| destination | VARCHAR | Drop-off location name |
| origin_lat/lng | DOUBLE | GPS coordinates |
| dest_lat/lng | DOUBLE | GPS coordinates |
| departure_time | DATETIME | When the trip starts |
| available_seats | INT | Remaining bookable seats |
| price_per_seat | DECIMAL | Cost for single trips |
| daily_rate | DECIMAL | Cost for recurring trips |
| recurring | BOOLEAN | Is this a repeating trip |
| recurring_days | VARCHAR | e.g. "MON,TUE,WED" |
| recurring_group_id | VARCHAR UUID | Links sibling recurring trips |
| approval_mode | ENUM(MANUAL,AUTO) | How bookings are accepted |
| status | ENUM(SCHEDULED,ACTIVE,COMPLETED,CANCELLED) | Trip lifecycle |
| created_at | DATETIME | |

#### `trip_stops`
Intermediate stops for a trip.
| Column | Type | Purpose |
|---|---|---|
| id | BIGINT PK | |
| trip_id | FK → trips | Parent trip |
| stop_name | VARCHAR | e.g. "Salem" |
| lat / lng | DOUBLE | Coordinates |
| stop_order | INT | Sequence order |

#### `bookings`
Records of passengers booking trips.
| Column | Type | Purpose |
|---|---|---|
| id | BIGINT PK | |
| trip_id | FK → trips | Which trip is booked |
| passenger_id | FK → users | Who booked |
| status | ENUM(PENDING,APPROVED,REJECTED,CANCELLED) | Booking state |
| fare | DECIMAL | Total fare calculated at booking time |
| seats_booked | INT | How many seats reserved |
| booking_type | ENUM(SINGLE,RECURRING) | For recurring trips |
| booked_days | VARCHAR | "MON,TUE" for recurring bookings |
| booked_at | DATETIME | When booking was made |

#### `vehicles`
Vehicles registered by drivers (require admin approval).
| Column | Type | Purpose |
|---|---|---|
| id | BIGINT PK | |
| user_id | FK → users | Vehicle owner |
| license_plate | VARCHAR UNIQUE | |
| model | VARCHAR | Car model |
| color | VARCHAR | |
| total_seats | INT | |
| license_doc_url | VARCHAR | Uploaded document |
| approved | BOOLEAN | Admin must approve before use |

#### `notifications`
In-app notification records.
| Column | Type | Purpose |
|---|---|---|
| id | BIGINT PK | |
| user_id | FK → users | Recipient |
| type | ENUM | BOOKING_REQUESTED, BOOKING_APPROVED, etc. |
| title | VARCHAR | Short heading |
| message | TEXT | Full message |
| reference_id | BIGINT | Related entity (e.g. trip ID) |
| read | BOOLEAN | Read status |
| created_at | DATETIME | |

#### `chat_messages`
Messages between driver and passenger within a trip context.
| Column | Type | Purpose |
|---|---|---|
| id | BIGINT PK | |
| trip_id | FK → trips | Context of the chat |
| sender_id | FK → users | |
| receiver_id | FK → users | |
| content | TEXT | Message text |
| sent_at | DATETIME | |
| read_at | DATETIME NULL | NULL means unread |

#### `password_reset_tokens` & `email_verification_tokens`
Temporary one-time-use tokens for secure password reset and email verification flows.

### Entity Relationships (ER Summary)
```
users ──< trips (one user can drive many trips)
users ──< bookings (one user can make many bookings)
users ──< vehicles (one user can own many vehicles)
trips ──< bookings (one trip can have many bookings)
trips ──< trip_stops (one trip can have many stops)
vehicles >── trips (one vehicle assigned to many trips)
organizations (standalone - just domain whitelist)
```

---

## 5. Backend — Deep Dive

### 5.1 Entry Point & Configuration

**`SmartTransportApplication.java`**
- `@SpringBootApplication` — enables auto-configuration, component scan, Spring Boot setup
- `@EnableAsync` — enables `@Async` for email sending
- `@EnableScheduling` — enables `@Scheduled` for trip reminders

**`application.properties`**
| Property | Value | Purpose |
|---|---|---|
| `spring.datasource.url` | jdbc:mysql://localhost:3306/smart_transport | MySQL connection |
| `createDatabaseIfNotExist=true` | Auto-create DB | No manual DB setup needed |
| `spring.jpa.hibernate.ddl-auto=update` | Auto-create/update tables | Schema managed by Hibernate |
| `app.jwt.secret` | 256-bit string | HMAC-SHA256 signing key |
| `app.jwt.expiration-ms` | 86400000 (24 hours) | Token validity |
| `server.port` | 8081 | Backend port |
| `spring.mail.*` | Gmail SMTP | Email configuration |
| `app.email-verification-enabled` | true/false | Toggle email verification requirement |

---

### 5.2 Security Layer (JWT + Filter)

#### `JwtTokenProvider.java`
**Purpose**: Generates and validates JWT tokens.

**How it works:**
1. **`generateToken(email)`** — Creates a JWT with:
   - Subject = user's email
   - Issued At = now
   - Expiry = now + 24 hours
   - Signed using HMAC-SHA256 with the secret key
2. **`getEmailFromToken(token)`** — Parses the JWT, extracts the subject (email)
3. **`validateToken(token)`** — Returns true/false; catches any JWT exceptions

**Why JWT (not sessions)?**
- Stateless — server doesn't store session state
- Scalable — any server instance can validate the token
- Self-contained — carries user identity

#### `JwtAuthenticationFilter.java`
**Purpose**: Intercepts all `/api/*` requests to validate the token.

**Flow for every request:**
```
Request arrives
  ↓
Is it OPTIONS (CORS preflight)? → send 200, stop
  ↓
Is it a public endpoint? (login, register, verify-email, etc.) → pass through
  ↓
Extract "Authorization: Bearer <token>" header
  ↓
Is token valid? No → 401 Unauthorized response
  ↓
Get email from token
  ↓
Does user exist in DB? No → 401 Unauthorized
  ↓
Is path /api/admin and user is NOT ADMIN? → 403 Forbidden
  ↓
Set request.setAttribute("userEmail", email)
  ↓
Pass to controller
```

**Why `request.setAttribute("userEmail")`?**
Controllers use `@RequestAttribute("userEmail")` to know which logged-in user is making the request without re-querying the database or re-parsing the token.

#### `SecurityConfig.java`
**Purpose**: Registers the JWT filter and CORS filter with the servlet container.

- **CORS Filter**: Allows requests from `http://localhost:4200` with all HTTP methods. This prevents the browser from blocking cross-origin API calls.
- **JWT Filter**: Applied to `/api/*` pattern at order 1 (early in the chain).

**Why not Spring Security's HttpSecurity?**
The project uses manual `FilterRegistrationBean` instead of `WebSecurityConfigurerAdapter` — a lighter approach since Spring Security's full framework isn't needed.

---

### 5.3 WebSocket Configuration

**`WebSocketConfig.java`**
```java
config.enableSimpleBroker("/topic");          // In-memory message broker
config.setApplicationDestinationPrefixes("/app"); // Client sends to /app/...
registry.addEndpoint("/ws").withSockJS();    // Fallback for older browsers
```

**Topics used in the app:**
| Topic | Purpose |
|---|---|
| `/topic/chat/{tripId}` | Real-time chat messages for a specific trip |
| `/topic/user/{userId}/notifications` | Push notifications to a specific user |

**How a real-time notification works:**
1. Driver approves booking
2. `BookingService.approveBooking()` calls `notificationService.notify(passenger, ...)`
3. `NotificationService.notify()` saves notification to DB AND calls `messagingTemplate.convertAndSend("/topic/user/"+userId+"/notifications", payload)`
4. Frontend Angular service subscribed to that topic receives the push immediately
5. Bell icon badge updates without page refresh

---

### 5.4 Controllers

#### `AuthController` — `/api/auth`
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/register` | POST | Public | Register new user |
| `/login` | POST | Public | Login, get JWT |
| `/profile` | GET | JWT | Get own profile |
| `/profile` | PUT | JWT | Update profile |
| `/profile/picture` | POST | JWT | Upload profile photo |
| `/profile/picture/{filename}` | GET | Public | Serve profile image file |
| `/forgot-password` | POST | Public | Send password reset email |
| `/reset-password` | POST | Public | Reset password with token |
| `/verify-email` | GET | Public | Verify email with token |
| `/resend-verification` | POST | Public | Re-send verification email |

**Key point**: Profile picture is stored on the server filesystem via `FileStorageService`, and returned as a static resource via `UrlResource`.

#### `TripController` — `/api/trips`
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/` | POST | JWT | Create trip(s) |
| `/search` | GET | JWT | Search available trips |
| `/{id}` | GET | JWT | Get trip details |
| `/my` | GET | JWT | Get driver's own trips |
| `/{id}` | PUT | JWT | Update trip |
| `/{id}` | DELETE | JWT | Cancel trip |
| `/{id}/start` | PUT | JWT | Start trip (SCHEDULED → ACTIVE) |
| `/{id}/complete` | PUT | JWT | Complete trip (ACTIVE → COMPLETED) |
| `/{id}/siblings` | GET | JWT | Get sibling recurring trips |
| `/locations/origins` | GET | JWT | All distinct origin names (for autocomplete) |
| `/locations/destinations` | GET | JWT | All distinct destination names |

#### `BookingController` — `/api/bookings`
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/{tripId}` | POST | JWT | Request a booking |
| `/{id}/approve` | PUT | JWT (driver) | Approve a booking |
| `/{id}/reject` | PUT | JWT (driver) | Reject a booking |
| `/my` | GET | JWT | Get passenger's own bookings |
| `/trip/{tripId}` | GET | JWT | Get all bookings for a trip |
| `/{id}/cancel` | PUT | JWT | Cancel own booking |

#### `AdminController` — `/api/admin` (ADMIN role only)
| Endpoint | Method | Purpose |
|---|---|---|
| `/stats` | GET | Platform statistics (counts) |
| `/organizations` | POST/GET | Create/list organizations |
| `/organizations/{id}` | PUT/DELETE | Update/delete organization |
| `/vehicles/pending` | GET | List unapproved vehicles |
| `/vehicles/{id}/approve` | PUT | Approve a vehicle |

**Why admin is at filter level?** The `JwtAuthenticationFilter` checks the role and returns `403` before the request even reaches the controller. No Spring Security annotations needed.

#### `ChatController` — `/api/chat`
| Endpoint | Purpose |
|---|---|
| POST `/{tripId}` | Send message (REST) |
| GET `/{tripId}` | Get conversation history |
| PUT `/{tripId}/read` | Mark all trip messages read |
| GET `/unread` | Total unread message count |
| WebSocket `@MessageMapping("/chat/{tripId}")` | Send via STOMP |

**Dual mechanism**: Messages can be sent via REST (simpler) or WebSocket STOMP. Both broadcast to `/topic/chat/{tripId}` so all connected clients see it live.

#### `NotificationController` — `/api/notifications`
| Endpoint | Purpose |
|---|---|
| GET `/` | Get all notifications for user |
| GET `/unread-count` | Badge count |
| PUT `/{id}/read` | Mark single notification read |
| PUT `/read-all` | Mark all read |

#### `VehicleController` — `/api/vehicles`
Handles vehicle registration by drivers and listing their own vehicles. New vehicles start with `approved=false`.

---

### 5.5 Services

#### `AuthService`
**Register flow:**
1. Check email not already registered
2. Extract domain from email (`email.substring(email.indexOf("@")+1)`)
3. Check `organizationRepository.existsByEmailDomainAndWhitelistedTrue(domain)`
4. Hash password: `BCrypt.hashpw(password, BCrypt.gensalt())`
5. Build and save `User` entity
6. If `app.email-verification-enabled=true`: generate UUID token, save `EmailVerificationToken`, send email
7. Return JWT token immediately (user can log in after verifying)

**Login flow:**
1. Find user by email (throw if not found — same generic error for security)
2. `BCrypt.checkpw(rawPassword, hashedPassword)`
3. If email verification enabled and `!user.isEmailVerified()` → throw with message "Please verify your email"
4. Generate and return JWT

**Why BCrypt for passwords?**
BCrypt is a one-way adaptive hashing function with a built-in salt. Even if the database is compromised, passwords cannot be reversed. The work factor can be increased over time.

#### `TripService`
**createTrip flow:**
1. Validate driver exists, vehicle belongs to driver and is approved
2. If `recurring=true`:
   - Loop through next 7 days
   - Match day names (MON, TUE...) against `recurringDays`
   - Create one Trip per matching day with the same `recurringGroupId` (UUID)
3. If `recurring=false`: create single Trip
4. Save all trips
5. Save intermediate `TripStop` entities

**searchTrips — the core JPQL query:**
```sql
SELECT t FROM Trip t WHERE t.status = 'SCHEDULED'
AND (origin LIKE %:origin% OR stop name matches)
AND (destination LIKE %:destination% OR stop name matches)
AND (departureTime BETWEEN :after AND :before)
AND (pricePerSeat BETWEEN :min AND :max)
AND (driver.gender = :gender)
AND (driver.city = :city)       ← City filter from passenger's profile
AND driver.id <> :passengerOwnId ← Can't book own trip
AND availableSeats > 0
```

**Why city filter?** It avoids showing trips from other cities by default. This is derived from the passenger's registered city, not a search parameter.

**startTrip / completeTrip:** Change `TripStatus` enum on the entity and save. Also notifies all approved passengers via `NotificationService`.

#### `BookingService`
**requestBooking flow:**
1. Validate passenger and trip exist
2. Check `availableSeats >= seatsRequested`
3. Check not already booked: `existsByTripIdAndPassengerIdAndStatusNot(..., CANCELLED)`
4. Calculate fare: `pricePerSeat × seatsRequested` (or `dailyRate × seatsRequested`)
5. Set `initialStatus`:
   - `ApprovalMode.AUTO` → **APPROVED** immediately, deduct seats
   - `ApprovalMode.MANUAL` → **PENDING**, seats not deducted yet
6. Save booking
7. Notify driver: "New booking request from X"
8. For RECURRING bookings: same logic but loops through all sibling trips in the group

**approveBooking flow:**
1. Validate booking is PENDING
2. Validate driver owns the trip
3. Check seats still available
4. Set status → APPROVED, deduct available seats
5. `notificationService.notify(passenger, BOOKING_APPROVED, ...)`
6. `emailService.sendBookingApprovedEmail(passenger.getEmail(), ...)`

**rejectBooking flow:**
1. Validate driver owns the trip
2. Set status → REJECTED (seats not affected since they weren't reserved for PENDING)
3. Notify + email passenger

**cancelBooking flow:**
1. Validate passenger owns the booking
2. If status was APPROVED → restore `availableSeats` on the trip
3. Set status → CANCELLED

#### `NotificationService`
**notify():**
1. Save `Notification` entity to DB (persists for the notifications page)
2. Push via WebSocket: `messagingTemplate.convertAndSend("/topic/user/{userId}/notifications", payload)`
- Frontend subscribed to this topic shows the badge update instantly

#### `EmailService`
All methods annotated `@Async` — run in a separate thread pool so the HTTP response returns immediately.

| Method | When Called |
|---|---|
| `sendEmailVerificationMail` | On registration (if verification enabled) |
| `sendPasswordResetEmail` | On forgot-password request |
| `sendBookingApprovedEmail` | On booking approval |
| `sendBookingRejectedEmail` | On booking rejection |
| `sendTripCancelledEmail` | When driver cancels a trip |
| `sendTripReminderEmail` | 1 hour before departure (scheduled) |

#### `TripReminderService`
- `@Scheduled(fixedRate = 900000)` — runs every 15 minutes
- Finds all SCHEDULED trips departing in the next 1 hour
- For each such trip: notifies the driver + all APPROVED passengers
- Sends reminder email to each approved passenger

**Why scheduled?** Ensures passengers never miss a trip even if they haven't opened the app.

#### `AdminService`
**Organization management**: Full CRUD. Domain must be unique. `whitelisted=true` is what allows registration.

**Vehicle approval**: `vehicle.setApproved(true)` — after which the driver can use it on trips.

**getStats()**: Counts from each repository — used for the admin dashboard overview.

#### `ChatService`
**sendMessage (passenger → driver):** Receiver is automatically trip's driver.

**sendMessageToUser:** Both sender and receiver must be validateChatParticipant — either the driver or have an APPROVED booking on that trip.

**getConversation:** Uses custom JPQL:
```sql
SELECT m FROM ChatMessage m 
WHERE m.trip.id = :tripId 
AND (m.sender.id = :userId OR m.receiver.id = :userId)
ORDER BY m.sentAt
```

**markTripMessagesAsRead:** Sets `readAt = now()` on all messages where receiver is the current user.

#### `VehicleService`
Simple: create vehicle with `approved=false`, list by driver. Admin manually approves.

#### `FileStorageService`
Stores uploaded profile pictures in a local directory. Returns the filename. Files served back through `AuthController.getProfilePicture()`.

---

### 5.6 Repositories

All repositories extend `JpaRepository<Entity, Long>` which provides:
- `save()`, `findById()`, `findAll()`, `deleteById()`, `count()` — for free

| Repository | Custom Methods |
|---|---|
| `UserRepository` | `findByEmail()`, `existsByEmail()` |
| `TripRepository` | `searchTrips()` (complex JPQL), `findDistinctOrigins()`, `findByRecurringGroupId()` |
| `BookingRepository` | `findByPassengerId()`, `findByTripId()`, `existsByTripIdAndPassengerIdAndStatusNot()` |
| `VehicleRepository` | `findByUserId()`, `findByApprovedFalse()` |
| `OrganizationRepository` | `existsByEmailDomainAndWhitelistedTrue()`, `findByEmailDomain()` |
| `NotificationRepository` | `findByUserIdOrderByCreatedAtDesc()`, `countByUserIdAndReadFalse()` |
| `ChatMessageRepository` | `findConversation()` (custom query by tripId + userId) |

**Why Spring Data JPA?**
- Method names are auto-converted to SQL (`findByEmail` → `WHERE email = ?`)
- Custom `@Query` with JPQL for complex multi-condition searches
- No boilerplate SQL needed

---

### 5.7 DTOs (Data Transfer Objects)

| DTO | Fields | Purpose |
|---|---|---|
| `RegisterRequest` | name, email, password, phone, gender, department, city, role | Registration form data |
| `LoginRequest` | email, password | Login credentials |
| `AuthResponse` | token, email, role | JWT + user info returned on login/register |
| `TripRequest` | origin, destination, lat/lng, departureTime, seats, price, recurring fields, stops[], vehicleId | Create/edit trip |
| `TripSearchRequest` | origin, destination, date range, price range, gender | Search filters |
| `BookingRequest` | seats, bookingType, bookedDays | Request a booking |
| `VehicleRequest` | licensePlate, model, color, totalSeats, licenseDocUrl | Register vehicle |
| `OrganizationRequest` | name, emailDomain, whitelisted | Admin org management |
| `ChatMessageDTO` | id, tripId, senderId, senderName, receiverId, content, sentAt, readAt | Chat message response |
| `SendMessageRequest` | content | Send chat message body |
| `ForgotPasswordRequest` | email | Forgot password |
| `ResetPasswordRequest` | token, newPassword | Reset password |

**Why DTOs?**
- Prevent exposing internal entity structure (e.g. hashed passwords)
- Control exactly which fields are accepted in requests
- Separate API contract from database model

---

### 5.8 Models & Enums

**Enums:**
| Enum | Values |
|---|---|
| `Role` | USER, DRIVER, ADMIN |
| `TripStatus` | SCHEDULED, ACTIVE, COMPLETED, CANCELLED |
| `BookingStatus` | PENDING, APPROVED, REJECTED, CANCELLED |
| `BookingType` | SINGLE, RECURRING |
| `ApprovalMode` | MANUAL, AUTO |
| `Gender` | MALE, FEMALE, OTHER |
| `NotificationType` | BOOKING_REQUESTED, BOOKING_APPROVED, BOOKING_REJECTED, TRIP_STARTED, TRIP_COMPLETED, TRIP_REMINDER, TRIP_CANCELLED |

**JPA Annotations used:**
- `@Entity` — marks as a database table
- `@Table(name="...")` — explicit table name
- `@Id @GeneratedValue(strategy=IDENTITY)` — auto-increment PK
- `@ManyToOne(fetch=LAZY)` — related entity loaded only when accessed
- `@OneToMany(cascade=ALL, orphanRemoval=true)` — child entities managed with parent
- `@Column(nullable=false, unique=true)` — database constraints
- `@Enumerated(EnumType.STRING)` — store enum as string (not index number)
- `@PrePersist` — set `createdAt` automatically before first save
- `@Builder.Default` — Lombok builder uses the specified default value

---

## 6. Frontend — Deep Dive

### 6.1 Architecture & Setup

**Key files:**
- `main.ts` — Bootstrap Angular app with `appConfig`
- `app.config.ts` — Provides router, HttpClient with interceptors
- `app.routes.ts` — Defines all routes
- `styles.css` — Global dark theme CSS variables

**Why Zoneless Angular?**
Angular 19 introduced zoneless change detection (no Zone.js). Instead of Zone.js monkey-patching async operations, the app uses **Signals** (`signal()`, `computed()`) which explicitly notify Angular when state changes. This is why all `loading`, `error`, `success` etc. state variables must be `signal()` — plain property mutations are invisible to the renderer.

**Inline templates and styles:** Every component has its template and styles defined directly in the `.ts` file (not separate `.html`/`.css` files), making each component fully self-contained.

---

### 6.2 Routing & Guards

**`app.routes.ts` — Route structure:**
```
/                → landing (public)
/login           → login (public)
/register        → register (public)
/forgot-password → forgot-password (public)
/reset-password  → reset-password (public)
/verify-email    → verify-email (public)

All below protected by AuthGuard:
/dashboard       → user dashboard
/search-trips    → search + map
/my-trips        → driver's trips
/my-bookings     → passenger's bookings
/my-vehicles     → vehicle management
/create-trip     → create trip form + map
/trip/:id        → trip detail + booking
/trip-bookings/:id → driver manages bookings
/profile         → user profile
/notifications   → notification list
/chat/:tripId    → chat page

/admin/*  protected by AdminGuard:
/admin/dashboard → stats
/admin/organizations → org management
/admin/vehicles  → vehicle approvals
```

**`AuthGuard`:**
```typescript
canActivate() {
  return this.authService.isLoggedIn() ? true : this.router.parseUrl('/login');
}
```
Reads the JWT from localStorage. If expired or missing → redirect to `/login`.

**`AdminGuard`:** Additional check that `role === 'ADMIN'`.

---

### 6.3 Services

#### `AuthService`
- Stores JWT + user info in `localStorage`
- `isLoggedIn()` — checks token exists and not expired (reads `exp` claim from JWT payload)
- `currentEmail()` / `currentRole()` — signals parsed from localStorage
- HTTP methods: `register()`, `login()`, `getProfile()`, `updateProfile()`, `uploadProfilePic()`, `forgotPassword()`, `resetPassword()`, `verifyEmail()`

```typescript
// How isLoggedIn works:
const token = localStorage.getItem('jwt_token');
const payload = JSON.parse(atob(token.split('.')[1])); // decode JWT
return payload.exp * 1000 > Date.now(); // check expiry
```

#### `TripService`
- `createTrip(form)` → POST `/api/trips`
- `searchTrips(filters)` → GET `/api/trips/search`
- `getTrip(id)` → GET `/api/trips/{id}`
- `getMyTrips()` → GET `/api/trips/my`
- `startTrip(id)` / `completeTrip(id)` → PUT `/api/trips/{id}/start|complete`
- `getOrigins()` / `getDestinations()` → for location autocomplete dropdown

#### `BookingService`
- `requestBooking(tripId, seats, type, days)` → POST `/api/bookings/{tripId}`
- `approveBooking(id)` / `rejectBooking(id)` → PUT
- `cancelBooking(id)` → PUT
- `getMyBookings()` / `getTripBookings(tripId)` → GET

#### `NotificationService`
- `getNotifications()` → GET `/api/notifications`
- `getUnreadCount()` → GET `/api/notifications/unread-count`
- `markAsRead(id)` / `markAllRead()` → PUT

#### `WebSocketService`
- Connects to backend WebSocket endpoint `/ws` using SockJS + STOMP
- **`subscribeToNotifications(userId, callback)`** → subscribes to `/topic/user/{userId}/notifications`
- **`subscribeToChat(tripId, callback)`** → subscribes to `/topic/chat/{tripId}`
- Reconnects on disconnect

#### `VehicleService`
- `getMyVehicles()` → GET `/api/vehicles/my`
- `registerVehicle(form)` → POST `/api/vehicles`
- `deleteVehicle(id)` → DELETE `/api/vehicles/{id}`

#### `AdminService`
- Organization CRUD + vehicle approval + stats

#### `ToastService`
- Manages a list of toast notifications (success/error/warning)
- `ToastsComponent` in the app layout renders them
- Auto-dismisses after a timeout

---

### 6.4 Pages (Components)

#### `landing.ts` — Home page
- Sticky navigation with links to Login/Register
- Hero section with CTA
- Features section showing key benefits
- "How it works" steps section
- No authentication required

#### `login.ts`
**State**: `email`, `password` (plain strings — bound to form), `loading` (signal), `error` (signal)
**Flow**: submit → `authService.login()` → on success: `localStorage` set → navigate to `/dashboard`

#### `register.ts`
**Fields**: name, email, password, phone, gender, department, city
**Flow**: submit → `authService.register()` → on success: `registered.set(true)` → shows "check your email" message

#### `verify-email.ts`
**OnInit**: reads `?token=` from URL → calls `authService.verifyEmail(token)` → shows success/error state using signals

#### `forgot-password.ts` / `reset-password.ts`
Standard forgot/reset password flow with token from email link.

#### `dashboard.ts`
- Fetches total trips, bookings, upcoming trips from their respective services
- Quick-action buttons for common tasks
- Shows summary cards using signals

#### `search-trips.ts` (most complex page)
**Features:**
1. **Location search with autocomplete**: Nominatim API (OpenStreetMap) queried on keystroke (debounce 400ms). Dropdown shows matching places. Second fallback: Photon API.
2. **Database suggestions**: Calls `/api/trips/locations/origins` and `/api/trips/locations/destinations` to show existing trip locations first.
3. **Leaflet map**: Shows pickup/drop-off markers. User can click map to set location.
4. **GPS**: `navigator.geolocation.getCurrentPosition()` auto-centers map and sets location.
5. **Filter form**: Date, price range, gender filter
6. **Results grid**: Trip cards with route visualization, price, driver info

**State management** (signals):
```typescript
trips = signal<Trip[]>([]);
loading = signal(false);
originSuggestions = signal<PlaceSuggestion[]>([]);
originSelected = signal(false);
```

#### `create-trip.ts`
Same map/location search as search-trips, plus:
- Vehicle selection (from approved vehicles)
- Departure time picker
- Available seats + price
- Intermediate stops (add/remove dynamically)
- Approval mode selection (MANUAL/AUTO)

#### `trip-detail.ts`
- Shows full trip info (route, driver, vehicle, stops, timing)
- **Booking panel** (if passenger): seat stepper, fare preview, book button
- **Driver panel** (if driver): start/complete trip buttons, link to manage bookings
- **Co-passengers**: list of approved bookings
- Distance & ETA computed via Haversine formula:
  ```
  d = R × 2 × atan2(√a, √(1−a))
  where a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)
  ```

#### `trip-bookings.ts`
Driver's view of all booking requests for one trip. Approve/reject buttons per booking.

#### `my-trips.ts`
List of all trips the user has created as a driver. Filter by status (SCHEDULED/ACTIVE/COMPLETED/CANCELLED).

#### `my-bookings.ts`
List of all bookings the passenger has made. Color-coded by status.

#### `my-vehicles.ts`
Register new vehicle (shown as pending until admin approves). List own vehicles with approval status.

#### `profile.ts`
Edit name, phone, gender, department, city. Upload profile picture. Change password.

#### `notifications.ts`
Lists all notifications with unread indicator. Mark individual or all as read.

#### `chat.ts`
Real-time chat page within a trip context. Subscribes to WebSocket topic on load.

#### Admin Pages
- **`admin/dashboard`**: Stat cards (users, trips, bookings, active trips, pending vehicles, organizations)
- **`admin/organizations`**: CRUD table for whitelisted email domains
- **`admin/vehicles`**: Grid of pending vehicle registrations with Approve button

---

### 6.5 Models (TypeScript Interfaces)

**`user.model.ts`**: id, name, email, role, gender, phone, department, city, profilePic, emailVerified

**`trip.model.ts`**: id, driver(User), vehicle, origin, destination, lat/lng, departureTime, availableSeats, pricePerSeat, dailyRate, recurring, recurringDays, recurringGroupId, status, approvalMode, stops[]

**`booking.model.ts`**: id, trip(Trip), passenger(User), status, fare, seatsBooked, bookingType, bookedDays, bookedAt

**`vehicle.model.ts`**: id, user(User), licensePlate, model, color, totalSeats, approved

**`notification.model.ts`**: id, type, title, message, referenceId, read, createdAt

**`chat.model.ts`**: id, tripId, senderId, senderName, receiverId, content, sentAt, readAt

**`other.model.ts`**: Organization, PlaceSuggestion (for map autocomplete)

---

### 6.6 Interceptor

**`auth.interceptor.ts`**
```typescript
// For every outgoing HTTP request:
const token = localStorage.getItem('jwt_token');
if (token) {
  request = request.clone({
    headers: request.headers.set('Authorization', 'Bearer ' + token)
  });
}
return next(request);
```
**Why?** Without this, every service would need to manually add the Authorization header. The interceptor adds it automatically to every request.

Registered in `app.config.ts`:
```typescript
provideHttpClient(withInterceptors([authInterceptor]))
```

---

## 7. End-to-End Application Flow

### Flow 1: New User Registration & Login
```
1. Admin adds organization domain in /admin/organizations (e.g. cognizant.com)

2. User opens app → clicks Register
3. Fills form → POST /api/auth/register
   Backend: checks domain whitelisted → hashes password → saves user
   → Sends verification email (if enabled)
   → Returns JWT

4. User clicks email link → /verify-email?token=xxx
   Backend: validates token not expired → sets emailVerified=true

5. User goes to /login → POST /api/auth/login
   Backend: BCrypt check → JWT returned
   Frontend: stores JWT in localStorage → redirects to /dashboard
```

### Flow 2: Driver Creates a Trip
```
1. Driver goes to /my-vehicles → registers vehicle
2. Admin approves vehicle at /admin/vehicles

3. Driver goes to /create-trip
   - Searches for origin location (Nominatim API returns suggestions)
   - Selects origin from dropdown → marker placed on map
   - Same for destination
   - Fills departure time, seats, price
   - Optionally adds intermediate stops
   - Selects approval mode (MANUAL or AUTO)
   - Submits form

4. POST /api/trips → TripService.createTrip()
   - Single trip created, saved to DB
   - Redirects to /my-trips
```

### Flow 3: Passenger Searches and Books a Trip
```
1. Passenger at /search-trips
   - Types origin → Nominatim API gives location suggestions
   - Selects origin → GPS coordinates stored, marker on map
   - Same for destination
   - Clicks Search

2. GET /api/trips/search → TripRepository.searchTrips()
   - Filters by city, date, price, gender, availability
   - Excludes driver's own trips
   - Returns matching trips

3. Passenger clicks "View" → /trip/:id
   - Sees full trip info
   - Sets seats → fare calculated live

4. Clicks "Book 1 Seat" → POST /api/bookings/{tripId}
   - If AUTO mode: immediately APPROVED, seats deducted
   - If MANUAL mode: status = PENDING
   
5. Driver gets notification (WebSocket push + DB record)
   "New booking request from [Passenger Name]"

6. Driver goes to /trip-bookings/:id
   - Sees booking request
   - Clicks Approve

7. PUT /api/bookings/{id}/approve
   - Status → APPROVED
   - Seats deducted from trip
   - Passenger notified via WebSocket
   - Email sent to passenger: "Your booking is approved!"
```

### Flow 4: Real-Time Notification
```
1. Frontend WebSocket connects:
   ws://localhost:8081/ws (SockJS)

2. After login, subscribe:
   /topic/user/{userId}/notifications

3. When driver approves booking:
   Spring: messagingTemplate.convertAndSend("/topic/user/"+userId, payload)

4. Angular callback fires instantly:
   → unread count badge on bell icon increments
   → notification appears in /notifications page
```

### Flow 5: Trip Reminder
```
Every 15 minutes (TripReminderService):
1. Find all SCHEDULED trips departing in next 60 minutes
2. For each trip:
   - Notify driver (WebSocket + DB)
   - For each APPROVED passenger: notify (WebSocket + DB) + send email
```

---

## 8. Key Features Explanation

### 1. JWT-Based Stateless Authentication
- No server-side sessions
- Token stored in browser localStorage
- Decoded on frontend to get email/role without API call
- 24-hour expiry — user must re-login after that

### 2. Organization Domain Whitelisting
- Admin adds domains to `organizations` table
- On registration, email domain extracted and checked
- Prevents outsiders from registering
- Can be enabled/disabled per domain via `whitelisted` flag

### 3. Dual-mode Booking Approval
- **AUTO mode**: Passenger gets instant confirmation, seats deducted immediately
- **MANUAL mode**: Driver reviews each request, approves/rejects individually
- Driver sets this per trip when creating

### 4. Map-Based Location Selection (Leaflet)
- Leaflet.js renders OpenStreetMap tiles
- User can type location name (Nominatim API search) or click on map
- GPS auto-detect: `navigator.geolocation.getCurrentPosition()`
- Haversine formula calculates trip distance from lat/lng
- Route line drawn between markers

### 5. Recurring Trips (Group Scheduling)
- Driver specifies days: "MON,TUE,WED"
- System creates one Trip entity per matching day in the next 7 days
- All linked by same `recurringGroupId` UUID
- Passenger can book all days or just one day

### 6. Real-Time WebSocket
- STOMP over SockJS
- Notifications pushed immediately on booking events
- Chat messages delivered in real-time
- In-memory broker (no external message queue needed for this scale)

### 7. Email Notifications (@Async)
- All email methods run in separate thread pool
- HTTP response returned before email is sent
- Gmail SMTP with app password (2FA required on Google account)

### 8. Angular Signals (Zoneless)
- No Zone.js = no monkey-patching of Promise/setTimeout
- State changes explicitly via `signal.set(value)`
- Only signal-based reads in templates trigger re-render
- More performant than Zone.js-based change detection

---

## 9. API Reference Summary

### Base URL: `http://localhost:8081`

### Authentication Header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### Key Request/Response Examples

**POST /api/auth/register**
```json
Request: { "name": "John", "email": "john@cognizant.com", "password": "pass123", "city": "Chennai", "role": "USER" }
Response: { "token": "eyJ...", "email": "john@cognizant.com", "role": "USER" }
```

**POST /api/auth/login**
```json
Request: { "email": "john@cognizant.com", "password": "pass123" }
Response: { "token": "eyJ...", "email": "john@cognizant.com", "role": "USER" }
```

**POST /api/trips**
```json
Request: { "origin": "Chennai", "destination": "Pune", "originLat": 13.08, "originLng": 80.27, "destLat": 18.52, "destLng": 73.85, "departureTime": "2026-06-01T09:00:00", "availableSeats": 3, "pricePerSeat": 500, "approvalMode": "MANUAL", "stops": [] }
Response: [ { "id": 1, "origin": "Chennai", ... } ]
```

**GET /api/trips/search?origin=Chennai&destination=Pune**
```json
Response: [ { "id": 1, "origin": "Chennai", "destination": "Pune", "driver": {...}, "availableSeats": 3, ... } ]
```

**POST /api/bookings/1**
```json
Request: { "seats": 1, "bookingType": "SINGLE" }
Response: { "id": 1, "status": "PENDING", "fare": 500, ... }
```

---

## 10. Common Interview Questions & Answers

**Q: What is SmartTransportPooling?**
A: A corporate ride-sharing platform where employees of whitelisted organizations can offer or book rides. It uses Spring Boot REST API + MySQL backend and Angular 19 frontend with real-time WebSocket notifications and email alerts.

**Q: How is authentication handled?**
A: JWT (JSON Web Token) based stateless authentication. On login, the backend generates a signed JWT token with the user's email as subject, expiring in 24 hours. The frontend stores it in localStorage and the `auth.interceptor.ts` attaches it as `Authorization: Bearer <token>` to every HTTP request. The `JwtAuthenticationFilter` validates it before every controller call.

**Q: How does the booking approval flow work?**
A: Passenger requests booking → if MANUAL mode, status is PENDING; if AUTO mode, instantly APPROVED. For MANUAL: driver sees the request in `/trip-bookings`, clicks Approve → backend sets status APPROVED, deducts available seats, sends in-app notification via WebSocket and email to the passenger.

**Q: What is the difference between MANUAL and AUTO approval?**
A: AUTO: booking is immediately approved when requested, seats deducted right away. MANUAL: booking waits as PENDING until the driver explicitly approves/rejects it. Seats are only deducted upon approval.

**Q: How does real-time notification work?**
A: Spring WebSocket with STOMP protocol. On approval/rejection events, the backend calls `messagingTemplate.convertAndSend("/topic/user/{userId}/notifications", payload)`. The frontend Angular service subscribes to this STOMP topic on login and updates signals when a message arrives, causing the notification badge to update instantly.

**Q: Why does Angular use signals instead of Zone.js?**
A: This is Angular 19's zoneless mode. Zone.js intercepted all async operations to trigger change detection — it adds overhead. With signals, state changes are explicit: `loading.set(true)` tells Angular exactly what changed. The `@if (loading())` template expression tracks the signal and re-renders only when that signal value changes.

**Q: How is password security handled?**
A: BCrypt hashing — `BCrypt.hashpw(password, BCrypt.gensalt())` on registration. BCrypt includes a random salt and applies the hash function thousands of times (work factor). On login, `BCrypt.checkpw(rawPassword, storedHash)` compares without ever decrypting.

**Q: How does the organization whitelisting work?**
A: The `organizations` table stores email domains with a `whitelisted` boolean. On registration, we extract the domain from the email: `email.substring(email.indexOf("@")+1)`. Then `organizationRepository.existsByEmailDomainAndWhitelistedTrue(domain)` must return true, otherwise registration throws "domain not whitelisted".

**Q: How is the trip search JPQL query built?**
A: `TripRepository.searchTrips()` uses a single JPQL query with optional parameters (null = skip that filter). It filters by: status=SCHEDULED, partial-match origin/destination (including stop names via EXISTS subquery), date range, price range, driver's gender, driver's city, and excludes the calling user's own trips. Only trips with `availableSeats > 0` are shown.

**Q: What is the recurring trip feature?**
A: When creating a recurring trip, the driver specifies days like "MON,WED,FRI". The backend generates one `Trip` entity for each matching day in the next 7 days. All are linked by the same `recurringGroupId` UUID. A passenger can book just today (SINGLE) or all days (RECURRING). The RECURRING booking iterates through all sibling trips and books each.

**Q: What does @Transactional do?**
A: It wraps the method in a database transaction. If any exception occurs mid-operation, all DB changes are rolled back. Example: in `approveBooking()`, if deducting seats succeeds but saving the booking fails, the seat count change is rolled back.

**Q: How is admin authorization enforced?**
A: In `JwtAuthenticationFilter`, if the request path starts with `/api/admin` and `user.getRole().name()` is not `"ADMIN"`, it returns `403 Forbidden` response and the request never reaches the controller. This is a simple, effective role-based access control without Spring Security annotations.

**Q: How are emails sent without slowing down the API?**
A: All email methods in `EmailService` are annotated with `@Async`. Spring runs them in a separate thread pool. The HTTP response returns to the client immediately while the email is being composed and sent in the background.

**Q: How does the trip reminder work?**
A: `TripReminderService` has a method with `@Scheduled(fixedRate=900000)` (every 15 minutes). It queries all SCHEDULED trips departing in the next 1 hour and sends in-app notifications and emails to approved passengers and the driver.

**Q: What is CORS and how is it handled?**
A: Cross-Origin Resource Sharing — browsers block requests from one origin (localhost:4200) to another (localhost:8081) by default. The `SecurityConfig` registers a `CorsFilter` at the highest priority that allows requests from `http://localhost:4200` with all HTTP methods and headers.

**Q: How does profile picture upload work?**
A: POST `/api/auth/profile/picture` with `multipart/form-data`. `FileStorageService.storeFile()` saves it to the server filesystem with a unique filename. The filename is stored in `user.profilePic`. To retrieve it, GET `/api/auth/profile/picture/{filename}` returns it as a `Resource` (inline with JPEG content-type).

**Q: What happens if the JWT expires?**
A: The backend filter returns 401 Unauthorized. The Angular `AuthService.isLoggedIn()` checks the `exp` field in the JWT payload decoded from localStorage — if expired, the AuthGuard redirects to `/login`. The user must log in again to get a new 24-hour token.

---

*This document covers the complete technical depth of SmartTransportPooling — backend, frontend, database, security, real-time, email, and scheduling. Use it as a reference for explaining any aspect of the system in interviews.*
