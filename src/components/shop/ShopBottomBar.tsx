import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../lib/theme';

export type ShopTab = 'home' | 'inventory' | 'bank' | 'catalog';

interface ShopBottomBarProps {
    activeTab: ShopTab;
    onTabChange: (tab: ShopTab) => void;
}

export function ShopBottomBar({ activeTab, onTabChange }: ShopBottomBarProps) {
    const tabs: { id: ShopTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
        { id: 'home', label: 'Accueil', icon: 'home' },
        { id: 'inventory', label: 'Casier', icon: 'shirt' },
        { id: 'bank', label: 'Banque', icon: 'wallet' },
        { id: 'catalog', label: 'Catalogue', icon: 'grid' },
    ];

    return (
        <View style={styles.container}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.content}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={styles.tab}
                            onPress={() => onTabChange(tab.id)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={isActive ? tab.icon : `${tab.icon}-outline` as any}
                                size={24}
                                color={isActive ? '#F59E0B' : '#9CA3AF'}
                            />
                            <Text style={[styles.label, isActive && styles.labelActive]}>
                                {tab.label}
                            </Text>
                            {isActive && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        flex: 1,
    },
    label: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    labelActive: {
        color: '#F59E0B',
        fontWeight: 'bold',
    },
    activeIndicator: {
        position: 'absolute',
        top: -12,
        width: 40,
        height: 2,
        backgroundColor: '#F59E0B',
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
});
