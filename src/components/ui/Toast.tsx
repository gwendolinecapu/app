import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { triggerHaptic } from '../../lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [activeToast, setActiveToast] = useState<Toast | null>(null);
    const insets = useSafeAreaInsets();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const isAnimatingRef = useRef(false);

    const animateOut = useCallback(() => {
        if (isAnimatingRef.current) return; // Prevent double animation
        isAnimatingRef.current = true;

        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setActiveToast(null);
            slideAnim.setValue(-100);
            isAnimatingRef.current = false;
        });
    }, [slideAnim, opacityAnim]);

    useEffect(() => {
        if (activeToast) {
            // Stop any running animations first
            slideAnim.stopAnimation();
            opacityAnim.stopAnimation();

            // Reset to initial state
            slideAnim.setValue(-100);
            opacityAnim.setValue(0);

            // Animate in
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 10,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide timer
            timeoutRef.current = setTimeout(() => {
                animateOut();
            }, activeToast.duration || 1500);
        }

        // Cleanup timeout
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [activeToast, opacityAnim, slideAnim, animateOut]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 2000) => {
        // Clear existing timeout if any
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Force reset animation state
        isAnimatingRef.current = false;

        // Haptic feedback based on type
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

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {activeToast && (
                <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="box-none">
                    <Animated.View
                        style={[
                            styles.toast,
                            styles[`toast_${activeToast.type}` as keyof typeof styles],
                            {
                                transform: [{ translateY: slideAnim }],
                                opacity: opacityAnim,
                            }
                        ]}
                    >
                        {/* Tap to dismiss - Fix for stuck toast */}
                        <View
                            style={styles.touchableArea}
                            onTouchEnd={hideToast}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons
                                    name={getIconName(activeToast.type)}
                                    size={24}
                                    color="#FFF"
                                />
                            </View>
                            <Text style={styles.message}>{activeToast.message}</Text>
                        </View>
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

const getIconName = (type: ToastType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
        case 'success': return 'checkmark-circle';
        case 'error': return 'alert-circle';
        case 'warning': return 'warning';
        default: return 'information-circle';
    }
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
        minWidth: 200,
        maxWidth: '100%',
    },
    toast_success: {
        backgroundColor: '#4CAF50', // Green
    },
    toast_error: {
        backgroundColor: '#FF5252', // Red
    },
    toast_warning: {
        backgroundColor: '#FFC107', // Amber
    },
    toast_info: {
        backgroundColor: '#2196F3', // Blue
    },
    iconContainer: {
        marginRight: 10,
    },
    message: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    // Style for tap-to-dismiss touchable area - fixes stuck toast bug
    touchableArea: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
});
