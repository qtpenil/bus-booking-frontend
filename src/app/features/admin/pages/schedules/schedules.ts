import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
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

  schedules: ScheduleResponse[] = [];
  buses: BusResponse[] = [];
  routes: RouteResponse[] = [];
  
  scheduleForm: FormGroup;
  isLoading = false;

  columns: TableColumn[] = [
    { def: 'id', header: 'ID', cell: (element: ScheduleResponse) => `${element.id}` },
    { def: 'routeId', header: 'Route ID', cell: (element: ScheduleResponse) => `${element.routeId}` },
    { def: 'busId', header: 'Bus ID', cell: (element: ScheduleResponse) => `${element.busId}` },
    { def: 'journeyDate', header: 'Journey Date', cell: (element: ScheduleResponse) => `${element.journeyDate}` },
    { def: 'departureTime', header: 'Departure', cell: (element: ScheduleResponse) => `${element.departureTime}` },
    { def: 'arrivalTime', header: 'Arrival', cell: (element: ScheduleResponse) => `${element.arrivalTime}` },
    { def: 'baseFare', header: 'Base Fare', cell: (element: ScheduleResponse) => `₹${element.baseFare}` },
    { def: 'availableSeats', header: 'Avail. Seats', cell: (element: ScheduleResponse) => `${element.availableSeats}` },
    { def: 'status', header: 'Status', cell: (element: ScheduleResponse) => `${element.status}` }
  ];



  constructor() {
    this.scheduleForm = this.fb.group({
      routeId: ['', Validators.required],
      busId: ['', Validators.required],
      journeyDate: ['', Validators.required],
      departureTime: ['', Validators.required],
      arrivalTime: ['', Validators.required],
      baseFare: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    this.routeService.getAllRoutes().subscribe({
      next: (routes) => this.routes = routes,
      error: () => this.toast.error('Failed to load routes')
    });

    this.fleetService.getAllBuses().subscribe({
      next: (buses) => this.buses = buses,
      error: () => this.toast.error('Failed to load buses')
    });

    this.loadSchedules();
  }

  loadSchedules(): void {
    this.scheduleService.getAllSchedules().subscribe({
      next: (schedules) => {
        this.schedules = schedules;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Failed to load schedules');
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.scheduleForm.valid) {
      const request: CreateScheduleRequest = this.scheduleForm.value;
      
      this.scheduleService.createSchedule(request).subscribe({
        next: (response) => {
          this.toast.success('Schedule created successfully');
          this.scheduleForm.reset();
          this.loadSchedules();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to create schedule');
        }
      });
    }
  }

  cancelSchedule(id: number): void {
    if (confirm('Are you sure you want to cancel this schedule?')) {
      this.scheduleService.cancelSchedule(id).subscribe({
        next: () => {
          this.toast.success('Schedule cancelled successfully');
          this.loadSchedules();
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to cancel schedule')
      });
    }
  }
}
