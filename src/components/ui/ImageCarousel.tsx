import React, { useState, useRef } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Dimensions,
    Image,
    TouchableOpacity,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { colors, spacing } from '../../lib/theme';

// =====================================================
// IMAGE CAROUSEL
// Carrousel swipeable pour posts multi-images
// Avec indicateurs de pagination (dots)
// =====================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageCarouselProps {
    images: string[];
    onImagePress?: (index: number, imageUrl: string) => void;
    aspectRatio?: number; // Default 1 (square)
}

export const ImageCarousel = ({ images, onImagePress, aspectRatio = 1 }: ImageCarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        if (index !== currentIndex && index >= 0 && index < images.length) {
            setCurrentIndex(index);
        }
    };

    if (images.length === 0) return null;

    // Single image - no carousel needed
    if (images.length === 1) {
        return (
            <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => onImagePress?.(0, images[0])}
            >
                <Image
                    source={{ uri: images[0] }}
                    style={[styles.image, { aspectRatio }]}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
            >
                {images.map((uri, index) => (
                    <TouchableOpacity
                        key={`${uri}-${index}`}
                        activeOpacity={0.95}
                        onPress={() => onImagePress?.(index, uri)}
                    >
                        <Image
                            source={{ uri }}
                            style={[styles.image, { aspectRatio }]}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {images.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === currentIndex && styles.dotActive,
                        ]}
                    />
                ))}
            </View>

            {/* Image Counter */}
            <View style={styles.counter}>
                <View style={styles.counterBg}>
                    {/* Counter text handled via Text component in parent if needed */}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: SCREEN_WIDTH,
    },
    image: {
        width: SCREEN_WIDTH,
        backgroundColor: colors.backgroundLight,
    },
    pagination: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dotActive: {
        backgroundColor: 'white',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    counter: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    counterBg: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    counterText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});
