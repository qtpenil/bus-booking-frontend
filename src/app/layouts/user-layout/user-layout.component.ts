import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthService, UserPayload } from '../../features/auth/services/auth.service';
import { AuthModalComponent } from '../../shared/components/auth-modal/auth-modal.component';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    CommonModule
  ],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
export class UserLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  currentUser: UserPayload | null = null;
  isLoggedIn = false;
  isHomePage = false;

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });

    this.checkIsHomePage(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      this.checkIsHomePage(event.urlAfterRedirects || event.url);
    });
  }

  private checkIsHomePage(url: string): void {
    const cleanUrl = url ? url.split('?')[0] : '';
    this.isHomePage = cleanUrl === '/' || cleanUrl === '/home';
  }

  openAuthModal(initialMode: 'login' | 'register' = 'login'): void {
    this.dialog.open(AuthModalComponent, {
      panelClass: 'auth-modal-pane',
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
    if (this.isLoggedIn) {
      this.router.navigate(['/booking/my-bookings']);
    } else {
      this.openAuthModal('login');
    }
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


