import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Navbar -->
    <nav class="top-navbar">
      <div class="nav-inner">
        <div class="nav-left">
          <button class="hamburger d-lg-none" (click)="sidebarOpen.set(!sidebarOpen())">
            <i class="bi bi-list"></i>
          </button>
          <a class="brand" [routerLink]="defaultRoute()">
            <div class="brand-icon"><i class="bi bi-bus-front-fill"></i></div>
            <span>SmartTransport</span>
          </a>
        </div>
        <div class="nav-right">
          <div class="nav-user d-none d-md-flex">
            <i class="bi bi-person-circle"></i>
            <span>{{ auth.currentEmail() }}</span>
          </div>
          @if (!isAdmin()) {
            <a class="nav-action" routerLink="/notifications" title="Notifications">
              <i class="bi bi-bell"></i>
              @if (notifCount() > 0) {
                <span class="notif-badge">{{ notifCount() }}</span>
              }
            </a>
          }
          <a class="nav-action" routerLink="/profile" title="Settings"><i class="bi bi-gear"></i></a>
          <button class="nav-action" (click)="auth.logout()" title="Logout"><i class="bi bi-box-arrow-right"></i></button>
        </div>
      </div>
    </nav>

    <div class="app-shell">
      @if (sidebarOpen()) {
        <div class="sidebar-overlay d-lg-none" (click)="sidebarOpen.set(false)"></div>
      }

      <!-- Sidebar -->
      <aside class="sidebar" [class.show]="sidebarOpen()">
        @if (!isAdmin()) {
          <div class="sb-section">
            <a class="sb-link" routerLink="/dashboard" routerLinkActive="active" (click)="sidebarOpen.set(false)">
              <i class="bi bi-grid-1x2-fill"></i><span>Dashboard</span>
            </a>
          </div>
          <div class="sb-section">
            <div class="sb-label">Rides</div>
            <a class="sb-link" routerLink="/search-trips" routerLinkActive="active" (click)="sidebarOpen.set(false)">
              <i class="bi bi-search-heart"></i><span>Search Rides</span>
            </a>
            <a class="sb-link" routerLink="/my-bookings" routerLinkActive="active" (click)="sidebarOpen.set(false)">
              <i class="bi bi-ticket-detailed-fill"></i><span>My Bookings</span>
            </a>
          </div>
          <div class="sb-section">
            <div class="sb-label">Offer</div>
            <a class="sb-link" routerLink="/create-trip" routerLinkActive="active" (click)="sidebarOpen.set(false)">
              <i class="bi bi-plus-circle-fill"></i><span>Create Trip</span>
            </a>
            <a class="sb-link" routerLink="/my-trips" routerLinkActive="active" (click)="sidebarOpen.set(false)">
              <i class="bi bi-map-fill"></i><span>My Trips</span>
            </a>
            <a class="sb-link" routerLink="/my-vehicles" routerLinkActive="active" (click)="sidebarOpen.set(false)">
              <i class="bi bi-car-front-fill"></i><span>My Vehicles</span>
            </a>
          </div>
        }
        @if (isAdmin()) {
          <div class="sb-section">
            <div class="sb-label">Admin</div>
            <a class="sb-link" routerLink="/admin/dashboard" routerLinkActive="active" (click)="sidebarOpen.set(false)">
              <i class="bi bi-grid-1x2-fill"></i><span>Dashboard</span>
            </a>
            <a class="sb-link" routerLink="/admin/organizations" routerLinkActive="active" (click)="sidebarOpen.set(false)">
              <i class="bi bi-building-fill"></i><span>Organizations</span>
            </a>
            <a class="sb-link" routerLink="/admin/vehicles" routerLinkActive="active" (click)="sidebarOpen.set(false)">
              <i class="bi bi-shield-fill-check"></i><span>Approve Vehicles</span>
            </a>
          </div>
        }
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    /* Navbar */
    .top-navbar {
      position: sticky; top: 0; z-index: 1030;
      background: rgba(15,15,26,0.8);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      height: 64px;
    }
    .nav-inner {
      display: flex; align-items: center; justify-content: space-between;
      height: 100%; padding: 0 20px;
    }
    .nav-left { display: flex; align-items: center; gap: 12px; }
    .nav-right { display: flex; align-items: center; gap: 6px; }
    .brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; color: #fff; font-weight: 700; font-size: 1.1rem;
    }
    .brand-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #6c63ff, #8f88ff);
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; color: #fff;
    }
    .hamburger {
      background: none; border: none; color: rgba(255,255,255,0.7);
      font-size: 1.5rem; padding: 4px; cursor: pointer;
    }
    .hamburger:hover { color: #fff; }
    .nav-user {
      display: flex; align-items: center; gap: 6px;
      color: rgba(255,255,255,0.45); font-size: 0.85rem;
      padding: 0 12px;
    }
    .nav-action {
      position: relative;
      width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center;
      border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
      background: transparent; color: rgba(255,255,255,0.5);
      text-decoration: none; transition: all 0.2s; cursor: pointer;
      font-size: 1rem;
    }
    .nav-action:hover { background: rgba(108,99,255,0.1); color: #fff; border-color: rgba(108,99,255,0.3); }
    .notif-badge {
      position: absolute; top: -4px; right: -4px;
      background: #e74c3c; color: #fff; font-size: 0.6rem;
      width: 18px; height: 18px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-weight: 700;
    }

    /* App Shell */
    .app-shell { display: flex; min-height: calc(100vh - 64px); }

    /* Sidebar */
    .sidebar {
      width: 240px; flex-shrink: 0; padding: 16px 0;
      background: #12121f; border-right: 1px solid rgba(255,255,255,0.06);
      min-height: calc(100vh - 64px);
    }
    .sb-section { padding: 4px 0; }
    .sb-section + .sb-section { border-top: 1px solid rgba(255,255,255,0.04); margin-top: 4px; padding-top: 8px; }
    .sb-label {
      padding: 6px 20px 4px; font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: rgba(255,255,255,0.25);
    }
    .sb-link {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 16px; margin: 2px 10px; border-radius: 10px;
      color: rgba(255,255,255,0.5); text-decoration: none;
      font-size: 0.875rem; font-weight: 500; transition: all 0.2s;
    }
    .sb-link i { font-size: 1rem; width: 20px; text-align: center; }
    .sb-link:hover { color: rgba(255,255,255,0.85); background: rgba(108,99,255,0.06); }
    .sb-link.active {
      color: #fff;
      background: linear-gradient(135deg, rgba(108,99,255,0.18), rgba(108,99,255,0.06));
      box-shadow: inset 3px 0 0 #6c63ff;
    }

    /* Main */
    .main-content {
      flex: 1; padding: 28px; overflow-y: auto;
      min-height: calc(100vh - 64px);
    }

    /* Overlay */
    .sidebar-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6); z-index: 1040;
      backdrop-filter: blur(4px);
    }

    @media (max-width: 991.98px) {
      .sidebar {
        position: fixed; top: 64px; left: -260px;
        z-index: 1045; transition: left 0.3s ease;
        min-height: calc(100vh - 64px);
      }
      .sidebar.show { left: 0; }
      .main-content { padding: 16px; }
    }
  `]
})
export class Layout implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private notifService = inject(NotificationService);
  sidebarOpen = signal(false);
  notifCount = signal(0);
  isAdmin = computed(() => this.auth.currentRole() === 'ADMIN');
  defaultRoute = computed(() => this.isAdmin() ? '/admin/dashboard' : '/dashboard');
  private pollInterval: any;

  ngOnInit() {
    this.loadUnread();
    this.pollInterval = setInterval(() => this.loadUnread(), 15000);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  private loadUnread() {
    if (this.isAdmin()) return;
    this.notifService.getUnreadCount().subscribe({
      next: res => this.notifCount.set(res.count),
      error: () => {}
    });
  }
}
