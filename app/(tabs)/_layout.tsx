import { Tabs, router } from 'expo-router';
import { View, StyleSheet, Dimensions } from 'react-native';
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
                        headerShown: false,
                    }}
                    initialRouteName="alters"
                >
                    <Tabs.Screen
                        name="alters"
                        options={{
                            title: 'Alters',
                            tabBarIcon: ({ focused, color }) => (
                                <Ionicons
                                    name={focused ? "grid" : "grid-outline"}
                                    size={24}
                                    color={color}
                                    accessibilityLabel="Fil d'actualité"
                                />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="feed"
                        options={{
                            title: 'Feed',
                            tabBarIcon: ({ focused, color }) => (
                                <Ionicons
                                    name={focused ? "images" : "images-outline"}
                                    size={24}
                                    color={color}
                                />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="create"
                        options={{
                            title: 'Créer',
                            tabBarIcon: ({ focused }) => (
                                <View style={styles.addButton}>
                                    <Ionicons name="add" size={32} color="#FFF" accessibilityLabel="Créer un post" />
                                </View>
                            ),
                        }}
                        listeners={({ navigation }) => ({
                            tabPress: (e) => {
                                e.preventDefault();
                                router.push('/post/create');
                            },
                        })}
                    />
                    <Tabs.Screen
                        name="search"
                        options={{
                            title: 'Recherche',
                            tabBarIcon: ({ focused, color }) => (
                                <Ionicons
                                    name={focused ? "search" : "search-outline"}
                                    size={24}
                                    color={color}
                                    accessibilityLabel="Recherche"
                                />
                            ),
                        }}
                    />
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
                    <Tabs.Screen
                        name="profile"
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
