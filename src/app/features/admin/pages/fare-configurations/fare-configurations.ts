import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, of, catchError } from 'rxjs';

import { FareConfigurationService } from '../../services/fare-configuration.service';
import { RouteService } from '../../services/route.service';
import { FleetService } from '../../services/fleet.service';
import {
  FareConfigurationRequest,
  FareConfigurationResponse,
  FareCalculationResponse
} from '../../models/fare-configuration.model';
import { RouteResponse, RouteStopResponse } from '../../models/route.models';
import { BusTypeResponse } from '../../models/fleet.models';
import { ToastService } from '../../../../shared/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';

export interface RouteStopOption {
  cityId: number;
  cityName: string;
  distanceFromOriginKm: number;
  stopOrder: number;
}

export interface SampleSegmentPreview {
  fromCity: string;
  toCity: string;
  distanceKm: number;
  calculatedFare: number;
}

@Component({
  selector: 'app-fare-configurations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DataTableComponent
  ],
  templateUrl: './fare-configurations.html',
  styleUrl: './fare-configurations.scss'
})
export class FareConfigurationsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private fareService = inject(FareConfigurationService);
  private routeService = inject(RouteService);
  private fleetService = inject(FleetService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // Data lists
  configurations: FareConfigurationResponse[] = [];
  routes: RouteResponse[] = [];
  busTypes: BusTypeResponse[] = [];
  stopsCache = new Map<number, RouteStopResponse[]>();

  // UI state
  activeTab: 'matrix' | 'form' | 'calculator' = 'matrix';
  isLoading = false;
  isSubmitting = false;
  isCalculating = false;
  editingId: number | null = null;

  // Table filter state
  filterRouteId: number | null = null;
  filterBusTypeId: number | null = null;
  filterStatus = 'ALL';

  // Forms
  fareForm: FormGroup;
  calcForm: FormGroup;

  // Live calculator & preview state
  calculationResult: FareCalculationResponse | null = null;
  calculatorStops: RouteStopOption[] = [];
  samplePreviews: SampleSegmentPreview[] = [];

  // Data Table Columns definition
  columns: TableColumn[] = [
    { def: 'id', header: 'ID', cell: (element: FareConfigurationResponse) => `#${element.id}` },
    { def: 'busType', header: 'Bus Category', cell: (element: FareConfigurationResponse) => element.busTypeName || `Type #${element.busTypeId}` },
    {
      def: 'route',
      header: 'Applicable Scope',
      cell: (element: FareConfigurationResponse) =>
        element.routeId
          ? `${element.sourceCityName || 'City'} → ${element.destinationCityName || 'City'} (${element.routeTotalDistanceKm || ''} km)`
          : '🌐 All Routes (Global Default)'
    },
    { def: 'rate', header: 'Rate / KM', cell: (element: FareConfigurationResponse) => `₹${Number(element.ratePerKm ?? element.farePerKm ?? 0).toFixed(2)}/km` },
    { def: 'minFare', header: 'Min Fare', cell: (element: FareConfigurationResponse) => `₹${Number(element.minimumFare || 0).toFixed(2)}` },
    {
      def: 'validity',
      header: 'Effective Period',
      cell: (element: FareConfigurationResponse) =>
        `${element.effectiveFrom || ''} ${element.effectiveTo ? '→ ' + element.effectiveTo : '(Ongoing)'}`
    },
    { def: 'status', header: 'Status', cell: (element: FareConfigurationResponse) => element.status || 'ACTIVE' }
  ];

  constructor() {
    const today = new Date().toISOString().split('T')[0];

    this.fareForm = this.fb.group({
      busTypeId: ['', Validators.required],
      routeId: [''], // Optional: null or '' = Global Default Rate
      ratePerKm: ['', [Validators.required, Validators.min(0.01)]],
      minimumFare: [0, [Validators.min(0)]],
      effectiveFrom: [today, Validators.required],
      effectiveTo: [''],
      status: ['ACTIVE', Validators.required]
    });

    this.calcForm = this.fb.group({
      routeId: ['', Validators.required],
      busTypeId: ['', Validators.required],
      sourceCityId: ['', Validators.required],
      destinationCityId: ['', Validators.required],
      travelDate: [today]
    });
  }

  ngOnInit(): void {
    this.loadAllData();

    // Listen for route or rate changes in form to calculate live sample segment preview
    this.fareForm.valueChanges.subscribe(() => {
      this.updateSamplePreviews();
    });

    // Listen for route change in calculator form to load stops
    this.calcForm.get('routeId')?.valueChanges.subscribe((routeId) => {
      if (routeId) {
        this.loadCalculatorStops(Number(routeId));
      } else {
        this.calculatorStops = [];
      }
    });
  }

  filteredConfigurations: FareConfigurationResponse[] = [];

  applyFilters(): void {
    if (!this.configurations) {
      this.filteredConfigurations = [];
      return;
    }
    this.filteredConfigurations = this.configurations.filter((item) => {
      const matchRoute =
        this.filterRouteId === null ||
        this.filterRouteId === undefined ||
        (this.filterRouteId === 0 && !item.routeId) ||
        item.routeId === Number(this.filterRouteId);
      const matchBusType = !this.filterBusTypeId || item.busTypeId === Number(this.filterBusTypeId);
      const matchStatus = !this.filterStatus || this.filterStatus === 'ALL' || item.status === this.filterStatus;
      return matchRoute && matchBusType && matchStatus;
    });
  }

  resetFilters(): void {
    this.filterRouteId = null;
    this.filterBusTypeId = null;
    this.filterStatus = 'ALL';
    this.applyFilters();
  }

  get activeRulesCount(): number {
    return (this.configurations || []).filter((c) => c.status === 'ACTIVE').length;
  }

  get averageRatePerKm(): number {
    if (!this.configurations || this.configurations.length === 0) return 0;
    const total = this.configurations.reduce((acc, curr) => acc + Number(curr.ratePerKm ?? curr.farePerKm ?? 0), 0);
    return +(total / this.configurations.length).toFixed(2);
  }

  loadAllData(): void {
    this.isLoading = true;
    forkJoin({
      configs: this.fareService.getAllFareConfigurations().pipe(catchError((err) => {
        console.warn('Fare configurations not loaded yet or empty:', err);
        return of([] as FareConfigurationResponse[]);
      })),
      routes: this.routeService.getAllRoutes().pipe(catchError((err) => {
        console.warn('Routes could not be loaded:', err);
        return of([] as RouteResponse[]);
      })),
      busTypes: this.fleetService.getAllBusTypes().pipe(catchError((err) => {
        console.warn('Bus types could not be loaded:', err);
        return of([] as BusTypeResponse[]);
      }))
    }).subscribe({
      next: ({ configs, routes, busTypes }) => {
        this.configurations = configs || [];
        this.routes = routes || [];
        this.busTypes = busTypes || [];
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // --- Form Handlers ---

  onSubmit(): void {
    if (this.fareForm.invalid) {
      this.fareForm.markAllAsTouched();
      this.toast.error('Please complete all required fields.');
      return;
    }

    const val = this.fareForm.value;
    const rate = Number(val.ratePerKm);
    const request: FareConfigurationRequest = {
      routeId: val.routeId ? Number(val.routeId) : null,
      busTypeId: Number(val.busTypeId),
      farePerKm: rate,
      ratePerKm: rate,
      minimumFare: val.minimumFare ? Number(val.minimumFare) : 0,
      effectiveFrom: val.effectiveFrom,
      effectiveTo: val.effectiveTo ? val.effectiveTo : null,
      status: val.status
    };

    if (request.effectiveTo && request.effectiveTo < request.effectiveFrom) {
      this.toast.error('Effective To date must be on or after Effective From date.');
      return;
    }

    this.isSubmitting = true;

    if (this.editingId) {
      this.fareService.updateFareConfiguration(this.editingId, request).subscribe({
        next: (updated) => {
          this.toast.success('Fare configuration updated successfully!');
          this.isSubmitting = false;
          this.resetForm();
          this.activeTab = 'matrix';
          this.loadAllData();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err?.error?.message || 'Failed to update fare configuration.';
          this.toast.error(msg);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.fareService.createFareConfiguration(request).subscribe({
        next: (created) => {
          this.toast.success('Fare configuration rule created successfully!');
          this.isSubmitting = false;
          this.resetForm();
          this.activeTab = 'matrix';
          this.loadAllData();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err?.error?.message || 'Failed to create fare configuration.';
          this.toast.error(msg);
          this.cdr.detectChanges();
        }
      });
    }
  }

  onEdit(element: FareConfigurationResponse): void {
    this.editingId = element.id;
    this.fareForm.patchValue({
      busTypeId: element.busTypeId,
      routeId: element.routeId || '',
      ratePerKm: element.ratePerKm ?? element.farePerKm,
      minimumFare: element.minimumFare,
      effectiveFrom: element.effectiveFrom,
      effectiveTo: element.effectiveTo || '',
      status: element.status
    });
    this.activeTab = 'form';
    this.cdr.markForCheck();
  }

  onDelete(element: FareConfigurationResponse): void {
    const label = element.routeId
      ? `${element.busTypeName} (${element.sourceCityName || ''} → ${element.destinationCityName || ''})`
      : `${element.busTypeName} (Global Default)`;

    if (confirm(`Are you sure you want to deactivate or remove fare rule #${element.id} for ${label}?`)) {
      this.fareService.deleteFareConfiguration(element.id).subscribe({
        next: () => {
          this.toast.success(`Fare rule #${element.id} deactivated successfully.`);
          this.loadAllData();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to delete fare configuration.');
        }
      });
    }
  }

  resetForm(): void {
    this.editingId = null;
    const today = new Date().toISOString().split('T')[0];
    this.fareForm.reset({
      busTypeId: '',
      routeId: '',
      ratePerKm: '',
      minimumFare: 0,
      effectiveFrom: today,
      effectiveTo: '',
      status: 'ACTIVE'
    });
    this.samplePreviews = [];
    this.cdr.markForCheck();
  }

  // --- Real-time Sample Previews in Form ---

  private updateSamplePreviews(): void {
    const routeIdVal = this.fareForm.get('routeId')?.value;
    const routeId = routeIdVal ? Number(routeIdVal) : null;
    const ratePerKm = Number(this.fareForm.get('ratePerKm')?.value);
    const minFare = Number(this.fareForm.get('minimumFare')?.value) || 0;

    if (!ratePerKm || ratePerKm <= 0) {
      this.samplePreviews = [];
      return;
    }

    if (!routeId) {
      // Global Bus Type Rate: Generate standard benchmark samples
      const benchmarkDistances = [
        { name: 'Short Commute', km: 50 },
        { name: 'Regional Route', km: 75 },
        { name: 'Mid-Distance Journey', km: 150 },
        { name: 'Long Corridor (e.g. Surat → Ahmedabad)', km: 260 },
        { name: 'Inter-State Expressway', km: 400 }
      ];

      this.samplePreviews = benchmarkDistances.map((bm) => {
        const fare = Math.max(Math.ceil(bm.km * ratePerKm), Math.ceil(minFare));
        return {
          fromCity: bm.name,
          toCity: `${bm.km} km`,
          distanceKm: bm.km,
          calculatedFare: fare
        };
      });
      this.cdr.markForCheck();
      return;
    }

    const route = this.routes.find((r) => r.id === routeId);
    if (!route) return;

    this.ensureRouteStops(routeId, (stops) => {
      // Build ordered list of all stops: Origin -> Stop1 -> Stop2 -> Destination
      const allPoints: RouteStopOption[] = [
        {
          cityId: route.sourceCityId,
          cityName: route.sourceCityName,
          distanceFromOriginKm: 0,
          stopOrder: 0
        },
        ...stops.map((s) => ({
          cityId: s.cityId,
          cityName: s.cityName,
          distanceFromOriginKm: Number(s.distanceFromOriginKm || 0),
          stopOrder: s.stopOrder
        })),
        {
          cityId: route.destinationCityId,
          cityName: route.destinationCityName,
          distanceFromOriginKm: Number(route.distanceKm),
          stopOrder: 9999
        }
      ];

      allPoints.sort((a, b) => a.distanceFromOriginKm - b.distanceFromOriginKm);

      // Generate key segment previews
      const previews: SampleSegmentPreview[] = [];
      for (let i = 0; i < allPoints.length - 1; i++) {
        for (let j = i + 1; j < allPoints.length; j++) {
          const from = allPoints[i];
          const to = allPoints[j];
          const dist = +(to.distanceFromOriginKm - from.distanceFromOriginKm).toFixed(2);
          if (dist > 0) {
            const calculated = Math.max(Math.ceil(dist * ratePerKm), Math.ceil(minFare));
            previews.push({
              fromCity: from.cityName,
              toCity: to.cityName,
              distanceKm: dist,
              calculatedFare: calculated
            });
          }
        }
      }

      this.samplePreviews = previews;
      this.cdr.markForCheck();
    });
  }

  // --- Calculator Simulator Handlers ---

  openCalculatorForRule(element: FareConfigurationResponse): void {
    const targetRouteId = element.routeId || (this.routes.length > 0 ? this.routes[0].id : '');
    this.calcForm.patchValue({
      routeId: targetRouteId,
      busTypeId: element.busTypeId,
      sourceCityId: '',
      destinationCityId: '',
      travelDate: new Date().toISOString().split('T')[0]
    });
    this.activeTab = 'calculator';
    if (targetRouteId) {
      this.loadCalculatorStops(Number(targetRouteId));
    }
    this.calculationResult = null;
    this.cdr.markForCheck();
  }

  loadCalculatorStops(routeId: number): void {
    const route = this.routes.find((r) => r.id === routeId);
    if (!route) {
      this.calculatorStops = [];
      return;
    }

    this.ensureRouteStops(routeId, (stops) => {
      const all: RouteStopOption[] = [
        {
          cityId: route.sourceCityId,
          cityName: route.sourceCityName,
          distanceFromOriginKm: 0,
          stopOrder: 0
        },
        ...stops.map((s) => ({
          cityId: s.cityId,
          cityName: s.cityName,
          distanceFromOriginKm: Number(s.distanceFromOriginKm || 0),
          stopOrder: s.stopOrder
        })),
        {
          cityId: route.destinationCityId,
          cityName: route.destinationCityName,
          distanceFromOriginKm: Number(route.distanceKm),
          stopOrder: 9999
        }
      ];

      all.sort((a, b) => a.distanceFromOriginKm - b.distanceFromOriginKm);
      this.calculatorStops = all;

      // Auto-select origin and destination
      this.calcForm.patchValue({
        sourceCityId: route.sourceCityId,
        destinationCityId: route.destinationCityId
      });
      this.cdr.markForCheck();
    });
  }

  runSimulation(): void {
    if (this.calcForm.invalid) {
      this.calcForm.markAllAsTouched();
      this.toast.error('Please select Route, Bus Type, and both Stops to calculate.');
      return;
    }

    const { routeId, busTypeId, sourceCityId, destinationCityId, travelDate } = this.calcForm.value;

    if (Number(sourceCityId) === Number(destinationCityId)) {
      this.toast.error('Boarding and Dropping points must be different.');
      return;
    }

    this.isCalculating = true;
    this.calculationResult = null;

    this.fareService.calculateFare({
      routeId: Number(routeId),
      busTypeId: Number(busTypeId),
      sourceCityId: Number(sourceCityId),
      destinationCityId: Number(destinationCityId),
      travelDate: travelDate || undefined
    }).subscribe({
      next: (res) => {
        this.calculationResult = res;
        this.isCalculating = false;
        this.toast.success(`Fare calculated: ₹${res.calculatedFare} (${res.distanceKm} km)`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isCalculating = false;
        const msg = err?.error?.message || 'No active fare rule found for this corridor and date.';
        this.toast.error(msg);
        this.cdr.detectChanges();
      }
    });
  }

  private ensureRouteStops(routeId: number, callback: (stops: RouteStopResponse[]) => void): void {
    if (this.stopsCache.has(routeId)) {
      callback(this.stopsCache.get(routeId)!);
      return;
    }

    this.routeService.getStopsForRoute(routeId).subscribe({
      next: (stops) => {
        const sorted = (stops || []).sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));
        this.stopsCache.set(routeId, sorted);
        callback(sorted);
      },
      error: () => {
        this.stopsCache.set(routeId, []);
        callback([]);
      }
    });
  }

  getRouteLabel(routeId: number): string {
    const route = this.routes.find((r) => r.id === routeId);
    return route ? `${route.routeName} (${route.distanceKm} km)` : `Route #${routeId}`;
  }

  getBusTypeLabel(busTypeId: number): string {
    const bt = this.busTypes.find((b) => b.id === busTypeId);
    return bt ? bt.name : `Bus Type #${busTypeId}`;
  }
}
