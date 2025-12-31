import { Redirect } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { View, StyleSheet } from 'react-native';
import { colors } from '../src/lib/theme';
import { storage } from '../src/lib/storage';
import { BackgroundBubbles } from '../src/components/ui/BackgroundBubbles';

export default function Index() {
    const { user, loading: authLoading } = useAuth();
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            const seen = await storage.hasSeenOnboarding();
            setIsFirstLaunch(!seen);
        };
        checkOnboarding();
    }, []);

    if (authLoading || isFirstLaunch === null) {
        return (
            <View style={styles.container}>
                <BackgroundBubbles />
            </View>
        );
    }

    if (user) {
        return <Redirect href="/(tabs)/dashboard" />;
    }

    if (isFirstLaunch) {
        return <Redirect href="/onboarding" />;
    }

    return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});
