import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, catchError, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ScheduleService } from '../../../admin/services/schedule.service';
import { RouteService } from '../../../admin/services/route.service';
import { FleetService } from '../../../admin/services/fleet.service';
import { ScheduleSeatResponse } from '../../../admin/models/schedule.models';
import { AuthService } from '../../../auth/services/auth.service';
import { AuthModalComponent } from '../../../../shared/components/auth-modal/auth-modal.component';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss'
})
export class SeatSelectionComponent implements OnInit {
  isLoading = true;
  errorMessage = '';
  
  scheduleId!: number;
  schedule: any;
  routeDetails: any;
  busDetails: any;
  
  seats: ScheduleSeatResponse[] = [];
  lowerDeckSeats: ScheduleSeatResponse[] = [];
  upperDeckSeats: ScheduleSeatResponse[] = [];
  
  selectedSeats: ScheduleSeatResponse[] = [];
  maxSeats = 6;
  totalFare = 0;

  // --- Seat layout UI properties ---
  activeDeck: string = 'LOWER';
  displayedSeats: ScheduleSeatResponse[] = [];
  regularSeats: ScheduleSeatResponse[] = [];
  lastRowSeats: ScheduleSeatResponse[] = [];
  lastRowNumber = 0;
  shouldCenterLastRow = false;
  hasMultipleDecks = false;
  gridStyle: { [key: string]: string } = {};

  // Internal layout computation
  private maxCol = 0;
  private aisleAfterCol = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private scheduleService: ScheduleService,
    private routeService: RouteService,
    private fleetService: FleetService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  sourceCityId?: number;
  destinationCityId?: number;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.scheduleId = Number(params['scheduleId']);
      this.sourceCityId = params['sourceCityId'] ? Number(params['sourceCityId']) : undefined;
      this.destinationCityId = params['destinationCityId'] ? Number(params['destinationCityId']) : undefined;
      if (!this.scheduleId) {
        this.errorMessage = 'Invalid Schedule ID.';
        this.isLoading = false;
        return;
      }
      this.loadData();
    });
  }

  loadData() {
    this.scheduleService.getScheduleById(this.scheduleId).pipe(
      switchMap(schedule => {
        this.schedule = schedule;
        this.totalFare = 0;
        
        // Fetch seats, route, and bus in parallel with segment bounds
        return Promise.all([
          this.scheduleService.getScheduleSeats(this.scheduleId, this.sourceCityId, this.destinationCityId).toPromise(),
          this.routeService.getRouteById(this.schedule.routeId).toPromise(),
          this.fleetService.getBusById(this.schedule.busId).toPromise()
        ]);
      }),
      catchError(err => {
        console.error('Error fetching data:', err);
        this.errorMessage = 'Failed to load seat layout. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        const [seats, route, bus] = result;
        this.seats = seats || [];
        this.routeDetails = route;
        this.busDetails = bus;
        
        this.organizeSeats();
        this.updateDisplayedSeats();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  organizeSeats() {
    this.lowerDeckSeats = this.seats.filter(s => s.deckType === 'LOWER');
    this.upperDeckSeats = this.seats.filter(s => s.deckType === 'UPPER');
    this.hasMultipleDecks = this.lowerDeckSeats.length > 0 && this.upperDeckSeats.length > 0;
  }

  /**
   * Switch between Lower and Upper deck views.
   */
  switchDeck(deck: string) {
    this.activeDeck = deck;
    this.updateDisplayedSeats();
    this.cdr.detectChanges();
  }

  /**
   * Determine which seats to show based on active deck.
   * Also recomputes the CSS grid layout.
   */
  updateDisplayedSeats() {
    if (this.upperDeckSeats.length === 0) {
      this.displayedSeats = this.lowerDeckSeats;
    } else if (this.lowerDeckSeats.length === 0) {
      this.displayedSeats = this.upperDeckSeats;
    } else {
      this.displayedSeats = this.activeDeck === 'LOWER' ? this.lowerDeckSeats : this.upperDeckSeats;
    }

    this.computeGridLayout();
  }

  /**
   * Compute CSS grid-template-columns with controlled seat column widths and aisle gap.
   * Tightens pair seat spacing and reduces middle aisle width.
   */
  private computeGridLayout() {
    if (!this.displayedSeats || this.displayedSeats.length === 0) {
      this.gridStyle = {};
      return;
    }

    // Group seats by row to inspect row structure
    const rowMap = new Map<number, ScheduleSeatResponse[]>();
    this.displayedSeats.forEach(s => {
      if (!rowMap.has(s.rowNo)) rowMap.set(s.rowNo, []);
      rowMap.get(s.rowNo)!.push(s);
    });

    const rowCounts = Array.from(rowMap.values()).map(seats => seats.length);
    const minSeatsInRow = Math.min(...rowCounts);

    // Find max column count among standard (non-bench) rows
    let regularMaxCol = 0;
    rowMap.forEach((seatsInRow) => {
      if (seatsInRow.length === minSeatsInRow || rowCounts.length === 1) {
        const maxInThisRow = Math.max(...seatsInRow.map(s => s.columnNo));
        if (maxInThisRow > regularMaxCol) regularMaxCol = maxInThisRow;
      }
    });

    if (regularMaxCol === 0) {
      regularMaxCol = Math.max(...this.displayedSeats.map(s => s.columnNo));
    }

    this.maxCol = regularMaxCol;
    this.aisleAfterCol = this.maxCol >= 2 ? Math.floor(this.maxCol / 2) : 0;

    const isSleeper = this.displayedSeats.some(s => s.seatType === 'SLEEPER');
    const seatColWidth = isSleeper ? '36px' : '34px';
    const aisleGapWidth = isSleeper ? '20px' : '22px';

    let columns = '';
    if (this.aisleAfterCol === 0) {
      columns = `repeat(${this.maxCol}, ${seatColWidth})`;
    } else {
      for (let i = 1; i <= this.maxCol; i++) {
        columns += `${seatColWidth} `;
        if (i === this.aisleAfterCol) {
          columns += `${aisleGapWidth} `;
        }
      }
      columns = columns.trim();
    }

    this.gridStyle = {
      'grid-template-columns': columns
    };
  }

  /**
   * Returns the adjusted grid-column and grid-row for a seat.
   * Left seats align with left columns, right seats align with right columns,
   * and an extra middle seat in full bench row sits in the middle aisle column.
   */
  getSeatGridPosition(seat: ScheduleSeatResponse): { [key: string]: number } {
    const rowSeats = this.displayedSeats.filter(s => s.rowNo === seat.rowNo);
    const sortedRowSeats = [...rowSeats].sort((a, b) => a.columnNo - b.columnNo);
    const seatIndex = sortedRowSeats.findIndex(s => s.seatId === seat.seatId);

    let gridCol = seat.columnNo;

    if (this.aisleAfterCol > 0) {
      if (rowSeats.length > this.maxCol) {
        // Full bench row (extra seat filling middle aisle space)
        gridCol = seatIndex + 1;
      } else {
        // Standard row with aisle gap
        if (seat.columnNo > this.aisleAfterCol) {
          gridCol = seat.columnNo + 1;
        }
      }
    }

    return {
      'grid-column': gridCol,
      'grid-row': seat.rowNo
    };
  }

  toggleSeat(seat: ScheduleSeatResponse) {
    if (seat.status !== 'AVAILABLE') return;

    const index = this.selectedSeats.findIndex(s => s.seatId === seat.seatId);
    if (index > -1) {
      this.selectedSeats.splice(index, 1);
    } else {
      if (this.selectedSeats.length >= this.maxSeats) {
        this.snackBar.open(`You can select a maximum of ${this.maxSeats} seats.`, 'Close', { duration: 3000 });
        return;
      }
      this.selectedSeats.push(seat);
    }
    
    this.totalFare = this.selectedSeats.length * (this.schedule?.baseFare || 0);
  }

  isSelected(seat: ScheduleSeatResponse): boolean {
    return this.selectedSeats.some(s => s.seatId === seat.seatId);
  }

  getSeatClass(seat: ScheduleSeatResponse): string {
    if (seat.status === 'BOOKED' || seat.status === 'HOLD') {
      return 'seat-booked';
    }
    if (this.isSelected(seat)) {
      return 'seat-selected';
    }
    return 'seat-available';
  }

  proceed() {
    if (this.selectedSeats.length === 0) return;
    
    if (!this.authService.isAuthenticated()) {
      const dialogRef = this.dialog.open(AuthModalComponent, {
        panelClass: 'auth-modal-pane',
        data: { message: 'Please sign in or create an account to proceed with your booking.' }
      });

      dialogRef.afterClosed().subscribe(authenticated => {
        if (authenticated) {
          this.navigateToPassengerDetails();
        }
      });
      return;
    }

    this.navigateToPassengerDetails();
  }

  private navigateToPassengerDetails() {
    const seatIds = this.selectedSeats.map(s => s.seatId);
    this.router.navigate(['/booking/passenger-details'], {
      queryParams: { 
        scheduleId: this.scheduleId,
        seats: seatIds.join(','),
        sourceCityId: this.sourceCityId,
        destinationCityId: this.destinationCityId
      }
    });
  }
  
  goBack() {
    this.router.navigate(['/home']);
  }
}
