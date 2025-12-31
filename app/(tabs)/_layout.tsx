import { Tabs, router } from 'expo-router';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useState } from 'react';
import { SystemMenuModal } from '../../src/components/dashboard/SystemMenuModal';

export default function TabLayout() {
    export default function TabLayout() {
        const { colors } = useTheme();

        return (
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        display: 'none', // Tab Bar masquée - navigation via bulles d'alter
                    },
                }}
                initialRouteName="dashboard"
            >
                {/* Dashboard - Seul écran visible directement */}
                <Tabs.Screen
                    name="dashboard"
                    options={{
                        title: 'Système',
                    }}
                />

                {/* Tous les autres écrans sont masqués - accessibles via Alter Space */}
                <Tabs.Screen name="journal" options={{ href: null }} />
                <Tabs.Screen name="messages" options={{ href: null }} />
                <Tabs.Screen name="profile" options={{ href: null }} />
                <Tabs.Screen name="alters" options={{ href: null }} />
                <Tabs.Screen name="emotions" options={{ href: null }} />
                <Tabs.Screen name="search" options={{ href: null }} />
                <Tabs.Screen name="create" options={{ href: null }} />
                <Tabs.Screen name="menu" options={{ href: null }} />
                <Tabs.Screen name="notifications" options={{ href: null }} />
            </Tabs>
        );
    }


