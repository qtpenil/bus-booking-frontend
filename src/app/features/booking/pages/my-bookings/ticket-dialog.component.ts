import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookingResponse } from '../../models/booking.models';
import { BookingService } from '../../services/booking.service';
import { CancelConfirmDialogComponent } from './cancel-confirm-dialog.component';

@Component({
  selector: 'app-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="ticket-dialog-container p-3">
      <!-- Printable Ticket Area -->
      <div id="printable-ticket" class="ticket-card bg-white border rounded-3 p-4 shadow-sm">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
          <div class="d-flex align-items-center">
            <mat-icon class="text-primary me-2 fs-1">directions_bus</mat-icon>
            <div>
              <h3 class="fw-bold mb-0 text-primary">BusBooking E-Ticket</h3>
              <small class="text-muted">Official Travel Pass</small>
            </div>
          </div>
          <div class="text-end">
            <span class="badge px-3 py-2 text-uppercase fs-6" [ngClass]="{
              'bg-success': data.status === 'CONFIRMED',
              'bg-warning text-dark': data.status === 'PENDING_PAYMENT' || data.status === 'PENDING',
              'bg-danger': data.status === 'CANCELLED'
            }">{{ data.status }}</span>
          </div>
        </div>

        <!-- Reference & Journey Info -->
        <div class="row g-3 mb-3 bg-light p-3 rounded-3 align-items-center">
          <div class="col-6 col-md-4">
            <span class="text-muted small d-block">PNR / Reference</span>
            <strong class="font-monospace fs-6 text-primary">{{ data.bookingReference || ('BKG-' + data.bookingId) }}</strong>
          </div>
          <div class="col-6 col-md-4">
            <span class="text-muted small d-block">Journey Date & Time</span>
            <strong class="fs-6 text-dark">{{ data.journeyDate ? (data.journeyDate | date:'mediumDate') : 'Scheduled' }} ({{ data.departureTime || 'TBD' }})</strong>
          </div>
          <div class="col-12 col-md-4 text-md-end">
            <span class="text-muted small d-block">Total Fare Paid</span>
            <strong class="fs-5 text-success">₹{{ data.totalAmount }}</strong>
          </div>
        </div>

        <!-- Contact & Booking Time Info -->
        <div class="row g-2 mb-3">
          <div class="col-12 col-md-4" *ngIf="data.contactEmail">
            <span class="text-muted small d-block"><mat-icon class="align-middle fs-6 me-1">email</mat-icon> Email:</span>
            <span class="fw-semibold small text-truncate d-block">{{ data.contactEmail }}</span>
          </div>
          <div class="col-12 col-md-4" *ngIf="data.contactPhone">
            <span class="text-muted small d-block"><mat-icon class="align-middle fs-6 me-1">phone</mat-icon> Contact Phone:</span>
            <span class="fw-semibold small">{{ data.contactPhone }}</span>
          </div>
          <div class="col-12 col-md-4 text-md-end" *ngIf="data.bookingDate">
            <span class="text-muted small d-block"><mat-icon class="align-middle fs-6 me-1">event</mat-icon> Booked On:</span>
            <span class="fw-semibold small text-muted">{{ data.bookingDate | date:'medium' }}</span>
          </div>
        </div>

        <mat-divider class="my-3"></mat-divider>

        <!-- Passengers & Seats -->
        <h5 class="fw-bold mb-3 d-flex align-items-center text-dark">
          <mat-icon class="me-2 text-primary">people</mat-icon> Passenger Details
        </h5>

        <div class="table-responsive mb-3">
          <table class="table table-bordered align-middle">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Seat No</th>
                <th>Passenger Name</th>
                <th>Age</th>
                <th>Gender</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of data.passengers; let i = index">
                <td>{{ i + 1 }}</td>
                <td><span class="badge bg-primary px-2 py-1">{{ p.seatNumber || (data.seats ? data.seats[i] : 'N/A') }}</span></td>
                <td class="fw-bold">{{ p.firstName }} {{ p.lastName }}</td>
                <td>{{ p.age }} yrs</td>
                <td class="text-capitalize">{{ p.gender }}</td>
              </tr>
              <tr *ngIf="!data.passengers || data.passengers.length === 0">
                <td colspan="5" class="text-center text-muted py-3">
                  Seats: <span class="fw-bold text-dark">{{ data.seats ? data.seats.join(', ') : 'N/A' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer note -->
        <div class="bg-light p-3 rounded-3 text-muted small d-flex align-items-center">
          <mat-icon class="me-2 text-info">info</mat-icon>
          <span>Please carry a valid government ID along with this e-ticket during travel. Have a safe journey!</span>
        </div>
      </div>

      <!-- Dialog Actions -->
      <div class="d-flex justify-content-between align-items-center mt-3 no-print">
        <button mat-stroked-button color="warn" (click)="cancelTicket()" class="text-danger border-danger">
          <mat-icon class="me-1">cancel</mat-icon> Cancel Ticket
        </button>
        <div class="d-flex gap-2">
          <button mat-button (click)="dialogRef.close()">Close</button>
          <button mat-raised-button color="primary" (click)="printTicket()">
            <mat-icon class="me-1">print</mat-icon> Print Ticket
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticket-card {
      border: 2px dashed #3b82f6 !important;
    }
    @media print {
      .no-print {
        display: none !important;
      }
    }
  `]
})
export class TicketDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BookingResponse,
    private bookingService: BookingService,
    private confirmDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  printTicket(): void {
    window.print();
  }

  cancelTicket(): void {
    const pnr = this.data.bookingReference || ('BKG-' + this.data.bookingId);
    const seatsStr = this.data.seats ? this.data.seats.join(', ') : 'Reserved Seat';

    const confirmRef = this.confirmDialog.open(CancelConfirmDialogComponent, {
      width: '440px',
      data: {
        bookingId: this.data.bookingId,
        bookingReference: pnr,
        seatsDisplay: seatsStr,
        totalAmount: this.data.totalAmount
      }
    });

    confirmRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.bookingService.cancelBooking(this.data.bookingId).subscribe({
          next: () => {
            this.snackBar.open(`Ticket ${pnr} cancelled successfully. Seats released!`, 'Dismiss', {
              duration: 4000,
              horizontalPosition: 'end',
              verticalPosition: 'bottom'
            });
            this.dialogRef.close('cancelled');
          },
          error: (err: any) => {
            const msg = err.error?.message || 'Server error';
            this.snackBar.open(`Failed to cancel ticket: ${msg}`, 'Close', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'bottom'
            });
          }
        });
      }
    });
  }
}
