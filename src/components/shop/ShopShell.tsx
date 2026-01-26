import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

import { ShopBottomBar, ShopTab } from './ShopBottomBar';
import { ShopHomeScreen } from './ShopHomeScreen';
import { ShopInventoryScreen } from './ShopInventoryScreen';
import { ShopBankScreen } from './ShopBankScreen';
import { ShopCatalogScreen } from './ShopCatalogScreen';

import { useMonetization } from '../../contexts/MonetizationContext';

const { width } = Dimensions.get('window');

interface ShopShellProps {
    isEmbedded?: boolean;
}

export function ShopShell({ isEmbedded = false }: ShopShellProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { credits, dust } = useMonetization();
    const [activeTab, setActiveTab] = useState<ShopTab>('home');

    const getTitle = () => {
        switch (activeTab) {
            case 'home': return 'BOUTIQUE';
            case 'inventory': return 'MON CASIER';
            case 'bank': return 'BANQUE';
            case 'catalog': return 'CATALOGUE';
            default: return 'BOUTIQUE';
        }
    };

    return (
        <View style={styles.container}>
            {/* DYNAMIC HEADER */}
            {!isEmbedded && (
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <View style={styles.headerTop}>
                        {/* LEFT: BACK BUTTON */}
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>

                        {/* CENTER: TITLE */}
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>{getTitle()}</Text>
                        </View>

                        {/* RIGHT: CURRENCY */}
                        <View style={styles.headerRight}>
                            <View style={styles.currencyContainer}>
                                <View style={styles.creditBadge}>
                                    <Ionicons name="flash" size={12} color="#FCD34D" />
                                    <Text style={styles.creditText}>{dust}</Text>
                                </View>
                                <View style={styles.creditBadge}>
                                    <Ionicons name="diamond" size={12} color="#F59E0B" />
                                    <Text style={styles.creditText}>{credits}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* CONTENT AREA */}
            <View style={styles.contentArea}>
                {activeTab === 'home' && <ShopHomeScreen />}
                {activeTab === 'inventory' && <ShopInventoryScreen />}
                {activeTab === 'bank' && <ShopBankScreen />}
                {activeTab === 'catalog' && <ShopCatalogScreen />}
            </View>

            {/* BOTTOM BAR */}
            <ShopBottomBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: '#0F172A',
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        height: 60,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
        textAlign: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencyContainer: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
    },
    iconBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    creditBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        minWidth: 60,
        justifyContent: 'center',
    },
    creditText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    contentArea: {
        flex: 1,
        // Bottom padding handled by ScrollViews inside screens + tab bar safety
    }
});
