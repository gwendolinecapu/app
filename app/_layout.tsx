import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { MonetizationProvider } from '../src/contexts/MonetizationContext';
import { colors, typography } from '../src/lib/theme';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../src/components/ErrorBoundary'; // Assuming path for ErrorBoundary
import { ToastProvider } from '../src/components/ui/Toast';
import { AppState, AppStateStatus } from 'react-native'; // Import AppState
import React, { useState, useEffect } from 'react'; // React hooks
import { BlurView } from 'expo-blur'; // Privacy Blur
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
    const [isPrivacyActive, setIsPrivacyActive] = useState(false);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                setIsPrivacyActive(false);
            } else if (nextAppState === 'inactive' || nextAppState === 'background') {
                setIsPrivacyActive(true);
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <ErrorBoundary>
                    <ToastProvider>
                        <AuthProvider>
                            <ThemeProvider>
                                <NotificationProvider>
                                    <MonetizationProvider>
                                        <View style={styles.container}>
                                            <Stack
                                                screenOptions={{
                                                    headerStyle: {
                                                        backgroundColor: colors.background,
                                                    },
                                                    headerTintColor: colors.text,
                                                    headerTitleStyle: {
                                                        fontWeight: 'bold',
                                                    },
                                                    contentStyle: {
                                                        backgroundColor: colors.background,
                                                    },
                                                }}
                                            >
                                                <Stack.Screen name="index" options={{ headerShown: false }} />
                                                <Stack.Screen name="alter-space" options={{ headerShown: false }} />
                                                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                                                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                                <Stack.Screen
                                                    name="alter/[id]"
                                                    options={{
                                                        title: 'Profil Alter',
                                                        presentation: 'modal',
                                                        headerShown: false,
                                                    }}
                                                />
                                                <Stack.Screen
                                                    name="conversation/[id]"
                                                    options={{
                                                        title: 'Conversation',
                                                        headerShown: false,
                                                    }}
                                                />
                                                <Stack.Screen
                                                    name="post/create"
                                                    options={{
                                                        title: 'Nouvelle Publication',
                                                        presentation: 'modal',
                                                        headerShown: false,
                                                    }}
                                                />
                                                {/* Settings et sous-écrans */}
                                                <Stack.Screen name="settings/index" options={{ headerShown: false }} />
                                                <Stack.Screen name="settings/import" options={{ headerShown: false, presentation: 'modal' }} />
                                                <Stack.Screen name="settings/notifications" options={{ headerShown: false }} />

                                                {/* Roles */}
                                                <Stack.Screen name="roles/index" options={{ headerShown: false }} />
                                                <Stack.Screen name="roles/create" options={{ headerShown: false, presentation: 'modal' }} />

                                                {/* Help/Demandes d'aide */}
                                                <Stack.Screen name="help/index" options={{ headerShown: false }} />
                                                <Stack.Screen name="help/create" options={{ headerShown: false, presentation: 'modal' }} />

                                                {/* Journal */}
                                                <Stack.Screen name="journal/[id]" options={{ headerShown: false }} />

                                                {/* Premium */}
                                                <Stack.Screen name="premium/index" options={{ headerShown: false, presentation: 'modal' }} />
                                                <Stack.Screen name="journal/create" options={{ headerShown: false, presentation: 'modal' }} />

                                                {/* Tasks */}
                                                <Stack.Screen name="tasks/index" options={{ headerShown: false }} />
                                                <Stack.Screen name="tasks/create" options={{ headerShown: false, presentation: 'modal' }} />

                                                {/* Groups */}
                                                <Stack.Screen name="groups/[id]" options={{ headerShown: false }} />
                                                <Stack.Screen name="groups/create" options={{ headerShown: false, presentation: 'modal' }} />

                                                {/* Découverte et profils externes (Social) */}
                                                <Stack.Screen name="discover/index" options={{ headerShown: false }} />
                                                <Stack.Screen
                                                    name="profile/[systemId]"
                                                    options={{
                                                        headerShown: false,
                                                        presentation: 'modal',
                                                    }}
                                                />

                                                {/* Autres écrans */}
                                                <Stack.Screen name="crisis/index" options={{ headerShown: false }} />
                                                <Stack.Screen name="crisis/guide" options={{ headerShown: false }} />


                                                {/* Boutique */}
                                                <Stack.Screen name="shop/index" options={{ headerShown: false }} />

                                                {/* Historique unifié */}
                                                <Stack.Screen name="history/index" options={{ headerShown: false }} />
                                            </Stack>
                                            <StatusBar style="auto" />
                                            {isPrivacyActive && (
                                                <View style={styles.privacyScreen}>
                                                    <View style={styles.privacyContent}>
                                                        <Ionicons name="lock-closed" size={48} color={colors.primary} />
                                                        <Text style={styles.privacyTitle}>App en pause</Text>
                                                        <Text style={styles.privacySubtitle}>
                                                            Touchez pour revenir
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </MonetizationProvider>
                                </NotificationProvider>
                            </ThemeProvider>
                        </AuthProvider>
                    </ToastProvider>
                </ErrorBoundary>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    privacyScreen: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 99999,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    privacyContent: {
        alignItems: 'center',
        padding: 32,
    },
    privacyTitle: {
        ...typography.h2,
        color: colors.text,
        marginTop: 16,
    },
    privacySubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: 8,
    },
});
