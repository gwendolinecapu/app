
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
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="security" options={{ headerShown: false }} />
            <Stack.Screen name="blocked" options={{ headerShown: false }} />
            <Stack.Screen name="import" options={{ headerShown: false }} />
            <Stack.Screen name="edit-system" options={{ headerShown: false }} />
            <Stack.Screen name="archived-alters" options={{ headerShown: false }} />
            <Stack.Screen name="checkin" options={{ headerShown: false }} />
            <Stack.Screen name="encryption" options={{ headerShown: false }} />
            <Stack.Screen name="subsystems" options={{ headerShown: false }} />
            <Stack.Screen name="system-profile" options={{ headerShown: false }} />
            <Stack.Screen name="widgets" options={{ headerShown: false }} />
            <Stack.Screen name="feedback" options={{ headerShown: false }} />
        </Stack>
    );
}
