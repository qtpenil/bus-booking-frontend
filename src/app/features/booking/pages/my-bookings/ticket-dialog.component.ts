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
    <div class="ticket-dialog-container p-2 p-md-3">
      <!-- Printable Ticket Area -->
      <div id="printable-ticket" class="ticket-card p-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center pb-3 mb-4 border-card-bottom">
          <div class="d-flex align-items-center">
            <div class="bus-icon-wrap me-3 d-flex align-items-center justify-content-center">
              <mat-icon class="text-primary-blue fs-4">directions_bus</mat-icon>
            </div>
            <div>
              <h3 class="fw-bold mb-0 ticket-brand-title">Bus<span class="highlight-blue">Booking</span> Pass</h3>
              <small class="text-muted">Official Electronic Travel Pass</small>
            </div>
          </div>
          <div class="text-end">
            <span class="badge px-3 py-2 text-uppercase fs-6 status-pill" [ngClass]="{
              'status-confirmed': data.status === 'CONFIRMED',
              'status-pending': data.status === 'PENDING_PAYMENT' || data.status === 'PENDING',
              'status-cancelled': data.status === 'CANCELLED'
            }">{{ data.status }}</span>
          </div>
        </div>

        <!-- Reference & Journey Info (Top Info Box) -->
        <div class="journey-summary-box p-3 p-md-4 mb-4">
          <!-- Route line if available -->
          <div class="d-flex align-items-center flex-wrap gap-2 mb-3 pb-3 border-summary-bottom" *ngIf="hasRoute()">
            <span class="route-city fw-bold text-dark">{{ getRouteSource() }}</span>
            <mat-icon class="route-arrow text-primary-blue">trending_flat</mat-icon>
            <span class="route-city fw-bold text-dark">{{ getRouteDestination() }}</span>
          </div>

          <div class="row g-3 align-items-center">
            <div class="col-6 col-md-4">
              <span class="field-label d-block mb-1">PNR / Reference</span>
              <strong class="font-monospace fs-6 pnr-amber">{{ data.bookingReference || ('BKG-' + data.bookingId) }}</strong>
            </div>
            <div class="col-6 col-md-4">
              <span class="field-label d-block mb-1">Boarding Date & Time</span>
              <strong class="fs-6 text-dark-emphasis">{{ getBoardingDisplay() }}</strong>
            </div>
            <div class="col-12 col-md-4 text-md-end">
              <span class="field-label d-block mb-1">Total Fare Paid</span>
              <strong class="fare-amount">₹{{ data.totalAmount }}</strong>
            </div>
          </div>
        </div>

        <!-- Contact & Booking Time Info with Circular Tinted Icon Badges -->
        <div class="row g-3 mb-4">
          <div class="col-12 col-md-4" *ngIf="data.contactEmail">
            <div class="d-flex align-items-center">
              <span class="icon-badge-tint me-2">
                <mat-icon>email</mat-icon>
              </span>
              <div>
                <span class="text-muted small d-block">Contact Email:</span>
                <span class="fw-semibold small text-dark-emphasis text-truncate d-block">{{ data.contactEmail }}</span>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4" *ngIf="data.contactPhone">
            <div class="d-flex align-items-center">
              <span class="icon-badge-tint me-2">
                <mat-icon>phone</mat-icon>
              </span>
              <div>
                <span class="text-muted small d-block">Contact Phone:</span>
                <span class="fw-semibold small text-dark-emphasis">{{ data.contactPhone }}</span>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4 text-md-end" *ngIf="data.bookingDate">
            <div class="d-flex align-items-center justify-content-md-end">
              <span class="icon-badge-tint me-2">
                <mat-icon>history</mat-icon>
              </span>
              <div class="text-md-end">
                <span class="text-muted small d-block">Booked On:</span>
                <span class="fw-semibold small text-muted">{{ data.bookingDate | date:'medium' }}</span>
              </div>
            </div>
          </div>
        </div>

        <mat-divider class="my-4 border-card-divider"></mat-divider>

        <!-- Passengers & Seats Heading with Person Icon Badge -->
        <div class="passenger-section-wrapper mb-4">
          <h5 class="passenger-section-heading mb-3 d-flex align-items-center">
            <span class="icon-badge-tint me-2">
              <mat-icon>people</mat-icon>
            </span>
            <span>Passenger Details</span>
          </h5>

          <div class="table-responsive">
            <table class="table table-bordered align-middle light-passenger-table mb-0">
              <thead>
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
                  <td class="text-center text-muted fw-semibold">{{ i + 1 }}</td>
                  <td><span class="seat-badge-pill">{{ p.seatNumber || (data.seats ? data.seats[i] : 'N/A') }}</span></td>
                  <td class="fw-bold text-dark-emphasis">{{ p.firstName }} {{ p.lastName }}</td>
                  <td>{{ p.age }} yrs</td>
                  <td class="text-capitalize">{{ p.gender }}</td>
                </tr>
                <tr *ngIf="!data.passengers || data.passengers.length === 0">
                  <td colspan="5" class="text-center text-muted py-3">
                    Seats: <span class="fw-bold text-dark-emphasis">{{ data.seats ? data.seats.join(', ') : 'N/A' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer note -->
        <div class="ticket-info-note p-3 small d-flex align-items-center mt-4">
          <mat-icon class="me-2 text-primary-blue flex-shrink-0">info</mat-icon>
          <span>Please carry a valid government ID along with this e-ticket during travel. Have a safe journey!</span>
        </div>
      </div>

      <!-- Dialog Actions -->
      <div class="d-flex justify-content-between align-items-center mt-3 no-print">
        <div>
          <button *ngIf="data.status === 'CONFIRMED' || data.status === 'PENDING_PAYMENT'"
                  mat-button 
                  (click)="!isJourneyPassed(data.journeyDate) && cancelTicket()" 
                  class="ticket-cancel-btn"
                  [disabled]="isJourneyPassed(data.journeyDate)"
                  [title]="isJourneyPassed(data.journeyDate) ? 'Journey already completed' : 'Cancel Ticket'">
            <mat-icon class="me-1">cancel</mat-icon> Cancel Ticket
          </button>
        </div>
        <div class="d-flex gap-2">
          <button mat-button class="ticket-close-btn" (click)="dialogRef.close()">Close</button>
          <button mat-flat-button class="home-btn-primary" (click)="printTicket()">
            <mat-icon class="me-1">print</mat-icon> Print Pass
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticket-dialog-container {
      background: var(--color-surface-light, #ffffff);
      color: var(--color-text-dark, #0f172a);
      border-radius: 16px;
    }

    .ticket-card {
      background: var(--color-surface-light, #ffffff);
      border: 2px dashed #93c5fd !important;
      border-radius: 16px;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
    }

    .ticket-brand-title {
      color: var(--color-text-dark, #0f172a);
      letter-spacing: -0.5px;
    }

    .border-card-bottom {
      border-bottom: 1px solid var(--color-border-subtle, #e2e8f0);
    }

    .border-card-divider {
      border-color: var(--color-border-subtle, #e2e8f0) !important;
    }

    .bus-icon-wrap {
      width: 42px;
      height: 42px;
      background: var(--color-accent-tint, #eff6ff);
      border: 1px solid #dbeafe;
      border-radius: 50%;
    }

    .highlight-blue {
      color: var(--color-primary-blue, #2563eb);
    }

    .text-primary-blue {
      color: var(--color-primary-blue, #2563eb) !important;
    }

    .pnr-amber {
      color: #b45309;
      font-weight: 700;
    }

    .fare-amount {
      color: var(--color-text-dark, #0f172a);
      font-size: 1.45rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .field-label {
      color: var(--color-text-muted, #64748b);
      font-size: 0.74rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .journey-summary-box {
      background: var(--color-surface-muted, #f8fafc);
      border: 1px solid var(--color-border-subtle, #e2e8f0);
      border-radius: 12px;
    }

    .border-summary-bottom {
      border-bottom: 1px dashed var(--color-border-subtle, #cbd5e1);
    }

    .route-city {
      font-size: 1.12rem;
      letter-spacing: -0.3px;
    }

    .route-arrow {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Icon Badges (Circular Tinted) */
    .icon-badge-tint {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-accent-tint, #eff6ff);
      border: 1px solid #dbeafe;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
        color: var(--color-primary-blue, #2563eb);
        line-height: 15px;
      }
    }

    .passenger-section-heading {
      color: var(--color-text-dark, #0f172a);
      font-size: 1.12rem;
      font-weight: 700;
      letter-spacing: -0.2px;
    }

    .status-pill {
      border-radius: 9999px;
      font-weight: 700;
      font-size: 0.75rem !important;
      letter-spacing: 0.5px;
    }

    .status-confirmed {
      background: var(--color-status-available-bg, #ecfdf5) !important;
      border: 1px solid var(--color-status-available-border, #a7f3d0) !important;
      color: var(--color-status-available-text, #047857) !important;
    }

    .status-cancelled {
      background: #fef2f2 !important;
      border: 1px solid #fecaca !important;
      color: #dc2626 !important;
    }

    .status-pending {
      background: #fffbeb !important;
      border: 1px solid #fde68a !important;
      color: #b45309 !important;
    }

    .seat-badge-pill {
      background: var(--color-accent-tint, #eff6ff);
      border: 1px solid #dbeafe;
      color: var(--color-primary-blue, #2563eb);
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 6px;
      display: inline-block;
    }

    .light-passenger-table {
      border-color: var(--color-border-subtle, #e2e8f0);
      th {
        background: var(--color-surface-muted, #f8fafc);
        color: var(--color-text-muted, #64748b);
        font-size: 0.78rem;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.5px;
        border-color: var(--color-border-subtle, #e2e8f0);
        padding: 10px 14px;
      }
      td {
        color: var(--color-text-dark, #0f172a);
        border-color: var(--color-border-subtle, #e2e8f0);
        padding: 10px 14px;
      }
      tbody tr:nth-child(even) {
        background-color: var(--color-surface-muted, #f8fafc);
      }
      tbody tr:nth-child(odd) {
        background-color: #ffffff;
      }
    }

    .ticket-info-note {
      background: var(--color-accent-tint, #eff6ff);
      border: 1px solid #dbeafe;
      color: #1e40af;
      border-radius: 10px;
    }

    .home-btn-primary {
      background: var(--color-primary-blue, #2563eb) !important;
      color: #ffffff !important;
      border-radius: 10px !important;
      font-weight: 700;
      padding: 0 20px;
      height: 44px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25) !important;
      transition: all 0.2s;

      &:hover {
        background: var(--color-primary-blue-hover, #1d4ed8) !important;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35) !important;
      }
    }

    .ticket-cancel-btn {
      background: #ffffff !important;
      border: 1px solid #fca5a5 !important;
      color: #dc2626 !important;
      border-radius: 10px !important;
      font-weight: 600;
      height: 44px;
      padding: 0 16px;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #fef2f2 !important;
        border-color: #ef4444 !important;
      }

      &:disabled {
        background: var(--color-input-bg, #f1f5f9) !important;
        border-color: var(--color-border-subtle, #e2e8f0) !important;
        color: var(--color-text-muted, #94a3b8) !important;
        cursor: not-allowed;
        opacity: 0.65;
      }
    }

    .ticket-close-btn {
      color: var(--color-text-dark, #0f172a) !important;
      border: 1px solid var(--color-border-subtle, #e2e8f0) !important;
      background: #ffffff !important;
      border-radius: 10px !important;
      font-weight: 600;
      height: 44px;
      padding: 0 16px;
      transition: all 0.2s;

      &:hover {
        background: var(--color-input-bg, #f1f5f9) !important;
      }
    }

    /* Print-Specific Styles */
    @media print {
      .no-print,
      mat-dialog-actions,
      .cdk-overlay-backdrop {
        display: none !important;
      }

      body, html {
        background: #ffffff !important;
        color: #000000 !important;
      }

      .ticket-dialog-container {
        padding: 0 !important;
        margin: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }

      .ticket-card {
        border: 1px solid #94a3b8 !important;
        box-shadow: none !important;
        border-radius: 8px !important;
        background: #ffffff !important;
        color: #000000 !important;
        page-break-inside: avoid;
        width: 100% !important;
      }

      .journey-summary-box,
      .ticket-info-note {
        background: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
        color: #000000 !important;
      }

      .light-passenger-table {
        border: 1px solid #cbd5e1 !important;
        th {
          background: #f1f5f9 !important;
          color: #000000 !important;
          border: 1px solid #cbd5e1 !important;
        }
        td {
          border: 1px solid #cbd5e1 !important;
          color: #000000 !important;
        }
        tbody tr:nth-child(even) {
          background-color: #f8fafc !important;
        }
      }

      .text-dark-emphasis,
      .ticket-brand-title,
      .fare-amount {
        color: #000000 !important;
      }

      .text-muted {
        color: #475569 !important;
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

  getBoardingDisplay(): string {
    if (this.data.boardingTime) {
      const d = new Date(this.data.boardingTime);
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${dateStr} (${timeStr})`;
    }
    const dateStr = this.data.journeyDate ? new Date(this.data.journeyDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Scheduled';
    const timeStr = this.data.departureTime ? this.data.departureTime.substring(0, 5) : 'TBD';
    return `${dateStr} (${timeStr})`;
  }

  getRouteSource(): string {
    if (this.data.sourceCityName) return this.data.sourceCityName;
    if (this.data.boardingStopName) return this.data.boardingStopName;
    if (this.data.routeName && this.data.routeName.includes(' to ')) {
      return this.data.routeName.split(' to ')[0].trim();
    }
    if (this.data.routeName && this.data.routeName.includes(' - ')) {
      return this.data.routeName.split(' - ')[0].trim();
    }
    return '';
  }

  getRouteDestination(): string {
    if (this.data.destinationCityName) return this.data.destinationCityName;
    if (this.data.droppingStopName) return this.data.droppingStopName;
    if (this.data.routeName && this.data.routeName.includes(' to ')) {
      return this.data.routeName.split(' to ')[1].trim();
    }
    if (this.data.routeName && this.data.routeName.includes(' - ')) {
      return this.data.routeName.split(' - ')[1].trim();
    }
    return '';
  }

  hasRoute(): boolean {
    return !!(this.getRouteSource() && this.getRouteDestination());
  }

  isJourneyPassed(journeyDate?: string): boolean {
    if (!journeyDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jDate = new Date(journeyDate);
    jDate.setHours(0, 0, 0, 0);
    return jDate.getTime() < today.getTime();
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
