import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookingService } from '../../services/booking.service';
import { TicketDialogComponent } from './ticket-dialog.component';
import { CancelConfirmDialogComponent } from './cancel-confirm-dialog.component';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.scss'
})
export class MyBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  allBookings: any[] = [];
  activeTab: 'CONFIRMED' | 'CANCELLED' | 'ALL' = 'CONFIRMED';
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.fetchBookings();
  }

  fetchBookings(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.bookingService.getMyBookings().subscribe({
      next: (list) => {
        console.log('Fetched My Bookings:', list);
        this.allBookings = Array.isArray(list) ? list : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching bookings:', err);
        this.errorMessage = 'Failed to load your tickets. Please check backend booking-service and api-gateway.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredTickets(): any[] {
    if (this.activeTab === 'CONFIRMED') {
      return this.allBookings.filter(b => b && b.status && b.status.toString().toUpperCase() === 'CONFIRMED');
    }
    if (this.activeTab === 'CANCELLED') {
      return this.allBookings.filter(b => b && b.status && b.status.toString().toUpperCase() === 'CANCELLED');
    }
    return this.allBookings;
  }

  get confirmedCount(): number {
    return this.allBookings.filter(b => b && b.status && b.status.toString().toUpperCase() === 'CONFIRMED').length;
  }

  get cancelledCount(): number {
    return this.allBookings.filter(b => b && b.status && b.status.toString().toUpperCase() === 'CANCELLED').length;
  }

  fetchConfirmedTickets(): void {
    this.fetchBookings();
  }

  isJourneyPassed(journeyDate?: string): boolean {
    if (!journeyDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jDate = new Date(journeyDate);
    jDate.setHours(0, 0, 0, 0);
    return jDate.getTime() < today.getTime();
  }

  getEmptyStateMessage(): string {
    if (this.activeTab === 'CONFIRMED') {
      return 'No confirmed tickets found.';
    }
    if (this.activeTab === 'CANCELLED') {
      return 'No cancelled tickets yet.';
    }
    return 'You do not have any bus bookings yet.';
  }

  openTicketDetails(ticket: any): void {
    const dialogRef = this.dialog.open(TicketDialogComponent, {
      width: '680px',
      data: ticket,
      panelClass: 'ticket-modal-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'cancelled') {
        this.fetchConfirmedTickets();
      }
    });
  }

  cancelTicket(ticket: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const pnr = ticket.bookingReference || ('BKG-' + ticket.bookingId);
    const seatsDisplay = this.getSeatsDisplay(ticket);

    const dialogRef = this.dialog.open(CancelConfirmDialogComponent, {
      width: '440px',
      data: {
        bookingId: ticket.bookingId,
        bookingReference: pnr,
        seatsDisplay: seatsDisplay,
        totalAmount: ticket.totalAmount
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.cdr.detectChanges();

        this.bookingService.cancelBooking(ticket.bookingId).subscribe({
          next: () => {
            this.snackBar.open(`Ticket ${pnr} cancelled successfully. Seats released!`, 'Dismiss', {
              duration: 4000,
              horizontalPosition: 'end',
              verticalPosition: 'bottom'
            });
            this.fetchConfirmedTickets();
          },
          error: (err) => {
            console.error('Error cancelling ticket:', err);
            const msg = err.error?.message || 'Failed to cancel ticket.';
            this.snackBar.open(`Cancellation failed: ${msg}`, 'Close', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'bottom'
            });
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  getSeatsDisplay(ticket: any): string {
    if (ticket.seats && ticket.seats.length > 0) {
      return ticket.seats.join(', ');
    }
    if (ticket.passengers && ticket.passengers.length > 0) {
      return ticket.passengers.map((p: any) => p.seatNumber || 'Seat #1').join(', ');
    }
    return 'Reserved Seat';
  }

  getDepartureTimeDisplay(ticket: any): string {
    if (ticket.boardingTime) {
      const date = new Date(ticket.boardingTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (ticket.departureTime) {
      return ticket.departureTime.substring(0, 5);
    }
    return 'TBD';
  }

  getPassengerNames(ticket: any): string {
    if (ticket.passengers && ticket.passengers.length > 0) {
      return ticket.passengers.map((p: any) => `${p.firstName} ${p.lastName}`.trim()).join(', ');
    }
    return 'Passenger';
  }

  getRouteSource(ticket: any): string {
    if (ticket.sourceCityName) return ticket.sourceCityName;
    if (ticket.sourceCity) return ticket.sourceCity;
    if (ticket.fromCity) return ticket.fromCity;
    if (ticket.routeName && ticket.routeName.includes(' to ')) {
      return ticket.routeName.split(' to ')[0].trim();
    }
    if (ticket.routeName && ticket.routeName.includes(' - ')) {
      return ticket.routeName.split(' - ')[0].trim();
    }
    return '';
  }

  getRouteDestination(ticket: any): string {
    if (ticket.destinationCityName) return ticket.destinationCityName;
    if (ticket.destinationCity) return ticket.destinationCity;
    if (ticket.toCity) return ticket.toCity;
    if (ticket.routeName && ticket.routeName.includes(' to ')) {
      return ticket.routeName.split(' to ')[1].trim();
    }
    if (ticket.routeName && ticket.routeName.includes(' - ')) {
      return ticket.routeName.split(' - ')[1].trim();
    }
    return '';
  }

  getRouteDisplay(ticket: any): boolean {
    return !!(this.getRouteSource(ticket) && this.getRouteDestination(ticket));
  }
}
