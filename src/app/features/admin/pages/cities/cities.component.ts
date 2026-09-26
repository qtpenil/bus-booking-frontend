import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouteService } from '../../services/route.service';
import { CityResponse } from '../../models/route.models';
import { ToastService } from '../../../../shared/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-cities',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinnerModule,
    DataTableComponent
  ],
  templateUrl: './cities.component.html',
  styleUrl: './cities.component.scss'
})
export class CitiesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private routeService = inject(RouteService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  cities: CityResponse[] = [];
  isLoading = false;
  isSubmitting = false;

  cityForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    state: ['', [Validators.required, Validators.maxLength(100)]]
  });

  columns: TableColumn[] = [
    { def: 'id', header: 'ID', cell: (element: CityResponse) => `#${element.id}` },
    { def: 'name', header: 'City Name', cell: (element: CityResponse) => `${element.name}` },
    { def: 'state', header: 'State / Region', cell: (element: CityResponse) => `${element.state}` }
  ];

  ngOnInit(): void {
    this.loadCities();
  }

  loadCities(): void {
    this.isLoading = true;
    this.routeService.getAllCities().subscribe({
      next: (data) => {
        this.cities = [...data];
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load cities');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.cityForm.valid) {
      this.isSubmitting = true;
      this.routeService.createCity(this.cityForm.value).subscribe({
        next: (newCity) => {
          this.toast.success(`City "${newCity.name}" added successfully!`);
          this.cityForm.reset();
          this.cities = [newCity, ...this.cities];
          this.isSubmitting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to add city');
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onEdit(city: CityResponse): void {
    this.toast.info(`Edit mode for ${city.name} will be available in next release.`);
  }

  onDelete(city: CityResponse): void {
    this.toast.info(`City ${city.name} cannot be deleted while assigned to routes.`);
  }
}
