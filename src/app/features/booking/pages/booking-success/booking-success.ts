import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './booking-success.html',
  styleUrl: './booking-success.scss'
})
export class BookingSuccessComponent implements OnInit {
  bookingId!: number;
  bookingDetails: any;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
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
        console.log('Success API loadBooking data:', data);
        this.bookingDetails = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        
        if (this.bookingDetails?.status !== 'CONFIRMED') {
           this.snackBar.open('Warning: This booking is not confirmed.', 'Close', { duration: 4000 });
        }
      },
      error: (err) => {
        this.snackBar.open('Failed to load booking details.', 'Close', { duration: 3000 });
        this.router.navigate(['/home']);
      }
    });
  }

  printTicket() {
    window.print();
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
