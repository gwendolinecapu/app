import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { useNotifications } from '../../src/hooks/useNotifications';
import {
    NOTIFICATION_CONFIGS,
    CATEGORY_LABELS,
    FREQUENCY_LABELS,
    NotificationType,
    NotificationFrequency,
} from '../../src/services/NotificationTypes';

export default function NotificationSettingsScreen() {
    const {
        settings,
        loading,
        setGlobalEnabled,
        setPersistentNotification,
        setDynamicIslandEnabled,
        setQuietHours,
        toggleNotification,
        setFrequency,
        sendAffirmation,
    } = useNotifications();

    const [expandedType, setExpandedType] = useState<NotificationType | null>(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    if (loading || !settings) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    const groupedConfigs = NOTIFICATION_CONFIGS.reduce((acc, config) => {
        if (!acc[config.category]) acc[config.category] = [];
        acc[config.category].push(config);
        return acc;
    }, {} as Record<string, typeof NOTIFICATION_CONFIGS>);

    const getPref = (type: NotificationType) =>
        settings.preferences.find(p => p.type === type);

    const handleQuietHoursChange = (type: 'start' | 'end', date: Date) => {
        const hour = date.getHours();
        if (type === 'start') {
            setQuietHours(settings.quietHoursEnabled, hour, settings.quietHoursEnd);
            setShowStartPicker(false);
        } else {
            setQuietHours(settings.quietHoursEnabled, settings.quietHoursStart, hour);
            setShowEndPicker(false);
        }
    };

    const sendTestNotification = async () => {
        await sendAffirmation();
        Alert.alert('Notification envoyée', 'Vérifiez vos notifications !');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Global Toggle */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="notifications" size={24} color={colors.primary} />
                            <Text style={[styles.label, { marginLeft: spacing.sm }]}>
                                Activer les notifications
                            </Text>
                        </View>
                        <Switch
                            value={settings.globalEnabled}
                            onValueChange={setGlobalEnabled}
                            trackColor={{ false: colors.backgroundLight, true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {settings.globalEnabled && (
                    <>
                        {/* Features Avancées */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>⚡ Fonctionnalités Avancées</Text>

                            {/* Notification Persistante */}
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Ionicons name="pin" size={22} color="#F59E0B" />
                                    <View style={styles.rowTextContainer}>
                                        <Text style={styles.label}>Notification Persistante</Text>
                                        <Text style={styles.description}>
                                            Sélection d'alter depuis le fond d'écran
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={settings.persistentNotification}
                                    onValueChange={setPersistentNotification}
                                    trackColor={{ false: colors.backgroundLight, true: '#F59E0B' }}
                                    thumbColor="#fff"
                                />
                            </View>

                            {/* Dynamic Island (iOS only) */}
                            {Platform.OS === 'ios' && (
                                <View style={styles.row}>
                                    <View style={styles.rowLeft}>
                                        <Ionicons name="phone-portrait" size={22} color="#EC4899" />
                                        <View style={styles.rowTextContainer}>
                                            <Text style={styles.label}>Dynamic Island</Text>
                                            <Text style={styles.description}>
                                                Affiche le front actuel en Live Activity
                                            </Text>
                                        </View>
                                    </View>
                                    <Switch
                                        value={settings.dynamicIslandEnabled}
                                        onValueChange={setDynamicIslandEnabled}
                                        trackColor={{ false: colors.backgroundLight, true: '#EC4899' }}
                                        thumbColor="#fff"
                                    />
                                </View>
                            )}
                        </View>

                        {/* Heures Calmes */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🌙 Heures Calmes</Text>
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Ionicons name="moon" size={22} color="#6366F1" />
                                    <View style={styles.rowTextContainer}>
                                        <Text style={styles.label}>Activer les heures calmes</Text>
                                        <Text style={styles.description}>
                                            Pas de notifications pendant cette période
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={settings.quietHoursEnabled}
                                    onValueChange={(enabled) => setQuietHours(enabled)}
                                    trackColor={{ false: colors.backgroundLight, true: '#6366F1' }}
                                    thumbColor="#fff"
                                />
                            </View>

                            {settings.quietHoursEnabled && (
                                <View style={styles.timePickerContainer}>
                                    <TouchableOpacity
                                        style={styles.timePicker}
                                        onPress={() => setShowStartPicker(true)}
                                    >
                                        <Text style={styles.timePickerLabel}>Début</Text>
                                        <Text style={styles.timePickerValue}>
                                            {settings.quietHoursStart}:00
                                        </Text>
                                    </TouchableOpacity>
                                    <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
                                    <TouchableOpacity
                                        style={styles.timePicker}
                                        onPress={() => setShowEndPicker(true)}
                                    >
                                        <Text style={styles.timePickerLabel}>Fin</Text>
                                        <Text style={styles.timePickerValue}>
                                            {settings.quietHoursEnd}:00
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {showStartPicker && (
                                <DateTimePicker
                                    value={new Date().setHours(settings.quietHoursStart, 0, 0, 0) as any}
                                    mode="time"
                                    is24Hour={true}
                                    display="default"
                                    onChange={(_, date) => date && handleQuietHoursChange('start', date)}
                                />
                            )}
                            {showEndPicker && (
                                <DateTimePicker
                                    value={new Date().setHours(settings.quietHoursEnd, 0, 0, 0) as any}
                                    mode="time"
                                    is24Hour={true}
                                    display="default"
                                    onChange={(_, date) => date && handleQuietHoursChange('end', date)}
                                />
                            )}
                        </View>

                        {/* Notifications par catégorie */}
                        {Object.entries(groupedConfigs).map(([category, configs]) => (
                            <View key={category} style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                                </Text>

                                {configs.map(config => {
                                    const pref = getPref(config.id);
                                    const isExpanded = expandedType === config.id;

                                    return (
                                        <View key={config.id}>
                                            <TouchableOpacity
                                                style={styles.notificationRow}
                                                onPress={() => setExpandedType(isExpanded ? null : config.id)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.rowLeft}>
                                                    <View style={styles.rowTextContainer}>
                                                        <Text style={styles.label}>{config.title}</Text>
                                                        <Text style={styles.description} numberOfLines={1}>
                                                            {config.body.slice(0, 45)}
                                                            {config.body.length > 45 ? '...' : ''}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.rowRight}>
                                                    <Switch
                                                        value={pref?.enabled ?? false}
                                                        onValueChange={() => toggleNotification(config.id)}
                                                        trackColor={{ false: colors.backgroundLight, true: colors.primary }}
                                                        thumbColor="#fff"
                                                    />
                                                    {config.defaultFrequency && (
                                                        <Ionicons
                                                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                                            size={16}
                                                            color={colors.textSecondary}
                                                        />
                                                    )}
                                                </View>
                                            </TouchableOpacity>

                                            {/* Fréquence (expandable) */}
                                            {isExpanded && config.defaultFrequency && pref?.enabled && (
                                                <View style={styles.frequencyContainer}>
                                                    <Text style={styles.frequencyLabel}>Fréquence :</Text>
                                                    <View style={styles.frequencyOptions}>
                                                        {(['hourly', 'every_2_hours', 'every_4_hours', 'twice_daily', 'daily'] as NotificationFrequency[]).map(
                                                            freq => (
                                                                <TouchableOpacity
                                                                    key={freq}
                                                                    style={[
                                                                        styles.frequencyOption,
                                                                        pref.frequency === freq && styles.frequencyOptionActive,
                                                                    ]}
                                                                    onPress={() => setFrequency(config.id, freq)}
                                                                >
                                                                    <Text
                                                                        style={[
                                                                            styles.frequencyOptionText,
                                                                            pref.frequency === freq && styles.frequencyOptionTextActive,
                                                                        ]}
                                                                    >
                                                                        {FREQUENCY_LABELS[freq]}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            )
                                                        )}
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        ))}

                        {/* Test Button */}
                        <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
                            <Ionicons name="paper-plane" size={18} color={colors.primary} />
                            <Text style={styles.testButtonText}>Envoyer une notification de test</Text>
                        </TouchableOpacity>
                    </>
                )}

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerTitle: {
        ...typography.h3,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.lg,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rowTextContainer: {
        marginLeft: spacing.sm,
        flex: 1,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        ...typography.body,
        fontWeight: '500',
    },
    description: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    notificationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    timePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingVertical: spacing.md,
    },
    timePicker: {
        backgroundColor: colors.backgroundLight,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    timePickerLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    timePickerValue: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.primary,
        marginTop: 4,
    },
    frequencyContainer: {
        backgroundColor: colors.backgroundLight,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        marginVertical: spacing.xs,
    },
    frequencyLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    frequencyOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    frequencyOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: colors.border,
    },
    frequencyOptionActive: {
        backgroundColor: colors.primary,
    },
    frequencyOptionText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    frequencyOptionTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    testButtonText: {
        color: colors.primary,
        fontWeight: '500',
    },
});
