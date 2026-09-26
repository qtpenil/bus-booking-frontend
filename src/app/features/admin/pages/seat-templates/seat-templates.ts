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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatProgressSpinnerModule,
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
  isLoading = false;
  isSubmitting = false;
  
  templateForm: FormGroup = this.fb.group({
    templateName: ['', [Validators.required, Validators.maxLength(100)]],
    templateCode: ['', [Validators.required, Validators.maxLength(50)]],
    totalSeats: [null, [Validators.required, Validators.min(1)]],
    busTypeId: ['', [Validators.required]],
    isActive: [true],
    description: ['', [Validators.maxLength(255)]]
  });

  columns: TableColumn[] = [
    { def: 'id', header: 'ID', cell: (element: SeatLayoutTemplateResponse) => `#${element.id}` },
    { def: 'templateName', header: 'Template Name', cell: (element: SeatLayoutTemplateResponse) => `${element.templateName}` },
    { def: 'templateCode', header: 'Code', cell: (element: SeatLayoutTemplateResponse) => `${element.templateCode}` },
    { def: 'totalSeats', header: 'Capacity', cell: (element: SeatLayoutTemplateResponse) => `${element.totalSeats} seats` },
    { def: 'busType', header: 'Bus Type', cell: (element: SeatLayoutTemplateResponse) => this.getBusTypeName(element.busTypeId) },
    { def: 'isActive', header: 'Status', cell: (element: SeatLayoutTemplateResponse) => element.isActive ? 'Active' : 'Inactive' }
  ];

  ngOnInit(): void {
    this.loadTemplates();
    this.loadBusTypes();
  }

  getBusTypeName(busTypeId: number): string {
    const found = this.busTypes.find(bt => bt.id === busTypeId);
    return found ? found.name : `Type #${busTypeId}`;
  }

  loadTemplates(): void {
    this.isLoading = true;
    this.fleetService.getAllSeatTemplates().subscribe({
      next: (data) => {
        this.templates = [...data];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load seat templates');
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

  onSubmit(): void {
    if (this.templateForm.valid) {
      this.isSubmitting = true;
      this.fleetService.createSeatTemplate(this.templateForm.value).subscribe({
        next: (newTemplate) => {
          this.toast.success(`Template "${newTemplate.templateName}" created successfully!`);
          this.templateForm.reset({ isActive: true });
          this.templates = [newTemplate, ...this.templates];
          this.isSubmitting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to create seat template');
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onView(template: SeatLayoutTemplateResponse): void {
    this.dialog.open(SeatLayoutBuilderDialog, {
      width: '94vw',
      maxWidth: '1300px',
      height: '92vh',
      disableClose: true,
      data: { template }
    });
  }

  onEdit(template: SeatLayoutTemplateResponse): void {
    this.toast.info(`Edit template "${template.templateName}" will be available in next release.`);
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
