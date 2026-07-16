import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouteResponse, RouteStopResponse } from '../../models/route.models';
import { RouteService } from '../../services/route.service';
import { ToastService } from '../../../../shared/services/toast.service';

export interface RouteDetailsDialogData {
  route: RouteResponse;
}

@Component({
  selector: 'app-route-details-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title class="fw-bold d-flex align-items-center gap-2">
      <mat-icon color="primary">directions_bus</mat-icon> Route Details
    </h2>
    <mat-dialog-content class="mat-typography pb-4">
      
      <div class="route-summary p-3 bg-light rounded mb-4 mt-2">
        <h4 class="mb-3 text-primary">{{ data.route.routeName }}</h4>
        <div class="row">
          <div class="col-sm-6 mb-2">
            <strong>Source:</strong> {{ data.route.sourceCityName }}
          </div>
          <div class="col-sm-6 mb-2">
            <strong>Destination:</strong> {{ data.route.destinationCityName }}
          </div>
          <div class="col-sm-6 mb-2">
            <strong>Total Distance:</strong> {{ data.route.distanceKm }} km
          </div>
          <div class="col-sm-6 mb-2">
            <strong>Estimated Duration:</strong> {{ formatDuration(data.route.estimatedDurationMinutes) }}
          </div>
        </div>
      </div>

      <h4 class="mb-3 border-bottom pb-2">Stops & Stations</h4>
      
      <div *ngIf="isLoading" class="d-flex justify-content-center p-4">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!isLoading && stops.length === 0" class="text-muted fst-italic p-3 text-center border rounded">
        This is a direct route with no intermediate stops.
      </div>

      <mat-list *ngIf="!isLoading && stops.length > 0">
        <mat-list-item *ngFor="let stop of stops; let last = last">
          <mat-icon matListItemIcon color="accent">place</mat-icon>
          <div matListItemTitle class="fw-bold">Stop #{{ stop.stopOrder }}: {{ stop.cityName }}</div>
          <div matListItemLine>
            Arrival: +{{ formatDuration(stop.arrivalOffsetMinutes) }} | 
            Departure: +{{ formatDuration(stop.departureOffsetMinutes) }}
          </div>
          <mat-divider *ngIf="!last"></mat-divider>
        </mat-list-item>
      </mat-list>

    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `
})
export class RouteDetailsDialogComponent implements OnInit {
  stops: RouteStopResponse[] = [];
  isLoading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RouteDetailsDialogData,
    private dialogRef: MatDialogRef<RouteDetailsDialogComponent>,
    private routeService: RouteService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.data?.route?.id) {
      this.toast.error('Invalid Route ID.');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.routeService.getStopsForRoute(this.data.route.id).subscribe({
      next: (response) => {
        try {
          let stopsArray = Array.isArray(response) ? response : [];
          this.stops = stopsArray.sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));
        } catch (e) {
          console.error('Error processing stops:', e);
          this.stops = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch route stops:', err);
        this.toast.error('Could not fetch route stops.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatDuration(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }
}
