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

import { ScheduleService } from '../../../admin/services/schedule.service';
import { RouteService } from '../../../admin/services/route.service';
import { FleetService } from '../../../admin/services/fleet.service';
import { ScheduleSeatResponse } from '../../../admin/models/schedule.models';

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
    MatTooltipModule
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private scheduleService: ScheduleService,
    private routeService: RouteService,
    private fleetService: FleetService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.scheduleId = Number(params['scheduleId']);
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
        
        // Fetch seats, route, and bus in parallel
        return Promise.all([
          this.scheduleService.getScheduleSeats(this.scheduleId).toPromise(),
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
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  organizeSeats() {
    this.lowerDeckSeats = this.seats.filter(s => s.deckType === 'LOWER');
    this.upperDeckSeats = this.seats.filter(s => s.deckType === 'UPPER');
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
  
  getGridStyle(seats: ScheduleSeatResponse[]) {
    if (!seats || seats.length === 0) return {};
    const maxCol = Math.max(...seats.map(s => s.columnNo)) || 1;
    return {
      'display': 'grid',
      'grid-template-columns': `repeat(${maxCol}, minmax(40px, 1fr))`,
      'gap': '10px'
    };
  }
  
  getSeatStyle(seat: ScheduleSeatResponse) {
    return {
      'grid-column': seat.columnNo,
      'grid-row': seat.rowNo
    };
  }

  proceed() {
    if (this.selectedSeats.length === 0) return;
    
    const seatIds = this.selectedSeats.map(s => s.seatId);
    this.router.navigate(['/booking/passenger-details'], {
      queryParams: { 
        scheduleId: this.scheduleId,
        seats: seatIds.join(',')
      }
    });
  }
  
  goBack() {
    this.router.navigate(['/home']);
  }
}
