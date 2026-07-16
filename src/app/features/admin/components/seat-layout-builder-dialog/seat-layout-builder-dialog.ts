import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { FleetService } from '../../services/fleet.service';
import { SeatTemplateResponse, SeatTemplateRequest, SeatLayoutTemplateResponse, SeatType, DeckType } from '../../models/fleet.models';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-seat-layout-builder-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatCardModule,
    MatButtonModule, 
    MatIconModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  templateUrl: './seat-layout-builder-dialog.html',
  styleUrl: './seat-layout-builder-dialog.scss'
})
export class SeatLayoutBuilderDialog implements OnInit {
  private fb = inject(FormBuilder);
  private fleetService = inject(FleetService);
  private toast = inject(ToastService);

  seats: SeatTemplateResponse[] = [];
  isLoading = false;

  seatTypes = Object.values(SeatType);
  deckTypes = Object.values(DeckType);

  currentDeck: DeckType = DeckType.LOWER;

  seatForm: FormGroup = this.fb.group({
    seatNumber: ['', [Validators.required, Validators.maxLength(10)]],
    rowNo: [1, [Validators.required, Validators.min(1)]],
    columnNo: [1, [Validators.required, Validators.min(1)]],
    seatType: [SeatType.SEATER, Validators.required],
    deckType: [DeckType.LOWER, Validators.required]
  });

  constructor(
    public dialogRef: MatDialogRef<SeatLayoutBuilderDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { template: SeatLayoutTemplateResponse }
  ) {}

  ngOnInit(): void {
    this.loadSeats();
  }

  loadSeats(): void {
    this.isLoading = true;
    this.fleetService.getSeatsByTemplateId(this.data.template.id).subscribe({
      next: (seats) => {
        this.seats = seats;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Failed to load seats');
        this.isLoading = false;
      }
    });
  }

  get maxRow(): number {
    if (this.seats.length === 0) return 10;
    return Math.max(...this.seats.map(s => s.rowNo), 10);
  }

  get maxCol(): number {
    if (this.seats.length === 0) return 5;
    return Math.max(...this.seats.map(s => s.columnNo), 5);
  }

  getSeatsForGrid(deck: DeckType): (SeatTemplateResponse | null)[][] {
    const grid: (SeatTemplateResponse | null)[][] = [];
    const deckSeats = this.seats.filter(s => s.deckType === deck);
    
    for (let r = 1; r <= this.maxRow; r++) {
      const rowArr: (SeatTemplateResponse | null)[] = [];
      for (let c = 1; c <= this.maxCol; c++) {
        const seat = deckSeats.find(s => s.rowNo === r && s.columnNo === c);
        rowArr.push(seat || null);
      }
      grid.push(rowArr);
    }
    return grid;
  }

  addSeat(): void {
    if (this.seatForm.valid) {
      const request: SeatTemplateRequest = {
        ...this.seatForm.value,
        seatLayoutTemplateId: this.data.template.id
      };
      
      this.fleetService.createSeat(request).subscribe({
        next: (newSeat) => {
          this.toast.success(`Seat ${newSeat.seatNumber} added!`);
          this.seats = [...this.seats, newSeat];
          
          // Auto-increment row/col for convenience
          const currentCol = this.seatForm.get('columnNo')?.value;
          const currentRow = this.seatForm.get('rowNo')?.value;
          if (currentCol < this.maxCol) {
            this.seatForm.patchValue({ columnNo: currentCol + 1, seatNumber: '' });
          } else {
            this.seatForm.patchValue({ rowNo: currentRow + 1, columnNo: 1, seatNumber: '' });
          }
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to add seat');
        }
      });
    }
  }

  deleteSeat(seatId: number): void {
    this.fleetService.deleteSeat(seatId).subscribe({
      next: () => {
        this.toast.success('Seat removed');
        this.seats = this.seats.filter(s => s.id !== seatId);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to remove seat');
      }
    });
  }
}
