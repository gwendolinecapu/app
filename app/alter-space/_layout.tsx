import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/lib/theme';

export default function AlterSpaceLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: colors.background,
                },
            }}
        >
            <Stack.Screen name="[alterId]" />
        </Stack>
    );
}
