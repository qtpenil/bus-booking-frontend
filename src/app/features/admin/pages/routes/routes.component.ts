import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouteService } from '../../services/route.service';
import { CityResponse, RouteResponse } from '../../models/route.models';
import { ToastService } from '../../../../shared/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { forkJoin, from, concatMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { RouteDetailsDialogComponent } from '../../components/route-details-dialog/route-details-dialog.component';

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatInputModule, 
    MatSelectModule,
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DataTableComponent
  ],
  templateUrl: './routes.component.html',
  styleUrl: './routes.component.scss'
})
export class RoutesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private routeService = inject(RouteService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  routes: RouteResponse[] = [];
  cities: CityResponse[] = [];
  isLoading = false;
  isSubmitting = false;

  routeForm: FormGroup = this.fb.group({
    routeName: ['', [Validators.required, Validators.maxLength(150)]],
    sourceCityId: ['', [Validators.required]],
    destinationCityId: ['', [Validators.required]],
    distanceKm: ['', [Validators.required, Validators.min(1)]],
    estimatedDurationMinutes: ['', [Validators.required, Validators.min(1)]],
    stops: this.fb.array([])
  });

  columns: TableColumn[] = [
    { def: 'id', header: 'ID', cell: (element: RouteResponse) => `#${element.id}` },
    { def: 'routeName', header: 'Route Name', cell: (element: RouteResponse) => `${element.routeName}` },
    { def: 'source', header: 'Origin', cell: (element: RouteResponse) => `${element.sourceCityName}` },
    { def: 'destination', header: 'Destination', cell: (element: RouteResponse) => `${element.destinationCityName}` },
    { def: 'distance', header: 'Distance', cell: (element: RouteResponse) => `${element.distanceKm} km` },
    { def: 'duration', header: 'Est. Duration', cell: (element: RouteResponse) => this.formatMinutes(element.estimatedDurationMinutes) }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get stops() {
    return this.routeForm.get('stops') as FormArray;
  }

  addStop() {
    this.stops.push(this.fb.group({
      cityId: ['', Validators.required],
      stopOrder: [this.stops.length + 1, [Validators.required, Validators.min(1)]],
      arrivalOffsetMinutes: ['', [Validators.required, Validators.min(0)]],
      departureOffsetMinutes: ['', [Validators.required, Validators.min(0)]]
    }));
  }

  removeStop(index: number) {
    this.stops.removeAt(index);
    this.stops.controls.forEach((control, i) => {
      control.get('stopOrder')?.setValue(i + 1);
    });
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      routes: this.routeService.getAllRoutes(),
      cities: this.routeService.getAllCities()
    }).subscribe({
      next: (data) => {
        this.routes = [...data.routes];
        this.cities = [...data.cities];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load routes and cities');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.routeForm.valid) {
      if (this.routeForm.value.sourceCityId === this.routeForm.value.destinationCityId) {
        this.toast.error('Source and Destination cities cannot be the same');
        return;
      }

      this.isSubmitting = true;
      const { stops, ...routeDetails } = this.routeForm.value;

      this.routeService.createRoute(routeDetails).subscribe({
        next: (newRoute) => {
          if (stops && stops.length > 0) {
            from(stops).pipe(
              concatMap(stop => this.routeService.addStopToRoute(newRoute.id, stop))
            ).subscribe({
              complete: () => {
                this.toast.success('Route and stops configured successfully!');
                this.resetForm();
                this.routes = [newRoute, ...this.routes];
                this.isSubmitting = false;
                this.cdr.detectChanges();
              },
              error: () => {
                this.toast.error('Route created but failed to save some stops');
                this.resetForm();
                this.routes = [newRoute, ...this.routes];
                this.isSubmitting = false;
                this.cdr.detectChanges();
              }
            });
          } else {
            this.toast.success('Route created successfully!');
            this.resetForm();
            this.routes = [newRoute, ...this.routes];
            this.isSubmitting = false;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to create route');
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private resetForm() {
    this.routeForm.reset();
    this.stops.clear();
  }

  onView(route: RouteResponse): void {
    this.dialog.open(RouteDetailsDialogComponent, {
      width: '640px',
      data: { route }
    });
  }

  onEdit(route: RouteResponse): void {
    this.toast.info(`Edit mode for ${route.routeName} will be available in next release.`);
  }

  onDelete(route: RouteResponse): void {
    this.toast.info(`Route ${route.routeName} cannot be deleted while referenced by active schedules.`);
  }

  formatMinutes(minutes: number): string {
    if (!minutes) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }
}
