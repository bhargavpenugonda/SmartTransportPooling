import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TripService } from '../../services/trip.service';
import { Trip } from '../../models/trip.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-trips',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="pg-head">
      <div>
        <h2><i class="bi bi-map-fill me-2"></i>My Trips</h2>
        <p>Manage your posted rides</p>
      </div>
      <div class="d-flex gap-2">
        <button class="refresh-btn" (click)="loadTrips()"><i class="bi bi-arrow-clockwise"></i></button>
        <a routerLink="/create-trip" class="btn btn-primary"><i class="bi bi-plus-circle me-1"></i> New Trip</a>
      </div>
    </div>

    <!-- Status Pills -->
    <div class="filter-pills">
      @for (status of ['ALL','SCHEDULED','ACTIVE','COMPLETED','CANCELLED']; track status) {
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
    } @else if (filteredTrips().length === 0) {
      <div class="empty-state">
        <i class="bi bi-map"></i>
        <h5>No trips {{ filter !== 'ALL' ? 'with status ' + filter : 'posted' }}</h5>
        <a routerLink="/create-trip" class="btn btn-primary mt-2">Create your first trip</a>
      </div>
    } @else {
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Route</th>
              <th>Departure</th>
              <th>Seats</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (trip of filteredTrips(); track trip.id) {
              <tr>
                <td>
                  <div class="route-cell">
                    <span class="rdot-sm from"></span>
                    <strong>{{ trip.origin }}</strong>
                    <i class="bi bi-arrow-right" style="color:rgba(255,255,255,0.15)"></i>
                    <span class="rdot-sm to"></span>
                    <strong>{{ trip.destination }}</strong>
                  </div>
                  @if (trip.recurring) {
                    <div class="recur-label"><i class="bi bi-arrow-repeat"></i> {{ trip.recurringDays }}</div>
                  }
                </td>
                <td><span class="date-cell">{{ trip.departureTime | date:'MMM d, h:mm a' }}</span></td>
                <td><span class="seats-chip">{{ trip.availableSeats }}</span></td>
                <td>
                  @if (trip.recurring && trip.dailyRate) {
                    <span class="price-cell">₹{{ trip.dailyRate }}<small>/day</small></span>
                  } @else {
                    <span class="price-cell">₹{{ trip.pricePerSeat || '-' }}</span>
                  }
                </td>
                <td><span class="badge-status badge-{{ trip.status.toLowerCase() }}">{{ trip.status }}</span></td>
                <td>
                  <div class="d-flex gap-1 flex-wrap">
                    <a [routerLink]="['/trip', trip.id]" class="tbl-btn" title="View"><i class="bi bi-eye"></i></a>
                    <a [routerLink]="['/trip-bookings', trip.id]" class="tbl-btn success" title="Bookings"><i class="bi bi-people"></i></a>
                    @if (trip.status === 'SCHEDULED') {
                      <button class="tbl-btn go" (click)="startTrip(trip.id)" title="Start"><i class="bi bi-play-fill"></i></button>
                      <button class="tbl-btn danger" (click)="cancelTrip(trip.id)" title="Cancel"><i class="bi bi-x-circle"></i></button>
                    }
                    @if (trip.status === 'ACTIVE') {
                      <button class="tbl-btn warn" (click)="completeTrip(trip.id)" title="Complete"><i class="bi bi-check-circle-fill"></i></button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
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

    .route-cell { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; color: #f0f0f5; }
    .rdot-sm { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    .rdot-sm.from { background: #6c63ff; }
    .rdot-sm.to { background: #e74c3c; }
    .recur-label { font-size: 0.75rem; color: #3498db; margin-top: 2px; }
    .date-cell { font-size: 0.85rem; color: rgba(255,255,255,0.5); }
    .seats-chip {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 8px;
      background: rgba(108,99,255,0.1); color: #8f88ff; font-weight: 700; font-size: 0.85rem;
    }
    .price-cell { color: #2ecc71; font-weight: 600; }
    .price-cell small { color: rgba(255,255,255,0.3); }

    .tbl-btn {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: rgba(108,99,255,0.1); color: #8f88ff;
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s; text-decoration: none; font-size: 0.85rem;
    }
    .tbl-btn:hover { background: rgba(108,99,255,0.25); color: #fff; }
    .tbl-btn.success { background: rgba(46,204,113,0.1); color: #2ecc71; }
    .tbl-btn.success:hover { background: rgba(46,204,113,0.25); color: #fff; }
    .tbl-btn.go { background: rgba(46,204,113,0.15); color: #2ecc71; }
    .tbl-btn.go:hover { background: #2ecc71; color: #fff; }
    .tbl-btn.danger { background: rgba(231,76,60,0.1); color: #e74c3c; }
    .tbl-btn.danger:hover { background: rgba(231,76,60,0.25); color: #fff; }
    .tbl-btn.warn { background: rgba(241,196,15,0.12); color: #f1c40f; }
    .tbl-btn.warn:hover { background: rgba(241,196,15,0.3); color: #fff; }
    .tbl-btn.info { background: rgba(52,152,219,0.12); color: #3498db; }
    .tbl-btn.info:hover { background: rgba(52,152,219,0.3); color: #fff; }
  `]
})
export class MyTrips implements OnInit {
  private tripService = inject(TripService);
  private toast = inject(ToastService);
  trips = signal<Trip[]>([]);
  loading = signal(true);
  filter = 'ALL';

  filteredTrips() {
    if (this.filter === 'ALL') return this.trips();
    return this.trips().filter(t => t.status === this.filter);
  }

  countByStatus(status: string) {
    return this.trips().filter(t => t.status === status).length;
  }

  ngOnInit() { this.loadTrips(); }

  loadTrips() {
    this.loading.set(true);
    this.tripService.getMyTrips().subscribe({
      next: (t) => { this.trips.set(t); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load trips'); }
    });
  }

  startTrip(id: number) {
    if (confirm('Start this trip? Passengers will be notified.')) {
      this.tripService.startTrip(id).subscribe({
        next: () => {
          this.toast.success('Trip started!');
          this.loadTrips();
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to start trip')
      });
    }
  }

  completeTrip(id: number) {
    if (confirm('Mark this trip as completed?')) {
      this.tripService.completeTrip(id).subscribe({
        next: () => {
          this.toast.success('Trip completed successfully!');
          this.loadTrips();
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to complete trip')
      });
    }
  }

  cancelTrip(id: number) {
    if (confirm('Are you sure you want to cancel this trip?')) {
      this.tripService.cancelTrip(id).subscribe({
        next: () => {
          this.toast.warning('Trip cancelled.');
          this.loadTrips();
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to cancel trip')
      });
    }
  }
}
