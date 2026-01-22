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
export type AuthStartResponse = { requestId: string; maskedPhone: string };
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

export type Region = { id: string; name: string; capital: string };
export type City = { id: string; name: string; regionId: string };
export type Landmark = { id: string; name: string; cityId: string; type: string };
export type RolloutPhase = 'phase_1' | 'phase_2' | 'phase_3';

export type TripStatus =
  | 'requested'
  | 'matched'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type TransportMode = 'car' | 'motorbike' | 'pragya' | 'aboboyaa';

export type Trip = {
  id: string;
  riderId: string;
  driverId?: string;
  pickup: { label: string; lat: number; lng: number };
  dropoff: { label: string; lat: number; lng: number };
  mode?: TransportMode;
  status: TripStatus;
};
