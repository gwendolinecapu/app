import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Platform,
    StatusBar,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../src/lib/theme';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import {
    ColorBlindMode,
    COLOR_BLIND_LABELS,
    PREVIEW_COLORS,
    transformColor,
} from '../../src/lib/colorBlind';
import { triggerHaptic } from '../../src/lib/haptics';

const COLOR_BLIND_OPTIONS: ColorBlindMode[] = [
    'none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia',
];

export default function AccessibilitySettings() {
    const { settings, updateSetting } = useAccessibility();

    const handleColorBlindChange = (mode: ColorBlindMode) => {
        updateSetting('colorBlindMode', mode);
        triggerHaptic.light();
    };

    const handleToggle = (key: 'largeText' | 'highContrast' | 'reduceMotion' | 'reduceTransparency') => {
        updateSetting(key, !settings[key]);
        triggerHaptic.light();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Ionicons name="accessibility" size={22} color={colors.primary} />
                <Text style={styles.headerTitle}>Accessibilité</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Daltonisme */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Daltonisme</Text>
                    <Text style={styles.sectionDesc}>
                        Adapte les couleurs de l'application à ta vision.
                    </Text>

                    {COLOR_BLIND_OPTIONS.map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[
                                styles.radioRow,
                                settings.colorBlindMode === mode && styles.radioRowSelected,
                            ]}
                            onPress={() => handleColorBlindChange(mode)}
                        >
                            <View style={styles.radioLeft}>
                                <View style={[
                                    styles.radio,
                                    settings.colorBlindMode === mode && styles.radioActive,
                                ]}>
                                    {settings.colorBlindMode === mode && (
                                        <View style={styles.radioDot} />
                                    )}
                                </View>
                                <Text style={styles.radioLabel}>
                                    {COLOR_BLIND_LABELS[mode]}
                                </Text>
                            </View>

                            {/* Preview des couleurs transformées */}
                            <View style={styles.colorPreview}>
                                {PREVIEW_COLORS.map((c, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.colorDot,
                                            { backgroundColor: transformColor(c, mode) },
                                        ]}
                                    />
                                ))}
                            </View>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* Affichage */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Affichage</Text>

                    <ToggleRow
                        label="Texte agrandi"
                        desc="Augmente la taille du texte de 30%"
                        icon="text-outline"
                        value={settings.largeText}
                        onToggle={() => handleToggle('largeText')}
                    />
                    <ToggleRow
                        label="Contraste élevé"
                        desc="Renforce les bordures et le contraste"
                        icon="contrast-outline"
                        value={settings.highContrast}
                        onToggle={() => handleToggle('highContrast')}
                    />
                    <ToggleRow
                        label="Réduire la transparence"
                        desc="Remplace les fonds semi-transparents par des fonds opaques"
                        icon="layers-outline"
                        value={settings.reduceTransparency}
                        onToggle={() => handleToggle('reduceTransparency')}
                    />
                </Animated.View>

                {/* Mouvement */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Mouvement</Text>

                    <ToggleRow
                        label="Réduire les animations"
                        desc="Désactive les animations et transitions"
                        icon="flash-off-outline"
                        value={settings.reduceMotion}
                        onToggle={() => handleToggle('reduceMotion')}
                    />
                </Animated.View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

function ToggleRow({ label, desc, icon, value, onToggle }: {
    label: string;
    desc: string;
    icon: string;
    value: boolean;
    onToggle: () => void;
}) {
    return (
        <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
                <Ionicons name={icon as any} size={20} color={colors.primary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>{label}</Text>
                    <Text style={styles.toggleDesc}>{desc}</Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.primary }}
                thumbColor="#FFF"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        gap: 8,
    },
    backButton: {
        marginRight: 4,
    },
    headerTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: spacing.md,
    },
    section: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    sectionDesc: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        marginBottom: 12,
    },

    // Radio rows (colorblind picker)
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: borderRadius.md,
        marginBottom: 4,
    },
    radioRowSelected: {
        backgroundColor: 'rgba(139,92,246,0.1)',
    },
    radioLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        borderColor: colors.primary,
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
    radioLabel: {
        color: colors.text,
        fontSize: 14,
    },
    colorPreview: {
        flexDirection: 'row',
        gap: 4,
    },
    colorDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },

    // Toggle rows
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    toggleLabel: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    toggleDesc: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 2,
    },
});
