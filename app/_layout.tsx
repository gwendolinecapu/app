import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { colors } from '../src/lib/theme';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
    return (
        <AuthProvider>
            <View style={styles.container}>
                <StatusBar style="light" />
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
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="alter/[id]"
                        options={{
                            title: 'Profil Alter',
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="conversation/[id]"
                        options={{
                            title: 'Conversation',
                        }}
                    />
                    <Stack.Screen
                        name="post/create"
                        options={{
                            title: 'Nouvelle Publication',
                            presentation: 'modal',
                        }}
                    />
                </Stack>
            </View>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
});
