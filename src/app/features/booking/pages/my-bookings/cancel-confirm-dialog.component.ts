import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

export interface CancelConfirmPassenger {
  scheduleSeatId?: number;
  bookingSeatId?: number;
  seatNumber: string;
  firstName: string;
  lastName: string;
  age?: number;
  gender?: string;
  fare?: number;
  status?: string; // 'CONFIRMED' | 'CANCELLED'
}

export interface CancelConfirmData {
  bookingId: number;
  bookingReference: string;
  passengers?: CancelConfirmPassenger[];
  seatsDisplay?: string;
  totalAmount?: number;
  sourceCityName?: string;
  destinationCityName?: string;
}

export interface CancelConfirmResult {
  confirmed: boolean;
  selectedSeatIds: number[];
  isAllSelected: boolean;
  refundAmount: number;
}

@Component({
  selector: 'app-cancel-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatCheckboxModule,
    FormsModule
  ],
  template: `
    <div class="cancel-dialog-container p-3">
      <!-- Icon Header -->
      <div class="text-center mb-3">
        <div class="icon-wrapper mx-auto d-flex align-items-center justify-content-center mb-2">
          <mat-icon class="fs-2 text-danger-icon">warning_amber</mat-icon>
        </div>
        <h4 class="fw-bold text-dark-emphasis mb-1">
          {{ hasMultipleSeats ? 'Cancel Seats / Ticket' : 'Cancel Ticket?' }}
        </h4>
        <p class="text-muted small mb-0">
          {{ hasMultipleSeats 
            ? 'Select the specific passengers/seats you wish to cancel.' 
            : 'Please confirm if you want to cancel this booking.' }}
        </p>
      </div>

      <!-- Ticket & Route Summary Card -->
      <div class="summary-box p-3 mb-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-muted small">PNR / Reference:</span>
          <strong class="font-monospace pnr-amber small">{{ data.bookingReference || ('BKG-' + data.bookingId) }}</strong>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-2" *ngIf="data.sourceCityName && data.destinationCityName">
          <span class="text-muted small">Route:</span>
          <strong class="text-dark-emphasis small">{{ data.sourceCityName }} → {{ data.destinationCityName }}</strong>
        </div>
        <div class="d-flex justify-content-between align-items-center" *ngIf="data.totalAmount">
          <span class="text-muted small">Total Ticket Fare:</span>
          <strong class="text-dark-emphasis small">₹{{ data.totalAmount }}</strong>
        </div>
      </div>

      <!-- Multi-Seat Passenger Selection Table -->
      <div *ngIf="hasMultipleSeats" class="seat-selection-box mb-3">
        <div class="d-flex justify-content-between align-items-center px-2 py-2 bg-light rounded-top border-bottom">
          <mat-checkbox 
            [checked]="isAllSelected" 
            [indeterminate]="isPartiallySelected" 
            (change)="toggleSelectAll($event.checked)"
            color="warn">
            <span class="fw-bold text-dark-emphasis small">Select All Active Seats ({{ activePassengers.length }})</span>
          </mat-checkbox>
          <span class="text-muted small">{{ selectedSeatIds.length }} selected</span>
        </div>

        <div class="passenger-list-container">
          <div *ngFor="let p of passengersList" class="passenger-row d-flex align-items-center justify-content-between p-2 border-bottom"
               [class.passenger-cancelled]="p.status === 'CANCELLED'">
            <div class="d-flex align-items-center gap-2">
              <mat-checkbox 
                *ngIf="p.status !== 'CANCELLED'"
                [checked]="isSeatSelected(p)"
                (change)="toggleSeat(p, $event.checked)"
                color="warn">
              </mat-checkbox>
              <mat-icon *ngIf="p.status === 'CANCELLED'" class="text-muted fs-5 align-middle me-1">block</mat-icon>

              <div>
                <span class="seat-pill me-2">{{ p.seatNumber }}</span>
                <span class="fw-semibold text-dark-emphasis small">{{ p.firstName }} {{ p.lastName }}</span>
                <span class="text-muted small ms-1" *ngIf="p.age">({{ p.age }} yrs<span *ngIf="p.gender">, {{ p.gender }}</span>)</span>
              </div>
            </div>

            <div class="text-end">
              <span class="fw-bold small text-dark-emphasis" *ngIf="p.status !== 'CANCELLED'">₹{{ getPassengerFare(p) }}</span>
              <span class="badge bg-danger-subtle text-danger px-2 py-1 small fw-bold" *ngIf="p.status === 'CANCELLED'">Already Cancelled</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dynamic Cancellation Summary Note -->
      <div class="light-warning-note p-3 mb-3 small">
        <div class="d-flex align-items-start mb-2">
          <mat-icon class="text-warning-icon me-2 fs-5 flex-shrink-0 mt-0">info</mat-icon>
          <div class="text-warning-text flex-grow-1">
            <span *ngIf="selectedSeatIds.length === 0" class="text-danger fw-bold">
              Please select at least 1 seat above to proceed with cancellation.
            </span>
            <span *ngIf="selectedSeatIds.length > 0 && !isAllSelected">
              You are cancelling <strong>{{ selectedSeatIds.length }} seat(s)</strong>. Remaining <strong>{{ remainingCount }} seat(s)</strong> will stay active and confirmed for travel.
            </span>
            <span *ngIf="selectedSeatIds.length > 0 && isAllSelected">
              You are cancelling <strong>all remaining seats</strong>. The entire ticket will be cancelled.
            </span>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center pt-2 border-top border-warning-subtle" *ngIf="selectedSeatIds.length > 0">
          <span class="text-muted fw-semibold">Estimated Refund Amount:</span>
          <strong class="fs-6 text-success">₹{{ calculatedRefund }}</strong>
        </div>
      </div>

      <!-- Dialog Action Buttons -->
      <div class="d-flex gap-2 justify-content-end">
        <button mat-button class="btn-keep-ticket" (click)="dialogRef.close(null)">
          Keep Ticket
        </button>
        <button mat-flat-button 
                class="danger-cancel-btn" 
                [disabled]="selectedSeatIds.length === 0"
                (click)="confirmCancellation()">
          <mat-icon class="me-1 fs-6">cancel</mat-icon> 
          {{ getConfirmButtonText() }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-height: 90vh;
      overflow-y: auto;
    }

    .cancel-dialog-container {
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      background: var(--color-surface-light, #ffffff);
      color: var(--color-text-dark, #0f172a);
      border-radius: 16px;
      box-sizing: border-box;
    }

    .icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .text-danger-icon {
      color: #dc2626 !important;
    }

    .summary-box {
      background: var(--color-surface-muted, #f8fafc);
      border: 1px solid var(--color-border-subtle, #e2e8f0);
      border-radius: 12px;
    }

    .pnr-amber {
      color: #b45309;
      font-weight: 700;
    }

    .seat-selection-box {
      border: 1px solid var(--color-border-subtle, #e2e8f0);
      border-radius: 12px;
      overflow: hidden;
    }

    .passenger-list-container {
      max-height: 220px;
      overflow-y: auto;
    }

    .passenger-row {
      transition: background-color 0.15s ease;

      &:hover:not(.passenger-cancelled) {
        background-color: var(--color-surface-muted, #f8fafc);
      }

      &.passenger-cancelled {
        background-color: #fafafa;
        opacity: 0.65;
      }
    }

    .seat-pill {
      background: var(--color-accent-tint, #eff6ff);
      border: 1px solid #dbeafe;
      color: var(--color-primary-blue, #2563eb);
      font-weight: 700;
      padding: 1px 8px;
      border-radius: 6px;
      font-size: 0.78rem;
    }

    .light-warning-note {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
    }

    .text-warning-icon {
      color: #b45309 !important;
    }

    .text-warning-text {
      color: #92400e !important;
      font-weight: 500;
    }

    .btn-keep-ticket {
      color: var(--color-text-dark, #0f172a) !important;
      border: 1px solid var(--color-border-subtle, #e2e8f0) !important;
      background: #ffffff !important;
      border-radius: 10px !important;
      font-weight: 600;
      height: 42px;
      padding: 0 16px;

      &:hover {
        background: var(--color-input-bg, #f1f5f9) !important;
      }
    }

    .danger-cancel-btn {
      background: #dc2626 !important;
      color: #ffffff !important;
      border-radius: 10px !important;
      font-weight: 700;
      height: 42px;
      padding: 0 18px;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25) !important;

      &:hover:not(:disabled) {
        background: #b91c1c !important;
        box-shadow: 0 6px 16px rgba(220, 38, 38, 0.35) !important;
      }

      &:disabled {
        background: #f1f5f9 !important;
        color: #94a3b8 !important;
        box-shadow: none !important;
        cursor: not-allowed;
      }
    }
  `]
})
export class CancelConfirmDialogComponent implements OnInit {
  selectedSeatIds: number[] = [];

  constructor(
    public dialogRef: MatDialogRef<CancelConfirmDialogComponent, CancelConfirmResult | null>,
    @Inject(MAT_DIALOG_DATA) public data: CancelConfirmData
  ) {}

  ngOnInit(): void {
    // If only 1 active passenger, pre-select it
    if (this.activePassengers.length === 1) {
      const seatId = this.getSeatIdentifier(this.activePassengers[0]);
      if (seatId != null) {
        this.selectedSeatIds = [seatId];
      }
    } else if (this.activePassengers.length > 1) {
      // By default for multi-seat, let user choose, or if legacy data, select all
      if (!this.data.passengers || this.data.passengers.length === 0) {
        this.selectedSeatIds = [1];
      }
    }
  }

  get passengersList(): CancelConfirmPassenger[] {
    return this.data.passengers || [];
  }

  get activePassengers(): CancelConfirmPassenger[] {
    return this.passengersList.filter(p => p.status !== 'CANCELLED');
  }

  get hasMultipleSeats(): boolean {
    return this.passengersList.length > 1;
  }

  get isAllSelected(): boolean {
    return this.activePassengers.length > 0 && this.selectedSeatIds.length === this.activePassengers.length;
  }

  get isPartiallySelected(): boolean {
    return this.selectedSeatIds.length > 0 && !this.isAllSelected;
  }

  get remainingCount(): number {
    return Math.max(0, this.activePassengers.length - this.selectedSeatIds.length);
  }

  get calculatedRefund(): number {
    if (this.selectedSeatIds.length === 0) {
      return 0;
    }
    if (this.isAllSelected && this.data.totalAmount) {
      return this.data.totalAmount;
    }

    let sum = 0;
    for (const p of this.activePassengers) {
      const id = this.getSeatIdentifier(p);
      if (id != null && this.selectedSeatIds.includes(id)) {
        sum += this.getPassengerFare(p);
      }
    }
    return sum;
  }

  getPassengerFare(p: CancelConfirmPassenger): number {
    if (p.fare != null && p.fare > 0) {
      return p.fare;
    }
    if (this.data.totalAmount && this.activePassengers.length > 0) {
      return Math.round(this.data.totalAmount / this.activePassengers.length);
    }
    return 0;
  }

  getSeatIdentifier(p: CancelConfirmPassenger): number | null {
    if (p.scheduleSeatId != null) return p.scheduleSeatId;
    if (p.bookingSeatId != null) return p.bookingSeatId;
    return null;
  }

  isSeatSelected(p: CancelConfirmPassenger): boolean {
    const id = this.getSeatIdentifier(p);
    return id != null && this.selectedSeatIds.includes(id);
  }

  toggleSeat(p: CancelConfirmPassenger, checked: boolean): void {
    const id = this.getSeatIdentifier(p);
    if (id == null) return;

    if (checked) {
      if (!this.selectedSeatIds.includes(id)) {
        this.selectedSeatIds.push(id);
      }
    } else {
      this.selectedSeatIds = this.selectedSeatIds.filter(sId => sId !== id);
    }
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.selectedSeatIds = this.activePassengers
        .map(p => this.getSeatIdentifier(p))
        .filter((id): id is number => id != null);
    } else {
      this.selectedSeatIds = [];
    }
  }

  getConfirmButtonText(): string {
    if (this.selectedSeatIds.length === 0) {
      return 'Select Seats to Cancel';
    }
    if (this.isAllSelected || this.activePassengers.length <= 1) {
      return `Cancel Entire Ticket (Refund: ₹${this.calculatedRefund})`;
    }
    return `Cancel ${this.selectedSeatIds.length} Seat(s) (Refund: ₹${this.calculatedRefund})`;
  }

  confirmCancellation(): void {
    if (this.selectedSeatIds.length === 0) return;

    this.dialogRef.close({
      confirmed: true,
      selectedSeatIds: this.selectedSeatIds,
      isAllSelected: this.isAllSelected,
      refundAmount: this.calculatedRefund
    });
  }
}
