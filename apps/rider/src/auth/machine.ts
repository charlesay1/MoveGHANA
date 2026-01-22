import type { AuthAction, AuthState } from './types';

export const initialAuthState: AuthState = {
  step: 'welcome',
  phone: '',
  otp: '',
  requestId: undefined,
  token: undefined,
  user: undefined,
  profile: { firstName: '', lastName: '', email: '', acceptedTerms: false },
  locationReady: false,
  isAuthed: false,
};

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'NEXT':
      return { ...state, step: action.next };
    case 'BACK':
      return { ...state, step: action.prev };
    case 'SET_PHONE':
      return { ...state, phone: action.phone };
    case 'SET_OTP':
      return { ...state, otp: action.otp };
    case 'SET_REQUEST_ID':
      return { ...state, requestId: action.requestId };
    case 'SET_TOKEN':
      return { ...state, token: action.token };
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'SET_LOCATION_READY':
      return { ...state, locationReady: action.value };
    case 'SET_PROFILE':
      return { ...state, profile: action.profile };
    case 'COMPLETE':
      return { ...state, isAuthed: true, step: 'home' };
    case 'RESET':
      return initialAuthState;
    default:
      return state;
  }
};
