import React, { useState } from 'react';
import { View, Image, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';

interface AvatarWithLoadingProps {
    uri?: string | null;
    fallbackText?: string;
    size?: number;
    color?: string;
    style?: any;
}

export function AvatarWithLoading({
    uri,
    fallbackText = '?',
    size = 44,
    color = colors.primary,
    style
}: AvatarWithLoadingProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Si pas d'URL ou erreur, afficher le fallback
    if (!uri || error) {
        return (
            <View style={[
                styles.fallback,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color
                },
                style
            ]}>
                <Text style={[styles.fallbackText, { fontSize: size * 0.5 }]}>
                    {fallbackText.charAt(0).toUpperCase()}
                </Text>
            </View>
        );
    }

    // Afficher l'image avec un spinner en overlay pendant le chargement
    return (
        <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, style]}>
            <Image
                source={{ uri }}
                style={{ width: size, height: size, borderRadius: size / 2 }}
                onLoadStart={() => setLoading(true)}
                onLoad={() => setLoading(false)}
                onError={() => {
                    setLoading(false);
                    setError(true);
                }}
            />
            {loading && (
                <View style={[
                    StyleSheet.absoluteFill,
                    styles.loadingContainer,
                    { backgroundColor: colors.backgroundLight }
                ]}>
                    <ActivityIndicator size="small" color={color} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    fallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
