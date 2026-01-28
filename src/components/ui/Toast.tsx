import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    withDelay,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';
import { triggerHaptic } from '../../lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Configuration par type
const TOAST_CONFIG: Record<ToastType, {
    icon: keyof typeof Ionicons.glyphMap;
    bgColor: string;
    iconColor: string;
    borderColor: string;
}> = {
    success: {
        icon: 'checkmark-circle',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        iconColor: '#10B981',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    error: {
        icon: 'close-circle',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        iconColor: '#EF4444',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    warning: {
        icon: 'warning',
        bgColor: 'rgba(245, 158, 11, 0.15)',
        iconColor: '#F59E0B',
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    info: {
        icon: 'information-circle',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        iconColor: '#3B82F6',
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
};

// Composant icon animé
const AnimatedIcon = ({ type, visible }: { type: ToastType; visible: boolean }) => {
    const scale = useSharedValue(0);
    const config = TOAST_CONFIG[type];

    useEffect(() => {
        if (visible) {
            scale.value = withSequence(
                withTiming(0, { duration: 0 }),
                withDelay(100, withSpring(1.2, { damping: 12, stiffness: 200 })),
                withSpring(1, { damping: 15 })
            );
        } else {
            scale.value = withTiming(0, { duration: 150 });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
            <View style={[styles.iconBg, { backgroundColor: config.bgColor }]}>
                <Ionicons name={config.icon} size={22} color={config.iconColor} />
            </View>
        </Animated.View>
    );
};

// Progress bar animée
const ProgressBar = ({ duration, color }: { duration: number; color: string }) => {
    const progress = useSharedValue(1);

    useEffect(() => {
        progress.value = withTiming(0, {
            duration: duration,
            easing: Easing.linear,
        });
    }, [duration]);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    return (
        <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, { backgroundColor: color }, animatedStyle]} />
        </View>
    );
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [activeToast, setActiveToast] = useState<Toast | null>(null);
    const insets = useSafeAreaInsets();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const isShowingRef = useRef(false);

    // Animation values
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);
    const backdropBlur = useSharedValue(0);

    const animateOut = useCallback(() => {
        translateY.value = withTiming(-100, { duration: 250, easing: Easing.in(Easing.cubic) });
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0.9, { duration: 200 });
        backdropBlur.value = withTiming(0, { duration: 200 });

        setTimeout(() => {
            setActiveToast(null);
            isShowingRef.current = false;
        }, 250);
    }, []);

    useEffect(() => {
        if (activeToast && !isShowingRef.current) {
            isShowingRef.current = true;

            // Reset
            cancelAnimation(translateY);
            cancelAnimation(opacity);
            cancelAnimation(scale);

            translateY.value = -100;
            opacity.value = 0;
            scale.value = 0.9;

            // Animate in
            translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
            opacity.value = withTiming(1, { duration: 250 });
            scale.value = withSpring(1, { damping: 15, stiffness: 200 });
            backdropBlur.value = withTiming(1, { duration: 300 });

            // Auto hide
            timeoutRef.current = setTimeout(() => {
                animateOut();
            }, activeToast.duration || 2500);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [activeToast]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 2500) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        isShowingRef.current = false;

        // Haptic feedback
        switch (type) {
            case 'success': triggerHaptic.success(); break;
            case 'error': triggerHaptic.error(); break;
            case 'warning': triggerHaptic.warning(); break;
            default: triggerHaptic.light();
        }

        setActiveToast({
            id: Date.now().toString(),
            message,
            type,
            duration
        });
    }, []);

    const hideToast = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        animateOut();
    }, [animateOut]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        opacity: opacity.value,
    }));

    const config = activeToast ? TOAST_CONFIG[activeToast.type] : TOAST_CONFIG.info;

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {activeToast && (
                <View style={[styles.wrapper, { top: insets.top + 12 }]} pointerEvents="box-none">
                    <Animated.View style={[styles.container, containerStyle]}>
                        <Pressable onPress={hideToast} style={styles.pressable}>
                            {Platform.OS === 'ios' ? (
                                <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                                    <View style={[styles.innerBorder, { borderColor: config.borderColor }]}>
                                        <AnimatedIcon type={activeToast.type} visible={true} />
                                        <View style={styles.textContainer}>
                                            <Text style={styles.message} numberOfLines={2}>
                                                {activeToast.message}
                                            </Text>
                                        </View>
                                        <Pressable onPress={hideToast} hitSlop={10}>
                                            <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
                                        </Pressable>
                                    </View>
                                    <ProgressBar duration={activeToast.duration || 2500} color={config.iconColor} />
                                </BlurView>
                            ) : (
                                <View style={[styles.androidContainer, { borderColor: config.borderColor }]}>
                                    <View style={styles.innerBorder}>
                                        <AnimatedIcon type={activeToast.type} visible={true} />
                                        <View style={styles.textContainer}>
                                            <Text style={styles.message} numberOfLines={2}>
                                                {activeToast.message}
                                            </Text>
                                        </View>
                                        <Pressable onPress={hideToast} hitSlop={10}>
                                            <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
                                        </Pressable>
                                    </View>
                                    <ProgressBar duration={activeToast.duration || 2500} color={config.iconColor} />
                                </View>
                            )}
                        </Pressable>
                    </Animated.View>
                </View>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 9999,
        alignItems: 'center',
    },
    container: {
        width: '100%',
        maxWidth: 400,
    },
    pressable: {
        width: '100%',
    },
    blurContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    androidContainer: {
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    innerBorder: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
        borderWidth: Platform.OS === 'ios' ? 1 : 0,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        margin: Platform.OS === 'ios' ? 1 : 0,
    },
    iconContainer: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    message: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    progressContainer: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    progressBar: {
        height: '100%',
        borderRadius: 1.5,
    },
});
