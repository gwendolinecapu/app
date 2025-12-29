import { Tabs, router } from 'expo-router';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/lib/theme';

const { width } = Dimensions.get('window');
const MAX_WIDTH = 430; // iPhone 14 Pro Max width

export default function TabLayout() {
    return (
        <View style={styles.phoneContainer}>
            <View style={styles.phoneFrame}>
                <Tabs
                    screenOptions={{
                        headerShown: true,
                        headerRight: () => (
                            <TouchableOpacity
                                onPress={() => router.push('/crisis')}
                                style={{ marginRight: 16, padding: 8 }}
                            >
                                <Ionicons name="warning-outline" size={24} color={colors.error} />
                            </TouchableOpacity>
                        ),
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
                    initialRouteName="alters"
                >
                    {/* Onglet 1: Alters - Gestion des profils */}
                    <Tabs.Screen
                        name="alters"
                        options={{
                            title: 'Alters',
                            tabBarIcon: ({ focused, color }) => (
                                <Ionicons
                                    name={focused ? "grid" : "grid-outline"}
                                    size={24}
                                    color={color}
                                    accessibilityLabel="Mes Alters"
                                />
                            ),
                        }}
                    />
                    {/* Onglet 2: Émotions - Suivi émotionnel */}
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
                    {/* Onglet 3: Journal - Journal personnel */}
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
                    {/* Onglet 4: Messages - Communication */}
                    <Tabs.Screen
                        name="messages"
                        options={{
                            title: 'Messages',
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
                    {/* Écrans cachés (accessibles mais pas dans la tab bar) */}
                    <Tabs.Screen
                        name="profile"
                        options={{
                            href: null, // Caché de la tab bar
                        }}
                    />
                    <Tabs.Screen
                        name="feed"
                        options={{
                            href: null, // Caché pour Sprint futur
                        }}
                    />
                    <Tabs.Screen
                        name="search"
                        options={{
                            href: null, // Caché pour Sprint futur
                        }}
                    />
                    <Tabs.Screen
                        name="create"
                        options={{
                            href: null, // Redirigé vers /post/create
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
        backgroundColor: colors.background,
        overflow: 'hidden',
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -15,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
