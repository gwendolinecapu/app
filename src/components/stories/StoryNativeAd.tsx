import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import AdMediationService from '../../services/AdMediationService';
import { NativeAdData } from '../../services/MonetizationTypes';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

interface StoryNativeAdProps {
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

export const StoryNativeAd: React.FC<StoryNativeAdProps> = ({ onClose, onNext, onPrev }) => {
    const [adData, setAdData] = useState<NativeAdData | null>(null);
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadAd();
    }, []);

    const loadAd = async () => {
        const ad = await AdMediationService.loadNativeAd();
        setAdData(ad);
        startProgress();
    };

    const startProgress = () => {
        Animated.timing(progress, {
            toValue: 1,
            duration: STORY_DURATION,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                onNext();
            }
        });
    };

    if (!adData) {
        // Show a loading skeleton or skip
        return <View style={styles.container} />;
    }

    return (
        <View style={styles.container}>
            {/* Background Image */}
            <Image source={{ uri: adData.imageUrl }} style={styles.backgroundImage} resizeMode="cover" />

            {/* Gradient Overlay for text readability */}
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            {
                                width: progress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%']
                                })
                            }
                        ]}
                    />
                </View>

                {/* Header (User Info) */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Image source={{ uri: adData.iconUrl }} style={styles.avatar} />
                        <View>
                            <Text style={styles.userName}>{adData.advertiser}</Text>
                            <Text style={styles.sponsoredText}>Sponsorisé</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Touch Handles */}
                <View style={styles.touchContainer}>
                    <TouchableOpacity style={styles.touchLeft} onPress={onPrev} />
                    <TouchableOpacity style={styles.touchRight} onPress={onNext} />
                </View>

                {/* Footer Content */}
                <View style={styles.footer}>
                    <Text style={styles.headline}>{adData.headline}</Text>
                    <Text style={styles.body}>{adData.body}</Text>

                    <TouchableOpacity style={styles.ctaButton} onPress={() => console.log("Ad Clicked")}>
                        <Text style={styles.ctaText}>{adData.callToAction}</Text>
                        <Ionicons name="chevron-forward" size={16} color="white" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        width: width,
        height: height,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: width,
        height: height,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
    },
    progressBarContainer: {
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 10,
        marginTop: 10,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    userName: {
        ...typography.body,
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    sponsoredText: {
        ...typography.tiny,
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    closeButton: {
        padding: 5,
    },
    touchContainer: {
        ...StyleSheet.absoluteFillObject,
        top: 100,
        bottom: 150,
        flexDirection: 'row',
        zIndex: -1, // Behind header/footer
    },
    touchLeft: {
        flex: 1,
    },
    touchRight: {
        flex: 1,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    headline: {
        ...typography.h3,
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    body: {
        ...typography.body,
        color: 'white',
        textAlign: 'center',
        marginBottom: 20,
        opacity: 0.9,
    },
    ctaButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ctaText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
