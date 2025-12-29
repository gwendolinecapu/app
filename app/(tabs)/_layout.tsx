import { Tabs, router } from 'expo-router';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as defaultColors } from '../../src/lib/theme';
import { useTheme } from '../../src/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const MAX_WIDTH = 430; // iPhone 14 Pro Max width

export default function TabLayout() {
    const { colors } = useTheme();

    return (
        <View style={styles.phoneContainer}>
            <View style={styles.phoneFrame}>
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarActiveTintColor: colors.primary,
                        tabBarInactiveTintColor: colors.textMuted,
                        tabBarStyle: {
                            backgroundColor: colors.backgroundLight,
                            borderTopColor: colors.border,
                            borderTopWidth: 1,
                            paddingTop: 10,
                            paddingBottom: 10,
                            height: 65,
                        },
                        tabBarShowLabel: false,
                        headerStyle: {
                            backgroundColor: colors.background,
                        },
                        headerTintColor: colors.text,
                    }}
                    initialRouteName="dashboard"
                >
                    {/* Onglet 1: Feed - Fil d'actualité */}
                    <Tabs.Screen
                        name="feed"
                        options={{
                            title: 'Feed',
                            tabBarIcon: ({ focused, color }) => (
                                <Ionicons
                                    name={focused ? "newspaper" : "newspaper-outline"}
                                    size={24}
                                    color={color}
                                    accessibilityLabel="Fil d'actualité"
                                />
                            ),
                        }}
                    />
                    {/* Onglet 2: Journal - Journal personnel */}
                    <Tabs.Screen
                        name="journal"
                        options={{
                            title: 'Journal',
                            tabBarIcon: ({ focused, color }) => (
                                <Ionicons
                                    name={focused ? "book" : "book-outline"}
                                    size={24}
                                    color={color}
                                    accessibilityLabel="Journal"
                                />
                            ),
                        }}
                    />
                    {/* Onglet 3: Dashboard - Accueil Système (Central) */}
                    <Tabs.Screen
                        name="dashboard"
                        options={{
                            title: 'Système',
                            tabBarIcon: ({ focused, color }) => (
                                <View style={styles.addButton}>
                                    <Ionicons
                                        name="planet"
                                        size={32}
                                        color="white"
                                        style={{ marginLeft: 1 }} // Optical adjustment
                                    />
                                </View>
                            ),
                            tabBarLabel: () => null, // Hide label for center button
                        }}
                    />
                    {/* Onglet 4: Émotions - Suivi émotionnel */}
                    <Tabs.Screen
                        name="emotions"
                        options={{
                            title: 'Émotions',
                            tabBarIcon: ({ focused, color }) => (
                                <Ionicons
                                    name={focused ? "heart" : "heart-outline"}
                                    size={24}
                                    color={color}
                                    accessibilityLabel="Émotions"
                                />
                            ),
                        }}
                    />
                    {/* Onglet 5: Messages - Communication */}
                    <Tabs.Screen
                        name="messages"
                        options={{
                            title: 'Discut.',
                            tabBarIcon: ({ focused, color }) => (
                                <Ionicons
                                    name={focused ? "chatbubbles" : "chatbubbles-outline"}
                                    size={24}
                                    color={color}
                                    accessibilityLabel="Messages"
                                />
                            ),
                        }}
                    />

                    {/* Écrans cachés ou secondaires */}
                    <Tabs.Screen
                        name="alters"
                        options={{
                            href: null, // Accessible via Dashboard
                        }}
                    />
                    <Tabs.Screen
                        name="profile"
                        options={{
                            href: null,
                        }}
                    />
                    <Tabs.Screen
                        name="search"
                        options={{
                            href: null,
                        }}
                    />
                    <Tabs.Screen
                        name="create"
                        options={{
                            href: null,
                        }}
                    />
                </Tabs>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    phoneContainer: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    phoneFrame: {
        width: width > MAX_WIDTH ? MAX_WIDTH : '100%',
        height: '100%',
        maxWidth: MAX_WIDTH,
        backgroundColor: defaultColors.background,
        overflow: 'hidden',
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: defaultColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -15,
        shadowColor: defaultColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
