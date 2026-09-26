import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { RouteService } from '../../services/route.service';
import { FleetService } from '../../services/fleet.service';
import { ScheduleService } from '../../services/schedule.service';
import { CityResponse, RouteResponse } from '../../models/route.models';
import { BusResponse, BusTypeResponse } from '../../models/fleet.models';
import { ScheduleResponse } from '../../models/schedule.models';

interface DashboardStats {
  totalCities: number;
  totalRoutes: number;
  totalBuses: number;
  activeBuses: number;
  totalSchedules: number;
  totalBusTypes: number;
  estimatedTotalSeats: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private routeService = inject(RouteService);
  private fleetService = inject(FleetService);
  private scheduleService = inject(ScheduleService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  stats: DashboardStats = {
    totalCities: 0,
    totalRoutes: 0,
    totalBuses: 0,
    activeBuses: 0,
    totalSchedules: 0,
    totalBusTypes: 0,
    estimatedTotalSeats: 0
  };

  recentSchedules: ScheduleResponse[] = [];
  popularRoutes: RouteResponse[] = [];
  busTypes: BusTypeResponse[] = [];
  cities: CityResponse[] = [];
  buses: BusResponse[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    forkJoin({
      cities: this.routeService.getAllCities(),
      routes: this.routeService.getAllRoutes(),
      buses: this.fleetService.getAllBuses(),
      busTypes: this.fleetService.getAllBusTypes(),
      schedules: this.scheduleService.getAllSchedules()
    }).subscribe({
      next: (data) => {
        this.cities = data.cities || [];
        const routes = data.routes || [];
        this.buses = data.buses || [];
        this.busTypes = data.busTypes || [];
        const schedules = data.schedules || [];

        const activeBusesCount = this.buses.filter(b => b.status === 'ACTIVE').length;
        const totalSeats = this.buses.reduce((acc, curr) => acc + (curr.totalSeats || 0), 0);

        this.stats = {
          totalCities: this.cities.length,
          totalRoutes: routes.length,
          totalBuses: this.buses.length,
          activeBuses: activeBusesCount,
          totalSchedules: schedules.length,
          totalBusTypes: this.busTypes.length,
          estimatedTotalSeats: totalSeats
        };

        this.recentSchedules = schedules.slice(0, 5);
        this.popularRoutes = routes.slice(0, 5);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load admin dashboard data:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getRouteLabel(routeId: number): string {
    const found = this.popularRoutes.find(r => r.id === routeId);
    return found ? (found.routeName || `${found.sourceCityName} → ${found.destinationCityName}`) : `Route #${routeId}`;
  }

  getBusLabel(busId: number): string {
    const found = this.buses.find(b => b.id === busId);
    return found ? `${found.busName} (${found.busNumber})` : `Bus #${busId}`;
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }
}
