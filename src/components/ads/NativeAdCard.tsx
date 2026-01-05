import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image as RNImage, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import AdMediationService from '../../services/AdMediationService';
import { NativeAdData } from '../../services/MonetizationTypes';
import { triggerHaptic } from '../../lib/haptics';
import { ThemeColors } from '../../lib/cosmetics';

interface NativeAdCardProps {
    themeColors?: ThemeColors | null;
    onClose?: () => void;
}

export const NativeAdCard: React.FC<NativeAdCardProps> = ({ themeColors }) => {
    const [adData, setAdData] = useState<NativeAdData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAd();
    }, []);

    const loadAd = async () => {
        try {
            // Tenter de récupérer une pub préchargée ou en charger une nouvelle
            let ad = AdMediationService.getPreloadedNativeAd();
            if (!ad) {
                ad = await AdMediationService.loadNativeAd();
            }
            setAdData(ad);
        } catch (error) {
            console.error('Failed to load native ad', error);
        } finally {
            setLoading(false);
        }
    };

    if (!adData) return null;

    const handlePress = () => {
        triggerHaptic.selection();
        // Dans une vraie implémentation, ceci serait géré par le SDK (click handling)
        // Pour le mock, on pourrait ouvrir un lien placeholder
        console.log('Ad clicked:', adData.headline);
    };

    const handleOptions = () => {
        // Option pour masquer cette pub ou signaler
    };

    return (
        <View style={[styles.card, themeColors && { backgroundColor: themeColors.backgroundCard, borderBottomColor: themeColors.border }]}>
            {/* Header: Mimics PostCard Header */}
            <View style={styles.header}>
                <View style={styles.authorInfo}>
                    {/* Ad Icon as Avatar */}
                    {adData.iconUrl ? (
                        <Image source={{ uri: adData.iconUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, themeColors && { backgroundColor: themeColors.primary }]}>
                            <Ionicons name="megaphone" size={20} color="white" />
                        </View>
                    )}

                    <View>
                        <View style={styles.authorNameRow}>
                            <Text style={[styles.authorName, { color: themeColors?.text || colors.text }]}>
                                {adData.advertiser || 'Sponsorisé'}
                            </Text>
                            {/* "Sponsorisé" Badge instead of "En front" */}
                            <View style={styles.sponsoredBadge}>
                                <Text style={styles.sponsoredBadgeText}>Sponsorisé</Text>
                            </View>
                        </View>
                        <Text style={[styles.subtitle, { color: themeColors?.textSecondary || colors.textSecondary }]}>
                            Publicité • {adData.network === 'admob' ? 'Google' : 'Partenaire'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity onPress={handleOptions} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Content: Ad Headline & Body */}
            <View style={styles.contentContainer}>
                <Text style={[styles.headline, themeColors && { color: themeColors.text }]}>{adData.headline}</Text>
                {adData.body && (
                    <Text style={[styles.body, themeColors && { color: themeColors.text }]} numberOfLines={2}>
                        {adData.body}
                    </Text>
                )}
            </View>

            {/* Media: Ad Image */}
            {adData.imageUrl && (
                <TouchableOpacity activeOpacity={0.95} onPress={handlePress} style={styles.mediaContainer}>
                    <Image
                        source={{ uri: adData.imageUrl }}
                        style={styles.media}
                        contentFit="cover"
                        transition={200}
                    />
                    {/* Small "Ad" indicator on image */}
                    <View style={styles.adIndicator}>
                        <Text style={styles.adIndicatorText}>Publicité</Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Footer: Call To Action Button (Distinct from PostCard footer) */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.ctaButton, themeColors && { backgroundColor: themeColors.primary + '15' }]}
                    onPress={handlePress}
                >
                    <Text style={[styles.ctaText, { color: themeColors?.primary || colors.primary }]}>
                        {adData.callToAction || 'En savoir plus'}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={themeColors?.primary || colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.backgroundCard,
        marginBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.backgroundLight,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    authorName: {
        ...typography.body,
        fontWeight: '700',
    },
    subtitle: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    sponsoredBadge: {
        backgroundColor: colors.surface,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sponsoredBadgeText: {
        ...typography.tiny,
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    contentContainer: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    headline: {
        ...typography.body,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    body: {
        ...typography.body,
        fontSize: 14,
        lineHeight: 20,
    },
    mediaContainer: {
        width: '100%',
        aspectRatio: 1.91, // Standard FB/Instagram ad ratio (landscape), unlike 1:1 posts usually
        backgroundColor: colors.backgroundLight,
        position: 'relative',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    adIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    adIndicatorText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    footer: {
        padding: spacing.md,
        borderTopWidth: 1, // Slight separation for the CTA
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary + '15', // Transparent primary
        paddingVertical: 10,
        borderRadius: borderRadius.md,
        gap: 8,
    },
    ctaText: {
        ...typography.body,
        fontWeight: '700',
        color: colors.primary,
    },
});

export default NativeAdCard;
