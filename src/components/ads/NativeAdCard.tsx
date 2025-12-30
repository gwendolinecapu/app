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
    // MonetizationContext et les pubs sont désactivés pour l'instant
    // Nécessite un development build pour fonctionner
    return null;
}

export default NativeAdCard;
