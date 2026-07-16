import { Routes } from '@angular/router';
import { CitiesComponent } from './pages/cities/cities.component';
import { RoutesComponent } from './pages/routes/routes.component';
import { BusTypes } from './pages/bus-types/bus-types';
import { SeatTemplates } from './pages/seat-templates/seat-templates';
import { Buses } from './pages/buses/buses';
import { SchedulesComponent } from './pages/schedules/schedules';

export const ADMIN_ROUTES: Routes = [
  { path: 'cities', component: CitiesComponent },
  { path: 'routes', component: RoutesComponent },
  { path: 'bus-types', component: BusTypes },
  { path: 'seat-templates', component: SeatTemplates },
  { path: 'buses', component: Buses },
  { path: 'schedules', component: SchedulesComponent },
  { path: '', redirectTo: 'cities', pathMatch: 'full' }
];
