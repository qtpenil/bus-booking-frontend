import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FleetService } from '../../services/fleet.service';
import { SeatLayoutTemplateResponse, BusTypeResponse } from '../../models/fleet.models';
import { ToastService } from '../../../../shared/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { SeatLayoutBuilderDialog } from '../../components/seat-layout-builder-dialog/seat-layout-builder-dialog';

@Component({
  selector: 'app-seat-templates',
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
    MatSlideToggleModule,
    MatDialogModule,
    DataTableComponent
  ],
  templateUrl: './seat-templates.html',
  styleUrl: './seat-templates.scss'
})
export class SeatTemplates implements OnInit {
  private fb = inject(FormBuilder);
  private fleetService = inject(FleetService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  templates: SeatLayoutTemplateResponse[] = [];
  busTypes: BusTypeResponse[] = [];
  
  templateForm: FormGroup = this.fb.group({
    templateName: ['', [Validators.required, Validators.maxLength(100)]],
    templateCode: ['', [Validators.required, Validators.maxLength(50)]],
    totalSeats: [0, [Validators.required, Validators.min(1)]],
    busTypeId: ['', [Validators.required]],
    isActive: [true],
    description: ['', [Validators.maxLength(255)]]
  });

  columns: TableColumn[] = [
    { def: 'id', header: 'ID', cell: (element: SeatLayoutTemplateResponse) => `${element.id}` },
    { def: 'templateName', header: 'Name', cell: (element: SeatLayoutTemplateResponse) => `${element.templateName}` },
    { def: 'templateCode', header: 'Code', cell: (element: SeatLayoutTemplateResponse) => `${element.templateCode}` },
    { def: 'totalSeats', header: 'Seats', cell: (element: SeatLayoutTemplateResponse) => `${element.totalSeats}` },
    { def: 'busTypeId', header: 'Bus Type ID', cell: (element: SeatLayoutTemplateResponse) => `${element.busTypeId}` },
    { def: 'isActive', header: 'Active', cell: (element: SeatLayoutTemplateResponse) => element.isActive ? 'Yes' : 'No' }
  ];

  ngOnInit(): void {
    this.loadTemplates();
    this.loadBusTypes();
  }

  loadTemplates(): void {
    this.fleetService.getAllSeatTemplates().subscribe({
      next: (data) => {
        this.templates = [...data];
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load seat templates');
        this.cdr.detectChanges();
      }
    });
  }

  loadBusTypes(): void {
    this.fleetService.getAllBusTypes().subscribe({
      next: (data) => {
        this.busTypes = [...data];
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load bus types for dropdown');
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.templateForm.valid) {
      this.fleetService.createSeatTemplate(this.templateForm.value).subscribe({
        next: (newTemplate) => {
          this.toast.success('Seat template added successfully!');
          this.templateForm.reset({ isActive: true, totalSeats: 0 });
          this.templates = [newTemplate, ...this.templates];
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to add seat template');
          this.cdr.detectChanges();
        }
      });
    }
  }

  onView(template: SeatLayoutTemplateResponse): void {
    this.dialog.open(SeatLayoutBuilderDialog, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      disableClose: true,
      data: { template }
    });
  }

  onEdit(template: SeatLayoutTemplateResponse): void {
    this.toast.info(`Edit mode not fully implemented. Selected: ${template.templateName}`);
  }

  onDelete(template: SeatLayoutTemplateResponse): void {
    this.fleetService.deleteSeatTemplate(template.id).subscribe({
      next: () => {
        this.toast.success('Seat template deleted successfully');
        this.templates = this.templates.filter(t => t.id !== template.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to delete seat template');
        this.cdr.detectChanges();
      }
    });
  }
}
