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
    MatProgressSpinnerModule,
    DataTableComponent
  ],
  templateUrl: './buses.html',
  styleUrl: './buses.scss'
})
export class Buses implements OnInit {
  private fb = inject(FormBuilder);
  private fleetService = inject(FleetService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  buses: BusResponse[] = [];
  busTypes: BusTypeResponse[] = [];
  seatTemplates: SeatLayoutTemplateResponse[] = [];
  isLoading = false;
  isSubmitting = false;
  
  busStatuses = Object.values(BusStatus);

  busForm: FormGroup = this.fb.group({
    busNumber: ['', [Validators.required, Validators.maxLength(50)]],
    busName: ['', [Validators.required, Validators.maxLength(100)]],
    operatorName: ['', [Validators.required, Validators.maxLength(100)]],
    registrationNumber: ['', [Validators.required, Validators.maxLength(50)]],
    totalSeats: [null, [Validators.required, Validators.min(1)]],
    status: [BusStatus.ACTIVE, [Validators.required]],
    busTypeId: ['', [Validators.required]],
    seatLayoutTemplateId: ['', [Validators.required]]
  });

  columns: TableColumn[] = [
    { def: 'id', header: 'ID', cell: (element: BusResponse) => `#${element.id}` },
    { def: 'busNumber', header: 'Bus Code', cell: (element: BusResponse) => `${element.busNumber}` },
    { def: 'busName', header: 'Fleet / Vehicle Name', cell: (element: BusResponse) => `${element.busName}` },
    { def: 'registrationNumber', header: 'Registration No', cell: (element: BusResponse) => `${element.registrationNumber || '-'}` },
    { def: 'operatorName', header: 'Depot / Operator', cell: (element: BusResponse) => `${element.operatorName}` },
    { def: 'busTypeName', header: 'Type', cell: (element: BusResponse) => `${element.busTypeName || this.getBusTypeName(element.busTypeId)}` },
    { def: 'totalSeats', header: 'Seats', cell: (element: BusResponse) => `${element.totalSeats} seats` },
    { def: 'status', header: 'Status', cell: (element: BusResponse) => `${element.status}` }
  ];

  ngOnInit(): void {
    this.loadBuses();
    this.loadBusTypes();
    this.loadSeatTemplates();
  }

  getBusTypeName(busTypeId: number): string {
    const found = this.busTypes.find(bt => bt.id === busTypeId);
    return found ? found.name : `Type #${busTypeId}`;
  }

  onTemplateSelect(templateId: number): void {
    const found = this.seatTemplates.find(t => t.id === templateId);
    if (found && found.totalSeats) {
      this.busForm.get('totalSeats')?.setValue(found.totalSeats);
    }
  }

  loadBuses(): void {
    this.isLoading = true;
    this.fleetService.getAllBuses().subscribe({
      next: (data) => {
        this.buses = [...data];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load buses');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadBusTypes(): void {
    this.fleetService.getAllBusTypes().subscribe({
      next: (data) => {
        this.busTypes = [...data];
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load bus types');
      }
    });
  }

  loadSeatTemplates(): void {
    this.fleetService.getAllSeatTemplates().subscribe({
      next: (data) => {
        this.seatTemplates = [...data];
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load seat templates');
      }
    });
  }

  onSubmit(): void {
    if (this.busForm.valid) {
      this.isSubmitting = true;
      this.fleetService.createBus(this.busForm.value).subscribe({
        next: (newBus) => {
          this.toast.success(`Bus ${newBus.busNumber} added to active fleet!`);
          this.busForm.reset({ status: BusStatus.ACTIVE });
          this.buses = [newBus, ...this.buses];
          this.isSubmitting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to add bus');
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onEdit(bus: BusResponse): void {
    this.toast.info(`Edit mode for ${bus.busNumber} will be available in next release.`);
  }

  onDelete(bus: BusResponse): void {
    this.fleetService.deleteBus(bus.id).subscribe({
      next: () => {
        this.toast.success('Bus removed from fleet registry');
        this.buses = this.buses.filter(b => b.id !== bus.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to delete bus');
        this.cdr.detectChanges();
      }
    });
  }
}
