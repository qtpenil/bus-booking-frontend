import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

export interface CancelConfirmData {
  bookingId: number;
  bookingReference: string;
  seatsDisplay: string;
  totalAmount: number;
}

@Component({
  selector: 'app-cancel-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="cancel-dialog-container p-3">
      <!-- Icon Header -->
      <div class="text-center mb-3">
        <div class="icon-wrapper bg-danger bg-opacity-10 text-danger rounded-circle mx-auto d-flex align-items-center justify-content-center mb-2" style="width: 56px; height: 56px;">
          <mat-icon class="fs-2">warning_amber</mat-icon>
        </div>
        <h4 class="fw-bold text-dark mb-1">Cancel Booking?</h4>
        <p class="text-muted small mb-0">Please confirm if you want to cancel this ticket.</p>
      </div>

      <!-- Ticket Details Summary Card -->
      <div class="bg-light p-3 rounded-3 mb-3 border">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-muted small">PNR / Reference:</span>
          <strong class="font-monospace text-primary small">{{ data.bookingReference || ('BKG-' + data.bookingId) }}</strong>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-2" *ngIf="data.seatsDisplay">
          <span class="text-muted small">Seats:</span>
          <span class="badge bg-primary px-2 py-1">{{ data.seatsDisplay }}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center" *ngIf="data.totalAmount">
          <span class="text-muted small">Total Fare:</span>
          <strong class="text-success small">₹{{ data.totalAmount }}</strong>
        </div>
      </div>

      <!-- Warning Info Note -->
      <div class="alert alert-warning d-flex align-items-start p-2 mb-3 rounded-3 small">
        <mat-icon class="text-warning me-2 fs-5 flex-shrink-0 mt-1">info</mat-icon>
        <div>
          Cancelling this ticket will release your reserved seats immediately for other passengers.
        </div>
      </div>

      <!-- Dialog Action Buttons -->
      <div class="d-flex gap-2 justify-content-end">
        <button mat-stroked-button class="rounded-pill px-3" (click)="dialogRef.close(false)">
          Keep Ticket
        </button>
        <button mat-flat-button color="warn" class="rounded-pill px-3 bg-danger text-white" (click)="dialogRef.close(true)">
          <mat-icon class="me-1 fs-6">cancel</mat-icon> Yes, Cancel Ticket
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cancel-dialog-container {
      max-width: 440px;
    }
  `]
})
export class CancelConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CancelConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CancelConfirmData
  ) {}
}
