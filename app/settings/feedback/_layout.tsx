
import { Stack } from 'expo-router';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function FeedbackLayout() {
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
                headerShown: false, // We'll handle headers in screens or just use default with back
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: true,
                    title: "Retour & Idées",
                }}
            />
            <Stack.Screen
                name="create"
                options={{
                    headerShown: true,
                    title: "Envoyer un retour",
                }}
            />
        </Stack>
    );
}
