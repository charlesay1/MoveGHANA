export type AppStep =
  | 'welcome'
  | 'phone'
  | 'otp'
  | 'profile'
  | 'location'
  | 'home'
  | 'destination'
  | 'vehicle'
  | 'fare'
  | 'request';

export type Profile = {
  firstName: string;
  lastName?: string;
  email?: string;
  acceptedTerms: boolean;
};

export type AuthState = {
  step: AppStep;
  phone: string;
  otp: string;
  requestId?: string;
  maskedPhone?: string;
  token?: string;
  user?: {
    id: string;
    phone: string;
    role: 'rider';
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  profile: Profile;
  locationReady: boolean;
  isAuthed: boolean;
};

export type AuthAction =
  | { type: 'NEXT'; next: AppStep }
  | { type: 'BACK'; prev: AppStep }
  | { type: 'SET_PHONE'; phone: string }
  | { type: 'SET_OTP'; otp: string }
  | { type: 'SET_REQUEST_ID'; requestId?: string }
  | { type: 'SET_MASKED_PHONE'; maskedPhone?: string }
  | { type: 'SET_TOKEN'; token?: string }
  | { type: 'SET_USER'; user?: AuthState['user'] }
  | { type: 'SET_LOCATION_READY'; value: boolean }
  | { type: 'SET_PROFILE'; profile: Profile }
  | { type: 'COMPLETE' }
  | { type: 'RESET' };
