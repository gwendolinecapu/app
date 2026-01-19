import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import Animated, {
    SlideInUp,
    SlideOutUp
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

export const OfflineBanner = () => {
    const netInfo = useNetInfo();
    const insets = useSafeAreaInsets();
    const isOffline = netInfo.isConnected === false;

    if (!isOffline) return null;

    return (
        <Animated.View
            entering={SlideInUp.duration(500)}
            exiting={SlideOutUp.duration(500)}
            style={[styles.container, { paddingTop: insets.top + 8 }]}
        >
            <View style={styles.content}>
                <Ionicons name="cloud-offline" size={16} color="white" />
                <Text style={styles.text}>Mode hors ligne</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.error, // Or a warning color like orange/dark grey
        alignItems: 'center',
        paddingBottom: 8,
        zIndex: 99999,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    text: {
        ...typography.caption,
        color: 'white',
        fontWeight: 'bold',
    }
});
