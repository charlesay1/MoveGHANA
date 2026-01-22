export type AuthStep = 'welcome' | 'phone' | 'otp' | 'profile' | 'location' | 'home';

export type Profile = {
  firstName: string;
  lastName?: string;
  email?: string;
  acceptedTerms: boolean;
};

export type AuthState = {
  step: AuthStep;
  phone: string;
  otp: string;
  profile: Profile;
  isAuthed: boolean;
};

export type AuthAction =
  | { type: 'NEXT'; next: AuthStep }
  | { type: 'BACK'; prev: AuthStep }
  | { type: 'SET_PHONE'; phone: string }
  | { type: 'SET_OTP'; otp: string }
  | { type: 'SET_PROFILE'; profile: Profile }
  | { type: 'COMPLETE' }
  | { type: 'RESET' };
