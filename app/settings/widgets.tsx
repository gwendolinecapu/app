/**
 * WidgetsSettingsScreen.tsx
 * Paramètres des Widgets et Dynamic Island
 * 
 * Permet de configurer :
 * - Dynamic Island (activer/désactiver)
 * - Widgets iOS Home Screen
 * - Widgets Android Home Screen
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    Platform,
    Alert,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicIslandService from '../../src/services/DynamicIslandService';

export default function WidgetsSettingsScreen() {
    const router = useRouter();
    const [dynamicIslandEnabled, setDynamicIslandEnabled] = useState(true);
    const [dynamicIslandAvailable, setDynamicIslandAvailable] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const availability = await DynamicIslandService.checkAvailability();
            setDynamicIslandAvailable(availability.available);

            const enabled = await DynamicIslandService.isEnabled();
            setDynamicIslandEnabled(enabled);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDynamicIsland = async (value: boolean) => {
        setDynamicIslandEnabled(value);
        await DynamicIslandService.setEnabled(value);
    };

    const openWidgetGuide = () => {
        Alert.alert(
            'Ajouter un Widget',
            Platform.OS === 'ios'
                ? '1. Restez appuyé sur l\'écran d\'accueil\n2. Tapez le + en haut à gauche\n3. Cherchez "PluralConnect"\n4. Choisissez votre widget'
                : '1. Restez appuyé sur l\'écran d\'accueil\n2. Tapez "Widgets"\n3. Cherchez "PluralConnect"\n4. Glissez vers l\'écran d\'accueil',
            [{ text: 'OK' }]
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#1a1a2e', '#16213e', '#0f0f23']}
                    style={StyleSheet.absoluteFill}
                />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f0f23']}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>📱</Text>
                    <Text style={styles.title}>Widgets & Dynamic Island</Text>
                    <Text style={styles.subtitle}>
                        Affichez vos infos sur l'écran d'accueil
                    </Text>
                </View>

                {/* Dynamic Island (iOS only) */}
                {Platform.OS === 'ios' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Dynamic Island</Text>

                        {dynamicIslandAvailable ? (
                            <>
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingLabel}>Activer le Dynamic Island</Text>
                                        <Text style={styles.settingDescription}>
                                            Affiche le fronter actuel dans le Dynamic Island
                                        </Text>
                                    </View>
                                    <Switch
                                        value={dynamicIslandEnabled}
                                        onValueChange={handleToggleDynamicIsland}
                                        trackColor={{ false: '#3e3e3e', true: '#8B5CF6' }}
                                        thumbColor={dynamicIslandEnabled ? '#FFFFFF' : '#f4f3f4'}
                                    />
                                </View>

                                <View style={styles.featureCard}>
                                    <Text style={styles.featureIcon}>🏝️</Text>
                                    <View style={styles.featureInfo}>
                                        <Text style={styles.featureLabel}>Fonctionnalités</Text>
                                        <Text style={styles.featureDescription}>
                                            • Avatar et nom du fronter{'\n'}
                                            • Durée depuis le switch{'\n'}
                                            • Boutons d'action rapide{'\n'}
                                            • Notifications de switch
                                        </Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.unavailableCard}>
                                <Text style={styles.unavailableIcon}>📵</Text>
                                <Text style={styles.unavailableTitle}>
                                    Non disponible
                                </Text>
                                <Text style={styles.unavailableDescription}>
                                    Le Dynamic Island nécessite un iPhone 14 Pro ou plus récent
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Widgets */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Widgets Home Screen</Text>

                    <View style={styles.widgetGrid}>
                        <View style={styles.widgetCard}>
                            <Text style={styles.widgetSize}>Small</Text>
                            <Text style={styles.widgetName}>Qui est là ?</Text>
                            <Text style={styles.widgetDescription}>
                                Fronter actuel
                            </Text>
                        </View>

                        <View style={styles.widgetCard}>
                            <Text style={styles.widgetSize}>Medium</Text>
                            <Text style={styles.widgetName}>Switch Rapide</Text>
                            <Text style={styles.widgetDescription}>
                                4 alters favoris
                            </Text>
                        </View>

                        <View style={styles.widgetCard}>
                            <Text style={styles.widgetSize}>Large</Text>
                            <Text style={styles.widgetName}>Vue du Jour</Text>
                            <Text style={styles.widgetDescription}>
                                Stats + wellness
                            </Text>
                        </View>
                    </View>

                    <View style={styles.helpCard}>
                        <Text style={styles.helpTitle}>💡 Comment ajouter un widget ?</Text>
                        <Text style={styles.helpText}>
                            {Platform.OS === 'ios'
                                ? 'Restez appuyé sur l\'écran d\'accueil, puis tapez le "+" en haut à gauche.'
                                : 'Restez appuyé sur l\'écran d\'accueil, puis sélectionnez "Widgets".'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
    },
    loadingText: {
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 100,
    },
    header: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    featureIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    featureInfo: {
        flex: 1,
    },
    featureLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8B5CF6',
        marginBottom: 8,
    },
    featureDescription: {
        fontSize: 12,
        color: '#9CA3AF',
        lineHeight: 18,
    },
    unavailableCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 24,
    },
    unavailableIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    unavailableTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 8,
    },
    unavailableDescription: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    widgetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    widgetCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        marginRight: '4%',
    },
    widgetSize: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8B5CF6',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    widgetName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    widgetDescription: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    helpCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    helpTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    helpText: {
        fontSize: 12,
        color: '#9CA3AF',
        lineHeight: 18,
    },
});
