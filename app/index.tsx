import LoginScreen from '@/components/LoginScreen';
import OnboardingScreen from '@/components/OnboardingScreen';
import { UserScreen } from '@/components/UserScreen';
import { useOpenfort } from '@openfort/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function Index() {
  const { user } = useOpenfort();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]); // Add user as dependency to re-run when user changes

  const checkOnboardingStatus = async () => {
    try {
      if (user) {
        // When user logs in, always reset onboarding to false and clear stored data
        await AsyncStorage.removeItem('onboardingCompleted');
        await AsyncStorage.removeItem('onboardingAnswers');
        setOnboardingCompleted(false);
      } else {
        // When no user, check if there's stored onboarding status
        const completed = await AsyncStorage.getItem('onboardingCompleted');
        setOnboardingCompleted(completed === 'true');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setOnboardingCompleted(true);
  };

  console.log('User:', user);
  console.log('Onboarding completed:', onboardingCompleted);
  console.log('Loading:', loading);

  // Show loading state while checking onboarding status
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#0f0f23'
      }}>
        <ActivityIndicator size="large" color="#00ff9d" />
        <Text style={{ color: '#ffffff', marginTop: 20 }}>Loading...</Text>
      </View>
    );
  }

  // If no user, show login screen
  if (!user) {
    return <LoginScreen />;
  }

  // If user exists but onboarding not completed, show onboarding
  if (!onboardingCompleted) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // If user exists and onboarding completed, show user screen
  return <UserScreen />;
}
