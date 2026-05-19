import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TripService } from '../../services/trip.service';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Trip } from '../../models/trip.model';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-trip-detail',
  imports: [DatePipe, RouterLink, FormsModule],
  template: `
    @if (trip()) {
      <div class="pg-head">
        <div>
          <h2><i class="bi bi-geo-alt-fill me-2"></i>Trip Details</h2>
          <p>Trip #{{ trip()!.id }}</p>
        </div>
        <span class="badge-status badge-{{ trip()!.status.toLowerCase() }}" style="font-size:0.9rem;padding:8px 18px;">{{ trip()!.status }}</span>
      </div>

      @if (message) {
        <div class="alert" [class]="messageType === 'success' ? 'alert-success' : 'alert-danger'">{{ message }}</div>
      }

      <div class="row g-4">
        <div class="col-md-8">
          <div class="panel">
            <div class="panel-head"><h6>Route Information</h6></div>
            <div class="panel-body">
              <div class="row mb-3">
                <div class="col-6">
                  <div class="route-label"><span class="rdot from"></span><small>FROM</small></div>
                  <h6 class="fw-bold">{{ trip()!.origin }}</h6>
                </div>
                <div class="col-6">
                  <div class="route-label"><span class="rdot to"></span><small>TO</small></div>
                  <h6 class="fw-bold">{{ trip()!.destination }}</h6>
                </div>
              </div>
              @if (trip()!.stops && trip()!.stops.length > 0) {
                <div class="mb-3" style="padding: 12px 16px; background: rgba(108,99,255,0.06); border-radius: 10px; border: 1px solid rgba(108,99,255,0.12);">
                  <small style="color: rgba(255,255,255,0.5);"><i class="bi bi-signpost-split me-1"></i>Intermediate Stops:</small>
                  <div class="d-flex flex-wrap gap-2 mt-1">
                    @for (stop of trip()!.stops; track stop.id) {
                      <span class="badge" style="background: rgba(108,99,255,0.15); color: #b8bbff;">{{ stop.stopName }}</span>
                    }
                  </div>
                </div>
              }
              <div class="stat-row">
                <div class="stat-item">
                  <div class="stat-ic" style="--c:#6c63ff"><i class="bi bi-clock"></i></div>
                  <small>Departure</small>
                  <span>{{ trip()!.departureTime | date:'MMM d, h:mm a' }}</span>
                </div>
                <div class="stat-item">
                  <div class="stat-ic" style="--c:#2ecc71"><i class="bi bi-people"></i></div>
                  <small>Seats</small>
                  <span>{{ trip()!.availableSeats }}</span>
                </div>
                <div class="stat-item">
                  <div class="stat-ic" style="--c:#f39c12"><i class="bi bi-currency-rupee"></i></div>
                  <small>{{ trip()!.recurring ? 'Daily Rate' : 'Per Seat' }}</small>
                  <span>₹{{ trip()!.recurring ? trip()!.dailyRate : trip()!.pricePerSeat }}</span>
                </div>
              </div>

              @if (distance()) {
                <div class="stat-row mt-3" style="border-top: 1px solid rgba(255,255,255,0.04); padding-top: 16px;">
                  <div class="stat-item">
                    <div class="stat-ic" style="--c:#3498db"><i class="bi bi-signpost-split"></i></div>
                    <small>Distance</small>
                    <span>{{ distance() }} km</span>
                  </div>
                  <div class="stat-item">
                    <div class="stat-ic" style="--c:#e74c3c"><i class="bi bi-hourglass-split"></i></div>
                    <small>Est. Duration</small>
                    <span>{{ eta() }}</span>
                  </div>
                </div>
              }

              @if (trip()!.recurring) {
                <div class="recur-section">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <i class="bi bi-arrow-repeat" style="color:#3498db;font-size:1.1rem"></i>
                    <strong>Recurring Trip</strong>
                    <span class="recur-days">{{ trip()!.recurringDays }}</span>
                  </div>
                  @if (siblingTrips().length > 1) {
                    <small class="d-block mb-2" style="color:rgba(255,255,255,0.35)">Schedule ({{ siblingTrips().length }} days):</small>
                    <div class="sib-badges">
                      @for (s of siblingTrips(); track s.id) {
                        <a [routerLink]="['/trip', s.id]" class="sib-badge"
                           [class.current]="s.id === trip()!.id"
                           [class.completed]="s.status === 'COMPLETED'"
                           [class.active-trip]="s.status === 'ACTIVE'">
                          {{ s.departureTime | date:'EEE, MMM d' }}
                        </a>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <!-- Driver -->
          <div class="panel mb-3">
            <div class="panel-head"><h6>Driver</h6></div>
            <div class="panel-body">
              <div class="driver-block">
                <div class="driver-av"><i class="bi bi-person-fill"></i></div>
                <div>
                  <h6 class="mb-0 fw-bold">{{ trip()!.driver.name }}</h6>
                  <small style="color:rgba(255,255,255,0.35)">{{ trip()!.driver.email }}</small>
                </div>
              </div>
              <div class="driver-meta">
                <span><i class="bi bi-gender-ambiguous"></i>{{ trip()!.driver.gender || 'N/A' }}</span>
                <span><i class="bi bi-diagram-3"></i>{{ trip()!.driver.department || 'N/A' }}</span>
              </div>
              <a [routerLink]="['/chat', trip()!.id]" class="msg-btn">
                <i class="bi bi-chat-dots me-1"></i> Message Driver
              </a>
            </div>
          </div>

          <!-- Vehicle -->
          @if (trip()!.vehicle) {
            <div class="panel mb-3">
              <div class="panel-head"><h6><i class="bi bi-car-front me-2"></i>Vehicle</h6></div>
              <div class="panel-body">
                <div class="v-row"><i class="bi bi-car-front-fill"></i><strong>{{ trip()!.vehicle!.model }}</strong></div>
                <div class="v-row"><i class="bi bi-credit-card"></i>{{ trip()!.vehicle!.licensePlate }}</div>
                <div class="v-row"><i class="bi bi-palette"></i>{{ trip()!.vehicle!.color || 'N/A' }}</div>
                <div class="v-row"><i class="bi bi-people"></i>{{ trip()!.vehicle!.totalSeats }} total seats</div>
              </div>
            </div>
          }

          <!-- Co-Passengers -->
          @if (coPassengers().length > 0) {
            <div class="panel mb-3">
              <div class="panel-head"><h6><i class="bi bi-people me-2"></i>Co-Passengers ({{ coPassengers().length }})</h6></div>
              <div class="panel-body">
                @for (p of coPassengers(); track p.id) {
                  <div class="copax">
                    <div class="copax-av"><i class="bi bi-person-fill"></i></div>
                    <div>
                      <span class="fw-semibold">{{ p.passengerName }}</span>
                      <small class="d-block" style="color:rgba(255,255,255,0.3)">{{ p.seatsBooked }} {{ p.seatsBooked === 1 ? 'seat' : 'seats' }}</small>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Booking Panel -->
          @if (isPassenger()) {
            <div class="panel mb-3">
              <div class="panel-body">
              @if (myBooking()) {
                <h6 class="fw-bold mb-3"><i class="bi bi-ticket-detailed-fill me-2" style="color:#6c63ff"></i>Your Booking</h6>
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span class="badge-status badge-{{ myBooking()!.status.toLowerCase() }}">{{ myBooking()!.status }}</span>
                  @if (myBooking()!.bookingType === 'RECURRING') {
                    <span style="font-size:0.72rem;color:#3498db;font-weight:600"><i class="bi bi-arrow-repeat me-1"></i>Recurring</span>
                  }
                </div>
                <p class="mb-1" style="color:rgba(255,255,255,0.6)"><strong style="color:#f0f0f5">Seats:</strong> {{ myBooking()!.seatsBooked }}</p>
                <p class="mb-1" style="color:rgba(255,255,255,0.6)"><strong style="color:#f0f0f5">Fare:</strong> <span style="color:#2ecc71;font-weight:700">₹{{ myBooking()!.fare }}</span></p>
                @if (myBooking()!.bookedDays) {
                  <p class="mb-1" style="color:rgba(255,255,255,0.6)"><strong style="color:#f0f0f5">Days:</strong> {{ myBooking()!.bookedDays }}</p>
                }
                <p style="color:rgba(255,255,255,0.3);font-size:0.82rem" class="mb-0">Booked {{ myBooking()!.bookedAt | date:'medium' }}</p>
                @if (myBooking()!.status === 'PENDING' || myBooking()!.status === 'APPROVED') {
                  <button class="cancel-btn mt-2" (click)="cancelMyBooking()">
                    <i class="bi bi-x-circle me-1"></i>Cancel Booking
                  </button>
                }
              } @else {
              <h6 class="fw-bold mb-3">Book this Ride</h6>
              @if (trip()!.availableSeats > 0 && trip()!.status === 'SCHEDULED') {
                <p style="color:rgba(255,255,255,0.35);font-size:0.85rem">
                  {{ trip()!.approvalMode === 'AUTO' ? 'Your booking will be auto-approved.' : 'Driver will review your request.' }}
                </p>
                @if (trip()!.recurring) {
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Booking Type</label>
                    <div class="d-flex gap-2">
                      <button class="type-btn" [class.active]="bookingType === 'SINGLE'" (click)="bookingType = 'SINGLE'">
                        <i class="bi bi-calendar-event me-1"></i>Today Only
                      </button>
                      <button class="type-btn" [class.active]="bookingType === 'RECURRING'" (click)="bookingType = 'RECURRING'">
                        <i class="bi bi-arrow-repeat me-1"></i>All Days
                      </button>
                    </div>
                    @if (bookingType === 'RECURRING') {
                      <small class="d-block mt-1" style="color:rgba(255,255,255,0.3)"><i class="bi bi-calendar-week me-1"></i>{{ trip()!.recurringDays }}</small>
                    }
                  </div>
                }
                <div class="mb-3">
                  <label class="form-label fw-semibold">Seats to book</label>
                  <div class="seat-stepper">
                    <button (click)="seatsRequested > 1 && seatsRequested = seatsRequested - 1">−</button>
                    <input type="number" [(ngModel)]="seatsRequested" min="1" [max]="trip()!.availableSeats" readonly>
                    <button (click)="seatsRequested < trip()!.availableSeats && seatsRequested = seatsRequested + 1">+</button>
                  </div>
                  @if (trip()!.recurring) {
                    @if (bookingType === 'RECURRING' && trip()!.dailyRate && siblingTrips().length > 0) {
                      <small class="fare-preview">Total: <strong>₹{{ trip()!.dailyRate * siblingTrips().length * seatsRequested }}</strong> (₹{{ trip()!.dailyRate }}/day × {{ siblingTrips().length }} days × {{ seatsRequested }} seat{{ seatsRequested > 1 ? 's' : '' }})</small>
                    } @else if (bookingType === 'SINGLE' && trip()!.dailyRate) {
                      <small class="fare-preview">Total: <strong>₹{{ trip()!.dailyRate * seatsRequested }}</strong> (₹{{ trip()!.dailyRate }}/day × 1 day × {{ seatsRequested }} seat{{ seatsRequested > 1 ? 's' : '' }})</small>
                    }
                  } @else if (trip()!.pricePerSeat) {
                    <small class="fare-preview">Total: <strong>₹{{ trip()!.pricePerSeat * seatsRequested }}</strong> (₹{{ trip()!.pricePerSeat }}/seat × {{ seatsRequested }} seat{{ seatsRequested > 1 ? 's' : '' }})</small>
                  }
                </div>
                <button class="book-btn" (click)="bookTrip()" [disabled]="booking">
                  @if (booking) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  <i class="bi bi-ticket-detailed me-1"></i>
                  {{ bookingType === 'RECURRING' ? 'Book All Days' : 'Book ' + seatsRequested + (seatsRequested === 1 ? ' Seat' : ' Seats') }}
                </button>
              } @else if (trip()!.status === 'ACTIVE') {
                <p style="color:rgba(255,255,255,0.4);font-size:0.85rem">This trip is currently active.</p>
              } @else {
                <p style="color:rgba(255,255,255,0.4)">This ride is not available for booking.</p>
              }
              }
              </div>
            </div>
          }

          <!-- Driver Actions -->
          @if (isDriver()) {
            <div class="panel mb-3">
              <div class="panel-head"><h6>Trip Actions</h6></div>
              <div class="panel-body">
                @if (trip()!.status === 'SCHEDULED') {
                  <button class="btn btn-success w-100 mb-2" (click)="startTrip()"><i class="bi bi-play-fill me-1"></i> Start Trip</button>
                  <a [routerLink]="['/trip-bookings', trip()!.id]" class="btn btn-outline-primary w-100 mb-2"><i class="bi bi-people me-1"></i> View Bookings</a>
                }
                @if (trip()!.status === 'ACTIVE') {
                  <button class="btn btn-warning w-100 mb-2" (click)="completeTrip()"><i class="bi bi-check-circle-fill me-1"></i> Complete Trip</button>
                }
              </div>
            </div>
          }

        </div>
      </div>
    } @else {
      <div class="loading-state"><div class="spinner-border" style="color:#6c63ff"></div></div>
    }
  `,
  styles: [`
    :host { display: block; }
    .pg-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .pg-head h2 { font-weight: 800; font-size: 1.5rem; color: #f0f0f5; margin: 0; }
    .pg-head p { color: rgba(255,255,255,0.4); margin: 4px 0 0; }
    .loading-state { text-align: center; padding: 60px; }

    .panel { background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; }
    .panel-head { padding: 16px 20px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .panel-head h6 { margin: 0; font-weight: 700; color: #f0f0f5; font-size: 0.95rem; }
    .panel-body { padding: 20px; }

    .route-label { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .route-label small { color: rgba(255,255,255,0.3); font-weight: 600; font-size: 0.7rem; letter-spacing: 0.05em; }
    .rdot { width: 10px; height: 10px; border-radius: 50%; }
    .rdot.from { background: #6c63ff; }
    .rdot.to { background: #e74c3c; }

    .stat-row { display: flex; justify-content: space-around; text-align: center; }
    .stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .stat-ic {
      width: 44px; height: 44px; border-radius: 12px;
      background: color-mix(in srgb, var(--c) 15%, transparent);
      color: var(--c); display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }
    .stat-item small { color: rgba(255,255,255,0.3); font-size: 0.75rem; }
    .stat-item span { font-weight: 600; color: #f0f0f5; font-size: 0.9rem; }

    .recur-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.04); }
    .recur-days { font-size: 0.78rem; color: rgba(255,255,255,0.35); }
    .sib-badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .sib-badge {
      padding: 5px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 600;
      text-decoration: none; transition: all 0.2s;
      background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .sib-badge:hover { border-color: rgba(108,99,255,0.3); color: #8f88ff; }
    .sib-badge.current { background: linear-gradient(135deg, #6c63ff, #8f88ff); color: #fff; border-color: transparent; }
    .sib-badge.completed { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.3); }
    .sib-badge.active-trip { background: rgba(46,204,113,0.15); color: #2ecc71; border-color: rgba(46,204,113,0.2); }

    .driver-block { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
    .driver-av {
      width: 48px; height: 48px; border-radius: 14px;
      background: rgba(108,99,255,0.15); color: #8f88ff;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .driver-meta { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; color: rgba(255,255,255,0.4); margin-bottom: 12px; }
    .driver-meta i { margin-right: 6px; }
    .msg-btn {
      display: block; text-align: center; padding: 9px; border-radius: 10px;
      border: 1px solid rgba(108,99,255,0.2); color: #8f88ff;
      text-decoration: none; font-weight: 600; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .msg-btn:hover { background: rgba(108,99,255,0.1); color: #fff; }

    .v-row { padding: 6px 0; font-size: 0.88rem; color: rgba(255,255,255,0.6); }
    .v-row i { margin-right: 10px; color: rgba(255,255,255,0.3); }

    .copax { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .copax-av {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(52,152,219,0.15); color: #3498db;
      display: flex; align-items: center; justify-content: center;
    }

    .type-btn {
      flex: 1; padding: 8px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.08); background: transparent;
      color: rgba(255,255,255,0.5); font-weight: 600; font-size: 0.82rem;
      cursor: pointer; transition: all 0.2s;
    }
    .type-btn.active { background: linear-gradient(135deg, #6c63ff, #8f88ff); border-color: transparent; color: #fff; }

    .seat-stepper { display: flex; max-width: 160px; }
    .seat-stepper button {
      width: 36px; height: 36px; border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6);
      cursor: pointer; font-size: 1rem; transition: all 0.2s;
    }
    .seat-stepper button:first-child { border-radius: 8px 0 0 8px; }
    .seat-stepper button:last-child { border-radius: 0 8px 8px 0; }
    .seat-stepper button:hover { background: rgba(108,99,255,0.15); color: #fff; }
    .seat-stepper input {
      width: 50px; text-align: center; border: 1px solid rgba(255,255,255,0.08);
      border-left: none; border-right: none; background: rgba(255,255,255,0.02);
      color: #f0f0f5; font-weight: 700;
    }
    .fare-preview { display: block; margin-top: 8px; color: rgba(255,255,255,0.35); font-size: 0.82rem; }
    .fare-preview strong { color: #2ecc71; }

    .book-btn {
      display: block; width: 100%; padding: 12px; border: none; border-radius: 12px;
      background: linear-gradient(135deg, #6c63ff, #8f88ff); color: #fff;
      font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s;
      box-shadow: 0 4px 15px rgba(108,99,255,0.25);
    }
    .book-btn:hover { box-shadow: 0 6px 25px rgba(108,99,255,0.4); transform: translateY(-1px); }
    .book-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .cancel-btn {
      padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(231,76,60,0.2);
      background: rgba(231,76,60,0.08); color: #e74c3c; font-weight: 600;
      font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
    }
    .cancel-btn:hover { background: rgba(231,76,60,0.15); }

    .track-btn {
      display: block; text-align: center; padding: 12px; border-radius: 12px;
      background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff;
      text-decoration: none; font-weight: 700; transition: all 0.2s;
    }
    .track-btn:hover { box-shadow: 0 6px 20px rgba(46,204,113,0.3); transform: translateY(-1px); color: #fff; }
  `]
})
export class TripDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  trip = signal<Trip | null>(null);
  siblingTrips = signal<Trip[]>([]);
  coPassengers = signal<{ id: number; passengerName: string; seatsBooked: number }[]>([]);
  myBooking = signal<Booking | null>(null);
  booking = false;
  seatsRequested = 1;
  bookingType: 'SINGLE' | 'RECURRING' = 'SINGLE';
  message = '';
  messageType = '';
  isDriver = computed(() => {
    const t = this.trip();
    return !!t && t.driver.email === this.authService.currentEmail();
  });
  isPassenger = computed(() => {
    const t = this.trip();
    return !!t && t.driver.email !== this.authService.currentEmail();
  });

  distance = computed(() => {
    const t = this.trip();
    if (!t || !t.originLat || !t.destLat) return null;
    return this.haversine(t.originLat, t.originLng, t.destLat, t.destLng);
  });

  eta = computed(() => {
    const d = this.distance();
    if (!d) return '';
    const mins = Math.round((d / 40) * 60); // assume 40 km/h avg
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.tripService.getTrip(id).subscribe({
      next: t => {
        this.trip.set(t);
        // Load sibling trips for recurring
        if (t.recurring && t.recurringGroupId) {
          this.tripService.getSiblingTrips(id).subscribe({
            next: siblings => this.siblingTrips.set(siblings.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())),
            error: () => {}
          });
        }
      },
      error: () => this.toast.error('Failed to load trip details')
    });
    this.bookingService.getTripBookings(id).subscribe({
      next: bookings => {
        this.coPassengers.set(
          bookings.filter(b => b.status === 'APPROVED').map(b => ({ id: b.id, passengerName: b.passenger.name, seatsBooked: b.seatsBooked }))
        );
        const email = this.authService.currentEmail();
        const mine = bookings.find(b => b.passenger.email === email && b.status !== 'CANCELLED');
        if (mine) this.myBooking.set(mine);
      },
      error: () => {} // non-critical
    });
  }

  bookTrip() {
    this.booking = true;
    this.message = '';
    const bookedDays = this.bookingType === 'RECURRING' ? this.trip()!.recurringDays : undefined;
    this.bookingService.requestBooking(this.trip()!.id, this.seatsRequested, this.bookingType, bookedDays).pipe(
      finalize(() => this.booking = false)
    ).subscribe({
      next: (b) => {
        this.message = b.status === 'APPROVED' ? 'Booking confirmed!' : 'Booking request sent! Waiting for driver approval.';
        this.messageType = 'success';
        this.toast.success(this.message);
        this.myBooking.set(b);
        this.tripService.getTrip(this.trip()!.id).subscribe(t => this.trip.set(t));
      },
      error: (err) => {
        this.message = err.error?.message || err.error || 'Booking failed. You may have already booked this ride.';
        this.messageType = 'error';
        this.toast.error(this.message);
      }
    });
  }

  startTrip() {
    if (confirm('Start this trip now?')) {
      this.tripService.startTrip(this.trip()!.id).subscribe({
        next: (t) => { this.trip.set(t); this.toast.success('Trip started!'); },
        error: (err) => this.toast.error(err.error?.message || 'Failed to start')
      });
    }
  }

  completeTrip() {
    if (confirm('Mark this trip as completed?')) {
      this.tripService.completeTrip(this.trip()!.id).subscribe({
        next: (t) => { this.trip.set(t); this.toast.success('Trip completed!'); },
        error: (err) => this.toast.error(err.error?.message || 'Failed to complete')
      });
    }
  }

  cancelMyBooking() {
    if (confirm('Cancel your booking? If already approved, the seat will be released.')) {
      this.bookingService.cancelBooking(this.myBooking()!.id).subscribe({
        next: () => {
          this.toast.warning('Booking cancelled.');
          this.myBooking.set(null);
          this.tripService.getTrip(this.trip()!.id).subscribe(t => this.trip.set(t));
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to cancel')
      });
    }
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const toRad = (d: number) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
}
