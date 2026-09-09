import { Routes } from '@angular/router';
import { SeatSelectionComponent } from './pages/seat-selection/seat-selection';
import { PassengerDetailsComponent } from './pages/passenger-details/passenger-details';
import { PaymentComponent } from './pages/payment/payment';
import { BookingSuccessComponent } from './pages/booking-success/booking-success';

export const BOOKING_ROUTES: Routes = [
  {
    path: 'seats',
    component: SeatSelectionComponent
  },
  {
    path: 'passenger-details',
    component: PassengerDetailsComponent
  },
  {
    path: 'payment',
    component: PaymentComponent
  },
  {
    path: 'success',
    component: BookingSuccessComponent
  }
];
