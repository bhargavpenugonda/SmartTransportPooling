# SmartTransport Backend Complete Guide

This guide explains the backend in beginner-friendly language.
It covers:
- project flow
- all models (entities)
- all repositories
- all services
- all controllers and APIs (endpoint by endpoint)
- auth and security behavior
- websocket behavior
- error format

---

## 1) Backend Stack and High-Level Flow

Backend project path:
- `SmartTransport/`

Tech stack:
- Spring Boot 4.0.6
- Spring Data JPA + MySQL 8
- JWT authentication (jjwt 0.12.6)
- BCrypt password hashing (jbcrypt 0.4)
- JavaMail for email flows
- Scheduled tasks for trip reminders and auto-cancellation

Typical request flow:
1. Frontend calls REST API on port `8081`.
2. `JwtAuthenticationFilter` checks token for protected routes.
3. Controller receives request and calls Service.
4. Service applies business rules (including past-date validation) and calls Repository.
5. Repository runs DB operations (JPA methods / JPQL queries).
6. Controller returns JSON response.
7. `TripReminderService` runs background jobs (reminder every 15 min, auto-cancel at midnight).

---

## 2) Authentication and Security Flow

### JWT Filter (`JwtAuthenticationFilter`)
For `/api/*` routes:
- Public routes (no token required):
  - `/api/auth/register`
  - `/api/auth/login`
  - `/api/auth/forgot-password`
  - `/api/auth/reset-password`
  - `/api/auth/verify-email`
  - `/api/auth/resend-verification`
  - `/api/auth/profile/picture/*`
  - `/ws` (websocket handshake)
- Other routes require `Authorization: Bearer <token>`.
- If token invalid/missing -> `401`.
- For `/api/admin/*`, user role must be `ADMIN`, else `403`.
- If valid, filter stores:
  - `userEmail` in request attributes
  - `userRole` in request attributes

### Security Config (`SecurityConfig`)
- CORS allows origin: `http://localhost:4200`
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`
- JWT filter registered for `/api/*`

### Token Provider (`JwtTokenProvider`)
- Creates token with email as subject.
- Uses `app.jwt.secret` and `app.jwt.expiration-ms`.

---

## 3) Data Model (Entities)

## 3.1 User
Represents any account (admin/driver/passenger/user).

Fields:
- `id`
- `name`
- `email` (unique)
- `password` (BCrypt hashed)
- `phone`
- `gender` (`MALE/FEMALE/OTHER`)
- `role` (`ADMIN/USER/DRIVER/PASSENGER`)
- `organizationDomain`
- `department`
- `city`
- `profilePic`
- `enabled`
- `emailVerified`
- `createdAt`

## 3.2 Vehicle
Driver vehicle details.

Fields:
- `id`
- `user` (owner driver)
- `licensePlate` (unique)
- `model`
- `color`
- `totalSeats`
- `licenseDocUrl`
- `approved` (admin approval required)

## 3.3 Trip
A ride created by driver.

Fields:
- `id`
- `driver` (`User`)
- `vehicle` (`Vehicle`, optional)
- `origin`, `destination`
- coordinates (`originLat/originLng/destLat/destLng`)
- `departureTime`
- `availableSeats`
- `pricePerSeat` (single trip pricing)
- `dailyRate` (recurring pricing)
- `recurring` (boolean)
- `recurringDays` (ex: `MON,TUE,WED`)
- `recurringGroupId` (links sibling recurring trips)
- `approvalMode` (`AUTO` or `MANUAL`)
- `status` (`SCHEDULED/ACTIVE/COMPLETED/CANCELLED`)
- `stops` (`TripStop` list)
- `createdAt`

## 3.4 TripStop
Intermediate stop for a trip.

Fields:
- `id`
- `trip`
- `stopName`
- `lat`, `lng`
- `stopOrder`

## 3.5 Booking
Passenger booking for a trip.

Fields:
- `id`
- `trip`
- `passenger`
- `status` (`PENDING/APPROVED/REJECTED/CANCELLED`)
- `fare`
- `seatsBooked`
- `bookingType` (`SINGLE/RECURRING`)
- `bookedDays`
- `bookedAt`

## 3.6 Notification
In-app notification.

Fields:
- `id`
- `user`
- `type` (`NotificationType`)
- `title`
- `message`
- `referenceId` (usually trip id)
- `read`
- `createdAt`

## 3.7 Organization
Allowed organization domain for registration.

Fields:
- `id`
- `name`
- `emailDomain` (unique)
- `whitelisted`
- `createdAt`

## 3.8 PasswordResetToken
For reset-password email flow.

Fields:
- `id`
- `token` (unique)
- `user`
- `expiryDate`
- `used`
- helper: `isExpired()`

## 3.9 EmailVerificationToken
For email verification flow.

Fields:
- `id`
- `token` (unique)
- `user`
- `expiryDate`
- helper: `isExpired()`

---

## 4) Enums

- `Role`: `ADMIN, USER, DRIVER, PASSENGER`
- `Gender`: `MALE, FEMALE, OTHER`
- `ApprovalMode`: `AUTO, MANUAL`
- `TripStatus`: `SCHEDULED, ACTIVE, COMPLETED, CANCELLED`
- `BookingStatus`: `PENDING, APPROVED, REJECTED, CANCELLED`
- `BookingType`: `SINGLE, RECURRING`
- `NotificationType`:
  - `BOOKING_REQUESTED`
  - `BOOKING_APPROVED`
  - `BOOKING_REJECTED`
  - `BOOKING_CANCELLED`
  - `TRIP_CANCELLED`
  - `TRIP_STARTED`
  - `TRIP_COMPLETED`
  - `TRIP_REMINDER`

---

## 5) Repository Layer (DB Access)

## 5.1 UserRepository
- `findByEmail(email)`
- `existsByEmail(email)`

Used in auth and user lookups.

## 5.2 OrganizationRepository
- `findByEmailDomain(emailDomain)`
- `existsByEmailDomainAndWhitelistedTrue(emailDomain)`

Used to allow only whitelisted email domains at registration.

## 5.3 VehicleRepository
- `findByUserId(userId)`
- `findByLicensePlate(licensePlate)`
- `findByApprovedFalse()`

## 5.4 TripRepository
- `findByDriverId(driverId)`
- `findByStatus(status)`
- `findByRecurringGroupId(recurringGroupId)`
- `findDistinctOrigins()`
- `findDistinctDestinations()`
- `findDistinctStopNames()`
- `searchTrips(...)` custom JPQL search with filters:
  - origin/destination (including stops)
  - departure range
  - price range (`pricePerSeat` or `dailyRate`)
  - gender filter
  - city filter (same city preference)
  - excludes trips by same driver
  - only scheduled trips with seats

## 5.5 BookingRepository
- `findByPassengerId(passengerId)`
- `findByTripId(tripId)`
- `findByPassengerIdAndStatus(...)`
- `findByTripIdAndStatus(...)`
- `existsByTripIdAndPassengerIdAndStatusNot(...)`

## 5.6 NotificationRepository
- `findByUserIdOrderByCreatedAtDesc(userId)`
- `countByUserIdAndReadFalse(userId)`

## 5.7 PasswordResetTokenRepository
- `findByToken(token)`

## 5.8 EmailVerificationTokenRepository
- `findByToken(token)`

---

## 6) Service Layer (Business Logic)

## 6.1 AuthService
Main auth/account service.

Methods:
- `register(request)`
  - checks unique email
  - checks domain whitelist from `Organization`
  - blocks self-register as `ADMIN`
  - hashes password
  - sets `emailVerified` depending on config
  - optionally creates email verification token and sends email
  - returns JWT
- `login(request)`
  - validates password
  - blocks login if email verification required and not verified
  - returns JWT
- `getProfile(email)`
- `updateProfile(email, request)` (name/phone/gender/department/city)
- `saveUser(user)`
- `forgotPassword(email)`
  - creates reset token, expires in 30 mins, sends email
- `resetPassword(token, newPassword)`
  - validates token, expiry, used flag
  - hashes new password and marks token used
- `verifyEmail(token)`
  - validates token, marks user verified, deletes token
- `resendVerification(email)`
  - creates new verify token if not already verified

## 6.2 VehicleService
- `registerVehicle(driverEmail, request)`
  - creates vehicle with `approved=false`
- `getDriverVehicles(driverEmail)`

## 6.3 TripService
- `createTrip(driverEmail, request)`
  - validates driver and selected vehicle ownership/approval
  - for recurring trips:
    - requires `recurringDays` and `dailyRate`
    - expands into next 7 days matching day list
    - assigns one `recurringGroupId` for sibling trips
  - for non-recurring trips:
    - requires `pricePerSeat`
  - saves stops for each created trip
- `searchTrips(request, passengerEmail)`
  - uses passenger city and id exclusion
  - delegates to repository filtered search
- `getTrip(id)`
- `getSiblingTrips(tripId)`
- `getDistinctOrigins()` and `getDistinctDestinations()`
  - merge direct trip points + stop names
- `getDriverTrips(driverEmail)`
- `updateTrip(tripId, driverEmail, request)`
  - only trip owner
  - blocked if less than 30 mins before departure
  - updates pricing based on recurring flag
- `cancelTrip(tripId, driverEmail)`
  - only owner
  - blocked if less than 30 mins before departure
  - sets status `CANCELLED`
  - notifies approved passengers
- `startTrip(tripId, driverEmail)`
  - only owner, only from `SCHEDULED`
  - sets status `ACTIVE`
  - notifies approved passengers
- `completeTrip(tripId, driverEmail)`
  - only owner, only from `ACTIVE`
  - sets status `COMPLETED`
  - notifies approved passengers

## 6.4 BookingService
- `requestBooking(...)`
  - validates passenger/trip
  - defaults seats to at least 1
  - parses booking type (`SINGLE`/`RECURRING`)
  - recurring booking:
    - applies to all sibling trips in recurring group
    - skips already booked/no-seat days
    - auto-approve when trip approval mode is `AUTO`
    - seat decrement immediately when auto-approved
    - sends one driver notification
  - single booking:
    - checks seat availability and duplicate booking
    - sets status `APPROVED` or `PENDING` by approval mode
    - computes fare from `dailyRate` or `pricePerSeat`
    - decrements seats if auto-approved
    - notifies driver
- `approveBooking(bookingId, driverEmail)`
  - only trip driver
  - must be `PENDING`
  - checks seats, marks `APPROVED`, decrements seats
  - notifies passenger
- `rejectBooking(bookingId, driverEmail)`
  - only trip driver
  - marks `REJECTED`
  - notifies passenger
- `getPassengerBookings(email)`
- `getTripBookings(tripId)`
- `cancelBooking(bookingId, passengerEmail)`
  - only booking owner
  - if approved, restores seats
  - marks `CANCELLED`

## 6.5 NotificationService
- `notify(user, type, title, message, referenceId)`
  - stores notification in DB
  - does NOT push via WebSocket; frontend polls `/api/notifications/unread-count` every 60 s
- `getUserNotifications(email)`
- `getUnreadCount(email)`
- `markAsRead(notificationId, email)`
- `markAllRead(email)`

## 6.6 EmailService
Async mail sender methods:
- `sendPasswordResetEmail`
- `sendEmailVerificationMail`
- `sendBookingApprovedEmail`
- `sendBookingRejectedEmail`
- `sendTripCancelledEmail`
- `sendTripReminderEmail`

## 6.7 FileStorageService
- creates upload directory from `app.upload-dir` (default `uploads`)
- `storeFile(file, prefix)` -> returns generated filename
- `getFilePath(filename)`

## 6.8 AdminService
- organization CRUD
- pending vehicle list and approval
- stats counts:
  - total users
  - total trips
  - total bookings
  - active trips
  - pending vehicles
  - total organizations

## 6.9 TripReminderService
Two scheduled jobs:

**Reminder job** — `@Scheduled(fixedRate = 900000)` (every 15 minutes):
- finds `SCHEDULED` trips departing in next 1 hour
- notifies driver and approved passengers (in-app notification + email)

**Auto-cancel job** — `@Scheduled(cron = "0 0 0 * * *")` (midnight daily):
- finds `SCHEDULED` trips where `departureTime.toLocalDate().isBefore(today)`
- cancels each trip (status → `CANCELLED`)
- cancels all `PENDING` and `APPROVED` bookings
- sends `TRIP_CANCELLED` notification to driver and all affected passengers

---

## 7) API Layer (Controller Endpoints)

Base URL examples assume backend runs at:
- `http://localhost:8081`

Auth header for protected endpoints:
- `Authorization: Bearer <jwt_token>`

## 7.1 Auth APIs (`/api/auth`)

### 1. POST `/api/auth/register`
Purpose: create new user and return JWT.

Body (`RegisterRequest`):
- `name` (required)
- `email` (required)
- `password` (required, min 6)
- `phone` (optional)
- `gender` (optional)
- `department` (optional)
- `city` (optional)
- `role` (optional: USER/DRIVER/PASSENGER; ADMIN is ignored)

Flow:
1. Validate email uniqueness.
2. Validate domain whitelist.
3. Hash password.
4. Save user.
5. Optionally send verification email.
6. Return token + email + role.

### 2. POST `/api/auth/login`
Purpose: login and return JWT.

Body (`LoginRequest`):
- `email` (required)
- `password` (required)

Flow:
1. Find user by email.
2. Verify BCrypt password.
3. If verification enabled, ensure email verified.
4. Return JWT.

### 3. GET `/api/auth/profile`
Purpose: get current logged-in user profile.

Auth: required.

### 4. PUT `/api/auth/profile`
Purpose: update profile basic fields.

Auth: required.
Body: same DTO type as register, but service only updates:
- `name`
- `phone`
- `gender`
- `department`
- `city`

### 5. POST `/api/auth/profile/picture`
Purpose: upload profile image file.

Auth: required.
Form-data:
- `file` (multipart)

Flow:
1. File stored in upload directory.
2. Filename saved into `user.profilePic`.
3. Returns updated user.

### 6. GET `/api/auth/profile/picture/{filename}`
Purpose: fetch stored profile picture resource.

Auth: public.

### 7. POST `/api/auth/forgot-password`
Purpose: start password reset flow.

Body (`ForgotPasswordRequest`):
- `email`

Flow:
1. Create reset token (30 min).
2. Send reset mail with frontend link.

### 8. POST `/api/auth/reset-password`
Purpose: reset password using token.

Body (`ResetPasswordRequest`):
- `token`
- `newPassword` (min 6)

Flow:
1. Validate token exists/not used/not expired.
2. Hash and save new password.
3. Mark token used.

### 9. GET `/api/auth/verify-email?token=...`
Purpose: verify email.

Flow:
1. Validate token not expired.
2. Set `user.emailVerified=true`.
3. Delete token.

### 10. POST `/api/auth/resend-verification`
Purpose: resend verify email for unverified account.

Body: `{ "email": "..." }` (uses ForgotPasswordRequest DTO)

---

## 7.2 Trip APIs (`/api/trips`)

### 11. POST `/api/trips`
Purpose: create one trip or multiple recurring trips.

Auth: required.
Body (`TripRequest`):
- `origin`, `destination` (required)
- `departureTime` (required)
- `availableSeats` (min 1)
- `pricePerSeat` (required for non-recurring)
- `dailyRate` (required for recurring)
- `recurring` (boolean)
- `recurringDays` like `MON,TUE,WED`
- `approvalMode` (`AUTO`/`MANUAL`)
- `vehicleId` (optional, must belong to driver and be approved)
- `stops` (optional list of stops)

Returns: list of created `Trip` objects.

### 12. GET `/api/trips/search`
Purpose: search available trips.

Auth: required.
Query params (`TripSearchRequest`):
- `origin`
- `destination`
- `departureAfter`
- `departureBefore`
- `minPrice`
- `maxPrice`
- `gender`

Behavior:
- only `SCHEDULED` trips with seats
- excludes own trips
- filters by same city as passenger
- also matches stop names for origin/destination search

### 13. GET `/api/trips/{id}`
Purpose: get one trip by id.

### 14. GET `/api/trips/my`
Purpose: get current driver's trips.

### 15. PUT `/api/trips/{id}`
Purpose: update driver's own trip.

Rules:
- only owner
- cannot update if less than 30 mins to departure

### 16. DELETE `/api/trips/{id}`
Purpose: cancel trip.

Rules:
- only owner
- cannot cancel if less than 30 mins to departure
- sets status `CANCELLED`
- notifies approved passengers

### 17. PUT `/api/trips/{id}/start`
Purpose: mark trip started.

Rules:
- only owner
- status must be `SCHEDULED`
- status becomes `ACTIVE`
- notifies approved passengers

### 18. PUT `/api/trips/{id}/complete`
Purpose: mark trip completed.

Rules:
- only owner
- status must be `ACTIVE`
- status becomes `COMPLETED`
- notifies approved passengers

### 19. GET `/api/trips/{id}/siblings`
Purpose: get all trips in same recurring group.

### 20. GET `/api/trips/locations/origins`
Purpose: get distinct origin suggestions.

Includes:
- trip origins
- stop names

### 21. GET `/api/trips/locations/destinations`
Purpose: get distinct destination suggestions.

Includes:
- trip destinations
- stop names

---

## 7.3 Booking APIs (`/api/bookings`)

### 22. POST `/api/bookings/{tripId}`
Purpose: request booking on a trip.

Auth: required.
Body (`BookingRequest`):
- `seats` (default 1)
- `bookingType` (`SINGLE` default, or `RECURRING`)
- `bookedDays` (optional)

Behavior:
- checks duplicate booking and seat availability
- if trip approval mode is `AUTO`, directly approves and decrements seats
- if `RECURRING`, tries all sibling trips in recurring group

### 23. PUT `/api/bookings/{id}/approve`
Purpose: driver approves pending booking.

Rules:
- only trip driver
- booking must be pending
- enough seats required
- decrements seats

### 24. PUT `/api/bookings/{id}/reject`
Purpose: driver rejects booking.

Rules:
- only trip driver

### 25. GET `/api/bookings/my`
Purpose: get current passenger bookings.

### 26. GET `/api/bookings/trip/{tripId}`
Purpose: get all bookings for a trip.

### 27. PUT `/api/bookings/{id}/cancel`
Purpose: passenger cancels own booking.

Rules:
- only booking owner
- if already approved, seats restored to trip

---

## 7.4 Vehicle APIs (`/api/vehicles`)

### 28. POST `/api/vehicles`
Purpose: register driver vehicle.

Auth: required.
Body (`VehicleRequest`):
- `licensePlate` (required)
- `model` (required)
- `color` (optional)
- `totalSeats` (required)
- `licenseDocUrl` (optional)

Behavior:
- new vehicle is `approved=false` until admin action.

### 29. GET `/api/vehicles/my`
Purpose: get logged-in driver's vehicles.

---

## 7.5 Notification APIs (`/api/notifications`)

### 30. GET `/api/notifications`
Purpose: list current user's notifications (latest first).

### 31. GET `/api/notifications/unread-count`
Purpose: get unread count.

Response example:
- `{ "count": 5 }`

### 32. PUT `/api/notifications/{id}/read`
Purpose: mark one notification read.

Rule:
- must belong to current user.

### 33. PUT `/api/notifications/read-all`
Purpose: mark all current user's notifications read.

---

## 7.6 Admin APIs (`/api/admin`) [ADMIN only]

### 34. GET `/api/admin/stats`
Purpose: admin dashboard stats.

Returns map with keys:
- `totalUsers`
- `totalTrips`
- `totalBookings`
- `activeTrips`
- `pendingVehicles`
- `totalOrganizations`

### 35. POST `/api/admin/organizations`
Purpose: create allowed organization domain.

Body (`OrganizationRequest`):
- `name`
- `emailDomain`
- `whitelisted`

### 36. GET `/api/admin/organizations`
Purpose: list all organizations.

### 37. PUT `/api/admin/organizations/{id}`
Purpose: update organization.

### 38. DELETE `/api/admin/organizations/{id}`
Purpose: delete organization.

### 39. GET `/api/admin/vehicles/pending`
Purpose: list unapproved vehicles.

### 40. PUT `/api/admin/vehicles/{id}/approve`
Purpose: approve a vehicle.

---

## 8) Error Handling Format

Global exception handling (`GlobalExceptionHandler`):

### RuntimeException
HTTP: `400`
Body:
```json
{
  "timestamp": "2026-...",
  "status": 400,
  "message": "Some business rule message"
}
```

### Validation error (`MethodArgumentNotValidException`)
HTTP: `400`
Body:
```json
{
  "timestamp": "2026-...",
  "status": 400,
  "errors": {
    "fieldName": "validation message"
  }
}
```

JWT auth errors from filter:
- `401` invalid/missing token
- `401` user not found for token
- `403` admin endpoint without admin role

---

## 9) Important Config Values (`application.properties`)

- DB: MySQL `smart_transport`
- JPA: `ddl-auto=update`
- Server port: `8081`
- JWT expiration: `86400000` ms (24 hours)
- Frontend URL for email links: `http://localhost:4200`
- Email verification toggle: `app.email-verification-enabled=false`

---

## 10) Practical API Usage Order (Recommended)

Typical end-to-end flow for a new user:
1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. Driver side:
   - `POST /api/vehicles`
   - Admin approves via `PUT /api/admin/vehicles/{id}/approve`
   - `POST /api/trips`
4. Passenger side:
   - `GET /api/trips/search` (only future SCHEDULED trips returned)
   - `POST /api/bookings/{tripId}` (blocked if trip has departed)
5. Driver handles bookings:
   - `PUT /api/bookings/{id}/approve` or `/reject`
6. Trip lifecycle:
   - `PUT /api/trips/{id}/start`
   - `PUT /api/trips/{id}/complete`
7. Notifications:
   - `GET /api/notifications`
   - `PUT /api/notifications/read-all`

---

## 11) Notes and Caveats

- Admin role cannot be self-created from register API.
- Vehicle must be approved before being used in trip creation.
- Trip update/cancel is blocked within 30 minutes before departure.
- Search results only include trips where `departureTime > CURRENT_TIMESTAMP`.
- Booking is rejected by the backend if the trip departure time has already passed.
- Trip creation is rejected if `departureTime` is in the past (frontend also enforces via datetime-local `min` attribute).
- Expired SCHEDULED trips are automatically cancelled at midnight by the auto-cancel scheduler.
- `GET /api/bookings/trip/{tripId}` has no explicit non-driver check; frontend should restrict access.
