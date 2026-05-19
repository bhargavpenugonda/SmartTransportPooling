import { Component, inject, signal, ElementRef, viewChild, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TripService } from '../../services/trip.service';
import { Trip, TripSearchRequest } from '../../models/trip.model';
import { ToastService } from '../../services/toast.service';

declare const L: any;

interface PlaceSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address?: any;
  short?: string;
}

@Component({
  selector: 'app-search-trips',
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="page-head">
      <h2><i class="bi bi-search-heart me-2"></i>Search Rides</h2>
      <p>Find available rides matching your route</p>
    </div>

    <!-- Search Filters -->
    <div class="filter-panel">
      <!-- Location search inputs -->
      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <label class="form-label fw-bold"><i class="bi bi-geo-alt text-primary me-1"></i>From</label>
          <div class="position-relative">
            <div class="input-group">
              <span class="input-group-text bg-primary text-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control"
                     [value]="filters.origin || ''"
                     (input)="onOriginSearch($event)"
                     (focus)="originFocused.set(true)"
                     placeholder="Search pickup location..."
                     autocomplete="off">
              <button type="button" class="btn btn-outline-primary" (click)="detectMyLocation('origin')"
                      [disabled]="gpsLoading()" title="Use my current location">
                @if (gpsLoading() && gpsTarget() === 'origin') {
                  <span class="spinner-border spinner-border-sm"></span>
                } @else {
                  <i class="bi bi-crosshair"></i>
                }
              </button>
            </div>
            @if (originFocused() && (dbOriginSuggestions().length > 0 || originSuggestions().length > 0)) {
              <div class="suggestions-dropdown">
                @if (dbOriginSuggestions().length > 0) {
                  <div class="suggestion-section-label"><i class="bi bi-database me-1"></i>From existing trips</div>
                  @for (name of dbOriginSuggestions(); track name) {
                    <div class="suggestion-item" (mousedown)="selectDbSuggestion(name, 'origin')">
                      <i class="bi bi-signpost-2 text-success me-2"></i>
                      <div><div class="suggestion-main">{{ name }}</div></div>
                    </div>
                  }
                  @if (originSuggestions().length > 0) {
                    <div class="suggestion-section-label"><i class="bi bi-globe me-1"></i>Other locations</div>
                  }
                }
                @for (s of originSuggestions(); track s.display_name) {
                  <div class="suggestion-item" (mousedown)="selectSuggestion(s, 'origin')">
                    <i class="bi bi-geo-alt text-primary me-2"></i>
                    <div>
                      <div class="suggestion-main">{{ s.short }}</div>
                      <small class="text-muted suggestion-detail">{{ s.display_name }}</small>
                    </div>
                  </div>
                }
              </div>
            }
            @if (originSelected()) {
              <small class="text-success mt-1 d-block"><i class="bi bi-check-circle me-1"></i>{{ filters.origin }}</small>
            }
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold"><i class="bi bi-geo-alt-fill text-danger me-1"></i>To</label>
          <div class="position-relative">
            <div class="input-group">
              <span class="input-group-text bg-danger text-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control"
                     [value]="filters.destination || ''"
                     (input)="onDestSearch($event)"
                     (focus)="destFocused.set(true)"
                     placeholder="Search drop-off location..."
                     autocomplete="off">
              <button type="button" class="btn btn-outline-danger" (click)="detectMyLocation('destination')"
                      [disabled]="gpsLoading()" title="Use my current location">
                @if (gpsLoading() && gpsTarget() === 'destination') {
                  <span class="spinner-border spinner-border-sm"></span>
                } @else {
                  <i class="bi bi-crosshair"></i>
                }
              </button>
            </div>
            @if (destFocused() && (dbDestSuggestions().length > 0 || destSuggestions().length > 0)) {
              <div class="suggestions-dropdown">
                @if (dbDestSuggestions().length > 0) {
                  <div class="suggestion-section-label"><i class="bi bi-database me-1"></i>From existing trips</div>
                  @for (name of dbDestSuggestions(); track name) {
                    <div class="suggestion-item" (mousedown)="selectDbSuggestion(name, 'destination')">
                      <i class="bi bi-signpost-2 text-success me-2"></i>
                      <div><div class="suggestion-main">{{ name }}</div></div>
                    </div>
                  }
                  @if (destSuggestions().length > 0) {
                    <div class="suggestion-section-label"><i class="bi bi-globe me-1"></i>Other locations</div>
                  }
                }
                @for (s of destSuggestions(); track s.display_name) {
                  <div class="suggestion-item" (mousedown)="selectSuggestion(s, 'destination')">
                    <i class="bi bi-geo-alt-fill text-danger me-2"></i>
                    <div>
                      <div class="suggestion-main">{{ s.short }}</div>
                      <small class="text-muted suggestion-detail">{{ s.display_name }}</small>
                    </div>
                  </div>
                }
              </div>
            }
            @if (destSelected()) {
              <small class="text-success mt-1 d-block"><i class="bi bi-check-circle me-1"></i>{{ filters.destination }}</small>
            }
          </div>
        </div>
      </div>

      <!-- Map -->
      <div class="mb-3">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="d-flex align-items-center gap-2">
            <span class="badge" [class]="originSelected() ? 'bg-primary' : 'bg-secondary'">
              <i class="bi bi-circle-fill me-1" style="font-size: 8px;"></i>Pickup
            </span>
            <i class="bi bi-three-dots"></i>
            <span class="badge" [class]="destSelected() ? 'bg-danger' : 'bg-secondary'">
              <i class="bi bi-circle-fill me-1" style="font-size: 8px;"></i>Drop-off
            </span>
          </div>
          <div class="d-flex gap-2">
            @if (originSelected() || destSelected()) {
              <button type="button" class="btn btn-outline-warning btn-sm" (click)="resetMarkers()">
                <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>
            }
          </div>
        </div>
        <div class="map-pick-hint mb-2">
          @if (!originSelected()) {
            <small class="text-primary"><i class="bi bi-cursor me-1"></i>Search above or click the map to set <strong>Pickup</strong></small>
          } @else if (!destSelected()) {
            <small class="text-danger"><i class="bi bi-cursor me-1"></i>Search above or click the map to set <strong>Drop-off</strong></small>
          } @else {
            <small class="text-success"><i class="bi bi-check-circle me-1"></i>Route set! Drag markers to adjust.</small>
          }
        </div>
        <div #mapContainer class="search-map"></div>
      </div>

      <!-- Other filters + search button -->
      <form (ngSubmit)="search()" class="row g-3 align-items-end">
        <div class="col-md-2">
          <label class="form-label">Date</label>
          <input type="date" class="form-control" [(ngModel)]="selectedDate" name="date">
        </div>
        <div class="col-md-2">
          <label class="form-label">Min Price</label>
          <input type="number" class="form-control" [(ngModel)]="filters.minPrice" name="minPrice" placeholder="₹">
        </div>
        <div class="col-md-2">
          <label class="form-label">Max Price</label>
          <input type="number" class="form-control" [(ngModel)]="filters.maxPrice" name="maxPrice" placeholder="₹">
        </div>
        <div class="col-md-2">
          <label class="form-label">Gender Filter</label>
          <select class="form-select" [(ngModel)]="filters.gender" name="gender">
            <option value="">Any</option>
            <option value="MALE">Male Only</option>
            <option value="FEMALE">Female Only</option>
          </select>
        </div>
        <div class="col-md-2">
          <button type="submit" class="btn btn-primary w-100">
            <i class="bi bi-search me-1"></i> Search
          </button>
        </div>
      </form>
    </div>

    <!-- Results -->
    @if (loading() || !searched()) {
      <div class="loading-state">
        <div class="spinner-border" style="color:#6c63ff"></div>
        <p>Loading available rides...</p>
      </div>
    } @else if (trips().length === 0) {
      <div class="empty-state">
        <i class="bi bi-map"></i>
        <h5>No rides found</h5>
        <p>Try adjusting your search filters</p>
      </div>
    } @else {
      <div class="results-grid">
        @for (trip of trips(); track trip.id) {
          <div class="ride-card">
            <div class="ride-top">
              <span class="badge-status badge-{{ trip.status.toLowerCase() }}">{{ trip.status }}</span>
              @if (trip.recurring) {
                <span class="recur-tag"><i class="bi bi-arrow-repeat"></i> Recurring</span>
              }
            </div>

            <div class="ride-route">
              <div class="route-vis">
                <span class="rdot from"></span>
                <span class="rline"></span>
                <span class="rdot to"></span>
              </div>
              <div class="route-names">
                <span>{{ trip.origin }}</span>
                @if (trip.stops && trip.stops.length > 0) {
                  <span class="stops-line"><i class="bi bi-three-dots"></i> via {{ trip.stops.map(s => s.stopName).join(', ') }}</span>
                }
                <span class="dest">{{ trip.destination }}</span>
              </div>
            </div>

            <div class="ride-meta">
              <span><i class="bi bi-clock"></i>{{ trip.departureTime | date:'MMM d, h:mm a' }}</span>
              <span><i class="bi bi-people"></i>{{ trip.availableSeats }} seats</span>
              @if (trip.originLat && trip.destLat) {
                <span><i class="bi bi-signpost-split"></i>{{ calcDistance(trip) }} km</span>
              }
            </div>

            <div class="ride-bottom">
              <div class="ride-price">
                @if (trip.recurring) {
                  <strong>₹{{ trip.dailyRate }}</strong><small>/day</small>
                } @else {
                  <strong>₹{{ trip.pricePerSeat }}</strong><small>/seat</small>
                }
              </div>
              <a [routerLink]="['/trip', trip.id]" class="view-ride-btn">
                View <i class="bi bi-arrow-right"></i>
              </a>
            </div>

            <div class="ride-footer">
              <div class="driver-chip">
                <div class="driver-avatar"><i class="bi bi-person"></i></div>
                <span>{{ trip.driver.name }}</span>
              </div>
              @if (trip.approvalMode === 'AUTO') {
                <span class="auto-tag">Auto-Accept</span>
              }
            </div>
            @if (trip.vehicle) {
              <div class="vehicle-info">
                <i class="bi bi-car-front"></i>
                {{ trip.vehicle.model }} · {{ trip.vehicle.color }} · {{ trip.vehicle.licensePlate }}
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; }
    .page-head h2 { font-weight: 800; font-size: 1.5rem; color: #f0f0f5; margin: 0; }
    .page-head p { color: rgba(255,255,255,0.4); margin: 4px 0 0; }

    .filter-panel {
      background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px; padding: 24px; margin-bottom: 24px;
    }
    .input-icon { position: relative; }
    .input-icon i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); z-index: 2; }
    .input-icon input { padding-left: 32px; }

    .search-map {
      height: 380px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.08);
      z-index: 0;
      cursor: crosshair !important;
    }
    .suggestions-dropdown {
      position: absolute; top: 100%; left: 0; right: 0;
      background: #1c1c2e; border: 1px solid rgba(255,255,255,0.08);
      border-top: none; border-radius: 0 0 12px 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.4);
      z-index: 1050; max-height: 260px; overflow-y: auto;
    }
    .suggestion-item {
      display: flex; align-items: flex-start; padding: 10px 14px;
      cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.15s; color: #f0f0f5;
    }
    .suggestion-item:hover { background: rgba(108,99,255,0.08); }
    .suggestion-item:last-child { border-bottom: none; }
    .suggestion-section-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 14px 4px; color: rgba(255,255,255,0.35); border-bottom: 1px solid rgba(255,255,255,0.06); }
    .suggestion-main { font-weight: 500; font-size: 0.95rem; }
    .suggestion-detail { font-size: 0.78rem; color: rgba(255,255,255,0.35); display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    .badge { font-size: 0.82rem; padding: 5px 10px; }
    .map-pick-hint { min-height: 22px; }

    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-state i { font-size: 3rem; color: rgba(255,255,255,0.15); display: block; margin-bottom: 12px; }
    .empty-state h5 { color: rgba(255,255,255,0.5); font-weight: 700; }
    .empty-state p { color: rgba(255,255,255,0.3); }

    .loading-state { text-align: center; padding: 60px 20px; }
    .loading-state p { color: rgba(255,255,255,0.4); margin-top: 12px; }

    .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

    .ride-card {
      background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px; padding: 20px; transition: all 0.3s;
    }
    .ride-card:hover { border-color: rgba(108,99,255,0.3); transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }

    .ride-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .recur-tag { font-size: 0.75rem; color: #3498db; font-weight: 600; display: flex; align-items: center; gap: 4px; }

    .ride-route { display: flex; gap: 14px; margin-bottom: 16px; }
    .route-vis { display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 4px; }
    .rdot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .rdot.from { background: #6c63ff; }
    .rdot.to { background: #e74c3c; }
    .rline { width: 2px; flex: 1; min-height: 20px; background: linear-gradient(to bottom, #6c63ff, #e74c3c); }
    .route-names { display: flex; flex-direction: column; justify-content: space-between; font-weight: 600; color: #f0f0f5; font-size: 0.95rem; }
    .route-names .dest { color: rgba(255,255,255,0.7); }
    .stops-line { font-size: 0.78rem; color: rgba(255,255,255,0.4); font-weight: 400; }

    .ride-meta { display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.78rem; color: rgba(255,255,255,0.35); margin-bottom: 16px; }
    .ride-meta i { margin-right: 4px; }

    .ride-bottom { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .ride-price strong { font-size: 1.3rem; color: #2ecc71; }
    .ride-price small { color: rgba(255,255,255,0.35); margin-left: 2px; }
    .view-ride-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 50px;
      background: rgba(108,99,255,0.12); color: #8f88ff;
      text-decoration: none; font-weight: 600; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .view-ride-btn:hover { background: rgba(108,99,255,0.25); color: #fff; }

    .ride-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.04); }
    .driver-chip { display: flex; align-items: center; gap: 8px; }
    .driver-avatar {
      width: 28px; height: 28px; border-radius: 8px;
      background: rgba(108,99,255,0.15); color: #8f88ff;
      display: flex; align-items: center; justify-content: center; font-size: 0.8rem;
    }
    .driver-chip span { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
    .auto-tag { font-size: 0.7rem; background: rgba(46,204,113,0.15); color: #2ecc71; padding: 3px 8px; border-radius: 50px; font-weight: 600; }

    .vehicle-info { font-size: 0.78rem; color: rgba(255,255,255,0.3); margin-top: 10px; }
    .vehicle-info i { margin-right: 4px; }

    @media (max-width: 768px) {
      .results-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SearchTrips implements OnInit, AfterViewInit, OnDestroy {
  private tripService = inject(TripService);
  private toast = inject(ToastService);

  mapContainer = viewChild<ElementRef>('mapContainer');

  filters: TripSearchRequest = {};
  selectedDate = '';
  trips = signal<Trip[]>([]);
  loading = signal(false);
  searched = signal(false);

  // Map & location picking
  originSelected = signal(false);
  destSelected = signal(false);
  originSuggestions = signal<PlaceSuggestion[]>([]);
  destSuggestions = signal<PlaceSuggestion[]>([]);
  dbOriginSuggestions = signal<string[]>([]);
  dbDestSuggestions = signal<string[]>([]);
  originFocused = signal(false);
  destFocused = signal(false);
  private allDbOrigins: string[] = [];
  private allDbDestinations: string[] = [];
  gpsLoading = signal(false);
  gpsTarget = signal<'origin' | 'destination' | ''>('');

  private map: any;
  private originMarker: any;
  private destMarker: any;
  private routeLine: any;
  private currentLocMarker: any;
  private originSearchTimer: any;
  private destSearchTimer: any;

  private outsideClickHandler = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!t.closest('.position-relative')) {
      this.originFocused.set(false);
      this.destFocused.set(false);
    }
  };

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
    document.addEventListener('click', this.outsideClickHandler);
  }

  ngOnInit() {
    this.tripService.getOrigins().subscribe(o => this.allDbOrigins = o);
    this.tripService.getDestinations().subscribe(d => this.allDbDestinations = d);
    this.search();
  }

  private initMap() {
    const el = this.mapContainer()?.nativeElement;
    if (!el || typeof L === 'undefined') return;
    this.map = L.map(el).setView([12.9716, 77.5946], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.map.setView([pos.coords.latitude, pos.coords.longitude], 14);
          this.currentLocMarker = L.marker([pos.coords.latitude, pos.coords.longitude], {
            icon: L.divIcon({
              html: '<div class="current-loc-pulse"><div class="pulse-dot"></div><div class="pulse-ring"></div></div>',
              className: '', iconSize: [20, 20], iconAnchor: [10, 10]
            })
          }).addTo(this.map).bindPopup('<strong>You are here</strong>');
        },
        () => {}
      );
    }
    this.map.on('click', (e: any) => this.handleMapClick(e));
    this.addPulseStyles();
  }

  private addPulseStyles() {
    if (document.getElementById('search-pulse-style')) return;
    const style = document.createElement('style');
    style.id = 'search-pulse-style';
    style.textContent = [
      '.current-loc-pulse { position: relative; width: 20px; height: 20px; }',
      '.pulse-dot { position: absolute; top: 6px; left: 6px; width: 8px; height: 8px; background: #4285f4; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 4px rgba(66,133,244,0.5); z-index: 2; }',
      '.pulse-ring { position: absolute; top: 0; left: 0; width: 20px; height: 20px; border-radius: 50%; background: rgba(66,133,244,0.25); animation: pulse-anim 2s ease-out infinite; }',
      '@keyframes pulse-anim { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Search autocomplete ──

  onOriginSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.filters.origin = val;
    this.originFocused.set(true);
    this.originSelected.set(false);
    clearTimeout(this.originSearchTimer);
    if (val.length < 2) { this.originSuggestions.set([]); this.dbOriginSuggestions.set([]); return; }
    const q = val.toLowerCase();
    this.dbOriginSuggestions.set(this.allDbOrigins.filter(o => o.toLowerCase().includes(q)).slice(0, 5));
    if (val.length >= 3) this.originSearchTimer = setTimeout(() => this.searchPlaces(val, 'origin'), 400);
  }

  onDestSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.filters.destination = val;
    this.destFocused.set(true);
    this.destSelected.set(false);
    clearTimeout(this.destSearchTimer);
    if (val.length < 2) { this.destSuggestions.set([]); this.dbDestSuggestions.set([]); return; }
    const q = val.toLowerCase();
    this.dbDestSuggestions.set(this.allDbDestinations.filter(d => d.toLowerCase().includes(q)).slice(0, 5));
    if (val.length >= 3) this.destSearchTimer = setTimeout(() => this.searchPlaces(val, 'destination'), 400);
  }

  private searchPlaces(query: string, target: 'origin' | 'destination') {
    const center = this.map?.getCenter();
    const lat = center?.lat || 12.9716;
    const lng = center?.lng || 77.5946;
    const url = 'https://photon.komoot.io/api/?q=' + encodeURIComponent(query)
      + '&lat=' + lat + '&lon=' + lng + '&limit=6&lang=en';
    fetch(url).then(res => res.json()).then((data: any) => {
      const features = data.features || [];
      const india = features.filter((f: any) => f.properties?.country === 'India');
      const results = india.length >= 2 ? india : features;
      const suggestions: PlaceSuggestion[] = results.map((f: any) => {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates || [0, 0];
        const name = p.name || '';
        const street = p.street || '';
        const locality = p.locality || p.district || '';
        const city = p.city || p.county || p.state || '';
        const parts = [name, street, locality, city].filter(Boolean);
        return {
          display_name: parts.join(', ') || p.label || '',
          lat: String(coords[1]),
          lon: String(coords[0]),
          address: p,
          short: parts.slice(0, 2).join(', ') || p.label || ''
        } as PlaceSuggestion;
      });
      if (target === 'origin') this.originSuggestions.set(suggestions);
      else this.destSuggestions.set(suggestions);
    }).catch(() => this.searchPlacesFallback(query, target, lat, lng));
  }

  private searchPlacesFallback(query: string, target: 'origin' | 'destination', lat: number, lng: number) {
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query)
      + '&format=json&addressdetails=1&limit=6&countrycodes=in'
      + '&viewbox=' + (lng - 0.3) + ',' + (lat + 0.3) + ',' + (lng + 0.3) + ',' + (lat - 0.3) + '&bounded=1';
    fetch(url, { headers: { 'Accept-Language': 'en' } }).then(res => res.json()).then((results: any[]) => {
      const suggestions: PlaceSuggestion[] = results.map(r => ({
        ...r, lat: r.lat, lon: r.lon,
        short: this.shortName(r.address, r.display_name)
      }));
      if (target === 'origin') this.originSuggestions.set(suggestions);
      else this.destSuggestions.set(suggestions);
    }).catch(() => {});
  }

  selectSuggestion(s: PlaceSuggestion, target: 'origin' | 'destination') {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    if (target === 'origin') {
      this.filters.origin = s.short || s.display_name;
      this.originSuggestions.set([]);
      this.originFocused.set(false);
      this.originSelected.set(true);
      this.setMarker(lat, lng, 'origin');
    } else {
      this.filters.destination = s.short || s.display_name;
      this.destSuggestions.set([]);
      this.destFocused.set(false);
      this.destSelected.set(true);
      this.setMarker(lat, lng, 'destination');
    }
    this.map.setView([lat, lng], 15, { animate: true });
    this.drawRoute();
  }

  selectDbSuggestion(name: string, target: 'origin' | 'destination') {
    if (target === 'origin') {
      this.filters.origin = name;
      this.dbOriginSuggestions.set([]);
      this.originSuggestions.set([]);
      this.originFocused.set(false);
      this.originSelected.set(true);
    } else {
      this.filters.destination = name;
      this.dbDestSuggestions.set([]);
      this.destSuggestions.set([]);
      this.destFocused.set(false);
      this.destSelected.set(true);
    }
  }

  // ── GPS ──

  detectMyLocation(target: 'origin' | 'destination') {
    if (!navigator.geolocation) { this.toast.error('Geolocation not supported'); return; }
    this.gpsLoading.set(true);
    this.gpsTarget.set(target);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.map.setView([lat, lng], 15, { animate: true });
        this.setMarker(lat, lng, target);
        this.reverseGeocode(lat, lng, target);
        if (target === 'origin') this.originSelected.set(true);
        else this.destSelected.set(true);
        this.drawRoute();
        this.gpsLoading.set(false);
        this.gpsTarget.set('');
        this.toast.success((target === 'origin' ? 'Pickup' : 'Drop-off') + ' set to your location');
      },
      () => {
        this.gpsLoading.set(false);
        this.gpsTarget.set('');
        this.toast.error('Could not detect your location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Map click ──

  private handleMapClick(e: any) {
    const lat: number = e.latlng.lat;
    const lng: number = e.latlng.lng;
    if (!this.originSelected()) {
      this.setMarker(lat, lng, 'origin');
      this.reverseGeocode(lat, lng, 'origin');
      this.originSelected.set(true);
    } else if (!this.destSelected()) {
      this.setMarker(lat, lng, 'destination');
      this.reverseGeocode(lat, lng, 'destination');
      this.destSelected.set(true);
      this.drawRoute();
    }
  }

  private setMarker(lat: number, lng: number, target: 'origin' | 'destination') {
    if (this.currentLocMarker) { this.map.removeLayer(this.currentLocMarker); this.currentLocMarker = null; }
    if (target === 'origin') {
      if (this.originMarker) this.originMarker.setLatLng([lat, lng]);
      else {
        this.originMarker = L.marker([lat, lng], {
          draggable: true,
          icon: L.divIcon({
            html: '<div style="background:#0d6efd;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid #fff;"><i class="bi bi-geo-alt"></i></div>',
            className: '', iconSize: [34, 34], iconAnchor: [17, 34]
          })
        }).addTo(this.map);
        this.originMarker.on('dragend', () => {
          const p = this.originMarker.getLatLng();
          this.reverseGeocode(p.lat, p.lng, 'origin');
          this.drawRoute();
        });
      }
      this.originMarker.bindPopup('<strong>Pickup</strong>').openPopup();
    } else {
      if (this.destMarker) this.destMarker.setLatLng([lat, lng]);
      else {
        this.destMarker = L.marker([lat, lng], {
          draggable: true,
          icon: L.divIcon({
            html: '<div style="background:#dc3545;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid #fff;"><i class="bi bi-geo-alt-fill"></i></div>',
            className: '', iconSize: [34, 34], iconAnchor: [17, 34]
          })
        }).addTo(this.map);
        this.destMarker.on('dragend', () => {
          const p = this.destMarker.getLatLng();
          this.reverseGeocode(p.lat, p.lng, 'destination');
          this.drawRoute();
        });
      }
      this.destMarker.bindPopup('<strong>Drop-off</strong>').openPopup();
    }
  }

  private drawRoute() {
    if (this.routeLine) this.map.removeLayer(this.routeLine);
    if (this.originMarker && this.destMarker) {
      const o = this.originMarker.getLatLng();
      const d = this.destMarker.getLatLng();
      this.routeLine = L.polyline([[o.lat, o.lng], [d.lat, d.lng]],
        { color: '#6f42c1', weight: 4, dashArray: '10, 8', opacity: 0.8 }
      ).addTo(this.map);
      this.map.fitBounds(L.latLngBounds([o.lat, o.lng], [d.lat, d.lng]), { padding: [60, 60] });
    }
  }

  private reverseGeocode(lat: number, lng: number, target: 'origin' | 'destination') {
    const url = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&addressdetails=1';
    fetch(url, { headers: { 'Accept-Language': 'en' } }).then(res => res.json()).then(data => {
      if (data?.display_name) {
        const short = this.shortName(data.address, data.display_name);
        if (target === 'origin') {
          this.filters.origin = short;
          this.originMarker?.setPopupContent('<strong>Pickup:</strong> ' + short);
        } else {
          this.filters.destination = short;
          this.destMarker?.setPopupContent('<strong>Drop-off:</strong> ' + short);
        }
      }
    }).catch(() => {});
  }

  private shortName(addr: any, full: string): string {
    if (!addr) return full.split(',').slice(0, 2).join(', ').trim();
    return [addr.road || addr.neighbourhood || addr.suburb || addr.village || addr.town || '',
      addr.city || addr.state_district || addr.county || addr.state || ''].filter(Boolean).join(', ')
      || full.split(',').slice(0, 2).join(', ').trim();
  }

  resetMarkers() {
    if (this.originMarker) { this.map.removeLayer(this.originMarker); this.originMarker = null; }
    if (this.destMarker) { this.map.removeLayer(this.destMarker); this.destMarker = null; }
    if (this.routeLine) { this.map.removeLayer(this.routeLine); this.routeLine = null; }
    this.filters.origin = '';
    this.filters.destination = '';
    this.originSelected.set(false);
    this.destSelected.set(false);
    this.originSuggestions.set([]);
    this.destSuggestions.set([]);
    this.dbOriginSuggestions.set([]);
    this.dbDestSuggestions.set([]);
  }

  // ── Search ──

  search() {
    if (this.selectedDate) {
      this.filters.departureAfter = this.selectedDate + 'T00:00:00';
      this.filters.departureBefore = this.selectedDate + 'T23:59:59';
    } else {
      delete this.filters.departureAfter;
      delete this.filters.departureBefore;
    }
    this.loading.set(true);
    this.tripService.searchTrips(this.filters).subscribe({
      next: (t) => {
        this.trips.set(this.deduplicateRecurring(t));
        this.loading.set(false);
        this.searched.set(true);
        if (t.length === 0) this.toast.info('No rides found. Try different filters.');
      },
      error: (err) => { this.loading.set(false); this.toast.error(err.error?.message || 'Search failed. Please try again.'); }
    });
  }

  private deduplicateRecurring(trips: Trip[]): Trip[] {
    const seen = new Map<string, Trip>();
    const result: Trip[] = [];
    for (const t of trips) {
      if (t.recurringGroupId) {
        const existing = seen.get(t.recurringGroupId);
        if (!existing || new Date(t.departureTime) < new Date(existing.departureTime)) {
          seen.set(t.recurringGroupId, t);
        }
      } else {
        result.push(t);
      }
    }
    return [...result, ...seen.values()];
  }

  calcDistance(t: Trip): number {
    const R = 6371;
    const toRad = (d: number) => d * Math.PI / 180;
    const dLat = toRad(t.destLat - t.originLat), dLon = toRad(t.destLng - t.originLng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(t.originLat)) * Math.cos(toRad(t.destLat)) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  ngOnDestroy() {
    clearTimeout(this.originSearchTimer);
    clearTimeout(this.destSearchTimer);
    document.removeEventListener('click', this.outsideClickHandler);
    if (this.map) this.map.remove();
  }
}
