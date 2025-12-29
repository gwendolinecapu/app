import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import {
    registerForPushNotificationsAsync,
    scheduleDailyNotification,
    cancelAllNotifications,
    getAllScheduledNotifications,
    scheduleRandomNotification
} from '../../src/lib/notifications';

export default function NotificationSettingsScreen() {
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [dailyCheckinEnabled, setDailyCheckinEnabled] = useState(false);
    const [checkinTime, setCheckinTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [randomSupportEnabled, setRandomSupportEnabled] = useState(false);

    useEffect(() => {
        checkPermissionsAndStatus();
    }, []);

    const checkPermissionsAndStatus = async () => {
        const scheduled = await getAllScheduledNotifications();
        // Simple logic: if we have scheduled notifications, we assume enabled.
        // In a real app, we'd save these preferences in Firestore/AsyncStorage.
        // For this sprint, we'll just check if there are any scheduled notifs.
        if (scheduled.length > 0) {
            setNotificationsEnabled(true);
            setDailyCheckinEnabled(true); // Simplified assumption
        }
    };

    const toggleNotifications = async (value: boolean) => {
        if (value) {
            const granted = await registerForPushNotificationsAsync();
            if (!granted) {
                Alert.alert("Permission refusée", "Activez les notifications dans les paramètres de votre appareil.");
                return;
            }
            setNotificationsEnabled(true);
        } else {
            await cancelAllNotifications();
            setNotificationsEnabled(false);
            setDailyCheckinEnabled(false);
            setRandomSupportEnabled(false);
        }
    };

    const toggleDailyCheckin = async (value: boolean) => {
        setDailyCheckinEnabled(value);
        if (value) {
            await scheduleDaily(checkinTime);
        } else {
            // Cancel specific notif logic would go here, for now we just clear and re-schedule if others exist
            // But since we only have this vs random, we can just resync.
            await resyncNotifications(false, randomSupportEnabled, checkinTime);
        }
    };

    const toggleRandomSupport = async (value: boolean) => {
        setRandomSupportEnabled(value);
        if (value && notificationsEnabled) {
            // Simuler ou planifier
            Alert.alert("Activé", "Vous recevrez des messages de soutien occasionnels.");
            // Note: Random scheduling is complex on iOS without background fetch.
            // We will schedule one for testing purposes.
            scheduleRandomNotification();
        }
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate) {
            setCheckinTime(selectedDate);
            if (dailyCheckinEnabled) {
                scheduleDaily(selectedDate);
            }
        }
    };

    const scheduleDaily = async (date: Date) => {
        await cancelAllNotifications(); // Clear old to avoid dupes
        await scheduleDailyNotification(date.getHours(), date.getMinutes());
        if (randomSupportEnabled) {
            // Re-schedule random if needed, but for now we focus on daily
        }
        Alert.alert("Programmé", `Rappel quotidien réglé à ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`);
    };

    // Helper to re-sync everything (simplified)
    const resyncNotifications = async (daily: boolean, random: boolean, time: Date) => {
        await cancelAllNotifications();
        if (daily) {
            await scheduleDailyNotification(time.getHours(), time.getMinutes());
        }
        if (random) {
            // Re-add random logic
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications & Bien-être</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Général</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Activer les notifications</Text>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: colors.backgroundLight, true: colors.primary }}
                            thumbColor={colors.text}
                        />
                    </View>
                </View>

                {notificationsEnabled && (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Rappels Quotidiens</Text>
                            <Text style={styles.sectionDescription}>
                                Recevez un petit rappel pour faire le point sur vos émotions ou simplement pour prendre une pause.
                            </Text>

                            <View style={styles.row}>
                                <Text style={styles.label}>Check-in Quotidien</Text>
                                <Switch
                                    value={dailyCheckinEnabled}
                                    onValueChange={toggleDailyCheckin}
                                    trackColor={{ false: colors.backgroundLight, true: colors.primary }}
                                    thumbColor={colors.text}
                                />
                            </View>

                            {dailyCheckinEnabled && (
                                <View style={styles.row}>
                                    <Text style={styles.label}>Heure du rappel</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowTimePicker(true)}
                                        style={styles.timeButton}
                                    >
                                        <Text style={styles.timeText}>
                                            {checkinTime.getHours()}:{checkinTime.getMinutes().toString().padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {showTimePicker && (
                                <DateTimePicker
                                    value={checkinTime}
                                    mode="time"
                                    is24Hour={true}
                                    display="default"
                                    onChange={onTimeChange}
                                />
                            )}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Soutien Émotionnel</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>Messages de soutien</Text>
                                <Switch
                                    value={randomSupportEnabled}
                                    onValueChange={toggleRandomSupport}
                                    trackColor={{ false: colors.backgroundLight, true: colors.primary }}
                                    thumbColor={colors.text}
                                />
                            </View>
                            <Text style={styles.description}>
                                Recevez occasionnellement des messages bienveillants pour vous rappeler que vous n'êtes pas seul.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.testButton}
                            onPress={() => scheduleRandomNotification()}
                        >
                            <Text style={styles.testButtonText}>Envoyer une notification de test</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.sm,
    },
    backIcon: {
        fontSize: 24,
        color: colors.text,
    },
    headerTitle: {
        ...typography.h3,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        marginBottom: spacing.sm,
        color: colors.primaryLight,
    },
    sectionDescription: {
        ...typography.bodySmall,
        marginBottom: spacing.md,
        color: colors.textSecondary,
    },
    description: {
        ...typography.caption,
        marginTop: spacing.xs,
        color: colors.textSecondary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    label: {
        ...typography.body,
    },
    timeButton: {
        backgroundColor: colors.backgroundLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    timeText: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.primary,
    },
    testButton: {
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    testButtonText: {
        color: colors.textSecondary,
    },
});
