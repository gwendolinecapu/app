import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../../src/lib/theme';

export default function AlterIdLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: colors.background,
                },
            }}
        />
    );
}
