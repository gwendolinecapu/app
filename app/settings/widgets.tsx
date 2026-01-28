/**
 * WidgetsSettingsScreen.tsx
 * Paramètres des Widgets et Dynamic Island
 *
 * Permet de configurer :
 * - Dynamic Island (activer/désactiver + style)
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
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
    FadeIn,
    FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DynamicIslandService, { DynamicIslandStyle } from '../../src/services/DynamicIslandService';
import { useAuth } from '../../src/contexts/AuthContext';

const { width } = Dimensions.get('window');

// Preview du Dynamic Island
const DynamicIslandPreview = ({
    style,
    alterName,
    alterColor,
    mood,
    isActive,
}: {
    style: DynamicIslandStyle;
    alterName: string;
    alterColor: string;
    mood?: string;
    isActive: boolean;
}) => {
    const pulseScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.3);

    useEffect(() => {
        if (isActive) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.6, { duration: 1500 }),
                    withTiming(0.3, { duration: 1500 })
                ),
                -1,
                true
            );
        }
    }, [isActive]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const initial = alterName.charAt(0).toUpperCase();

    return (
        <View style={styles.previewContainer}>
            {/* Phone frame */}
            <View style={styles.phoneFrame}>
                {/* Notch / Dynamic Island area */}
                <View style={styles.notchArea}>
                    <Animated.View style={[styles.dynamicIsland, containerStyle]}>
                        {/* Glow effect */}
                        <Animated.View
                            style={[
                                styles.islandGlow,
                                { backgroundColor: alterColor },
                                glowStyle,
                            ]}
                        />

                        {/* Island content */}
                        <View style={styles.islandContent}>
                            {/* Left: Avatar */}
                            <View style={[styles.islandAvatar, { backgroundColor: alterColor }]}>
                                <Text style={styles.islandAvatarText}>{initial}</Text>
                            </View>

                            {/* Right content based on style */}
                            {style === 'minimal' && (
                                <View style={styles.islandMinimal}>
                                    <View style={[styles.islandDot, { backgroundColor: alterColor }]} />
                                </View>
                            )}

                            {style === 'detailed' && (
                                <View style={styles.islandDetailed}>
                                    <Text style={styles.islandName} numberOfLines={1}>
                                        {alterName}
                                    </Text>
                                    <Text style={styles.islandTime}>12m</Text>
                                </View>
                            )}

                            {style === 'mood' && (
                                <View style={styles.islandMood}>
                                    <Text style={styles.islandMoodEmoji}>{mood || '😊'}</Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </View>

                {/* Screen content (blurred) */}
                <View style={styles.screenContent}>
                    <View style={styles.mockApp} />
                    <View style={styles.mockApp} />
                    <View style={styles.mockApp} />
                </View>
            </View>

            {/* Label */}
            <Text style={styles.previewLabel}>
                {style === 'minimal' && 'Minimal'}
                {style === 'detailed' && 'Détaillé'}
                {style === 'mood' && 'Humeur'}
            </Text>
        </View>
    );
};

// Style selector card
const StyleCard = ({
    isSelected,
    onSelect,
    title,
    description,
    icon,
}: {
    isSelected: boolean;
    onSelect: () => void;
    title: string;
    description: string;
    icon: string;
}) => {
    return (
        <TouchableOpacity
            style={[styles.styleCard, isSelected && styles.styleCardSelected]}
            onPress={onSelect}
            activeOpacity={0.7}
        >
            <View style={styles.styleCardIcon}>
                <Ionicons
                    name={icon as any}
                    size={24}
                    color={isSelected ? '#8B5CF6' : '#9CA3AF'}
                />
            </View>
            <Text style={[styles.styleCardTitle, isSelected && styles.styleCardTitleSelected]}>
                {title}
            </Text>
            <Text style={styles.styleCardDescription}>{description}</Text>
            {isSelected && (
                <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                </View>
            )}
        </TouchableOpacity>
    );
};

export default function WidgetsSettingsScreen() {
    const { currentAlter } = useAuth();

    const [dynamicIslandEnabled, setDynamicIslandEnabled] = useState(true);
    const [dynamicIslandAvailable, setDynamicIslandAvailable] = useState(false);
    const [currentStyle, setCurrentStyle] = useState<DynamicIslandStyle>('detailed');
    const [loading, setLoading] = useState(true);

    const alterName = currentAlter?.name || 'Alex';
    const alterColor = currentAlter?.color || '#8B5CF6';

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const availability = await DynamicIslandService.checkAvailability();
            setDynamicIslandAvailable(availability.available);

            const enabled = await DynamicIslandService.isEnabled();
            setDynamicIslandEnabled(enabled);

            const style = await DynamicIslandService.getStyle();
            setCurrentStyle(style);
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

    const handleStyleChange = async (style: DynamicIslandStyle) => {
        setCurrentStyle(style);
        await DynamicIslandService.setStyle(style);
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

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                    <Text style={styles.emoji}>📱</Text>
                    <Text style={styles.title}>Widgets & Dynamic Island</Text>
                    <Text style={styles.subtitle}>
                        Affichez vos infos sur l'écran d'accueil
                    </Text>
                </Animated.View>

                {/* Dynamic Island (iOS only) */}
                {Platform.OS === 'ios' && (
                    <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.section}>
                        <Text style={styles.sectionTitle}>Dynamic Island</Text>

                        {dynamicIslandAvailable ? (
                            <>
                                {/* Toggle */}
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingLabel}>Activer le Dynamic Island</Text>
                                        <Text style={styles.settingDescription}>
                                            Affiche le fronter actuel en permanence
                                        </Text>
                                    </View>
                                    <Switch
                                        value={dynamicIslandEnabled}
                                        onValueChange={handleToggleDynamicIsland}
                                        trackColor={{ false: '#3e3e3e', true: '#8B5CF6' }}
                                        thumbColor={dynamicIslandEnabled ? '#FFFFFF' : '#f4f3f4'}
                                    />
                                </View>

                                {/* Preview */}
                                {dynamicIslandEnabled && (
                                    <Animated.View entering={FadeIn.duration(300)}>
                                        <View style={styles.previewSection}>
                                            <DynamicIslandPreview
                                                style={currentStyle}
                                                alterName={alterName}
                                                alterColor={alterColor}
                                                mood="😊"
                                                isActive={dynamicIslandEnabled}
                                            />
                                        </View>

                                        {/* Style selection */}
                                        <Text style={styles.subSectionTitle}>Style d'affichage</Text>
                                        <View style={styles.styleGrid}>
                                            <StyleCard
                                                isSelected={currentStyle === 'minimal'}
                                                onSelect={() => handleStyleChange('minimal')}
                                                title="Minimal"
                                                description="Juste un point coloré"
                                                icon="ellipse"
                                            />
                                            <StyleCard
                                                isSelected={currentStyle === 'detailed'}
                                                onSelect={() => handleStyleChange('detailed')}
                                                title="Détaillé"
                                                description="Nom + durée"
                                                icon="person"
                                            />
                                            <StyleCard
                                                isSelected={currentStyle === 'mood'}
                                                onSelect={() => handleStyleChange('mood')}
                                                title="Humeur"
                                                description="Emoji de l'humeur"
                                                icon="happy"
                                            />
                                        </View>
                                    </Animated.View>
                                )}

                                {/* Features list */}
                                <View style={styles.featureCard}>
                                    <Text style={styles.featureTitle}>✨ Fonctionnalités</Text>
                                    <View style={styles.featureList}>
                                        <View style={styles.featureItem}>
                                            <Ionicons name="person-circle" size={18} color="#8B5CF6" />
                                            <Text style={styles.featureText}>Avatar et nom du fronter</Text>
                                        </View>
                                        <View style={styles.featureItem}>
                                            <Ionicons name="time" size={18} color="#8B5CF6" />
                                            <Text style={styles.featureText}>Durée depuis le switch</Text>
                                        </View>
                                        <View style={styles.featureItem}>
                                            <Ionicons name="people" size={18} color="#8B5CF6" />
                                            <Text style={styles.featureText}>Indicateur de co-fronting</Text>
                                        </View>
                                        <View style={styles.featureItem}>
                                            <Ionicons name="happy" size={18} color="#8B5CF6" />
                                            <Text style={styles.featureText}>Affichage de l'humeur</Text>
                                        </View>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.unavailableCard}>
                                <Text style={styles.unavailableIcon}>📵</Text>
                                <Text style={styles.unavailableTitle}>Non disponible</Text>
                                <Text style={styles.unavailableDescription}>
                                    Le Dynamic Island nécessite un iPhone 14 Pro ou plus récent avec iOS 16.1+
                                </Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* Widgets */}
                <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Widgets Home Screen</Text>

                    <View style={styles.widgetGrid}>
                        <View style={styles.widgetCard}>
                            <View style={[styles.widgetPreview, { backgroundColor: alterColor + '30' }]}>
                                <View style={[styles.widgetAvatar, { backgroundColor: alterColor }]}>
                                    <Text style={styles.widgetAvatarText}>
                                        {alterName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.widgetSize}>SMALL</Text>
                            <Text style={styles.widgetName}>Qui est là ?</Text>
                            <Text style={styles.widgetDescription}>Fronter actuel</Text>
                        </View>

                        <View style={styles.widgetCard}>
                            <View style={[styles.widgetPreview, { backgroundColor: '#8B5CF620' }]}>
                                <View style={styles.widgetQuickSwitch}>
                                    {[alterColor, '#60A5FA', '#F472B6', '#34D399'].map((color, i) => (
                                        <View key={i} style={[styles.quickSwitchDot, { backgroundColor: color }]} />
                                    ))}
                                </View>
                            </View>
                            <Text style={styles.widgetSize}>MEDIUM</Text>
                            <Text style={styles.widgetName}>Switch Rapide</Text>
                            <Text style={styles.widgetDescription}>4 alters favoris</Text>
                        </View>

                        <View style={[styles.widgetCard, styles.widgetCardLarge]}>
                            <View style={[styles.widgetPreviewLarge, { backgroundColor: '#8B5CF610' }]}>
                                <View style={styles.widgetStats}>
                                    <View style={styles.widgetStatItem}>
                                        <Text style={styles.widgetStatValue}>3</Text>
                                        <Text style={styles.widgetStatLabel}>Switches</Text>
                                    </View>
                                    <View style={styles.widgetStatItem}>
                                        <Text style={styles.widgetStatValue}>😊</Text>
                                        <Text style={styles.widgetStatLabel}>Humeur</Text>
                                    </View>
                                    <View style={styles.widgetStatItem}>
                                        <Text style={styles.widgetStatValue}>✓</Text>
                                        <Text style={styles.widgetStatLabel}>Check-in</Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.widgetSize}>LARGE</Text>
                            <Text style={styles.widgetName}>Vue du Jour</Text>
                            <Text style={styles.widgetDescription}>Stats + wellness</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.helpCard} onPress={openWidgetGuide}>
                        <Ionicons name="help-circle" size={24} color="#8B5CF6" />
                        <View style={styles.helpContent}>
                            <Text style={styles.helpTitle}>Comment ajouter un widget ?</Text>
                            <Text style={styles.helpText}>
                                {Platform.OS === 'ios'
                                    ? 'Restez appuyé sur l\'écran d\'accueil, puis tapez "+"'
                                    : 'Restez appuyé sur l\'écran d\'accueil, puis "Widgets"'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </Animated.View>

                <View style={{ height: 40 }} />
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
    subSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 10,
        marginTop: 16,
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

    // Preview
    previewSection: {
        alignItems: 'center',
        marginVertical: 16,
    },
    previewContainer: {
        alignItems: 'center',
    },
    phoneFrame: {
        width: 180,
        height: 280,
        backgroundColor: '#000',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#333',
    },
    notchArea: {
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
    },
    dynamicIsland: {
        backgroundColor: '#000',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 8,
        minWidth: 90,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    islandGlow: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        borderRadius: 30,
    },
    islandContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    islandAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    islandAvatarText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    islandMinimal: {
        width: 8,
        height: 8,
    },
    islandDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    islandDetailed: {
        alignItems: 'flex-start',
    },
    islandName: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
    },
    islandTime: {
        color: '#9CA3AF',
        fontSize: 9,
    },
    islandMood: {},
    islandMoodEmoji: {
        fontSize: 16,
    },
    screenContent: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        padding: 12,
        gap: 8,
    },
    mockApp: {
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    previewLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 8,
    },

    // Style cards
    styleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    styleCard: {
        flex: 1,
        minWidth: 100,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    styleCardSelected: {
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    styleCardIcon: {
        marginBottom: 8,
    },
    styleCardTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    styleCardTitleSelected: {
        color: '#8B5CF6',
    },
    styleCardDescription: {
        color: '#6B7280',
        fontSize: 11,
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
    },

    // Features
    featureCard: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    featureTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    featureList: {
        gap: 10,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureText: {
        color: '#9CA3AF',
        fontSize: 13,
    },

    // Unavailable
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

    // Widgets
    widgetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    widgetCard: {
        width: (width - 44) / 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 12,
        overflow: 'hidden',
    },
    widgetCardLarge: {
        width: '100%',
    },
    widgetPreview: {
        height: 80,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    widgetPreviewLarge: {
        height: 60,
        borderRadius: 12,
        marginBottom: 12,
        justifyContent: 'center',
    },
    widgetAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    widgetAvatarText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    widgetQuickSwitch: {
        flexDirection: 'row',
        gap: 8,
    },
    quickSwitchDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    widgetStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
    },
    widgetStatItem: {
        alignItems: 'center',
    },
    widgetStatValue: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    widgetStatLabel: {
        color: '#6B7280',
        fontSize: 10,
        marginTop: 2,
    },
    widgetSize: {
        fontSize: 9,
        fontWeight: '600',
        color: '#8B5CF6',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 1,
    },
    widgetName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    widgetDescription: {
        fontSize: 11,
        color: '#6B7280',
    },

    // Help
    helpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 12,
    },
    helpContent: {
        flex: 1,
    },
    helpTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    helpText: {
        fontSize: 12,
        color: '#6B7280',
    },
});
