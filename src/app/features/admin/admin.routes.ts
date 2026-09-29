import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CitiesComponent } from './pages/cities/cities.component';
import { RoutesComponent } from './pages/routes/routes.component';
import { BusTypes } from './pages/bus-types/bus-types';
import { SeatTemplates } from './pages/seat-templates/seat-templates';
import { Buses } from './pages/buses/buses';
import { SchedulesComponent } from './pages/schedules/schedules';
import { FareConfigurationsComponent } from './pages/fare-configurations/fare-configurations';

export const ADMIN_ROUTES: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'cities', component: CitiesComponent },
  { path: 'routes', component: RoutesComponent },
  { path: 'fare-configurations', component: FareConfigurationsComponent },
  { path: 'bus-types', component: BusTypes },
  { path: 'seat-templates', component: SeatTemplates },
  { path: 'buses', component: Buses },
  { path: 'schedules', component: SchedulesComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
