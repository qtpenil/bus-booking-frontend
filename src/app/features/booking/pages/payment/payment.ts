import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { BookingService } from '../../services/booking.service';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './payment.html',
  styleUrl: './payment.scss'
})
export class PaymentComponent implements OnInit {
  bookingId!: number;
  bookingDetails: any;
  isLoading = true;
  isProcessing = false;
  selectedPaymentMethod: string = 'CREDIT_CARD';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.bookingId = Number(params['bookingId']);
      if (!this.bookingId) {
        this.snackBar.open('Invalid booking ID.', 'Close', { duration: 3000 });
        this.router.navigate(['/home']);
        return;
      }
      this.loadBooking();
    });
  }

  loadBooking() {
    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (data) => {
        console.log('Payment API loadBooking data:', data);
        this.bookingDetails = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        
        if (this.bookingDetails?.status !== 'PENDING_PAYMENT') {
           this.snackBar.open('This booking is not pending payment.', 'Close', { duration: 3000 });
           this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.snackBar.open('Failed to load booking details.', 'Close', { duration: 3000 });
        this.router.navigate(['/home']);
      }
    });
  }

  selectMethod(method: string) {
    this.selectedPaymentMethod = method;
  }

  processPayment() {
    this.isProcessing = true;
    
    this.paymentService.makePayment({
      bookingId: this.bookingId,
      paymentMethod: this.selectedPaymentMethod
    }).subscribe({
      next: (res) => {
        this.snackBar.open('Payment successful!', 'Close', { duration: 3000 });
        this.router.navigate(['/booking/success'], {
          queryParams: { bookingId: this.bookingId }
        });
      },
      error: (err) => {
        console.error('Payment API makePayment error:', err);
        this.isProcessing = false;
        this.cdr.detectChanges();
        this.snackBar.open(err.error?.message || 'Payment failed. Please try again.', 'Close', { duration: 4000 });
      }
    });
  }
}
