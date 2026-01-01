
import { Stack } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function SettingsLayout() {
    const { colors } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                contentStyle: {
                    backgroundColor: colors.background,
                },
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
            <Stack.Screen name="security" options={{ headerShown: true, title: 'Sécurité' }} />
            <Stack.Screen name="blocked" options={{ headerShown: true, title: 'Bloqués' }} />
            <Stack.Screen name="import" options={{ headerShown: true, title: 'Import / Export' }} />
            <Stack.Screen name="feedback" options={{ headerShown: false }} />
        </Stack>
    );
}
