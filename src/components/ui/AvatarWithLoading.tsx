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
    const [loading, setLoading] = useState(!!uri);
    const [error, setError] = useState(false);

    // Si pas d'URL, afficher directement le fallback
    if (!uri) {
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

    // Si erreur de chargement, afficher fallback
    if (error) {
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

    // Si en cours de chargement, afficher UNIQUEMENT le spinner
    if (loading) {
        return (
            <View style={[
                styles.loadingContainer,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: colors.backgroundLight
                },
                style
            ]}>
                <ActivityIndicator size="small" color={color} />
            </View>
        );
    }

    // Une fois chargé, afficher UNIQUEMENT l'image
    return (
        <Image
            source={{ uri }}
            style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
            onLoadStart={() => setLoading(true)}
            onLoad={() => setLoading(false)}
            onError={() => {
                setLoading(false);
                setError(true);
            }}
        />
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
