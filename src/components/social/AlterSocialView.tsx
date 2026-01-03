import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Alter } from '../../types';
import { SocialSessionService, SupportedPlatform } from '../../services/social';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Props {
    alter: Alter;
    platform: SupportedPlatform;
    initialUrl?: string;
}

const PLATFORM_URLS: Record<SupportedPlatform, string> = {
    tiktok: 'https://www.tiktok.com',
    instagram: 'https://www.instagram.com',
    twitter: 'https://twitter.com',
    youtube: 'https://www.youtube.com'
};

export default function AlterSocialView({ alter, platform, initialUrl }: Props) {
    const router = useRouter();
    const webViewRef = useRef<WebView>(null);
    const [isReady, setIsReady] = useState(false);
    const url = initialUrl || PLATFORM_URLS[platform];
    const domain = new URL(url).hostname; // e.g. "www.tiktok.com"

    useEffect(() => {
        let isMounted = true;

        const initSession = async () => {
            console.log(`[AlterSocialView] Initializing session for ${alter.name} on ${platform}`);
            await SocialSessionService.restoreSession(alter, platform, domain);
            if (isMounted) setIsReady(true);
        };

        initSession();

        return () => {
            isMounted = false;
            // Save session on exit
            console.log(`[AlterSocialView] Saving session for ${alter.name} on ${platform}`);
            SocialSessionService.saveSession(alter.id, platform, domain);
        };
    }, [alter.id, platform, domain]);

    // Save session periodically (e.g. every 1 minute) in case of crash
    useEffect(() => {
        const interval = setInterval(() => {
            SocialSessionService.saveSession(alter.id, platform, domain);
        }, 60000);
        return () => clearInterval(interval);
    }, [alter.id, platform, domain]);

    const handleClose = async () => {
        await SocialSessionService.saveSession(alter.id, platform, domain);
        router.back();
    };

    if (!isReady) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF0050" />
                <Text style={styles.loadingText}>Connexion au compte de {alter.name}...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{platform.charAt(0).toUpperCase() + platform.slice(1)} ({alter.name})</Text>
            </View>
            <WebView
                ref={webViewRef}
                source={{ uri: url }}
                style={styles.webview}
                sharedCookiesEnabled={true} // Important for Android
                thirdPartyCookiesEnabled={true} // Important for Android
                domStorageEnabled={true}
                javaScriptEnabled={true}
                // Inject some JS to prevent "Open in App" prompts if possible
                injectedJavaScript={`
                    // Try to hide "Open in App" banners
                    const styles = document.createElement('style');
                    styles.innerHTML = '.index-open-app-btn, [class*="OpenApp"] { display: none !important; }';
                    document.body.appendChild(styles);
                `}
                onNavigationStateChange={(navState) => {
                    // Could track navigation here if needed
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
    },
    header: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: '#000',
    },
    closeButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 15,
        fontSize: 16,
    },
    webview: {
        flex: 1,
    }
});
