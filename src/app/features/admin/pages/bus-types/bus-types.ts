import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FleetService } from '../../services/fleet.service';
import { BusTypeResponse } from '../../models/fleet.models';
import { ToastService } from '../../../../shared/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-bus-types',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatFormFieldModule,
    MatInputModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinnerModule,
    DataTableComponent
  ],
  templateUrl: './bus-types.html',
  styleUrl: './bus-types.scss'
})
export class BusTypes implements OnInit {
  private fb = inject(FormBuilder);
  private fleetService = inject(FleetService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  busTypes: BusTypeResponse[] = [];
  isLoading = false;
  isSubmitting = false;
  
  busTypeForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]]
  });

  columns: TableColumn[] = [
    { def: 'id', header: 'ID', cell: (element: BusTypeResponse) => `#${element.id}` },
    { def: 'name', header: 'Category / Type', cell: (element: BusTypeResponse) => `${element.name}` },
    { def: 'description', header: 'Amenities & Details', cell: (element: BusTypeResponse) => `${element.description || 'Standard Configuration'}` }
  ];

  ngOnInit(): void {
    this.loadBusTypes();
  }

  loadBusTypes(): void {
    this.isLoading = true;
    this.fleetService.getAllBusTypes().subscribe({
      next: (data) => {
        this.busTypes = [...data];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load bus types');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.busTypeForm.valid) {
      this.isSubmitting = true;
      this.fleetService.createBusType(this.busTypeForm.value).subscribe({
        next: (newBusType) => {
          this.toast.success(`Bus type "${newBusType.name}" added successfully!`);
          this.busTypeForm.reset();
          this.busTypes = [newBusType, ...this.busTypes];
          this.isSubmitting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to add bus type');
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onEdit(type: BusTypeResponse): void {
    this.toast.info(`Edit mode for ${type.name} will be available in next release.`);
  }

  onDelete(type: BusTypeResponse): void {
    this.fleetService.deleteBusType(type.id).subscribe({
      next: () => {
        this.toast.success('Bus type deleted successfully');
        this.busTypes = this.busTypes.filter(bt => bt.id !== type.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to delete bus type');
        this.cdr.detectChanges();
      }
    });
  }
}
