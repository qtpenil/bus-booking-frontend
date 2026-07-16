import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { UserLayoutComponent } from './layouts/user-layout/user-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES) },
      { path: 'search', loadChildren: () => import('./features/search/search.routes').then(m => m.SEARCH_ROUTES) },
      { path: 'booking', loadChildren: () => import('./features/booking/booking.routes').then(m => m.BOOKING_ROUTES) },
      { path: 'profile', loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES) }
    ]
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES) }
    ]
  },
  { path: '**', redirectTo: 'home' } // Catch-all route
];
