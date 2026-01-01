/**
 * ShopItemModal.tsx
 * Modal de détail et confirmation d'achat pour les items de la boutique
 * 
 * Affiche :
 * - Preview détaillée de l'item
 * - Description complète
 * - Prix et bouton d'achat avec confirmation
 * - Option d'équiper si déjà possédé
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { ShopItem } from '../../services/MonetizationTypes';

const { width, height } = Dimensions.get('window');

interface ShopItemModalProps {
    visible: boolean;
    item: ShopItem | null;
    userCredits: number;
    isOwned: boolean;
    isEquipped: boolean;
    isPremiumUser: boolean;
    onClose: () => void;
    onPurchase: (item: ShopItem) => Promise<boolean>;
    onEquip: (item: ShopItem) => Promise<void>;
}

export function ShopItemModal({
    visible,
    item,
    userCredits,
    isOwned,
    isEquipped,
    isPremiumUser,
    onClose,
    onPurchase,
    onEquip,
}: ShopItemModalProps) {
    const [processing, setProcessing] = useState(false);
    const [confirmStep, setConfirmStep] = useState(false);

    if (!item) return null;

    const canAfford = (item.priceCredits || 0) <= userCredits;
    const isFree = (item.priceCredits || 0) === 0;
    const isPremiumItem = item.isPremium;

    // Reset state when modal closes
    const handleClose = () => {
        setConfirmStep(false);
        setProcessing(false);
        onClose();
    };

    const handlePurchaseClick = () => {
        if (isFree || confirmStep) {
            // Proceed with purchase
            executePurchase();
        } else {
            // Show confirmation
            setConfirmStep(true);
        }
    };

    const executePurchase = async () => {
        setProcessing(true);
        try {
            const success = await onPurchase(item);
            if (success) {
                handleClose();
            }
        } finally {
            setProcessing(false);
            setConfirmStep(false);
        }
    };

    const handleEquip = async () => {
        setProcessing(true);
        try {
            await onEquip(item);
            handleClose();
        } finally {
            setProcessing(false);
        }
    };

    // Render preview based on item type
    const renderPreview = () => {
        if (item.type === 'theme') {
            return (
                <View style={[styles.themePreview, { backgroundColor: item.preview }]}>
                    {/* Mock app interface */}
                    <View style={styles.mockHeader}>
                        <View style={styles.mockHeaderBar} />
                    </View>
                    <View style={styles.mockContent}>
                        <View style={[styles.mockCard, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
                        <View style={[styles.mockCard, { backgroundColor: 'rgba(255,255,255,0.1)', width: '70%' }]} />
                        <View style={[styles.mockCard, { backgroundColor: 'rgba(255,255,255,0.08)', width: '50%' }]} />
                    </View>
                    <View style={styles.mockNavbar}>
                        <View style={styles.mockNavItem} />
                        <View style={[styles.mockNavItem, styles.mockNavItemActive]} />
                        <View style={styles.mockNavItem} />
                    </View>
                </View>
            );
        }

        if (item.type === 'frame') {
            return (
                <View style={styles.framePreview}>
                    <View style={[
                        styles.frameCircle,
                        item.id.includes('neon') && styles.frameNeon,
                        item.id.includes('rainbow') && styles.frameRainbow,
                        item.id.includes('double') && styles.frameDouble,
                        item.id.includes('square') && { borderRadius: 16 },
                    ]}>
                        <Ionicons name="person" size={48} color={colors.textSecondary} />
                    </View>
                </View>
            );
        }

        if (item.type === 'bubble') {
            return (
                <View style={styles.bubblePreviewContainer}>
                    <View style={[
                        styles.bubblePreview,
                        item.id.includes('square') && { borderRadius: 4 },
                        item.id.includes('cloud') && { borderRadius: 24, borderBottomLeftRadius: 4 },
                        item.id.includes('pixel') && { borderRadius: 0 },
                    ]}>
                        <Text style={styles.bubbleText}>Salut ! Comment ça va ?</Text>
                    </View>
                    <View style={[
                        styles.bubblePreviewAlt,
                        item.id.includes('square') && { borderRadius: 4 },
                        item.id.includes('cloud') && { borderRadius: 24, borderBottomRightRadius: 4 },
                    ]}>
                        <Text style={styles.bubbleText}>Très bien, merci ! 😊</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.genericPreview}>
                <Ionicons name="gift-outline" size={64} color={colors.primary} />
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <BlurView intensity={40} style={styles.backdrop} tint="dark">
                <TouchableOpacity style={styles.backdropTouch} onPress={handleClose} activeOpacity={1}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>

                        {/* Preview Area */}
                        <View style={styles.previewContainer}>
                            {renderPreview()}

                            {/* Badges */}
                            {isPremiumItem && (
                                <View style={styles.premiumBadge}>
                                    <Ionicons name="star" size={12} color="#FFD700" />
                                    <Text style={styles.premiumBadgeText}>Premium</Text>
                                </View>
                            )}
                            {isOwned && (
                                <View style={styles.ownedBadge}>
                                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                    <Text style={styles.ownedBadgeText}>Acquis</Text>
                                </View>
                            )}
                        </View>

                        {/* Item Info */}
                        <View style={styles.infoContainer}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemType}>
                                {item.type === 'theme' ? '🎨 Thème' :
                                    item.type === 'frame' ? '🖼️ Cadre' :
                                        item.type === 'bubble' ? '💬 Bulle' : '🎁 Bundle'}
                            </Text>
                            <Text style={styles.itemDescription}>{item.description}</Text>
                        </View>

                        {/* Action Area */}
                        <View style={styles.actionContainer}>
                            {isOwned ? (
                                // Already owned - show equip button
                                <TouchableOpacity
                                    style={[styles.actionButton, isEquipped && styles.actionButtonDisabled]}
                                    onPress={handleEquip}
                                    disabled={isEquipped || processing}
                                >
                                    <LinearGradient
                                        colors={isEquipped ? ['#4B5563', '#374151'] : [colors.success, '#059669']}
                                        style={styles.actionGradient}
                                    >
                                        {processing ? (
                                            <ActivityIndicator color="#FFF" size="small" />
                                        ) : (
                                            <>
                                                <Ionicons
                                                    name={isEquipped ? "checkmark-circle" : "shirt-outline"}
                                                    size={20}
                                                    color="#FFF"
                                                />
                                                <Text style={styles.actionButtonText}>
                                                    {isEquipped ? 'Déjà équipé' : 'Équiper'}
                                                </Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : confirmStep ? (
                                // Confirmation step
                                <View style={styles.confirmContainer}>
                                    <Text style={styles.confirmText}>
                                        Confirmer l'achat pour {item.priceCredits} 💎 ?
                                    </Text>
                                    <View style={styles.confirmButtons}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => setConfirmStep(false)}
                                        >
                                            <Text style={styles.cancelButtonText}>Annuler</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.confirmButton}
                                            onPress={executePurchase}
                                            disabled={processing}
                                        >
                                            <LinearGradient
                                                colors={[colors.primary, colors.secondary]}
                                                style={styles.confirmGradient}
                                            >
                                                {processing ? (
                                                    <ActivityIndicator color="#FFF" size="small" />
                                                ) : (
                                                    <Text style={styles.confirmButtonText}>Confirmer</Text>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                // Purchase button
                                <TouchableOpacity
                                    style={[styles.actionButton, !canAfford && styles.actionButtonDisabled]}
                                    onPress={handlePurchaseClick}
                                    disabled={!canAfford || processing}
                                >
                                    <LinearGradient
                                        colors={canAfford ? [colors.primary, colors.secondary] : ['#4B5563', '#374151']}
                                        style={styles.actionGradient}
                                    >
                                        {processing ? (
                                            <ActivityIndicator color="#FFF" size="small" />
                                        ) : (
                                            <>
                                                <Ionicons name="diamond" size={18} color="#FFF" />
                                                <Text style={styles.actionButtonText}>
                                                    {isFree ? 'Obtenir gratuitement' :
                                                        canAfford ? `Acheter • ${item.priceCredits}` :
                                                            `${item.priceCredits} (insuffisant)`}
                                                </Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {/* Credits display */}
                            {!isOwned && (
                                <View style={styles.creditsInfo}>
                                    <Text style={styles.creditsLabel}>Tes crédits :</Text>
                                    <View style={styles.creditsValue}>
                                        <Ionicons name="diamond" size={14} color={colors.secondary} />
                                        <Text style={[
                                            styles.creditsAmount,
                                            !canAfford && { color: colors.error }
                                        ]}>
                                            {userCredits}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdropTouch: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.9,
        maxHeight: height * 0.8,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    closeButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        zIndex: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewContainer: {
        height: 200,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    themePreview: {
        width: 120,
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    mockHeader: {
        height: 24,
        padding: 6,
    },
    mockHeaderBar: {
        width: '60%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
    },
    mockContent: {
        flex: 1,
        padding: 8,
        gap: 8,
    },
    mockCard: {
        height: 20,
        borderRadius: 4,
    },
    mockNavbar: {
        flexDirection: 'row',
        height: 24,
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    mockNavItem: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    mockNavItemActive: {
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    framePreview: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    frameCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: colors.primary,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    frameNeon: {
        borderColor: '#00ff00',
        shadowColor: '#00ff00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
    },
    frameRainbow: {
        borderWidth: 6,
        borderColor: '#ff6b6b',
    },
    frameDouble: {
        borderWidth: 6,
        borderColor: colors.primary,
    },
    bubblePreviewContainer: {
        width: '80%',
        gap: spacing.sm,
    },
    bubblePreview: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        alignSelf: 'flex-start',
    },
    bubblePreviewAlt: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: spacing.md,
        borderRadius: 16,
        borderBottomRightRadius: 4,
        alignSelf: 'flex-end',
    },
    bubbleText: {
        color: '#FFF',
        fontSize: 14,
    },
    genericPreview: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumBadge: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    premiumBadgeText: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: 'bold',
    },
    ownedBadge: {
        position: 'absolute',
        bottom: spacing.md,
        right: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    ownedBadgeText: {
        color: colors.success,
        fontSize: 11,
        fontWeight: 'bold',
    },
    infoContainer: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    itemName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    itemType: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    itemDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    actionContainer: {
        padding: spacing.lg,
    },
    actionButton: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        gap: spacing.sm,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmContainer: {
        alignItems: 'center',
    },
    confirmText: {
        fontSize: 16,
        color: colors.text,
        marginBottom: spacing.md,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    confirmGradient: {
        padding: spacing.md,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    creditsInfo: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    creditsLabel: {
        color: colors.textSecondary,
        fontSize: 13,
    },
    creditsValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    creditsAmount: {
        color: colors.secondary,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
