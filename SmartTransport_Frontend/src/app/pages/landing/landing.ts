import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  template: `
    <!-- Floating Navbar -->
    <nav class="landing-nav">
      <div class="container d-flex justify-content-between align-items-center">
        <a class="brand" routerLink="/">
          <i class="bi bi-bus-front-fill"></i>
          <span>SmartTransport</span>
        </a>
        <div class="d-flex gap-2">
          <a routerLink="/login" class="btn btn-ghost">Sign In</a>
          <a routerLink="/register" class="btn btn-glow">Get Started</a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="grid-overlay"></div>
      </div>
      <div class="container hero-content">
        <div class="hero-badge">
          <i class="bi bi-lightning-fill"></i> Smart Commuting for Modern Teams
        </div>
        <h1 class="hero-title">
          Share Rides.<br>
          <span class="gradient-text">Save the Planet.</span>
        </h1>
        <p class="hero-subtitle">
          Your organization's intelligent ride-sharing platform. Offer a ride or find one —
          every trip makes commuting smarter, cheaper, and greener.
        </p>
        <div class="hero-actions">
          <a routerLink="/register" class="btn btn-glow btn-lg">
            <i class="bi bi-rocket-takeoff me-2"></i>Start Sharing Rides
          </a>
          <a href="#features" class="btn btn-glass btn-lg">
            <i class="bi bi-play-circle me-2"></i>See How It Works
          </a>
        </div>
        <div class="hero-stats">
          <div class="stat-pill">
            <i class="bi bi-geo-alt-fill text-primary"></i>
            <div><strong>City-Smart</strong><small>Filtered by your city</small></div>
          </div>
          <div class="stat-pill">
            <i class="bi bi-shield-check text-success"></i>
            <div><strong>Org-Verified</strong><small>Only whitelisted emails</small></div>
          </div>
          <div class="stat-pill">
            <i class="bi bi-arrow-repeat text-info"></i>
            <div><strong>Recurring</strong><small>Daily commute support</small></div>
          </div>
        </div>
      </div>
      <div class="scroll-indicator">
        <i class="bi bi-chevron-double-down"></i>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">Features</span>
          <h2>Everything you need for smarter commuting</h2>
          <p>One platform — offer rides, book seats, track live, chat, and manage vehicles.</p>
        </div>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon" style="--accent: #4e54c8;">
              <i class="bi bi-plus-circle-fill"></i>
            </div>
            <h4>Create & Offer Trips</h4>
            <p>Post one-time or recurring rides. Set your route, pick your vehicle, and choose your price.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon" style="--accent: #e74c3c;">
              <i class="bi bi-search-heart"></i>
            </div>
            <h4>Smart Search</h4>
            <p>Find rides by city, route, price, gender filter, and time. Results auto-filtered to your city.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon" style="--accent: #2ecc71;">
              <i class="bi bi-calendar2-week"></i>
            </div>
            <h4>Recurring Rides</h4>
            <p>Set up your daily commute once — book all days with one click. Each day runs independently.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon" style="--accent: #1abc9c;">
              <i class="bi bi-bell-fill"></i>
            </div>
            <h4>Instant Notifications</h4>
            <p>Real-time alerts for bookings, approvals, trip starts, and more — never miss a ride.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="how-it-works">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">How It Works</span>
          <h2>Three steps to your next ride</h2>
        </div>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Register with your org email</h4>
              <p>Sign up in seconds. Your organization email verifies your identity automatically.</p>
            </div>
          </div>
          <div class="step-connector"></div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Search or offer a ride</h4>
              <p>Browse available rides near you, or create your own trip and let others join.</p>
            </div>
          </div>
          <div class="step-connector"></div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Ride together & save</h4>
              <p>Track live, chat, and share the journey. Split costs, cut emissions, build connections.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="container text-center">
        <div class="cta-card">
          <h2>Ready to transform your commute?</h2>
          <p>Join your colleagues already sharing smarter rides.</p>
          <a routerLink="/register" class="btn btn-glow btn-lg">
            <i class="bi bi-arrow-right-circle me-2"></i>Create Free Account
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="container text-center">
        <i class="bi bi-bus-front-fill"></i>
        <span>SmartTransport</span> · Built for smarter commuting
      </div>
    </footer>
  `,
  styles: [`
    /* ===== LANDING NAV ===== */
    .landing-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      padding: 16px 0;
      background: rgba(10, 10, 30, 0.6);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .brand {
      display: flex; align-items: center; gap: 10px;
      font-size: 1.3rem; font-weight: 700; color: #fff; text-decoration: none;
    }
    .brand i { color: #8f94fb; font-size: 1.5rem; }
    .btn-ghost {
      color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px; padding: 8px 20px; font-weight: 500;
      transition: all 0.3s;
    }
    .btn-ghost:hover { color: #fff; border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); }
    .btn-glow {
      background: linear-gradient(135deg, #4e54c8, #8f94fb);
      color: #fff; border: none; border-radius: 10px; padding: 10px 24px;
      font-weight: 600; position: relative; overflow: hidden;
      box-shadow: 0 4px 20px rgba(78, 84, 200, 0.4);
      transition: all 0.3s;
    }
    .btn-glow:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(78,84,200,0.6); color: #fff; }
    .btn-glass {
      background: rgba(255,255,255,0.08); color: #fff;
      border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
      padding: 10px 24px; font-weight: 600;
      backdrop-filter: blur(10px); transition: all 0.3s;
    }
    .btn-glass:hover { background: rgba(255,255,255,0.15); color: #fff; transform: translateY(-2px); }

    /* ===== HERO ===== */
    .hero {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
      background: #0a0a1e;
      padding: 100px 0 60px;
    }
    .hero-bg {
      position: absolute; inset: 0; overflow: hidden;
    }
    .orb {
      position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4;
      animation: float 8s ease-in-out infinite;
    }
    .orb-1 { width: 500px; height: 500px; background: #4e54c8; top: -10%; right: -5%; animation-delay: 0s; }
    .orb-2 { width: 400px; height: 400px; background: #8f94fb; bottom: -10%; left: -5%; animation-delay: -3s; }
    .orb-3 { width: 300px; height: 300px; background: #2ecc71; top: 40%; left: 40%; animation-delay: -5s; opacity: 0.2; }
    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -30px) scale(1.05); }
      66% { transform: translate(-20px, 20px) scale(0.95); }
    }
    .grid-overlay {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    .hero-content { position: relative; z-index: 1; text-align: center; max-width: 800px; }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(78,84,200,0.15); border: 1px solid rgba(78,84,200,0.3);
      border-radius: 50px; padding: 8px 20px; font-size: 0.85rem;
      color: #b8bbff; margin-bottom: 28px;
      animation: fadeInUp 0.6s ease-out;
    }
    .hero-title {
      font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800;
      color: #fff; line-height: 1.1; margin-bottom: 24px;
      animation: fadeInUp 0.6s ease-out 0.1s backwards;
    }
    .gradient-text {
      background: linear-gradient(135deg, #4e54c8, #8f94fb, #2ecc71);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-subtitle {
      font-size: 1.2rem; color: rgba(255,255,255,0.6);
      max-width: 600px; margin: 0 auto 36px; line-height: 1.7;
      animation: fadeInUp 0.6s ease-out 0.2s backwards;
    }
    .hero-actions {
      display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
      margin-bottom: 60px;
      animation: fadeInUp 0.6s ease-out 0.3s backwards;
    }
    .hero-stats {
      display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
      animation: fadeInUp 0.6s ease-out 0.4s backwards;
    }
    .stat-pill {
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px; padding: 12px 20px;
      backdrop-filter: blur(10px);
    }
    .stat-pill i { font-size: 1.3rem; }
    .stat-pill strong { color: #fff; font-size: 0.9rem; display: block; }
    .stat-pill small { color: rgba(255,255,255,0.4); font-size: 0.75rem; }
    .scroll-indicator {
      position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
      color: rgba(255,255,255,0.3); font-size: 1.5rem;
      animation: bounce 2s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(10px); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ===== FEATURES ===== */
    .features { padding: 100px 0; background: #f8f9fc; }
    .section-header { text-align: center; margin-bottom: 60px; }
    .section-badge {
      display: inline-block;
      background: linear-gradient(135deg, rgba(78,84,200,0.1), rgba(143,148,251,0.1));
      color: #4e54c8; border-radius: 50px; padding: 6px 18px;
      font-size: 0.85rem; font-weight: 600; margin-bottom: 16px;
    }
    .section-header h2 { font-size: 2.2rem; font-weight: 800; color: #1a1a2e; }
    .section-header p { color: #6c757d; font-size: 1.1rem; max-width: 500px; margin: 12px auto 0; }
    .feature-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }
    .feature-card {
      background: #fff; border-radius: 16px; padding: 32px;
      border: 1px solid #eee; transition: all 0.3s ease;
    }
    .feature-card:hover {
      transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.08);
      border-color: transparent;
    }
    .feature-icon {
      width: 56px; height: 56px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; margin-bottom: 20px;
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      color: var(--accent);
    }
    .feature-card h4 { font-weight: 700; font-size: 1.1rem; color: #1a1a2e; margin-bottom: 8px; }
    .feature-card p { color: #6c757d; font-size: 0.95rem; line-height: 1.6; margin: 0; }

    /* ===== HOW IT WORKS ===== */
    .how-it-works { padding: 100px 0; background: #fff; }
    .steps { max-width: 600px; margin: 0 auto; }
    .step {
      display: flex; gap: 20px; align-items: flex-start;
    }
    .step-number {
      width: 48px; height: 48px; flex-shrink: 0;
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #4e54c8, #8f94fb);
      color: #fff; font-weight: 800; font-size: 1.2rem;
    }
    .step-content h4 { font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
    .step-content p { color: #6c757d; margin: 0; line-height: 1.5; }
    .step-connector {
      width: 2px; height: 40px; background: linear-gradient(to bottom, #4e54c8, #8f94fb);
      margin: 8px 0 8px 23px; border-radius: 2px; opacity: 0.3;
    }

    /* ===== CTA ===== */
    .cta { padding: 80px 0; background: #f8f9fc; }
    .cta-card {
      background: linear-gradient(135deg, #0a0a1e, #1a1a3e);
      border-radius: 24px; padding: 60px 40px;
      position: relative; overflow: hidden;
    }
    .cta-card::before {
      content: ''; position: absolute; top: -50%; right: -20%;
      width: 400px; height: 400px; border-radius: 50%;
      background: rgba(78,84,200,0.2); filter: blur(60px);
    }
    .cta-card h2 { color: #fff; font-weight: 800; font-size: 2rem; position: relative; }
    .cta-card p { color: rgba(255,255,255,0.6); font-size: 1.1rem; margin-bottom: 28px; position: relative; }

    /* ===== FOOTER ===== */
    .landing-footer {
      padding: 24px 0; background: #0a0a1e;
      color: rgba(255,255,255,0.4); font-size: 0.9rem;
    }
    .landing-footer i { color: #8f94fb; margin-right: 6px; }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .hero-stats { flex-direction: column; align-items: center; }
      .stat-pill { width: 100%; max-width: 280px; }
      .feature-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class Landing {}
