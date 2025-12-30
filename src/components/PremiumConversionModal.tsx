import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    ImageBackground,
    Dimensions,
    Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { useMonetization } from '../contexts/MonetizationContext';
import { PREMIUM_PACKS } from '../services/MonetizationTypes';
import { triggerHaptic } from '../lib/haptics';

const { width, height } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const PremiumConversionModal = ({ visible, onClose }: Props) => {
    const { presentPaywall, loading } = useMonetization();

    const handlePurchase = async () => {
        triggerHaptic.selection();

        // Use RevenueCat Native Paywall
        const success = await presentPaywall();

        if (success) {
            triggerHaptic.success();
            onClose();
        } else {
            triggerHaptic.error();
        }
    };

    const renderFeature = (icon: string, title: string, description: string) => (
        <View style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
                <Ionicons name={icon as any} size={24} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDescription}>{description}</Text>
            </View>
        </View>
    );



    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Header Image or Icon */}
                    <View style={styles.headerIcon}>
                        <Ionicons name="sparkles" size={60} color={colors.primary} />
                    </View>

                    <Text style={styles.title}>L'aventure continue !</Text>

                    <View style={styles.messageBox}>
                        <Text style={styles.messageText}>
                            Depuis 14 jours, vous profitez de Plural Connect Premium avec vos alters.
                            J'espère que cette expérience a enrichi votre communication !
                        </Text>
                        <Text style={[styles.messageText, { marginTop: spacing.sm, fontWeight: '600', color: colors.primary }]}>
                            Pour continuer à profiter de toutes les fonctionnalités, choisissez votre plan :
                        </Text>
                    </View>

                    <View style={styles.featuresList}>
                        {renderFeature('infinite', 'Alters Illimités', 'Créez autant d\'alters que vous le souhaitez')}
                        {renderFeature('sync', 'Synchronisation Cloud', 'Sauvegarde automatique et sécurisée')}
                        {renderFeature('color-wand', 'Personnalisation Avancée', 'Thèmes, couleurs et avatars exclusifs')}
                        {renderFeature('stats-chart', 'Statistiques Détaillées', 'Analysez votre fronting et vos habitudes')}
                    </View>

                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={handlePurchase}
                        disabled={loading}
                    >
                        {loading ? (
                            <Text style={styles.ctaButtonText}>Chargement...</Text>
                        ) : (
                            <Text style={styles.ctaButtonText}>Voir les offres Premium</Text>
                        )}
                        <Text style={styles.ctaSubText}>Via App Store / Google Play</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.closeLink} onPress={onClose}>
                        <Text style={styles.closeLinkText}>Non merci, je passe en version Gratuite</Text>
                    </TouchableOpacity>

                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
    },
    headerIcon: {
        alignSelf: 'center',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    title: {
        ...typography.h1,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    messageBox: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.xl,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    messageText: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    featuresList: {
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(59, 130, 246, 0.15)', // Primary with opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        ...typography.h3,
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 2,
    },
    featureDescription: {
        ...typography.caption,
        color: colors.textMuted,
    },
    plansContainer: {
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    planCard: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    planCardSelected: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // Subtle blue tint
    },
    planCardFeaturedNotSelected: {
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    bestValueBadge: {
        position: 'absolute',
        top: -12,
        right: 20,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 100,
    },
    bestValueText: {
        ...typography.caption,
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 10,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    radioButton: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.textMuted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.primary,
    },
    planName: {
        ...typography.h3,
        color: colors.text,
        fontSize: 16,
    },
    planNameSelected: {
        color: colors.primary,
    },
    planDiscount: {
        ...typography.caption,
        color: colors.success,
        fontWeight: '600',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    planPrice: {
        ...typography.h2,
        color: colors.text,
        fontSize: 20,
    },
    planPriceSelected: {
        color: colors.primary,
    },
    planPeriod: {
        ...typography.caption,
        color: colors.textMuted,
    },
    ctaButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        marginBottom: spacing.sm,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    ctaButtonText: {
        ...typography.h3,
        color: '#FFFFFF',
    },
    ctaSubText: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
        fontSize: 10,
    },
    closeLink: {
        alignItems: 'center',
        padding: spacing.sm,
    },
    closeLinkText: {
        ...typography.body,
        color: colors.textMuted,
        textDecorationLine: 'underline',
    },
});
