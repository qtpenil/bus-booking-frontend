import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AuthService, UserPayload } from '../../../features/auth/services/auth.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentUser: UserPayload | null = null;
  isLoggedIn = false;
  isMobileMenuOpen = false;
  currentUrl = '';

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      this.cdr.markForCheck();
    });

    this.updateActiveRoute(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      this.updateActiveRoute(event.urlAfterRedirects || event.url);
      this.isMobileMenuOpen = false;
      this.cdr.markForCheck();
    });
  }

  private updateActiveRoute(url: string): void {
    const cleanUrl = url ? url.split('?')[0] : '';
    this.currentUrl = cleanUrl;
  }

  get isHomeActive(): boolean {
    return this.currentUrl === '/' || this.currentUrl === '/home';
  }

  get isFindBusesActive(): boolean {
    return this.currentUrl.startsWith('/search');
  }

  get isMyBookingsActive(): boolean {
    return this.currentUrl.startsWith('/booking/my-bookings');
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  openAuthModal(initialMode: 'login' | 'register' = 'login'): void {
    this.closeMobileMenu();
    this.dialog.open(AuthModalComponent, {
      panelClass: 'auth-modal-pane',
      backdropClass: 'auth-modal-backdrop',
      data: { initialMode }
    });
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return '';
    const name = this.currentUser.sub || this.currentUser.email || '';
    if (name.includes('@')) {
      return name.split('@')[0];
    }
    return name || 'User';
  }

  onMyBookingsClick(): void {
    this.closeMobileMenu();
    if (this.isLoggedIn) {
      this.router.navigate(['/booking/my-bookings']);
    } else {
      this.openAuthModal('login');
    }
  }

  logout(): void {
    this.closeMobileMenu();
    this.currentUser = null;
    this.isLoggedIn = false;
    this.cdr.detectChanges();
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
