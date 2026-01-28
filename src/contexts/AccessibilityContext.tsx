/**
 * AccessibilityContext.tsx
 * Gestion globale des réglages d'accessibilité (daltonisme, taille texte, contraste, etc.)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorBlindMode } from '../lib/colorBlind';

const STORAGE_KEY = '@accessibility_settings';

export interface AccessibilitySettings {
    colorBlindMode: ColorBlindMode;
    largeText: boolean;
    highContrast: boolean;
    reduceMotion: boolean;
    reduceTransparency: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
    colorBlindMode: 'none',
    largeText: false,
    highContrast: false,
    reduceMotion: false,
    reduceTransparency: false,
};

interface AccessibilityContextType {
    settings: AccessibilitySettings;
    updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
    fontScale: number;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);

    // Load on mount
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then(val => {
                if (val) {
                    setSettings(prev => ({ ...prev, ...JSON.parse(val) }));
                }
            })
            .catch(() => { });
    }, []);

    const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => { });
            return next;
        });
    }, []);

    const fontScale = settings.largeText ? 1.3 : 1.0;

    const value = useMemo(() => ({
        settings,
        updateSetting,
        fontScale,
    }), [settings, updateSetting, fontScale]);

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within AccessibilityProvider');
    }
    return context;
}
