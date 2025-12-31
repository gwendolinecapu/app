import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { MonetizationProvider } from '../src/contexts/MonetizationContext';
import { NetworkProvider } from '../src/contexts/NetworkContext';
import { ToastProvider } from '../src/components/ui/Toast';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OfflineBanner } from '../src/components/ui/OfflineBanner';
import { SuccessAnimation } from '../src/components/ui/SuccessAnimation';
import { SuccessAnimationProvider } from '../src/contexts/SuccessAnimationContext';
import { colors, typography } from '../src/lib/theme';

import { BiometricGuard } from '../src/components/auth/BiometricGuard';

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaProvider>
                <ToastProvider>
                    <ErrorBoundary>
                        <AuthProvider>
                            <NetworkProvider>
                                <ThemeProvider>
                                    <NotificationProvider>
                                        <MonetizationProvider>
                                            <SuccessAnimationProvider>
                                                <BiometricGuard>
                                                    <View style={styles.container}>
                                                        <OfflineBanner />
                                                        <SuccessAnimation />
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
                                                                animation: 'fade',
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
                                                            <Stack.Screen name="settings/index" options={{ headerShown: false }} />
                                                            <Stack.Screen name="settings/import" options={{ headerShown: false, presentation: 'modal' }} />
                                                            <Stack.Screen name="settings/notifications" options={{ headerShown: false }} />
                                                            <Stack.Screen name="settings/blocked" options={{ headerShown: false }} />
                                                            <Stack.Screen name="settings/security" options={{ headerShown: false }} />
                                                            <Stack.Screen name="settings/edit-system" options={{ headerShown: false }} />
                                                            <Stack.Screen name="settings/blocked" options={{ headerShown: false }} />
                                                            <Stack.Screen name="settings/security" options={{ headerShown: false }} />
                                                            <Stack.Screen name="settings/edit-system" options={{ headerShown: false }} />

                                                            <Stack.Screen name="roles/index" options={{ headerShown: false }} />
                                                            <Stack.Screen name="roles/create" options={{ headerShown: false, presentation: 'modal' }} />

                                                            <Stack.Screen name="help/index" options={{ headerShown: false }} />
                                                            <Stack.Screen name="help/create" options={{ headerShown: false, presentation: 'modal' }} />

                                                            <Stack.Screen name="journal/[id]" options={{ headerShown: false }} />

                                                            <Stack.Screen name="premium/index" options={{ headerShown: false, presentation: 'modal' }} />
                                                            <Stack.Screen name="journal/create" options={{ headerShown: false, presentation: 'modal' }} />

                                                            <Stack.Screen name="tasks/index" options={{ headerShown: false }} />
                                                            <Stack.Screen name="tasks/create" options={{ headerShown: false, presentation: 'modal' }} />

                                                            <Stack.Screen name="groups/[id]" options={{ headerShown: false }} />
                                                            <Stack.Screen name="groups/create" options={{ headerShown: false, presentation: 'modal' }} />

                                                            <Stack.Screen name="discover/index" options={{ headerShown: false }} />
                                                            <Stack.Screen
                                                                name="profile/[systemId]"
                                                                options={{
                                                                    headerShown: false,
                                                                    presentation: 'modal',
                                                                }}
                                                            />

                                                            <Stack.Screen name="crisis/index" options={{ headerShown: false }} />
                                                            <Stack.Screen name="crisis/guide" options={{ headerShown: false }} />

                                                            <Stack.Screen name="shop/index" options={{ headerShown: false }} />

                                                            <Stack.Screen name="history/index" options={{ headerShown: false }} />
                                                        </Stack>
                                                        <StatusBar style="auto" />
                                                    </View>
                                                </BiometricGuard>
                                            </SuccessAnimationProvider>
                                        </MonetizationProvider>
                                    </NotificationProvider>
                                </ThemeProvider>
                            </NetworkProvider>
                        </AuthProvider>
                    </ErrorBoundary>
                </ToastProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
});

