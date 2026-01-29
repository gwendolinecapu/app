import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AlterSocialView from '../src/components/social/AlterSocialView';
import { AlterService } from '../src/services/alters';
import { Alter } from '../src/types';
import { SupportedPlatform } from '../src/services/social';

export default function SocialWebRoute() {
    const { alterId, platform } = useLocalSearchParams<{ alterId: string; platform: string }>();
    const [alter, setAlter] = useState<Alter | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlter = async () => {
            if (alterId) {
                try {
                    const data = await AlterService.getAlter(alterId);
                    setAlter(data);
                } catch (error) {
                    console.error('Error fetching alter:', error);
                }
            }
            setLoading(false);
        };
        fetchAlter();
    }, [alterId]);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#FF0050" />
            </View>
        );
    }

    if (!alter || !platform) {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#fff' }}>Alter inconnu ou plateforme manquante.</Text>
            </View>
        );
    }

    return (
        <AlterSocialView
            alter={alter}
            platform={platform as SupportedPlatform}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
