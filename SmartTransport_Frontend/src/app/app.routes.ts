import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing/landing').then(m => m.Landing) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPassword) },
  { path: 'verify-email', loadComponent: () => import('./pages/verify-email/verify-email').then(m => m.VerifyEmail) },
  {
    path: '',
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.Profile) },
      { path: 'search-trips', loadComponent: () => import('./pages/search-trips/search-trips').then(m => m.SearchTrips) },
      { path: 'trip/:id', loadComponent: () => import('./pages/trip-detail/trip-detail').then(m => m.TripDetail) },
      { path: 'my-bookings', loadComponent: () => import('./pages/my-bookings/my-bookings').then(m => m.MyBookings) },
      { path: 'notifications', loadComponent: () => import('./pages/notifications/notifications').then(m => m.Notifications) },
      // Trip management (any user)
      { path: 'create-trip', loadComponent: () => import('./pages/create-trip/create-trip').then(m => m.CreateTrip) },
      { path: 'my-trips', loadComponent: () => import('./pages/my-trips/my-trips').then(m => m.MyTrips) },
      { path: 'my-vehicles', loadComponent: () => import('./pages/my-vehicles/my-vehicles').then(m => m.MyVehicles) },
      { path: 'trip-bookings/:tripId', loadComponent: () => import('./pages/trip-bookings/trip-bookings').then(m => m.TripBookings) },
      // Admin routes
      { path: 'admin/dashboard', loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.AdminDashboard), canActivate: [roleGuard(['ADMIN'])] },
      { path: 'admin/organizations', loadComponent: () => import('./pages/admin/organizations/organizations').then(m => m.Organizations), canActivate: [roleGuard(['ADMIN'])] },
      { path: 'admin/vehicles', loadComponent: () => import('./pages/admin/vehicles/vehicles').then(m => m.PendingVehicles), canActivate: [roleGuard(['ADMIN'])] },
    ]
  },
  { path: '**', redirectTo: '/' }
];
