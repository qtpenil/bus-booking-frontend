import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FleetService } from '../../services/fleet.service';
import { BusResponse, BusTypeResponse, SeatLayoutTemplateResponse, BusStatus } from '../../models/fleet.models';
import { ToastService } from '../../../../shared/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-buses',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatFormFieldModule,
    MatInputModule, 
    MatButtonModule, 
    MatIconModule,
    MatSelectModule,
    DataTableComponent
  ],
  templateUrl: './buses.html',
  styleUrl: './buses.scss'
})
export class Buses implements OnInit {
  private fb = inject(FormBuilder);
  private fleetService = inject(FleetService);
  private toast = inject(ToastService);

  buses: BusResponse[] = [];
  busTypes: BusTypeResponse[] = [];
  seatTemplates: SeatLayoutTemplateResponse[] = [];
  
  busStatuses = Object.values(BusStatus);

  busForm: FormGroup = this.fb.group({
    busNumber: ['', [Validators.required, Validators.maxLength(50)]],
    busName: ['', [Validators.required, Validators.maxLength(100)]],
    operatorName: ['', [Validators.required, Validators.maxLength(100)]],
    registrationNumber: ['', [Validators.required, Validators.maxLength(50)]],
    totalSeats: [0, [Validators.required, Validators.min(1)]],
    status: [BusStatus.ACTIVE, [Validators.required]],
    busTypeId: ['', [Validators.required]],
    seatLayoutTemplateId: ['', [Validators.required]]
  });

  columns: TableColumn[] = [
    { def: 'id', header: 'ID', cell: (element: BusResponse) => `${element.id}` },
    { def: 'busNumber', header: 'Bus Number', cell: (element: BusResponse) => `${element.busNumber}` },
    { def: 'busName', header: 'Name', cell: (element: BusResponse) => `${element.busName}` },
    { def: 'operatorName', header: 'Operator', cell: (element: BusResponse) => `${element.operatorName}` },
    { def: 'status', header: 'Status', cell: (element: BusResponse) => `${element.status}` },
    { def: 'busTypeName', header: 'Type', cell: (element: BusResponse) => `${element.busTypeName || element.busTypeId}` },
    { def: 'totalSeats', header: 'Seats', cell: (element: BusResponse) => `${element.totalSeats}` }
  ];

  ngOnInit(): void {
    this.loadBuses();
    this.loadBusTypes();
    this.loadSeatTemplates();
  }

  loadBuses(): void {
    this.fleetService.getAllBuses().subscribe({
      next: (data) => this.buses = data,
      error: () => this.toast.error('Failed to load buses')
    });
  }

  loadBusTypes(): void {
    this.fleetService.getAllBusTypes().subscribe({
      next: (data) => this.busTypes = data,
      error: () => this.toast.error('Failed to load bus types')
    });
  }

  loadSeatTemplates(): void {
    this.fleetService.getAllSeatTemplates().subscribe({
      next: (data) => this.seatTemplates = data,
      error: () => this.toast.error('Failed to load seat templates')
    });
  }

  onSubmit(): void {
    if (this.busForm.valid) {
      this.fleetService.createBus(this.busForm.value).subscribe({
        next: (newBus) => {
          this.toast.success('Bus added successfully!');
          this.busForm.reset({ status: BusStatus.ACTIVE, totalSeats: 0 });
          this.buses = [newBus, ...this.buses];
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to add bus');
        }
      });
    }
  }

  onEdit(bus: BusResponse): void {
    this.toast.info(`Edit mode not fully implemented. Selected: ${bus.busNumber}`);
  }

  onDelete(bus: BusResponse): void {
    this.fleetService.deleteBus(bus.id).subscribe({
      next: () => {
        this.toast.success('Bus deleted successfully');
        this.buses = this.buses.filter(b => b.id !== bus.id);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to delete bus');
      }
    });
  }
}
