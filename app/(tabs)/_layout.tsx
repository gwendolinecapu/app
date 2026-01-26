import { Tabs } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { DashboardWrapper } from '../../src/components/dashboard/DashboardWrapper';
import { useResponsive } from '../../src/hooks/useResponsive';

export default function TabLayout() {
    const { colors } = useTheme();
    const { system, user } = useAuth();
    const { isDesktop, isWeb } = useResponsive();

    // Sur desktop web, cacher complètement la tabBar
    const tabBarStyle = (isWeb && isDesktop) ? { display: 'none' as const } : { display: 'none' as const };

    return (
        <DashboardWrapper
            systemName={system?.username}
            userEmail={user?.email}
        >
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle,
                }}
                initialRouteName="dashboard"
            >
            {/* Dashboard - Seul écran visible directement */}
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Système',
                }}
            />

            {/* Tous les autres écrans sont masqués - accessibles via Alter Space */}
            <Tabs.Screen name="journal" options={{ href: null }} />
            <Tabs.Screen name="messages" options={{ href: null }} />
            <Tabs.Screen name="profile" options={{ href: null }} />
            <Tabs.Screen name="alters" options={{ href: null }} />
            <Tabs.Screen name="emotions" options={{ href: null }} />
            <Tabs.Screen name="search" options={{ href: null }} />
            <Tabs.Screen name="create" options={{ href: null }} />
            <Tabs.Screen name="menu" options={{ href: null }} />
            <Tabs.Screen name="notifications" options={{ href: null }} />
            </Tabs>
        </DashboardWrapper>
    );
}


