import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SessionProvider, useSession } from './session/SessionProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StatusBanner } from './components/StatusBanner';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { PhoneScreen } from './screens/PhoneScreen';
import { OtpScreen } from './screens/OtpScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LocationScreen } from './screens/LocationScreen';
import { HomeScreen } from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

const AppRoutes = () => {
  const {
    state,
    loading,
    goTo,
    startAuth,
    verifyOtp,
    resendOtp,
    updateProfile,
    completeLocation,
    isOnline,
    apiStatus,
    bannerMessage,
  } = useSession();

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>
      {!isOnline && <StatusBanner message="You are offline. Some features may not work." />}
      {apiStatus === 'unreachable' && <StatusBanner tone="error" message="API unreachable." />}
      {bannerMessage && <StatusBanner tone="error" message={bannerMessage} />}
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {state.step === 'welcome' && (
            <Stack.Screen name="welcome">
              {() => <WelcomeScreen onNext={() => goTo('phone')} />}
            </Stack.Screen>
          )}
          {state.step === 'phone' && (
            <Stack.Screen name="phone">
              {() => (
                <PhoneScreen phone={state.phone} onBack={() => goTo('welcome')} onSubmit={startAuth} />
              )}
            </Stack.Screen>
          )}
          {state.step === 'otp' && (
            <Stack.Screen name="otp">
              {() => (
                <OtpScreen
                  phone={state.phone}
                  otp={state.otp}
                  requestId={state.requestId}
                  onBack={() => goTo('phone')}
                  onSubmit={verifyOtp}
                  onResend={resendOtp}
                />
              )}
            </Stack.Screen>
          )}
          {state.step === 'profile' && (
            <Stack.Screen name="profile">
              {() => (
                <ProfileScreen profile={state.profile} onBack={() => goTo('otp')} onSubmit={updateProfile} />
              )}
            </Stack.Screen>
          )}
          {state.step === 'location' && (
            <Stack.Screen name="location">
              {() => <LocationScreen onAllow={completeLocation} onSkip={completeLocation} />}
            </Stack.Screen>
          )}
          {state.step === 'home' && (
            <Stack.Screen name="home">{() => <HomeScreen name={state.profile.firstName} />}</Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </ErrorBoundary>
  );
}
