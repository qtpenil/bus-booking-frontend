import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  selectedPortal: 'USER' | 'ADMIN' = 'USER';

  selectPortal(portal: 'USER' | 'ADMIN') {
    this.selectedPortal = portal;
  }


  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });
  
  hidePassword = true;
  isLoading = false;

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.cdr.detectChanges();
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.toast.success('Login successful!');
          
          const userJson = localStorage.getItem('current_user');
          if (userJson) {
            const user = JSON.parse(userJson);
            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
              this.router.navigate(['/admin/cities']);
              return;
            }
          }
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Login failed. Please check your credentials.');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        complete: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }
}
