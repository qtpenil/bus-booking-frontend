import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScheduleService } from '../../services/schedule.service';
import { FleetService } from '../../services/fleet.service';
import { RouteService } from '../../services/route.service';
import { ScheduleResponse, CreateScheduleRequest } from '../../models/schedule.models';
import { BusResponse } from '../../models/fleet.models';
import { RouteResponse } from '../../models/route.models';
import { ToastService } from '../../../../shared/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    DataTableComponent
  ],
  templateUrl: './schedules.html',
  styleUrl: './schedules.scss'
})
export class SchedulesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private scheduleService = inject(ScheduleService);
  private fleetService = inject(FleetService);
  private routeService = inject(RouteService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  schedules: ScheduleResponse[] = [];
  buses: BusResponse[] = [];
  routes: RouteResponse[] = [];
  
  scheduleForm: FormGroup;
  isLoading = false;
  isSubmitting = false;

  columns: TableColumn[] = [
    { def: 'id', header: 'Trip ID', cell: (element: ScheduleResponse) => `#${element.id}` },
    { def: 'route', header: 'Route Corridor', cell: (element: ScheduleResponse) => this.getRouteLabel(element) },
    { def: 'bus', header: 'Assigned Bus', cell: (element: ScheduleResponse) => this.getBusLabel(element) },
    { def: 'journeyDate', header: 'Date', cell: (element: ScheduleResponse) => `${element.journeyDate}` },
    { def: 'timing', header: 'Departure → Arrival', cell: (element: ScheduleResponse) => `${element.departureTime} → ${element.arrivalTime}` },
    { def: 'baseFare', header: 'Fare', cell: (element: ScheduleResponse) => `₹${element.baseFare}` },
    { def: 'availableSeats', header: 'Seats Avail', cell: (element: ScheduleResponse) => `${element.availableSeats}` },
    { def: 'status', header: 'Status', cell: (element: ScheduleResponse) => `${element.status}` }
  ];

  constructor() {
    this.scheduleForm = this.fb.group({
      routeId: ['', Validators.required],
      busId: ['', Validators.required],
      journeyDate: ['', Validators.required],
      departureTime: ['', Validators.required],
      arrivalTime: ['', Validators.required],
      baseFare: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  getRouteLabel(element: ScheduleResponse): string {
    const found = this.routes.find(r => r.id === element.routeId);
    return found ? `${found.sourceCityName} → ${found.destinationCityName}` : `Route #${element.routeId}`;
  }

  getBusLabel(element: ScheduleResponse): string {
    const found = this.buses.find(b => b.id === element.busId);
    return found ? `${found.busName} (${found.busNumber})` : `Bus #${element.busId}`;
  }

  loadData(): void {
    this.isLoading = true;
    
    this.routeService.getAllRoutes().subscribe({
      next: (routes) => {
        this.routes = [...routes];
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load routes');
      }
    });

    this.fleetService.getAllBuses().subscribe({
      next: (buses) => {
        this.buses = [...buses];
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load buses');
      }
    });

    this.loadSchedules();
  }

  loadSchedules(): void {
    this.isLoading = true;
    this.scheduleService.getAllSchedules().subscribe({
      next: (schedules) => {
        this.schedules = [...schedules];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load schedules');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.scheduleForm.valid) {
      this.isSubmitting = true;
      const request: CreateScheduleRequest = this.scheduleForm.value;
      
      this.scheduleService.createSchedule(request).subscribe({
        next: () => {
          this.toast.success('Schedule planned and published successfully!');
          this.scheduleForm.reset();
          this.isSubmitting = false;
          this.loadSchedules();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to create schedule');
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancelSchedule(schedule: ScheduleResponse): void {
    const id = schedule.id;
    this.scheduleService.cancelSchedule(id).subscribe({
      next: () => {
        this.toast.success(`Schedule #${id} has been cancelled`);
        this.loadSchedules();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to cancel schedule');
        this.cdr.detectChanges();
      }
    });
  }
}
