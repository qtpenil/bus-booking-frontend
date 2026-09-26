import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService, UserPayload } from '../../features/auth/services/auth.service';

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
  badgeClass?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private routerSub?: Subscription;

  isCollapsed = false;
  currentBreadcrumb = 'Dashboard';
  currentUser: UserPayload | null = null;
  searchQuery = '';

  navGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' }
      ]
    },
    {
      title: 'NETWORK',
      items: [
        { label: 'Manage Cities', route: '/admin/cities', icon: 'location_city' },
        { label: 'Manage Routes', route: '/admin/routes', icon: 'alt_route' }
      ]
    },
    {
      title: 'FLEET',
      items: [
        { label: 'Bus Types', route: '/admin/bus-types', icon: 'category' },
        { label: 'Seat Templates', route: '/admin/seat-templates', icon: 'event_seat' },
        { label: 'Manage Buses', route: '/admin/buses', icon: 'directions_bus' }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Manage Schedules', route: '/admin/schedules', icon: 'schedule' },
        { label: 'Bookings', route: '/admin/bookings', icon: 'confirmation_number', badge: 'Soon', badgeClass: 'badge-soon' }
      ]
    },
    {
      title: 'INSIGHTS',
      items: [
        { label: 'Analytics & Reports', route: '/admin/reports', icon: 'insights', badge: 'Preview', badgeClass: 'badge-preview' }
      ]
    }
  ];

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.updateBreadcrumb(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateBreadcrumb(event.urlAfterRedirects || event.url);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  getUserInitials(): string {
    const name = this.currentUser?.sub || this.currentUser?.email || 'Admin';
    return name.substring(0, 2).toUpperCase();
  }

  getUserDisplayName(): string {
    return this.currentUser?.sub || this.currentUser?.email || 'Admin Operator';
  }

  getUserRole(): string {
    return (this.currentUser?.role || 'SUPER ADMIN').replace('ROLE_', '');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  private updateBreadcrumb(url: string): void {
    const cleanUrl = url.split('?')[0];
    for (const group of this.navGroups) {
      const match = group.items.find(item => cleanUrl.includes(item.route));
      if (match) {
        this.currentBreadcrumb = `${group.title} / ${match.label}`;
        return;
      }
    }
    this.currentBreadcrumb = 'Admin Portal';
  }
}
