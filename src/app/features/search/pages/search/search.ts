import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, of, catchError, map, throwError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CityService } from '../../../home/services/city.service';
import { RouteService } from '../../../admin/services/route.service';
import { ScheduleService } from '../../../admin/services/schedule.service';
import { ScheduleResponse } from '../../../admin/models/schedule.models';
import { FleetService } from '../../../admin/services/fleet.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './search.html',
  styleUrl: './search.scss'
})
export class SearchComponent implements OnInit {
  schedules: any[] = [];
  routeStops: any[] = [];
  isLoading = true;
  errorMessage = '';

  fromCityName = '';
  toCityName = '';
  journeyDate = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cityService: CityService,
    private routeService: RouteService,
    private scheduleService: ScheduleService,
    private fleetService: FleetService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const fromId = Number(params['from']);
      const toId = Number(params['to']);
      const date = params['date'];

      if (!fromId || !toId || !date) {
        this.errorMessage = 'Invalid search parameters.';
        this.isLoading = false;
        return;
      }

      this.journeyDate = date;

      console.log('Search params:', { fromId, toId, date });
      
      // Failsafe timeout to force loader off after 5 seconds
      setTimeout(() => {
        if (this.isLoading) {
          console.warn('Failsafe triggered! Loader was stuck.');
          this.isLoading = false;
          this.errorMessage = this.errorMessage || 'Search timed out. Please try again.';
          this.cdr.detectChanges();
        }
      }, 5000);

      // Fetch city names for display
      this.cityService.getAllCities().subscribe({
        next: (cities: any[]) => {
          console.log('Cities fetched:', cities?.length);
          const fromCity = (cities && Array.isArray(cities)) ? cities.find((c: any) => c.id == fromId) : null;
          const toCity = (cities && Array.isArray(cities)) ? cities.find((c: any) => c.id == toId) : null;
          this.fromCityName = fromCity ? fromCity.name : 'Unknown';
          this.toCityName = toCity ? toCity.name : 'Unknown';
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error("Error fetching cities", err);
          this.fromCityName = 'Unknown';
          this.toCityName = 'Unknown';
          this.cdr.detectChanges();
        }
      });

      // Use RxJS switchMap to chain requests cleanly and avoid nested subscription hell
      import('rxjs').then(({ forkJoin }) => {
        this.routeService.searchRoutes(fromId, toId).pipe(
          switchMap(routes => {
            console.log('Routes fetched:', routes);
            if (!routes || !Array.isArray(routes) || routes.length === 0) {
              return throwError(() => new Error('No routes found between these cities.'));
            }
            const routeId = routes[0].id;
            
            return forkJoin({
              schedules: this.scheduleService.searchSchedules(routeId, date),
              routeStops: this.routeService.getStopsForRoute(routeId).pipe(catchError(() => of([])))
            }).pipe(
              switchMap(({ schedules, routeStops }) => {
                console.log('Schedules fetched:', schedules);
                console.log('Route Stops fetched:', routeStops);
                
                this.routeStops = (routeStops && Array.isArray(routeStops)) ? routeStops.sort((a,b) => a.stopOrder - b.stopOrder) : [];

                if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
                  return of([]); // return empty schedules array
                }
                return this.fleetService.getAllBuses().pipe(
                  map(buses => {
                    console.log('Buses fetched:', buses?.length);
                    return schedules.map(s => {
                      const bus = (buses && Array.isArray(buses)) ? buses.find(b => b.id == s.busId) : null;
                      return { ...s, bus: bus };
                    });
                  })
                );
              })
            );
          }),
          catchError(err => {
            console.error('Search error caught:', err);
            this.errorMessage = err.message || 'Error fetching schedules. Please try again.';
            this.isLoading = false;
            this.cdr.detectChanges();
            return of(null);
          })
      ).subscribe(result => {
        console.log('Final mapped result:', result);
        if (result !== null) {
          this.schedules = result;
          if (this.schedules.length === 0 && !this.errorMessage) {
             console.log('No schedules to show');
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      });
      });
    });
  }

  viewSeats(scheduleId: number) {
    this.router.navigate(['/booking/seats'], {
      queryParams: { scheduleId: scheduleId }
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
