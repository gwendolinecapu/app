import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
// import { MonetizationProvider } from '../src/contexts/MonetizationContext'; // Disabled - requires development build
import { colors } from '../src/lib/theme';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../src/components/ErrorBoundary'; // Assuming path for ErrorBoundary
import { ToastProvider } from '../src/components/ui/Toast';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
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
            <Stack.Screen name="settings/import" options={{ headerShown: false }} />
            <Stack.Screen name="settings/notifications" options={{ headerShown: false }} />

            {/* Roles */}
            <Stack.Screen name="roles/index" options={{ headerShown: false }} />
            <Stack.Screen name="roles/create" options={{ headerShown: false }} />

            {/* Help/Demandes d'aide */}
            <Stack.Screen name="help/index" options={{ headerShown: false }} />
            <Stack.Screen name="help/create" options={{ headerShown: false }} />

            {/* Journal */}
            <Stack.Screen name="journal/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="journal/create" options={{ headerShown: false }} />

            {/* Tasks */}
            <Stack.Screen name="tasks/index" options={{ headerShown: false }} />
            <Stack.Screen name="tasks/create" options={{ headerShown: false }} />

            {/* Groups */}
            <Stack.Screen name="groups/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="groups/create" options={{ headerShown: false }} />

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
            <Stack.Screen name="emotions/history" options={{ headerShown: false }} />
            <Stack.Screen name="fronting/history" options={{ headerShown: false }} />
            <Stack.Screen name="stats" options={{ headerShown: false }} />
            <ErrorBoundary>
                <ToastProvider>
                    <AuthProvider>
                        <ThemeProvider>
                            <NotificationProvider>
                                {/* <MonetizationProvider> */}
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
                                        <Stack.Screen name="settings/import" options={{ headerShown: false }} />
                                        <Stack.Screen name="settings/notifications" options={{ headerShown: false }} />

                                        {/* Roles */}
                                        <Stack.Screen name="roles/index" options={{ headerShown: false }} />
                                        <Stack.Screen name="roles/create" options={{ headerShown: false }} />

                                        {/* Help/Demandes d'aide */}
                                        <Stack.Screen name="help/index" options={{ headerShown: false }} />
                                        <Stack.Screen name="help/create" options={{ headerShown: false }} />

                                        {/* Journal */}
                                        <Stack.Screen name="journal/[id]" options={{ headerShown: false }} />
                                        <Stack.Screen name="journal/create" options={{ headerShown: false }} />

                                        {/* Tasks */}
                                        <Stack.Screen name="tasks/index" options={{ headerShown: false }} />
                                        <Stack.Screen name="tasks/create" options={{ headerShown: false }} />

                                        {/* Groups */}
                                        <Stack.Screen name="groups/[id]" options={{ headerShown: false }} />
                                        <Stack.Screen name="groups/create" options={{ headerShown: false }} />

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
                                        <Stack.Screen name="emotions/history" options={{ headerShown: false }} />
                                        <Stack.Screen name="fronting/history" options={{ headerShown: false }} />
                                        <Stack.Screen name="stats" options={{ headerShown: false }} />

                                        {/* Boutique */}
                                        <Stack.Screen name="shop/index" options={{ headerShown: false }} />
                                    </Stack>
                                    <StatusBar style="auto" />
                                </View>
                                {/* </MonetizationProvider> */}
                            </NotificationProvider>
                        </ThemeProvider>
                    </AuthProvider>
                </ToastProvider>
            </ErrorBoundary>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
});
