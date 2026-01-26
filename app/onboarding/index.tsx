import React from 'react';
import { Platform } from 'react-native';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { OnboardingScreenWeb } from '../../src/components/onboarding/OnboardingScreenWeb';

export default function OnboardingRoute() {
    // Utiliser la version web sur navigateur, version native sur iOS/Android
    if (Platform.OS === 'web') {
        return <OnboardingScreenWeb />;
    }
    return <OnboardingScreen />;
}
