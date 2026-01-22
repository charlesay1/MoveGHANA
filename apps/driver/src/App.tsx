import React, { useEffect, useReducer, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { authReducer, initialAuthState } from './auth/machine';
import { loadAuthState, saveAuthState } from './auth/storage';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { PhoneScreen } from './screens/PhoneScreen';
import { OtpScreen } from './screens/OtpScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LocationScreen } from './screens/LocationScreen';
import { HomeScreen } from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthState().then((stored) => {
      dispatch({ type: 'RESET' });
      if (stored.isAuthed) {
        dispatch({ type: 'SET_PHONE', phone: stored.phone });
        dispatch({ type: 'SET_PROFILE', profile: stored.profile });
        dispatch({ type: 'COMPLETE' });
      } else {
        dispatch({ type: 'NEXT', next: stored.step });
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    saveAuthState(state);
  }, [state]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {state.step === 'welcome' && (
          <Stack.Screen name="welcome">
            {() => (
              <WelcomeScreen onNext={() => dispatch({ type: 'NEXT', next: 'phone' })} />
            )}
          </Stack.Screen>
        )}
        {state.step === 'phone' && (
          <Stack.Screen name="phone">
            {() => (
              <PhoneScreen
                phone={state.phone}
                onBack={() => dispatch({ type: 'NEXT', next: 'welcome' })}
                onSubmit={(phone) => {
                  dispatch({ type: 'SET_PHONE', phone });
                  dispatch({ type: 'NEXT', next: 'otp' });
                }}
              />
            )}
          </Stack.Screen>
        )}
        {state.step === 'otp' && (
          <Stack.Screen name="otp">
            {() => (
              <OtpScreen
                phone={state.phone}
                otp={state.otp}
                onBack={() => dispatch({ type: 'NEXT', next: 'phone' })}
                onSubmit={(otp) => {
                  dispatch({ type: 'SET_OTP', otp });
                  dispatch({ type: 'NEXT', next: 'profile' });
                }}
              />
            )}
          </Stack.Screen>
        )}
        {state.step === 'profile' && (
          <Stack.Screen name="profile">
            {() => (
              <ProfileScreen
                profile={state.profile}
                onBack={() => dispatch({ type: 'NEXT', next: 'otp' })}
                onSubmit={(profile) => {
                  dispatch({ type: 'SET_PROFILE', profile });
                  dispatch({ type: 'NEXT', next: 'location' });
                }}
              />
            )}
          </Stack.Screen>
        )}
        {state.step === 'location' && (
          <Stack.Screen name="location">
            {() => (
              <LocationScreen
                onAllow={() => dispatch({ type: 'COMPLETE' })}
                onSkip={() => dispatch({ type: 'COMPLETE' })}
              />
            )}
          </Stack.Screen>
        )}
        {state.step === 'home' && (
          <Stack.Screen name="home">
            {() => <HomeScreen name={state.profile.firstName} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
