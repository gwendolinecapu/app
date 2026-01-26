/**
 * DashboardWrapper - Wrapper qui choisit entre mobile et desktop layout
 */

import React from 'react';
import { Platform } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { DashboardDesktopLayout } from './DashboardDesktopLayout';
import { DesktopSidebar } from './DesktopSidebar';

interface DashboardWrapperProps {
    systemName?: string;
    userEmail?: string;
    children: React.ReactNode;
}

export function DashboardWrapper({ systemName, userEmail, children }: DashboardWrapperProps) {
    const { isDesktop, isWeb } = useResponsive();

    // Sur web desktop, utiliser le layout avec sidebar
    if (isWeb && isDesktop) {
        return (
            <DashboardDesktopLayout
                sidebar={
                    <DesktopSidebar
                        systemName={systemName}
                        userEmail={userEmail}
                    />
                }
                content={children}
            />
        );
    }

    // Sur mobile ou iOS/Android, layout normal
    return <>{children}</>;
}
