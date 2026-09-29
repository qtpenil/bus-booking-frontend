export type FareConfigurationStatus = 'ACTIVE' | 'INACTIVE';

export interface FareConfigurationRequest {
  routeId?: number | null; // null/empty = Global default for this bus category
  busTypeId: number;
  farePerKm: number;
  ratePerKm?: number;
  minimumFare?: number;
  effectiveFrom: string; // ISO date 'YYYY-MM-DD'
  effectiveTo?: string | null; // ISO date 'YYYY-MM-DD' or null
  status?: FareConfigurationStatus;
}

export interface FareConfigurationResponse {
  id: number;
  routeId?: number | null;
  routeName?: string | null;
  sourceCityName?: string | null;
  destinationCityName?: string | null;
  routeTotalDistanceKm?: number | null;
  busTypeId: number;
  busTypeName: string;
  farePerKm: number;
  ratePerKm?: number;
  minimumFare: number;
  fullRouteFare?: number | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: FareConfigurationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface FareCalculationRequest {
  routeId: number;
  busTypeId: number;
  sourceCityId: number;
  destinationCityId: number;
  travelDate?: string; // ISO date 'YYYY-MM-DD'
}

export interface FareCalculationResponse {
  routeId: number;
  busTypeId: number;
  sourceCityId: number;
  sourceCityName: string;
  destinationCityId: number;
  destinationCityName: string;
  distanceKm: number;
  farePerKm: number;
  ratePerKm?: number;
  minimumFare: number;
  calculatedFare: number;
  travelDate?: string;
  fareConfigurationId?: number;
}
