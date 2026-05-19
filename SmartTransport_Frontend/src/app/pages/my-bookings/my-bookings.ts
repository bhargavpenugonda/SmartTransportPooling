import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-bookings',
  imports: [DatePipe, RouterLink],
  template: `
    <div class="pg-head">
      <div>
        <h2><i class="bi bi-ticket-detailed-fill me-2"></i>My Bookings</h2>
        <p>View and manage your ride bookings</p>
      </div>
      <button class="refresh-btn" (click)="load()"><i class="bi bi-arrow-clockwise"></i></button>
    </div>

    <!-- Status Pills -->
    <div class="filter-pills">
      @for (status of ['ALL','PENDING','APPROVED','REJECTED','CANCELLED']; track status) {
        <button class="fpill" [class.active]="filter === status" (click)="filter = status">
          {{ status }}
          @if (status !== 'ALL') {
            <span class="fpill-count">{{ countByStatus(status) }}</span>
          }
        </button>
      }
    </div>

    @if (loading()) {
      <div class="loading-state"><div class="spinner-border" style="color:#6c63ff"></div></div>
    } @else if (filteredBookings().length === 0) {
      <div class="empty-state">
        <i class="bi bi-ticket"></i>
        <h5>{{ filter === 'ALL' ? 'No bookings yet' : 'No ' + filter + ' bookings' }}</h5>
        <p>Search and book a ride to get started</p>
        <a routerLink="/search-trips" class="btn btn-primary mt-2">Search Rides</a>
      </div>
    } @else {
      <div class="booking-grid">
        @for (b of filteredBookings(); track b.id) {
          <div class="bcard">
            <div class="bcard-top">
              <div class="d-flex gap-2 align-items-center">
                <span class="badge-status badge-{{ b.status.toLowerCase() }}">{{ b.status }}</span>
                @if (b.bookingType === 'RECURRING') {
                  <span class="recur-tag"><i class="bi bi-arrow-repeat"></i> Recurring</span>
                }
              </div>
              <span class="bcard-date">{{ b.bookedAt | date:'MMM d' }}</span>
            </div>

            @if (b.bookingType === 'RECURRING' && b.bookedDays) {
              <div class="bcard-days"><i class="bi bi-calendar-week me-1"></i>{{ b.bookedDays }}</div>
            }

            <div class="bcard-route">
              <div class="rdots"><span class="rdot from"></span><span class="rline"></span><span class="rdot to"></span></div>
              <div class="rnames">
                <span>{{ b.trip.origin }}</span>
                <span>{{ b.trip.destination }}</span>
              </div>
            </div>

            <div class="bcard-info">
              <span><i class="bi bi-clock"></i>{{ b.trip.departureTime | date:'MMM d, h:mm a' }}</span>
              <div class="bcard-fare">
                <strong>₹{{ b.fare }}</strong>
                @if (b.seatsBooked > 1) {
                  <span class="seats-badge">{{ b.seatsBooked }} seats</span>
                }
              </div>
            </div>

            <div class="bcard-footer">
              <div class="driver-chip">
                <div class="driver-av"><i class="bi bi-person"></i></div>
                <span>{{ b.trip.driver.name }}</span>
              </div>
              <div class="bcard-actions">
                <a [routerLink]="['/trip', b.trip.id]" class="act-btn"><i class="bi bi-eye"></i></a>
                @if (b.status === 'PENDING' || b.status === 'APPROVED') {
                  <button class="act-btn danger" (click)="cancel(b.id)"><i class="bi bi-x-circle"></i></button>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .pg-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .pg-head h2 { font-weight: 800; font-size: 1.5rem; color: #f0f0f5; margin: 0; }
    .pg-head p { color: rgba(255,255,255,0.4); margin: 4px 0 0; }
    .refresh-btn {
      width: 38px; height: 38px; border-radius: 10px;
      background: rgba(108,99,255,0.1); border: 1px solid rgba(108,99,255,0.2);
      color: #8f88ff; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
    }
    .refresh-btn:hover { background: rgba(108,99,255,0.2); }

    .filter-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
    .fpill {
      padding: 7px 16px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.08);
      background: transparent; color: rgba(255,255,255,0.5); font-weight: 600; font-size: 0.82rem;
      cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;
    }
    .fpill:hover { border-color: rgba(108,99,255,0.2); color: rgba(255,255,255,0.8); }
    .fpill.active { background: linear-gradient(135deg, #6c63ff, #8f88ff); border-color: transparent; color: #fff; }
    .fpill-count { background: rgba(255,255,255,0.15); padding: 1px 7px; border-radius: 50px; font-size: 0.72rem; }

    .loading-state { text-align: center; padding: 60px; }

    .booking-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }

    .bcard {
      background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px; padding: 20px; transition: all 0.3s;
    }
    .bcard:hover { border-color: rgba(108,99,255,0.2); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }

    .bcard-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .bcard-date { font-size: 0.78rem; color: rgba(255,255,255,0.3); }
    .recur-tag { font-size: 0.72rem; color: #3498db; font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .bcard-days { font-size: 0.78rem; color: rgba(255,255,255,0.35); margin-bottom: 12px; }

    .bcard-route { display: flex; gap: 12px; margin-bottom: 14px; }
    .rdots { display: flex; flex-direction: column; align-items: center; gap: 3px; padding-top: 4px; }
    .rdot { width: 8px; height: 8px; border-radius: 50%; }
    .rdot.from { background: #6c63ff; }
    .rdot.to { background: #e74c3c; }
    .rline { width: 2px; flex: 1; min-height: 16px; background: linear-gradient(to bottom, #6c63ff, #e74c3c); }
    .rnames { display: flex; flex-direction: column; justify-content: space-between; font-weight: 600; font-size: 0.92rem; color: #f0f0f5; }

    .bcard-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 0.8rem; color: rgba(255,255,255,0.35); }
    .bcard-info i { margin-right: 4px; }
    .bcard-fare strong { color: #2ecc71; font-size: 1rem; }
    .seats-badge { font-size: 0.7rem; background: rgba(108,99,255,0.15); color: #8f88ff; padding: 2px 8px; border-radius: 50px; margin-left: 6px; }

    .bcard-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.04); }
    .driver-chip { display: flex; align-items: center; gap: 8px; }
    .driver-av { width: 28px; height: 28px; border-radius: 8px; background: rgba(108,99,255,0.15); color: #8f88ff; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
    .driver-chip span { font-size: 0.82rem; color: rgba(255,255,255,0.5); }
    .bcard-actions { display: flex; gap: 4px; }
    .act-btn {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: rgba(108,99,255,0.1); color: #8f88ff;
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s; text-decoration: none; font-size: 0.85rem;
    }
    .act-btn:hover { background: rgba(108,99,255,0.25); color: #fff; }
    .act-btn.track { background: rgba(52,152,219,0.15); color: #3498db; }
    .act-btn.track:hover { background: rgba(52,152,219,0.3); color: #fff; }
    .act-btn.danger { background: rgba(231,76,60,0.1); color: #e74c3c; }
    .act-btn.danger:hover { background: rgba(231,76,60,0.25); color: #fff; }

    @media (max-width: 768px) { .booking-grid { grid-template-columns: 1fr; } }
  `]
})
export class MyBookings implements OnInit {
  private bookingService = inject(BookingService);
  private toast = inject(ToastService);
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  filter = 'ALL';

  filteredBookings() {
    if (this.filter === 'ALL') return this.bookings();
    return this.bookings().filter(b => b.status === this.filter);
  }

  countByStatus(status: string) {
    return this.bookings().filter(b => b.status === status).length;
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.bookingService.getMyBookings().subscribe({
      next: (b) => { this.bookings.set(b); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load bookings'); }
    });
  }

  cancel(id: number) {
    if (confirm('Cancel this booking? If already approved, the seat will be released.')) {
      this.bookingService.cancelBooking(id).subscribe({
        next: () => { this.toast.warning('Booking cancelled.'); this.load(); },
        error: (err) => this.toast.error(err.error?.message || 'Failed to cancel booking')
      });
    }
  }
}
