import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { colors, typography, spacing } from '../lib/theme';

interface NetworkContextType {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
    const [showBanner, setShowBanner] = useState(false);

    // Animation value for banner height/opacity with ref to persist across renders
    const bannerAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setIsConnected(state.isConnected);
            setIsInternetReachable(state.isInternetReachable);

            // Show banner if connected but internet not reachable, or completely disconnected
            // Note: On iOS simulator, isInternetReachable can be null initially or weird, be careful
            const isOffline = state.isConnected === false || (state.isConnected === true && state.isInternetReachable === false);
            setShowBanner(isOffline);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        Animated.timing(bannerAnim, {
            toValue: showBanner ? 1 : 0,
            duration: 300,
            useNativeDriver: false, // Height animation doesn't support native driver
        }).start();
    }, [showBanner]);

    return (
        <NetworkContext.Provider value={{ isConnected, isInternetReachable }}>
            {children}
            <Animated.View style={[
                styles.offlineBanner,
                {
                    height: bannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 40]
                    }),
                    opacity: bannerAnim
                }
            ]}>
                <Text style={styles.bannerText}>
                    {isConnected === false
                        ? 'Pas de connexion internet'
                        : 'Connexion internet instable'}
                </Text>
            </Animated.View>
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    offlineBanner: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 47 : 0, // Adjust for status bar/safe area roughly if not inside SafeAreaView
        left: 0,
        right: 0,
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        overflow: 'hidden',
    },
    bannerText: {
        ...typography.caption,
        color: 'white',
        fontWeight: 'bold',
    }
});
