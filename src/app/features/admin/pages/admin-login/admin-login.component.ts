import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { RoleType } from '../../../../core/enums/role-type.enum';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  hidePassword = true;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    // If already logged in as Admin, redirect directly to dashboard
    const user = this.authService.getCurrentUser();
    if (user && (user.role === RoleType.ADMIN || user.role === RoleType.SUPER_ADMIN)) {
      this.router.navigate(['/admin/cities']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        const user = this.authService.getCurrentUser();
        if (user && (user.role === RoleType.ADMIN || user.role === RoleType.SUPER_ADMIN)) {
          this.toast.success('Welcome to Admin Portal!');
          this.router.navigate(['/admin/cities']);
        } else {
          // Logged in user does NOT have admin role
          this.authService.logout();
          this.errorMessage = 'Access Denied: This portal requires administrator privileges.';
          this.toast.error(this.errorMessage);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Login failed. Invalid administrator credentials.';
        this.toast.error(this.errorMessage);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}