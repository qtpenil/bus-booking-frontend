import { Component, Inject, OnInit, inject, ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FleetService } from '../../services/fleet.service';
import { SeatTemplateResponse, SeatTemplateRequest, SeatLayoutTemplateResponse, SeatType, DeckType } from '../../models/fleet.models';
import { ToastService } from '../../../../shared/services/toast.service';

// ── Inline pipe: filter seats by deck ──────────────────────────────────────
@Pipe({ name: 'seatDeckFilter', standalone: true, pure: false })
export class SeatDeckFilterPipe implements PipeTransform {
  transform(seats: SeatTemplateResponse[], deck: string): SeatTemplateResponse[] {
    if (!seats) return [];
    return seats.filter(s => s.deckType === deck);
  }
}

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
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    SeatDeckFilterPipe
  ],
  templateUrl: './seat-layout-builder-dialog.html',
  styleUrl: './seat-layout-builder-dialog.scss'
})
export class SeatLayoutBuilderDialog implements OnInit {
  private fb = inject(FormBuilder);
  private fleetService = inject(FleetService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  seats: SeatTemplateResponse[] = [];
  isLoading = false;
  isSubmitting = false;

  seatTypes = Object.values(SeatType);
  deckTypes = Object.values(DeckType);

  currentDeck: DeckType = DeckType.LOWER;

  // Grid layout state (per deck)
  private gridCache: Map<string, { style: { [key: string]: string }; aisleAfterCol: number; maxCol: number }> = new Map();

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
        this.seats = [...seats];
        this.gridCache.clear();
        this.isLoading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load seats');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getSeatsCountByDeck(deck: DeckType | string): number {
    return this.seats.filter(s => s.deckType === deck).length;
  }

  // ── Grid layout computation (mirrors customer-facing computeGridLayout) ──

  private computeGridForDeck(deck: string): { style: { [key: string]: string }; aisleAfterCol: number; maxCol: number } {
    const deckSeats = this.seats.filter(s => s.deckType === deck);
    if (!deckSeats.length) {
      return { style: {}, aisleAfterCol: 0, maxCol: 0 };
    }

    // Group by row
    const rowMap = new Map<number, SeatTemplateResponse[]>();
    deckSeats.forEach(s => {
      if (!rowMap.has(s.rowNo)) rowMap.set(s.rowNo, []);
      rowMap.get(s.rowNo)!.push(s);
    });

    const rowCounts = Array.from(rowMap.values()).map(r => r.length);
    const minSeatsInRow = Math.min(...rowCounts);

    let regularMaxCol = 0;
    rowMap.forEach((seatsInRow) => {
      if (seatsInRow.length === minSeatsInRow || rowCounts.length === 1) {
        const m = Math.max(...seatsInRow.map(s => s.columnNo));
        if (m > regularMaxCol) regularMaxCol = m;
      }
    });
    if (regularMaxCol === 0) {
      regularMaxCol = Math.max(...deckSeats.map(s => s.columnNo));
    }

    const maxCol = regularMaxCol;
    const aisleAfterCol = maxCol >= 2 ? Math.floor(maxCol / 2) : 0;
    const isSleeper = deckSeats.some(s => s.seatType === 'SLEEPER');
    const seatColWidth = isSleeper ? '50px' : '48px';
    const aisleGapWidth = isSleeper ? '30px' : '32px';

    let columns = '';
    if (aisleAfterCol === 0) {
      columns = `repeat(${maxCol}, ${seatColWidth})`;
    } else {
      for (let i = 1; i <= maxCol; i++) {
        columns += `${seatColWidth} `;
        if (i === aisleAfterCol) {
          columns += `${aisleGapWidth} `;
        }
      }
      columns = columns.trim();
    }

    return {
      style: { 'grid-template-columns': columns },
      aisleAfterCol,
      maxCol
    };
  }

  private getGridInfoForDeck(deck: string) {
    const key = `${deck}-${this.seats.length}`;
    if (!this.gridCache.has(key)) {
      this.gridCache.set(key, this.computeGridForDeck(deck));
    }
    return this.gridCache.get(key)!;
  }

  getGridStyle(deck: string): { [key: string]: string } {
    return this.getGridInfoForDeck(deck).style;
  }

  getSeatGridPos(seat: SeatTemplateResponse): { [key: string]: any } {
    const info = this.getGridInfoForDeck(seat.deckType);
    const { aisleAfterCol, maxCol } = info;
    const deckSeats = this.seats.filter(s => s.deckType === seat.deckType);
    const rowSeats = deckSeats.filter(s => s.rowNo === seat.rowNo);

    let gridCol = seat.columnNo;
    if (aisleAfterCol > 0) {
      if (rowSeats.length > maxCol) {
        // Full bench row
        const sorted = [...rowSeats].sort((a, b) => a.columnNo - b.columnNo);
        gridCol = sorted.findIndex(s => s.id === seat.id) + 1;
      } else {
        if (seat.columnNo > aisleAfterCol) {
          gridCol = seat.columnNo + 1;
        }
      }
    }

    return {
      'grid-column': gridCol,
      'grid-row': seat.rowNo
    };
  }

  // ── kept for grid builder compatibility ──
  getSeatsForGrid(deck: DeckType | string): (SeatTemplateResponse | null)[][] {
    const grid: (SeatTemplateResponse | null)[][] = [];
    const deckSeats = this.seats.filter(s => s.deckType === deck);
    const maxRow = deckSeats.length ? Math.max(...deckSeats.map(s => s.rowNo)) : 0;
    const maxCol = deckSeats.length ? Math.max(...deckSeats.map(s => s.columnNo)) : 0;
    for (let r = 1; r <= maxRow; r++) {
      const rowArr: (SeatTemplateResponse | null)[] = [];
      for (let c = 1; c <= maxCol; c++) {
        rowArr.push(deckSeats.find(s => s.rowNo === r && s.columnNo === c) || null);
      }
      grid.push(rowArr);
    }
    return grid;
  }

  switchDeck(deck: DeckType | string): void {
    this.currentDeck = deck as DeckType;
    this.seatForm.patchValue({ deckType: deck });
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  addSeat(): void {
    if (this.seatForm.valid) {
      this.isSubmitting = true;
      const request: SeatTemplateRequest = {
        ...this.seatForm.value,
        seatLayoutTemplateId: this.data.template.id
      };

      this.fleetService.createSeat(request).subscribe({
        next: (newSeat) => {
          this.toast.success(`Seat ${newSeat.seatNumber} placed on ${newSeat.deckType} deck!`);
          this.seats = [...this.seats, newSeat];
          this.gridCache.clear();
          this.isSubmitting = false;

          // Auto-increment for rapid placement
          const currentCol = this.seatForm.get('columnNo')?.value;
          const currentRow = this.seatForm.get('rowNo')?.value;
          const deckSeats = this.seats.filter(s => s.deckType === this.currentDeck);
          const localMaxCol = deckSeats.length ? Math.max(...deckSeats.map(s => s.columnNo)) : 5;
          if (currentCol < localMaxCol) {
            this.seatForm.patchValue({ columnNo: currentCol + 1, seatNumber: '' });
          } else {
            this.seatForm.patchValue({ rowNo: currentRow + 1, columnNo: 1, seatNumber: '' });
          }
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to add seat');
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteSeat(seatId: number): void {
    this.fleetService.deleteSeat(seatId).subscribe({
      next: () => {
        this.toast.success('Seat removed from layout');
        this.seats = this.seats.filter(s => s.id !== seatId);
        this.gridCache.clear();
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to remove seat');
        this.cdr.detectChanges();
      }
    });
  }
}
