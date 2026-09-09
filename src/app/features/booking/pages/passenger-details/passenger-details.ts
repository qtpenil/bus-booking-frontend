import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap, catchError, of } from 'rxjs';

import { ScheduleService } from '../../../admin/services/schedule.service';
import { BookingService } from '../../services/booking.service';
import { RouteService } from '../../../admin/services/route.service';
import { ScheduleSeatResponse } from '../../../admin/models/schedule.models';

@Component({
  selector: 'app-passenger-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './passenger-details.html',
  styleUrl: './passenger-details.scss'
})
export class PassengerDetailsComponent implements OnInit {
  bookingForm!: FormGroup;
  isLoading = true;
  isSubmitting = false;
  
  scheduleId!: number;
  seatIds: number[] = [];
  schedule: any;
  routeDetails: any;
  selectedSeats: ScheduleSeatResponse[] = [];
  totalFare = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private scheduleService: ScheduleService,
    private routeService: RouteService,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.scheduleId = Number(params['scheduleId']);
      const seatsParam = params['seats'];
      
      if (!this.scheduleId || !seatsParam) {
        this.snackBar.open('Invalid booking parameters.', 'Close', { duration: 3000 });
        this.router.navigate(['/home']);
        return;
      }
      
      this.seatIds = seatsParam.split(',').map((id: string) => Number(id));
      this.loadData();
    });
  }

  loadData() {
    this.scheduleService.getScheduleById(this.scheduleId).pipe(
      switchMap(schedule => {
        this.schedule = schedule;
        
        return Promise.all([
          this.scheduleService.getScheduleSeats(this.scheduleId).toPromise(),
          this.routeService.getRouteById(this.schedule.routeId).toPromise()
        ]);
      }),
      catchError(err => {
        this.snackBar.open('Error loading details.', 'Close', { duration: 3000 });
        this.router.navigate(['/home']);
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        const [allSeats, route] = result;
        this.routeDetails = route;
        this.selectedSeats = (allSeats || []).filter((s: ScheduleSeatResponse) => this.seatIds.includes(s.seatId));
        this.totalFare = this.selectedSeats.length * this.schedule.baseFare;
        
        this.initForm();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  initForm() {
    this.bookingForm = this.fb.group({
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      passengers: this.fb.array([])
    });

    const passengersArray = this.bookingForm.get('passengers') as FormArray;
    
    this.selectedSeats.forEach(seat => {
      passengersArray.push(this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
        gender: ['', Validators.required],
        seatId: [seat.seatId]
      }));
    });
  }

  get passengerForms() {
    return (this.bookingForm.get('passengers') as FormArray).controls;
  }

  submitBooking() {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }
    
    this.isSubmitting = true;
    
    // Step 1: Hold the seats
    this.scheduleService.holdSeats(this.scheduleId, { seatIds: this.seatIds }).subscribe({
      next: (holdResponse) => {
        // Step 2: Create Booking
        const formValue = this.bookingForm.value;
        const passengers = formValue.passengers.map((p: any) => ({
          seatId: p.seatId,
          firstName: p.firstName,
          lastName: p.lastName,
          age: Number(p.age),
          gender: p.gender
        }));

        this.bookingService.createBooking({
          scheduleId: this.scheduleId,
          contactEmail: formValue.contactEmail,
          contactPhone: formValue.contactPhone,
          passengers: passengers
        }).subscribe({
          next: (bookingResponse) => {
            this.snackBar.open('Booking created! Redirecting to payment...', 'Close', { duration: 3000 });
            this.router.navigate(['/booking/payment'], {
              queryParams: { bookingId: bookingResponse.bookingId }
            });
          },
          error: (err) => {
            this.snackBar.open('Failed to create booking.', 'Close', { duration: 3000 });
            this.isSubmitting = false;
          }
        });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Selected seats are no longer available.', 'Close', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }
}
