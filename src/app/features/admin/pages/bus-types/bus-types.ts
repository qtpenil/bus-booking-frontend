import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    DataTableComponent
  ],
  templateUrl: './bus-types.html',
  styleUrl: './bus-types.scss'
})
export class BusTypes implements OnInit {
  private fb = inject(FormBuilder);
  private fleetService = inject(FleetService);
  private toast = inject(ToastService);

  busTypes: BusTypeResponse[] = [];
  
  busTypeForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]]
  });

  columns: TableColumn[] = [
    { def: 'id', header: 'ID', cell: (element: BusTypeResponse) => `${element.id}` },
    { def: 'name', header: 'Type Name', cell: (element: BusTypeResponse) => `${element.name}` },
    { def: 'description', header: 'Description', cell: (element: BusTypeResponse) => `${element.description || 'N/A'}` }
  ];

  ngOnInit(): void {
    this.loadBusTypes();
  }

  loadBusTypes(): void {
    this.fleetService.getAllBusTypes().subscribe({
      next: (data) => {
        this.busTypes = data;
      },
      error: () => {
        this.toast.error('Failed to load bus types');
      }
    });
  }

  onSubmit(): void {
    if (this.busTypeForm.valid) {
      this.fleetService.createBusType(this.busTypeForm.value).subscribe({
        next: (newBusType) => {
          this.toast.success('Bus type added successfully!');
          this.busTypeForm.reset();
          this.busTypes = [newBusType, ...this.busTypes];
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to add bus type');
        }
      });
    }
  }

  onEdit(type: BusTypeResponse): void {
    this.toast.info(`Edit mode not fully implemented. Selected: ${type.name}`);
  }

  onDelete(type: BusTypeResponse): void {
    this.fleetService.deleteBusType(type.id).subscribe({
      next: () => {
        this.toast.success('Bus type deleted successfully');
        this.busTypes = this.busTypes.filter(bt => bt.id !== type.id);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to delete bus type');
      }
    });
  }
}
