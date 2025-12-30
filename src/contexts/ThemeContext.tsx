import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { colors as defaultColors } from '../lib/theme';

type ThemeColors = typeof defaultColors;

interface ThemeContextType {
    colors: ThemeColors;
    isDynamic: boolean; // True if using an alter's specific color
}

const ThemeContext = createContext<ThemeContextType>({
    colors: defaultColors,
    isDynamic: false,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { activeFront } = useAuth();

    const themeColors = useMemo(() => {
        // Default theme
        let currentPrimary = defaultColors.primary;
        let isDynamic = false;

        // Determine dynamic color based on active front
        if (activeFront.type === 'single' && activeFront.alters.length > 0) {
            const alter = activeFront.alters[0];
            if (alter.color) {
                currentPrimary = alter.color;
                isDynamic = true;
            }
        } else if (activeFront.type === 'co-front' && activeFront.alters.length > 0) {
            // For co-fronting, we use the first alter's color as the primary theme color for now
            const alter = activeFront.alters[0];
            if (alter.color) {
                currentPrimary = alter.color;
                isDynamic = true;
            }
        }

        return {
            colors: {
                ...defaultColors,
                primary: currentPrimary,
                // We can also adjust other derivative colors if needed, 
                // but for now keeping it simple with just primary
                gradientStart: isDynamic ? currentPrimary : defaultColors.gradientStart,
            },
            isDynamic
        };
    }, [activeFront]);

    return (
        <ThemeContext.Provider value={themeColors}>
            {children}
        </ThemeContext.Provider>
    );
}
