import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Animated, {
    FadeInUp,
    FadeOutUp,
    SlideInUp,
    SlideOutUp,
    withSpring,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { colors } from '../../lib/theme';
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
    const timeoutRef = useRef<NodeJS.Timeout>();

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        // Clear existing timeout if any
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

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

        // Auto hide
        timeoutRef.current = setTimeout(() => {
            setActiveToast(null);
        }, duration);
    }, []);

    const hideToast = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setActiveToast(null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {activeToast && (
                <View style={[styles.container, { top: insets.top + 10 }]}>
                    <Animated.View
                        entering={SlideInUp.springify().damping(15)}
                        exiting={SlideOutUp}
                        style={[
                            styles.toast,
                            styles[`toast_${activeToast.type}`]
                        ]}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name={getIconName(activeToast.type)}
                                size={24}
                                color="#FFF"
                            />
                        </View>
                        <Text style={styles.message}>{activeToast.message}</Text>
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
    }
});
