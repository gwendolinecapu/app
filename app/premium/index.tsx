/**
 * Premium Landing Page
 * 
 * Page de présentation des fonctionnalités premium avant de lancer RevenueCat.
 * Design attractif avec animations, feature cards et pricing cards.
 * 
 * Workflow:
 * 1. L'utilisateur voit les avantages premium
 * 2. Choisit un plan (visuel)
 * 3. Appuie sur CTA → RevenueCat paywall s'ouvre
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { triggerHaptic } from '../../src/lib/haptics';
import { useMonetization } from '../../src/contexts/MonetizationContext';
import { PREMIUM_PACKS } from '../../src/services/MonetizationTypes';

// ==================== MAIN COMPONENT ====================

// ==================== MAIN COMPONENT ====================

import { PACKAGE_TYPE, PurchasesPackage } from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

// ==================== TYPES ====================

interface FeatureItem {
    icon: string;
    title: string;
    description: string;
    color: string;
}

interface PricingPlan {
    id: string;
    name: string;
    price: string;
    period: string;
    discount?: string;
    featured?: boolean;
}

// ==================== DATA ====================

const FEATURES: FeatureItem[] = [
    {
        icon: 'mic-circle',
        title: 'Journal Vocal & Photos',
        description: 'Enregistrez des audios et ajoutez des photos. Ces fichiers coûtent cher en stockage serveur : votre abonnement finance cet espace sécurisé.',
        color: '#EC4899',
    },
    {
        icon: 'heart',
        title: 'Soutien & Badge VIP',
        description: 'Aidez l\'application à rester indépendante et obtenez un badge VIP exclusif visible par la communauté.',
        color: '#8B5CF6',
    },
    {
        icon: 'server',
        title: 'Hébergement Sécurisé',
        description: 'Vos médias (sons/images) sont sauvegardés sur des serveurs privés et cryptés, garantis par votre contribution.',
        color: '#3B82F6',
    },
    {
        icon: 'watch',
        title: 'Extension Apple Watch',
        description: 'Gardez le contact avec votre système directement depuis votre poignet. (Bientôt disponible)',
        color: '#F59E0B',
    },
];

const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'monthly',
        name: 'Mensuel',
        price: '3,49€',
        period: '/mois',
    },
    {
        id: 'yearly',
        name: 'Annuel',
        price: '24,99€',
        period: '/an',
        discount: 'Économisez 40%',
        featured: true,
    },
    {
        id: 'lifetime',
        name: 'À Vie',
        price: '49,99€',
        period: 'une seule fois',
    },
];

// ==================== ANIMATED COMPONENTS ====================

// Effet de pulsation pour l'icône principale
const PulsingIcon = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    return (
        <Animated.View style={[styles.heroIcon, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
                colors={['#8B5CF6', '#EC4899', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroIconGradient}
            >
                <Ionicons name="sparkles" size={48} color="#FFF" />
            </LinearGradient>
        </Animated.View>
    );
};

// Feature card avec animation d'entrée
const FeatureCard = ({ feature, index }: { feature: FeatureItem; index: number }) => {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const delay = index * 100;
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.featureCard,
                {
                    transform: [{ translateX: slideAnim }],
                    opacity: opacityAnim,
                }
            ]}
        >
            <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                <Ionicons name={feature.icon as any} size={24} color={feature.color} />
            </View>
            <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
        </Animated.View>
    );
};

// Pricing card avec sélection visuelle
const PricingCard = ({
    plan,
    selected,
    onSelect
}: {
    plan: PricingPlan;
    selected: boolean;
    onSelect: () => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={onSelect}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    styles.pricingCard,
                    selected && styles.pricingCardSelected,
                    plan.featured && styles.pricingCardFeatured,
                    { transform: [{ scale: scaleAnim }] }
                ]}
            >
                {/* Badge économie */}
                {plan.discount && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{plan.discount}</Text>
                    </View>
                )}

                {/* Featured badge */}
                {plan.featured && (
                    <View style={styles.featuredBadge}>
                        <Ionicons name="star" size={10} color="#FFF" />
                        <Text style={styles.featuredText}>Populaire</Text>
                    </View>
                )}

                {/* Radio indicator */}
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected && <View style={styles.radioInner} />}
                </View>

                {/* Plan info */}
                <View style={styles.planInfo}>
                    <Text style={[styles.planName, selected && styles.planNameSelected]}>
                        {plan.name}
                    </Text>
                </View>

                {/* Price */}
                <View style={styles.priceContainer}>
                    <Text style={[styles.price, selected && styles.priceSelected]}>{plan.price}</Text>
                    <Text style={styles.period}>{plan.period}</Text>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function PremiumScreen() {
    const router = useRouter();
    const { presentPaywall, restorePurchases, isPremium, loading: contextLoading, purchaseIAP, offerings } = useMonetization();
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Animation d'entrée du CTA
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            delay: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    // Charger les offres réelles
    useEffect(() => {
        if (offerings && offerings.availablePackages.length > 0) {
            const mappedPlans: PricingPlan[] = offerings.availablePackages.map(pkg => {
                let name = 'Premium';
                let period = '';
                let discount = undefined;
                let featured = false;

                switch (pkg.packageType) {
                    case PACKAGE_TYPE.MONTHLY:
                        name = 'Mensuel';
                        period = '/mois';
                        break;
                    case PACKAGE_TYPE.ANNUAL:
                        name = 'Annuel';
                        period = '/an';
                        featured = true;
                        discount = 'Économisez 40%'; // Simplification pour l'instant (calcul réel possible)
                        break;
                    case PACKAGE_TYPE.LIFETIME:
                        name = 'À Vie';
                        period = 'une seule fois';
                        break;
                    case PACKAGE_TYPE.WEEKLY:
                        name = 'Hebdomadaire';
                        period = '/semaine';
                        break;
                    default:
                        name = pkg.product.title;
                        period = '';
                }

                return {
                    id: pkg.identifier,
                    name,
                    price: pkg.product.priceString,
                    period,
                    discount,
                    featured
                };
            });

            // Trier: Annuel d'abord (featured), puis Mensuel, puis Lifetime
            mappedPlans.sort((a, b) => {
                if (a.featured) return -1;
                if (b.featured) return 1;
                // Ordre custom si besoin, sinon par prix
                return 0;
            });

            setPlans(mappedPlans);

            // Sélectionner le plan "Annuel" ou le premier par défaut
            const defaultPlan = mappedPlans.find(p => p.featured) || mappedPlans[0];
            if (defaultPlan) setSelectedPlan(defaultPlan.id);
        } else {
            // Fallback hardcodé si pas d'offres (offline ou dev)
            // Ou on garde le loading. Pour UX, on garde le fallback hardcodé si rien n'est chargé
            // mais on désactive l'achat direct vers presentPaywall
            setPlans(PRICING_PLANS);
            setSelectedPlan('yearly');
        }
    }, [offerings]);

    // Redirection si déjà premium
    useEffect(() => {
        if (isPremium) {
            Alert.alert(
                "Déjà Premium 🎉",
                "Vous avez déjà accès à toutes les fonctionnalités premium !",
                [{ text: "Super !", onPress: () => router.back() }]
            );
        }
    }, [isPremium]);

    const handleSubscribe = async () => {
        triggerHaptic.selection();

        // Si on a chargés des plans réels, on tente l'achat direct
        if (plans.length > 0 && offerings && offerings.availablePackages.length > 0) {
            const plan = plans.find(p => p.id === selectedPlan);
            if (plan) {
                const success = await purchaseIAP(plan.id);
                if (success) {
                    triggerHaptic.success();
                    router.back();
                }
                return;
            }
        }

        // Fallback: Lance le paywall RevenueCat natif
        const success = await presentPaywall();
        if (success) {
            triggerHaptic.success();
            router.back();
        }
    };

    const handleRestore = async () => {
        triggerHaptic.light();
        await restorePurchases();
    };

    const handleSelectPlan = (planId: string) => {
        triggerHaptic.light();
        setSelectedPlan(planId);
    };

    return (
        <View style={styles.container}>
            {/* Background gradient */}
            <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f3460']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Decorative shapes */}
            <View style={[styles.decorCircle, { top: -50, right: -50 }]} />
            <View style={[styles.decorCircle, { bottom: 100, left: -80, width: 180, height: 180 }]} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <PulsingIcon />
                        <Text style={styles.heroTitle}>Plural Connect Pro</Text>
                        <Text style={styles.heroSubtitle}>
                            Débloquez tout le potentiel de votre système
                        </Text>
                    </View>

                    {/* Features Section */}
                    <View style={styles.featuresSection}>
                        <Text style={styles.sectionTitle}>Tout ce qui est inclus</Text>
                        {FEATURES.map((feature, index) => (
                            <FeatureCard key={feature.title} feature={feature} index={index} />
                        ))}
                    </View>

                    {/* Pricing Section */}
                    <View style={styles.pricingSection}>
                        <Text style={styles.sectionTitle}>Choisissez votre plan</Text>
                        <View style={styles.pricingContainer}>
                            {plans.map(plan => (
                                <PricingCard
                                    key={plan.id}
                                    plan={plan}
                                    selected={selectedPlan === plan.id}
                                    onSelect={() => handleSelectPlan(plan.id)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Trust badges */}
                    <View style={styles.trustSection}>
                        <View style={styles.trustBadge}>
                            <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                            <Text style={styles.trustText}>Paiement sécurisé</Text>
                        </View>
                        <View style={styles.trustBadge}>
                            <Ionicons name="refresh" size={16} color={colors.info} />
                            <Text style={styles.trustText}>Annulez à tout moment</Text>
                        </View>
                    </View>

                    {/* Extra spacing for fixed CTA */}
                    <View style={{ height: 140 }} />
                </ScrollView>

                {/* Fixed CTA Section */}
                <Animated.View style={[styles.ctaSection, { opacity: fadeAnim }]}>
                    <BlurView intensity={80} tint="dark" style={styles.ctaBlur}>
                        <TouchableOpacity
                            style={styles.ctaButton}
                            onPress={handleSubscribe}
                            disabled={contextLoading}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#8B5CF6', '#EC4899']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaGradient}
                            >
                                {contextLoading ? (
                                    <Text style={styles.ctaText}>Chargement...</Text>
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={20} color="#FFF" />
                                        <Text style={styles.ctaText}>Débloquer Plural Pro</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.restoreButton}
                            onPress={handleRestore}
                        >
                            <Text style={styles.restoreText}>Restaurer mes achats</Text>
                        </TouchableOpacity>

                        <Text style={styles.legalText}>
                            {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} • Abonnement auto-renouvelable
                        </Text>
                    </BlurView>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    safeArea: {
        flex: 1,
    },
    decorCircle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
    },

    // Hero Section
    heroSection: {
        alignItems: 'center',
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
    },
    heroIcon: {
        marginBottom: spacing.lg,
    },
    heroIconGradient: {
        width: 100,
        height: 100,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        paddingHorizontal: spacing.md,
    },

    // Section Title
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: spacing.md,
    },

    // Features Section
    featuresSection: {
        marginBottom: spacing.xl,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 18,
    },

    // Pricing Section
    pricingSection: {
        marginBottom: spacing.lg,
    },
    pricingContainer: {
        gap: spacing.sm,
    },
    pricingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
        overflow: 'visible',
    },
    pricingCardSelected: {
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
    },
    pricingCardFeatured: {
        borderColor: 'rgba(139, 92, 246, 0.4)',
        marginTop: 8,
        marginBottom: 8,
    },
    discountBadge: {
        position: 'absolute',
        top: -10,
        right: 16,
        backgroundColor: '#22C55E',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    discountText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    featuredBadge: {
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        zIndex: 10,
    },
    featuredText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        marginRight: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: '#8B5CF6',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#8B5CF6',
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    planNameSelected: {
        color: '#8B5CF6',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    },
    priceSelected: {
        color: '#8B5CF6',
    },
    period: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },

    // Trust Section
    trustSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.lg,
        marginTop: spacing.md,
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    trustText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },

    // CTA Section
    ctaSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    ctaBlur: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
        alignItems: 'center',
    },
    ctaButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    ctaGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: spacing.sm,
    },
    ctaText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    restoreButton: {
        marginTop: spacing.sm,
        paddingVertical: spacing.xs,
    },
    restoreText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    legalText: {
        marginTop: spacing.xs,
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
    },
});
