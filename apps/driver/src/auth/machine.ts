import type { AuthAction, AuthState } from './types';

export const initialAuthState: AuthState = {
  step: 'welcome',
  phone: '',
  otp: '',
  profile: { firstName: '', lastName: '', email: '', acceptedTerms: false },
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
