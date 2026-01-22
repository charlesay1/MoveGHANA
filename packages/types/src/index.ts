export type UserRole = 'rider' | 'driver' | 'business' | 'admin';

export type User = {
  id: string;
  role: UserRole;
  phone: string;
  firstName: string;
  lastName?: string;
  email?: string;
};

export type AuthStartRequest = { phone: string };
export type AuthStartResponse = { requestId: string; maskedPhone: string; expiresInSeconds: number };
export type AuthVerifyRequest = { requestId: string; code: string };
export type AuthVerifyResponse = { token: string; user: { id: string; phone: string; role: 'rider' } };
export type UserMeResponse = {
  id: string;
  phone: string;
  role: 'rider';
  firstName?: string;
  lastName?: string;
  email?: string;
};
export type UpdateProfileRequest = { firstName: string; lastName?: string; email?: string };
export type UpdateProfileResponse = UserMeResponse;

export type DriverProfile = {
  userId: string;
  licenseNumber: string;
  verified: boolean;
};

export type RegionTier = 'metro' | 'urban' | 'rural';
export type Region = { id: string; name: string; capital: string; tier?: RegionTier };
export type City = { id: string; name: string; regionId: string };
export type LandmarkCategory =
  | 'market'
  | 'junction'
  | 'church'
  | 'lorry_station'
  | 'mall'
  | 'hospital'
  | 'school'
  | 'government';
export type Landmark = {
  id: string;
  name: string;
  regionId?: string;
  city?: string;
  cityId?: string;
  category?: LandmarkCategory;
  type?: string;
  lat?: number;
  lng?: number;
};
export type RolloutPhase = 'phase_1' | 'phase_2' | 'phase_3';

export type TripStatus =
  | 'requested'
  | 'matched'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type TransportMode = 'car' | 'motorbike' | 'pragya' | 'aboboyaa';

export type RideStatus = 'searching' | 'matched' | 'cancelled';

export type RideRequestPayload = {
  pickup: { label: string; lat: number; lng: number };
  dropoff: { label: string; lat: number; lng: number };
  mode: TransportMode;
  distanceKm: number;
  fare: number;
};

export type RideResponse = {
  rideId: string;
  status: RideStatus;
  etaMinutes: number;
  fare: number;
  mode: TransportMode;
};

export type RideStatusResponse = RideResponse;

export type RideEstimate = { price: number; etaMinutes: number };

export type Trip = {
  id: string;
  riderId: string;
  driverId?: string;
  pickup: { label: string; lat: number; lng: number };
  dropoff: { label: string; lat: number; lng: number };
  mode?: TransportMode;
  status: TripStatus;
};

export type FareEstimateRequest = {
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode: TransportMode;
  regionId?: string;
  distanceKm?: number;
};

export type FareEstimateBreakdown = {
  baseFare: number;
  distanceFare: number;
  vehicleMultiplier: number;
  regionMultiplier: number;
  total: number;
};

export type FareEstimateResponse = {
  currency: 'GHS';
  distanceKm: number;
  regionId: string;
  mode: TransportMode;
  breakdown: FareEstimateBreakdown;
  total: number;
};

export type Driver = {
  id: string;
  userId: string;
  status: 'offline' | 'available' | 'busy';
  vehicleId?: string;
};

export type Vehicle = {
  id: string;
  type: TransportMode;
  plate: string;
  color?: string;
  capacity?: number;
};

export type Ride = {
  id: string;
  riderId: string;
  driverId?: string;
  status: RideStatus;
  pickup: { label: string; lat: number; lng: number };
  dropoff: { label: string; lat: number; lng: number };
  fareId?: string;
};

export type Fare = {
  id: string;
  amount: number;
  currency: 'GHS';
  breakdown?: FareEstimateBreakdown;
};
