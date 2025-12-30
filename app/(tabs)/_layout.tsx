import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as defaultColors } from '../../src/lib/theme';
import { useTheme } from '../../src/contexts/ThemeContext';
import { triggerHaptic } from '../../src/lib/haptics';

export default function TabLayout() {
    const { colors } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.backgroundLight,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
                    height: Platform.OS === 'ios' ? 85 : 60,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
                headerStyle: {
                    backgroundColor: colors.background,
                },
                headerTintColor: colors.text,
            }}
            initialRouteName="dashboard"
        >
            {/* Onglet 1: Dashboard - Accueil Système */}
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Système',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons name={focused ? 'planet' : 'planet-outline'} size={size} color={color} />
                    ),
                }}
                listeners={{
                    tabPress: () => triggerHaptic.selection(),
                }}
            />

            {/* Onglet 2: Journal */}
            <Tabs.Screen
                name="journal"
                options={{
                    title: 'Journal',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons name={focused ? 'book' : 'book-outline'} size={size} color={color} />
                    ),
                }}
                listeners={{
                    tabPress: () => triggerHaptic.selection(),
                }}
            />

            {/* Onglet 3: Messages */}
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Messages',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
                    ),
                }}
                listeners={{
                    tabPress: () => triggerHaptic.selection(),
                }}
            />

            {/* Onglet 4: Profil */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
                    ),
                }}
                listeners={{
                    tabPress: () => triggerHaptic.selection(),
                }}
            />

            {/* Écrans cachés - accessibles via navigation mais pas dans la tab bar */}
            <Tabs.Screen
                name="alters"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="emotions"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="search"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="create"
                options={{ href: null }}
            />
        </Tabs>
    );
}

