import { Component, inject, ChangeDetectorRef, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../features/auth/services/auth.service';
import { ToastService } from '../../services/toast.service';

export interface AuthModalData {
  initialMode?: 'login' | 'register';
  message?: string;
}

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule
  ],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss'
})
export class AuthModalComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  activeMode: 'login' | 'register' = 'login';
  message = '';
  selectedPortal: 'USER' | 'ADMIN' = 'USER';
  hidePassword = true;
  isLoading = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9+]+$')]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(
    @Optional() public dialogRef: MatDialogRef<AuthModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: AuthModalData
  ) {
    if (data) {
      if (data.initialMode) {
        this.activeMode = data.initialMode;
      }
      if (data.message) {
        this.message = data.message;
      }
    }
  }

  setMode(mode: 'login' | 'register') {
    this.activeMode = mode;
    this.cdr.detectChanges();
  }

  selectPortal(portal: 'USER' | 'ADMIN') {
    this.selectedPortal = portal;
  }

  onLoginSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.toast.success('Login successful!');
        this.isLoading = false;
        if (this.dialogRef) {
          this.dialogRef.close(true);
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Login failed. Check your credentials.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onRegisterSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.toast.success('Account created successfully!');
        this.isLoading = false;
        if (this.dialogRef) {
          this.dialogRef.close(true);
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Registration failed.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeModal() {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    }
  }
}
