import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SessionProvider, useSession } from './session/SessionProvider';
import { LocationProvider } from './context/LocationProvider';
import { BookingProvider } from './context/BookingProvider';
import { ToastProvider } from './context/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StatusBanner } from './components/StatusBanner';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { PhoneScreen } from './screens/PhoneScreen';
import { OtpScreen } from './screens/OtpScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LocationScreen } from './screens/LocationScreen';
import { HomeMapScreen } from './screens/HomeMapScreen';
import { DestinationSelectScreen } from './screens/DestinationSelectScreen';
import { VehicleSelectScreen } from './screens/VehicleSelectScreen';
import { FarePreviewScreen } from './screens/FarePreviewScreen';
import { RequestRideScreen } from './screens/RequestRideScreen';

const AuthStackNav = createNativeStackNavigator();
const SetupStackNav = createNativeStackNavigator();
const MainStackNav = createNativeStackNavigator();

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

  const flow = ['welcome', 'phone', 'otp'].includes(state.step)
    ? 'auth'
    : ['profile', 'location'].includes(state.step)
      ? 'setup'
      : 'main';

  return (
    <View style={{ flex: 1 }}>
      {!isOnline && <StatusBanner message="You are offline. Some features may not work." />}
      {apiStatus === 'unreachable' && <StatusBanner tone="error" message="API unreachable." />}
      {bannerMessage && <StatusBanner tone="error" message={bannerMessage} />}
      <NavigationContainer>
        {flow === 'auth' && (
          <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
            {state.step === 'welcome' && (
              <AuthStackNav.Screen name="welcome">
                {() => <WelcomeScreen onNext={() => goTo('phone')} />}
              </AuthStackNav.Screen>
            )}
            {state.step === 'phone' && (
              <AuthStackNav.Screen name="phone">
                {() => (
                  <PhoneScreen phone={state.phone} onBack={() => goTo('welcome')} onSubmit={startAuth} />
                )}
              </AuthStackNav.Screen>
            )}
            {state.step === 'otp' && (
              <AuthStackNav.Screen name="otp">
                {() => (
                    <OtpScreen
                      phone={state.phone}
                      maskedPhone={state.maskedPhone}
                      otp={state.otp}
                      requestId={state.requestId}
                    onBack={() => goTo('phone')}
                    onSubmit={verifyOtp}
                    onResend={resendOtp}
                  />
                )}
              </AuthStackNav.Screen>
            )}
          </AuthStackNav.Navigator>
        )}
        {flow === 'setup' && (
          <SetupStackNav.Navigator screenOptions={{ headerShown: false }}>
            {state.step === 'profile' && (
              <SetupStackNav.Screen name="profile">
                {() => (
                  <ProfileScreen profile={state.profile} onBack={() => goTo('otp')} onSubmit={updateProfile} />
                )}
              </SetupStackNav.Screen>
            )}
            {state.step === 'location' && (
              <SetupStackNav.Screen name="location">
                {() => <LocationScreen onAllow={completeLocation} onSkip={completeLocation} />}
              </SetupStackNav.Screen>
            )}
          </SetupStackNav.Navigator>
        )}
        {flow === 'main' && (
          <MainStackNav.Navigator screenOptions={{ headerShown: false }}>
            {state.step === 'home' && (
              <MainStackNav.Screen name="home">
                {() => <HomeMapScreen onWhereTo={() => goTo('destination')} />}
              </MainStackNav.Screen>
            )}
            {state.step === 'destination' && (
              <MainStackNav.Screen name="destination">
                {() => (
                  <DestinationSelectScreen onBack={() => goTo('home')} onNext={() => goTo('vehicle')} />
                )}
              </MainStackNav.Screen>
            )}
            {state.step === 'vehicle' && (
              <MainStackNav.Screen name="vehicle">
                {() => (
                  <VehicleSelectScreen onBack={() => goTo('destination')} onNext={() => goTo('fare')} />
                )}
              </MainStackNav.Screen>
            )}
            {state.step === 'fare' && (
              <MainStackNav.Screen name="fare">
                {() => (
                  <FarePreviewScreen onBack={() => goTo('vehicle')} onRequest={() => goTo('request')} />
                )}
              </MainStackNav.Screen>
            )}
            {state.step === 'request' && (
              <MainStackNav.Screen name="request">
                {() => <RequestRideScreen onDone={() => goTo('home')} />}
              </MainStackNav.Screen>
            )}
          </MainStackNav.Navigator>
        )}
      </NavigationContainer>
    </View>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SessionProvider>
          <LocationProvider>
            <BookingProvider>
              <AppRoutes />
            </BookingProvider>
          </LocationProvider>
        </SessionProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
