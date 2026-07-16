export interface CityRequest {
  name: string;
  state: string;
}

export interface CityResponse {
  id: number;
  name: string;
  state: string;
}

export interface RouteRequest {
  routeName: string;
  sourceCityId: number;
  destinationCityId: number;
  distanceKm: number;
  estimatedDurationMinutes: number;
}

export interface RouteResponse {
  id: number;
  routeName: string;
  sourceCityId: number;
  sourceCityName: string;
  destinationCityId: number;
  destinationCityName: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
}

export interface RouteStopRequest {
  cityId: number;
  stopOrder: number;
  arrivalOffsetMinutes: number;
  departureOffsetMinutes: number;
}

export interface RouteStopResponse {
  id: number;
  routeId: number;
  cityId: number;
  cityName: string;
  stopOrder: number;
  arrivalOffsetMinutes: number;
  departureOffsetMinutes: number;
}
