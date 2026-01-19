/**
 * AvatarWithAccessory.tsx
 * Composant qui affiche un avatar avec des accessoires superposés
 */

import React from 'react';
import { View, StyleSheet, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import { getAccessory, getAccessoryPositionStyle, AccessoryItem } from '../../lib/accessories';

interface AvatarWithAccessoryProps {
    avatarUrl?: string | null;
    accessoryIds?: string[];  // Liste des IDs d'accessoires équipés
    size?: number;
    borderRadius?: number;
    style?: any;
}

export const AvatarWithAccessory = React.memo(({
    avatarUrl,
    accessoryIds = [],
    size = 88,
    borderRadius,
    style,
}: AvatarWithAccessoryProps) => {
    // Résolution des accessoires
    const accessories = accessoryIds
        .map(id => getAccessory(id))
        .filter((a): a is AccessoryItem => a !== undefined)
        .sort((a, b) => a.style.zIndex - b.style.zIndex);

    const avatarBorderRadius = borderRadius ?? size / 2;

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            {/* Avatar de base */}
            {avatarUrl ? (
                <Image
                    source={{ uri: avatarUrl }}
                    style={[
                        styles.avatar,
                        {
                            width: size,
                            height: size,
                            borderRadius: avatarBorderRadius,
                        }
                    ]}
                    contentFit="cover"
                />
            ) : (
                <View
                    style={[
                        styles.placeholder,
                        {
                            width: size,
                            height: size,
                            borderRadius: avatarBorderRadius,
                        }
                    ]}
                />
            )}

            {/* Accessoires superposés */}
            {accessories.map((accessory) => {
                const positionStyle = getAccessoryPositionStyle(accessory, size);

                return (
                    <RNImage
                        key={accessory.id}
                        source={accessory.style.imageSource}
                        style={{
                            position: 'absolute',
                            width: positionStyle.width as number,
                            height: positionStyle.height as number,
                            left: positionStyle.left as number,
                            top: positionStyle.top as number,
                        }}
                        resizeMode="contain"
                    />
                );
            })}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'visible', // Important pour les accessoires qui dépassent
    },
    avatar: {
        backgroundColor: '#2a2a2e',
    },
    placeholder: {
        backgroundColor: '#3a3a3e',
    },
    accessory: {
        position: 'absolute',
    },
});

export default AvatarWithAccessory;
