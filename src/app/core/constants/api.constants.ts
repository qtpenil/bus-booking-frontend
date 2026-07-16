import { environment } from '../../../environments/environment';

export const API_URLS = {
  AUTH: `${environment.api.gatewayUrl}/auth`,
  BOOKINGS: `${environment.api.gatewayUrl}/api/v1/bookings`,
  FLEET: `${environment.api.gatewayUrl}/api/v1/fleet`,
  PAYMENTS: `${environment.api.gatewayUrl}/api/v1/payments`,
  ROUTES: `${environment.api.gatewayUrl}/api/v1/routes`,
  CITIES: `${environment.api.gatewayUrl}/api/v1/cities`,
  SCHEDULES: `${environment.api.gatewayUrl}/api/v1/schedules`
};
