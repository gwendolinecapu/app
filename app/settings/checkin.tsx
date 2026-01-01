/**
 * CheckInSettingsScreen.tsx
 * Paramètres du Check-In automatique
 * 
 * Permet de configurer :
 * - Activer/désactiver les notifications
 * - Intervalle entre les check-ins (1h à 12h)
 * - Heures calmes (pas de notification)
 * - Type de notification (Dynamic Island ou standard)
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import FrontingCheckInService, { CheckInSettings } from '../../src/services/FrontingCheckInService';

export default function CheckInSettingsScreen() {
    const router = useRouter();
    const [settings, setSettings] = useState<CheckInSettings>({
        enabled: true,
        intervalHours: 4,
        quietHoursStart: 22,
        quietHoursEnd: 8,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const saved = await FrontingCheckInService.getSettings();
            setSettings(saved);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEnabled = async (value: boolean) => {
        setSettings((prev: CheckInSettings) => ({ ...prev, enabled: value }));
        await FrontingCheckInService.setEnabled(value);
    };

    const handleIntervalChange = async (value: number) => {
        const roundedValue = Math.round(value);
        setSettings((prev: CheckInSettings) => ({ ...prev, intervalHours: roundedValue }));
    };

    const handleIntervalComplete = async (value: number) => {
        const roundedValue = Math.round(value);
        await FrontingCheckInService.setIntervalHours(roundedValue);
    };

    const handleTestNotification = async () => {
        Alert.alert(
            'Test de notification',
            'Voulez-vous envoyer une notification de test ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Envoyer',
                    onPress: async () => {
                        await FrontingCheckInService.sendImmediateCheckIn();
                        Alert.alert('✅', 'Notification envoyée !');
                    },
                },
            ]
        );
    };

    const formatInterval = (hours: number): string => {
        if (hours === 1) return '1 heure';
        return `${hours} heures`;
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
                    <Text style={styles.emoji}>🎭</Text>
                    <Text style={styles.title}>Check-In Automatique</Text>
                    <Text style={styles.subtitle}>
                        Recevez des rappels pour indiquer qui est en front
                    </Text>
                </View>

                {/* Toggle Activé */}
                <View style={styles.section}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Activer les rappels</Text>
                            <Text style={styles.settingDescription}>
                                Recevoir des notifications périodiques
                            </Text>
                        </View>
                        <Switch
                            value={settings.enabled}
                            onValueChange={handleToggleEnabled}
                            trackColor={{ false: '#3e3e3e', true: '#8B5CF6' }}
                            thumbColor={settings.enabled ? '#FFFFFF' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Intervalle */}
                {settings.enabled && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Fréquence</Text>

                        <View style={styles.intervalContainer}>
                            <Text style={styles.intervalValue}>
                                Toutes les {formatInterval(settings.intervalHours)}
                            </Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={1}
                                maximumValue={12}
                                step={1}
                                value={settings.intervalHours}
                                onValueChange={handleIntervalChange}
                                onSlidingComplete={handleIntervalComplete}
                                minimumTrackTintColor="#8B5CF6"
                                maximumTrackTintColor="#3e3e3e"
                                thumbTintColor="#FFFFFF"
                            />
                            <View style={styles.sliderLabels}>
                                <Text style={styles.sliderLabel}>1h</Text>
                                <Text style={styles.sliderLabel}>12h</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Heures calmes */}
                {settings.enabled && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Heures calmes</Text>
                        <View style={styles.quietHoursCard}>
                            <Text style={styles.quietHoursIcon}>🌙</Text>
                            <View style={styles.quietHoursInfo}>
                                <Text style={styles.quietHoursLabel}>
                                    Pas de notification entre
                                </Text>
                                <Text style={styles.quietHoursValue}>
                                    {settings.quietHoursStart}h00 et {settings.quietHoursEnd}h00
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.quietHoursHint}>
                            Les notifications seront reportées au matin
                        </Text>
                    </View>
                )}

                {/* Dynamic Island */}
                {settings.enabled && (
                    <View style={styles.section}>
                        <View style={styles.featureCard}>
                            <Text style={styles.featureIcon}>🏝️</Text>
                            <View style={styles.featureInfo}>
                                <Text style={styles.featureLabel}>Dynamic Island</Text>
                                <Text style={styles.featureDescription}>
                                    Sur iPhone 14 Pro+, le rappel s'affiche dans le Dynamic Island
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Test */}
                {settings.enabled && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.testButton}
                            onPress={handleTestNotification}
                        >
                            <Text style={styles.testButtonIcon}>🔔</Text>
                            <Text style={styles.testButtonText}>
                                Tester une notification
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Info */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>Comment ça marche ?</Text>
                    <Text style={styles.infoText}>
                        À intervalles réguliers, vous recevrez une notification vous demandant qui est actuellement en front. Vous pouvez :
                    </Text>
                    <View style={styles.infoBullet}>
                        <Text style={styles.infoBulletIcon}>•</Text>
                        <Text style={styles.infoBulletText}>
                            Confirmer que c'est le même fronter
                        </Text>
                    </View>
                    <View style={styles.infoBullet}>
                        <Text style={styles.infoBulletIcon}>•</Text>
                        <Text style={styles.infoBulletText}>
                            Changer de fronter rapidement
                        </Text>
                    </View>
                    <View style={styles.infoBullet}>
                        <Text style={styles.infoBulletIcon}>•</Text>
                        <Text style={styles.infoBulletText}>
                            Déclarer un co-front
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
    intervalContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
    },
    intervalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#8B5CF6',
        textAlign: 'center',
        marginBottom: 12,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    sliderLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    quietHoursCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
    },
    quietHoursIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    quietHoursInfo: {
        flex: 1,
    },
    quietHoursLabel: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    quietHoursValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: 4,
    },
    quietHoursHint: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 8,
        paddingLeft: 4,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
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
    },
    featureDescription: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    testButtonIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    testButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    infoSection: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    infoBullet: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    infoBulletIcon: {
        fontSize: 14,
        color: '#8B5CF6',
        marginRight: 8,
        lineHeight: 20,
    },
    infoBulletText: {
        flex: 1,
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
});
