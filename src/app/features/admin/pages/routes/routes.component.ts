import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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

  routeForm: FormGroup = this.fb.group({
    routeName: ['', [Validators.required]],
    sourceCityId: ['', [Validators.required]],
    destinationCityId: ['', [Validators.required]],
    distanceKm: ['', [Validators.required, Validators.min(1)]],
    estimatedDurationMinutes: ['', [Validators.required, Validators.min(1)]],
    stops: this.fb.array([])
  });

  columns: TableColumn[] = [
    { def: 'id', header: 'ID', cell: (element: RouteResponse) => `${element.id}` },
    { def: 'routeName', header: 'Route Name', cell: (element: RouteResponse) => `${element.routeName}` },
    { def: 'source', header: 'From', cell: (element: RouteResponse) => `${element.sourceCityName}` },
    { def: 'destination', header: 'To', cell: (element: RouteResponse) => `${element.destinationCityName}` },
    { def: 'distance', header: 'Distance (km)', cell: (element: RouteResponse) => `${element.distanceKm}` },
    { def: 'duration', header: 'Duration (min)', cell: (element: RouteResponse) => `${element.estimatedDurationMinutes}` }
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
    // update stop orders
    this.stops.controls.forEach((control, i) => {
      control.get('stopOrder')?.setValue(i + 1);
    });
  }

  loadData(): void {
    forkJoin({
      routes: this.routeService.getAllRoutes(),
      cities: this.routeService.getAllCities()
    }).subscribe({
      next: (data) => {
        this.routes = [...data.routes];
        this.cities = [...data.cities];
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load routes and cities');
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

      const { stops, ...routeDetails } = this.routeForm.value;

      this.routeService.createRoute(routeDetails).subscribe({
        next: (newRoute) => {
          if (stops && stops.length > 0) {
            // Add stops sequentially
            from(stops).pipe(
              concatMap(stop => this.routeService.addStopToRoute(newRoute.id, stop))
            ).subscribe({
              complete: () => {
                this.toast.success('Route and stops created successfully!');
                this.resetForm();
                this.routes = [newRoute, ...this.routes];
                this.cdr.detectChanges();
              },
              error: () => {
                this.toast.error('Route created but failed to add some stops');
                this.resetForm();
                this.routes = [newRoute, ...this.routes];
                this.cdr.detectChanges();
              }
            });
          } else {
            this.toast.success('Route created successfully!');
            this.resetForm();
            this.routes = [newRoute, ...this.routes];
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to create route');
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
      width: '600px',
      data: { route }
    });
  }

  onEdit(route: RouteResponse): void {
    this.toast.info(`Edit mode not fully implemented. Selected: ${route.routeName}`);
  }

  onDelete(route: RouteResponse): void {
    this.toast.info(`Delete not supported by backend yet. Selected: ${route.routeName}`);
  }
}
