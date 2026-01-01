import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMonetization } from '../../contexts/MonetizationContext';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface AdRewardCardProps {
    alterId?: string;
}

export function AdRewardCard({ alterId }: AdRewardCardProps) {
    const {
        canWatchRewardAd,
        rewardAdsRemaining,
        watchRewardAd,
        loading
    } = useMonetization();

    const [watching, setWatching] = useState(false);

    const handleWatch = async () => {
        if (!alterId) return;
        setWatching(true);
        try {
            const result = await watchRewardAd(alterId);
            if (result.completed) {
                Alert.alert('Récompense', `Vous avez gagné +${result.rewardAmount} crédits !`);
            } else {
                Alert.alert('Annulé', 'Vous devez regarder la vidéo en entier pour recevoir la récompense.');
            }
        } catch (error) {
            Alert.alert('Oups', 'Publicité non disponible pour le moment.');
        } finally {
            setWatching(false);
        }
    };

    if (!alterId) return null;

    // S'il ne reste plus de pubs, on masque ou on grise
    if (rewardAdsRemaining <= 0) {
        return null;
    }

    return (
        <LinearGradient
            colors={['#1E3A8A', '#2563EB']} // Blue gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="videocam" size={24} color="#FFF" />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>Crédits Gratuits</Text>
                    <Text style={styles.subtitle}>
                        Regarde une courte vidéo pour gagner +50💎
                    </Text>
                    <Text style={styles.counter}>
                        Restant aujourd'hui : {rewardAdsRemaining}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, (!canWatchRewardAd || watching) && styles.buttonDisabled]}
                    onPress={handleWatch}
                    disabled={!canWatchRewardAd || watching}
                >
                    {watching ? (
                        <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                        <Text style={styles.buttonText}>Voir</Text>
                    )}
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.md,
        padding: 4, // border padding effect
        marginBottom: spacing.md,
        elevation: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 15,
        marginBottom: 2,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginBottom: 4,
    },
    counter: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
    },
    button: {
        backgroundColor: '#FFF',
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: borderRadius.full,
        minWidth: 70,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 12,
    }
});
