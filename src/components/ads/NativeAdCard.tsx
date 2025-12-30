/**
 * NativeAdCard.tsx
 * Pub native style Instagram intégrée dans le feed
 * 
 * TEMPORAIREMENT DÉSACTIVÉ
 * Les publicités nécessitent un development build avec react-native-google-mobile-ads
 */

import React from 'react';

interface NativeAdCardProps {
    onClose?: () => void;
}

export function NativeAdCard({ onClose }: NativeAdCardProps) {
<<<<<<< Updated upstream
    // Safely get monetization context - returns null if provider is missing
    let getNativeAd: (() => NativeAdData | null) | null = null;
    let isAdFree = false;

    try {
        const monetization = useMonetization();
        getNativeAd = monetization.getNativeAd;
        isAdFree = monetization.isAdFree;
    } catch (error) {
        // MonetizationProvider is missing - don't show ads
        console.log('[NativeAdCard] MonetizationProvider not found, hiding ad');
        return null;
    }

    const [adData, setAdData] = useState<NativeAdData | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!isAdFree && getNativeAd) {
            const ad = getNativeAd();
            setAdData(ad);
        }
    }, [isAdFree, getNativeAd]);

    // Ne pas afficher si premium ou pas de pub
    if (isAdFree || !adData || dismissed) {
        return null;
    }

    const handlePress = () => {
        // Track le clic et ouvrir le lien
        console.log('[NativeAd] Clicked:', adData.headline);
        // Linking.openURL(adData.landingUrl);
    };

    const handleDismiss = () => {
        setDismissed(true);
        onClose?.();
    };

    return (
        <View style={styles.container}>
            {/* Header sponsorisé */}
            <View style={styles.header}>
                <View style={styles.advertiserRow}>
                    {adData.iconUrl && (
                        <Image source={{ uri: adData.iconUrl }} style={styles.icon} />
                    )}
                    <View style={styles.advertiserInfo}>
                        <Text style={styles.advertiserName}>{adData.advertiser}</Text>
                        <Text style={styles.sponsoredLabel}>Sponsorisé</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Image principale */}
            {adData.imageUrl && (
                <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
                    <Image
                        source={{ uri: adData.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
            )}

            {/* Contenu */}
            <View style={styles.content}>
                <Text style={styles.headline} numberOfLines={2}>
                    {adData.headline}
                </Text>
                <Text style={styles.body} numberOfLines={2}>
                    {adData.body}
                </Text>

                {/* Rating */}
                {adData.starRating && (
                    <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <Ionicons
                                key={star}
                                name={star <= adData.starRating! ? 'star' : 'star-outline'}
                                size={14}
                                color="#F59E0B"
                            />
                        ))}
                        <Text style={styles.ratingText}>{adData.starRating}</Text>
                    </View>
                )}

                {/* CTA Button */}
                <TouchableOpacity style={styles.ctaButton} onPress={handlePress}>
                    <Text style={styles.ctaText}>{adData.callToAction}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Footer Ad Choices */}
            <View style={styles.footer}>
                <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
                <Text style={styles.footerText}>Publicité · AdChoices</Text>
            </View>
        </View>
    );
=======
    // MonetizationContext et les pubs sont désactivés pour l'instant
    // Nécessite un development build pour fonctionner
    return null;
>>>>>>> Stashed changes
}

export default NativeAdCard;
