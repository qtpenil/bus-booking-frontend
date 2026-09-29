import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatProgressSpinnerModule
  ],
  template: `
    <div class="route-details-modal">
      <!-- Modal Header -->
      <div class="modal-custom-header">
        <div class="d-flex align-items-center gap-2">
          <div class="header-icon-box">
            <mat-icon>alt_route</mat-icon>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-danger-subtle text-danger small">Route Corridor #{{ data.route.id }}</span>
            </div>
            <h3 class="modal-title mb-0">{{ data.route.routeName }}</h3>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="text-muted" title="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-custom-body">
        <!-- Origin to Destination Strip -->
        <div class="route-summary-strip mb-4">
          <div class="city-box text-start">
            <span class="city-label">ORIGIN TERMINAL</span>
            <span class="city-name">{{ data.route.sourceCityName }}</span>
          </div>

          <div class="route-line-connector">
            <mat-icon class="connector-bus">directions_bus</mat-icon>
            <div class="connector-line"></div>
            <div class="connector-metrics">
              <span class="metric-pill">{{ data.route.distanceKm }} km</span>
              <span class="metric-pill">{{ formatDuration(data.route.estimatedDurationMinutes) }}</span>
            </div>
          </div>

          <div class="city-box text-end">
            <span class="city-label">DESTINATION TERMINAL</span>
            <span class="city-name">{{ data.route.destinationCityName }}</span>
          </div>
        </div>

        <!-- Timeline Section -->
        <div class="timeline-section">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: var(--admin-primary);">timeline</mat-icon>
              Station Timeline & Intermediate Waypoints
            </h6>
            <span class="badge bg-light text-dark border">{{ stops.length }} Waypoints</span>
          </div>

          <div *ngIf="isLoading" class="text-center py-4">
            <mat-spinner diameter="32" class="mx-auto mb-2"></mat-spinner>
            <span class="text-muted small">Loading waypoint stops...</span>
          </div>

          <div *ngIf="!isLoading && stops.length === 0" class="direct-route-notice">
            <mat-icon class="text-muted mb-2" style="font-size: 32px; width: 32px; height: 32px;">flash_on</mat-icon>
            <div class="fw-semibold text-dark">Non-Stop Direct Express</div>
            <div class="text-muted small">This route operates point-to-point without intermediate passenger boarding.</div>
          </div>

          <!-- Step Timeline -->
          <div *ngIf="!isLoading && stops.length > 0" class="stops-timeline">
            <!-- Origin Stop Marker -->
            <div class="timeline-item start-node">
              <div class="node-marker">
                <span class="dot origin-dot"></span>
                <div class="connector-bar"></div>
              </div>
              <div class="node-content">
                <div class="node-title">{{ data.route.sourceCityName }}</div>
                <div class="node-subtitle">Origin Departure Point (0 min)</div>
              </div>
            </div>

            <!-- Intermediate Stops -->
            <div *ngFor="let stop of stops; let i = index; let last = last" class="timeline-item">
              <div class="node-marker">
                <span class="step-num">{{ stop.stopOrder || (i + 1) }}</span>
                <div class="connector-bar" *ngIf="!last"></div>
              </div>
              <div class="node-content">
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div class="node-title">{{ stop.cityName }}</div>
                  <div class="time-badges">
                    <span class="time-chip arr">Arr: +{{ formatDuration(stop.arrivalOffsetMinutes) }}</span>
                    <span class="time-chip dep">Dep: +{{ formatDuration(stop.departureOffsetMinutes) }}</span>
                  </div>
                </div>
                <div class="node-subtitle d-flex align-items-center gap-2">
                  <span>Waypoint Stop #{{ stop.stopOrder || (i + 1) }}</span>
                  <span *ngIf="stop.distanceFromOriginKm" class="badge bg-light text-dark border px-2 py-0" style="font-size: 0.7rem;">
                    {{ stop.distanceFromOriginKm }} km from origin
                  </span>
                </div>
              </div>
            </div>

            <!-- Final Destination Marker -->
            <div class="timeline-item end-node">
              <div class="node-marker">
                <span class="dot dest-dot"></span>
              </div>
              <div class="node-content">
                <div class="node-title">{{ data.route.destinationCityName }}</div>
                <div class="node-subtitle">Final Destination Arrival (+{{ formatDuration(data.route.estimatedDurationMinutes) }})</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-custom-footer">
        <button class="btn btn-admin-secondary btn-sm" mat-dialog-close>
          Close Preview
        </button>
      </div>
    </div>
  `,
  styles: [`
    .route-details-modal {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
    }

    .modal-custom-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;

      .header-icon-box {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: #fef2f2;
        color: #b71c1c;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      .modal-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: #0f172a;
      }
    }

    .modal-custom-body {
      padding: 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
    }

    .route-summary-strip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .city-box {
        display: flex;
        flex-direction: column;

        .city-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }

        .city-name {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
        }
      }

      .route-line-connector {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        padding: 0 1.5rem;
        position: relative;

        .connector-bus {
          color: #b71c1c;
          font-size: 20px;
          width: 20px;
          height: 20px;
          margin-bottom: -6px;
          z-index: 1;
        }

        .connector-line {
          width: 100%;
          height: 2px;
          background: #cbd5e1;
          position: relative;
        }

        .connector-metrics {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.4rem;

          .metric-pill {
            font-size: 0.72rem;
            font-weight: 600;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 0.15rem 0.5rem;
            border-radius: 12px;
            color: #475569;
          }
        }
      }
    }

    .direct-route-notice {
      text-align: center;
      padding: 2.5rem 1.5rem;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
    }

    .stops-timeline {
      padding: 0.5rem 0.5rem 0.5rem 1rem;

      .timeline-item {
        display: flex;
        gap: 1.25rem;
        position: relative;
        min-height: 56px;

        .node-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 28px;
          flex-shrink: 0;

          .step-num {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: #b71c1c;
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
            box-shadow: 0 1px 3px rgba(183, 28, 28, 0.3);
          }

          .dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            z-index: 2;

            &.origin-dot {
              background: #059669;
              box-shadow: 0 0 0 3px #d1fae5;
            }

            &.dest-dot {
              background: #b71c1c;
              box-shadow: 0 0 0 3px #fee2e2;
            }
          }

          .connector-bar {
            width: 2px;
            flex: 1;
            background: #e2e8f0;
            margin: 4px 0;
          }
        }

        .node-content {
          flex: 1;
          padding-bottom: 1.25rem;

          .node-title {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
          }

          .node-subtitle {
            font-size: 0.75rem;
            color: #64748b;
          }

          .time-badges {
            display: flex;
            gap: 0.4rem;

            .time-chip {
              font-size: 0.72rem;
              font-weight: 600;
              padding: 0.15rem 0.5rem;
              border-radius: 4px;

              &.arr {
                background: #eff6ff;
                color: #2563eb;
                border: 1px solid #bfdbfe;
              }

              &.dep {
                background: #fef2f2;
                color: #b71c1c;
                border: 1px solid #fecaca;
              }
            }
          }
        }
      }
    }

    .modal-custom-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
    }
  `]
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
          const stopsArray = Array.isArray(response) ? response : [];
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
    if (!minutes) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }
}
