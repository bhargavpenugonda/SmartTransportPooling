import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-split">
      <!-- Left Panel - Branding -->
      <div class="auth-hero">
        <div class="auth-hero-bg">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="grid-overlay"></div>
        </div>
        <div class="auth-hero-content">
          <a routerLink="/" class="brand-link">
            <i class="bi bi-bus-front-fill"></i>
            <span>SmartTransport</span>
          </a>
          <h2>Welcome back</h2>
          <p>Sign in to continue sharing smarter rides with your colleagues.</p>
          <div class="auth-features">
            <div class="auth-feature"><i class="bi bi-check-circle-fill"></i> Offer or book rides instantly</div>
            <div class="auth-feature"><i class="bi bi-check-circle-fill"></i> Real-time booking notifications</div>
            <div class="auth-feature"><i class="bi bi-check-circle-fill"></i> Recurring daily commute support</div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Form -->
      <div class="auth-form-panel">
        <div class="auth-form-wrapper">
          <div class="d-lg-none text-center mb-4">
            <a routerLink="/" class="brand-link-mobile">
              <i class="bi bi-bus-front-fill text-primary" style="font-size: 2rem;"></i>
            </a>
          </div>
          <h3 class="fw-bold mb-1">Sign In</h3>
          <p class="text-muted mb-4">Enter your credentials to access your account</p>

          @if (error()) {
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
              {{ error() }}
              <button type="button" class="btn-close" (click)="error.set('')"></button>
            </div>
          }

          <form (ngSubmit)="onLogin()">
            <div class="mb-3">
              <label class="form-label fw-semibold">Email</label>
              <div class="input-group input-group-modern">
                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                <input type="email" class="form-control" [(ngModel)]="email" name="email"
                       placeholder="you&#64;organization.com" required>
              </div>
            </div>
            <div class="mb-4">
              <div class="d-flex justify-content-between">
                <label class="form-label fw-semibold">Password</label>
                <a routerLink="/forgot-password" class="text-decoration-none small">Forgot?</a>
              </div>
              <div class="input-group input-group-modern">
                <span class="input-group-text"><i class="bi bi-lock"></i></span>
                <input type="password" class="form-control" [(ngModel)]="password" name="password"
                       placeholder="••••••••" required>
              </div>
            </div>
            <button type="submit" class="btn btn-primary w-100 btn-lg mb-3" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner-border spinner-border-sm me-2"></span>
              }
              Sign In <i class="bi bi-arrow-right ms-1"></i>
            </button>
          </form>

          <div class="divider"><span>or</span></div>

          <p class="text-center mb-0">
            Don't have an account?
            <a routerLink="/register" class="text-decoration-none fw-semibold">Create one</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-split { display: flex; min-height: 100vh; }
    .auth-hero {
      flex: 1; position: relative; overflow: hidden;
      background: #0a0a1e; display: none;
    }
    @media (min-width: 992px) { .auth-hero { display: flex; align-items: center; justify-content: center; } }
    .auth-hero-bg { position: absolute; inset: 0; }
    .auth-hero-bg .orb {
      position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4;
      animation: float 8s ease-in-out infinite;
    }
    .auth-hero-bg .orb-1 { width: 400px; height: 400px; background: #4e54c8; top: -10%; right: -10%; }
    .auth-hero-bg .orb-2 { width: 300px; height: 300px; background: #8f94fb; bottom: -5%; left: -5%; animation-delay: -3s; }
    .auth-hero-bg .grid-overlay {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    @keyframes float {
      0%, 100% { transform: translate(0,0) scale(1); }
      33% { transform: translate(30px,-30px) scale(1.05); }
      66% { transform: translate(-20px,20px) scale(0.95); }
    }
    .auth-hero-content {
      position: relative; z-index: 1; padding: 60px; max-width: 480px;
    }
    .brand-link {
      display: flex; align-items: center; gap: 10px;
      font-size: 1.3rem; font-weight: 700; color: #fff; text-decoration: none;
      margin-bottom: 40px;
    }
    .brand-link i { color: #8f94fb; font-size: 1.5rem; }
    .brand-link-mobile { text-decoration: none; }
    .auth-hero-content h2 { color: #fff; font-weight: 800; font-size: 2rem; margin-bottom: 12px; }
    .auth-hero-content p { color: rgba(255,255,255,0.6); font-size: 1.05rem; line-height: 1.6; margin-bottom: 30px; }
    .auth-features { display: flex; flex-direction: column; gap: 12px; }
    .auth-feature {
      color: rgba(255,255,255,0.7); font-size: 0.95rem;
      display: flex; align-items: center; gap: 10px;
    }
    .auth-feature i { color: #2ecc71; }
    .auth-form-panel {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 40px; background: #fff;
    }
    .auth-form-panel h3 { color: #1a1a2e; }
    .auth-form-panel p, .auth-form-panel .text-muted { color: #6c757d !important; }
    .auth-form-panel .form-label { color: #344054; font-weight: 600; font-size: 0.875rem; }
    .auth-form-panel a { color: #4e54c8; }
    .auth-form-panel a:hover { color: #3b3f9e; }
    .auth-form-panel .text-center a { color: #4e54c8; }
    .auth-form-wrapper { width: 100%; max-width: 420px; }
    .input-group-modern .input-group-text {
      background: #f8f9fc; border: 1px solid #e0e3eb; border-right: 0;
      color: #6c757d; border-radius: 10px 0 0 10px;
    }
    .input-group-modern .form-control {
      background: #fff; color: #1a1a2e;
      border: 1px solid #e0e3eb; border-left: 0; border-radius: 0 10px 10px 0;
      padding: 12px 16px;
    }
    .input-group-modern .form-control::placeholder { color: #adb5bd; }
    .input-group-modern .form-control:focus { box-shadow: none; border-color: #4e54c8; background: #fff; color: #1a1a2e; }
    .input-group-modern .form-control:focus + .input-group-text,
    .input-group-modern:focus-within .input-group-text { border-color: #4e54c8; }
    .alert-danger { background: #f8d7da; border-color: #f5c2c7; color: #842029; }
    .divider {
      text-align: center; margin: 20px 0; position: relative;
      color: #adb5bd; font-size: 0.85rem;
    }
    .divider::before, .divider::after {
      content: ''; position: absolute; top: 50%;
      width: calc(50% - 20px); height: 1px; background: #e0e3eb;
    }
    .divider::before { left: 0; }
    .divider::after { right: 0; }
  `]
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  onLogin() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login({ email: this.email, password: this.password }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.toast.success('Welcome back!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Invalid credentials';
        this.error.set(msg);
        this.toast.error(msg);
      }
    });
  }
}

