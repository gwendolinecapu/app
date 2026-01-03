import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text, SafeAreaView, Linking } from 'react-native';
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
                allowsInlineMediaPlayback={true} // Prevent videos from going full screen automatically
                mediaPlaybackRequiresUserAction={false}
                // Keep Desktop UA for bypass, but fix UI with CSS
                userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                injectedJavaScriptBeforeContentLoaded={`
                    window.open = function() { return null; };
                `}
                injectedJavaScript={`
                    (function() {
                        const style = document.createElement('style');
                        style.innerHTML = \`
                            /* --- HIDE DESKTOP CLUTTER --- */
                            /* Warning: Selectors are brittle. Target generic structural containers if possible. */
                            
                            /* Sidebar */
                            [data-e2e="sidebar-container-wrapper"], 
                            [class*="SideNavContainer"], 
                            nav {
                                display: none !important; 
                            }

                            /* Top Header */
                            #header-main, 
                            [data-e2e="top-header-container"],
                            header {
                                display: none !important;
                            }

                            /* Login / Open App Prompts */
                            .e19f2d12, [data-e2e="open-app-modal"], #tiktok-verify-ele, 
                            [class*="OpenApp"], .index-open-app-btn, [id*="login-modal"], 
                            div[role="dialog"], #loginContainer, #header-login-button,
                            [data-e2e="top-login-button"], [class*="banner"]
                            { display: none !important; }

                            /* --- FORCE MOBILE LAYOUT --- */
                            html, body {
                                overflow-x: hidden !important;
                                background: black !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }

                            /* Make the main feed container fill the screen */
                            [data-e2e="main-content-response"], 
                            [class*="MainContainer"], 
                            [class*="DivBodyContainer"] {
                                margin-left: 0 !important;
                                width: 100vw !important;
                                max-width: 100vw !important;
                                padding: 0 !important;
                            }

                            /* Video Player - Force "Cover" fit to look like app */
                            video {
                                object-fit: cover !important;
                                width: 100vw !important;
                                height: 100vh !important;
                                max-height: 100vh !important;
                            }

                            /* Center the feed */
                            [data-e2e="feed-container"] {
                                width: 100% !important;
                                display: flex !important;
                                justify-content: center !important;
                            }
                        \`;
                        document.head.appendChild(style);

                        // --- Aggressive Event Killer for "Full Screen" ---
                        window.addEventListener('scroll', (e) => {
                            e.stopImmediatePropagation();
                        }, true);

                    })();
                `}
                onShouldStartLoadWithRequest={(request) => {
                    const { url } = request;

                    // 1. Strict Block List
                    const blockedDomains = [
                        'apps.apple.com',
                        'itunes.apple.com',
                        'snssdk1233', // TikTok scheme
                        'tiktok://'
                    ];

                    if (blockedDomains.some(domain => url.includes(domain))) {
                        return false;
                    }

                    // 2. Block custom schemes (tiktok://, mailto:, etc.)
                    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:blank')) {
                        return false;
                    }

                    // 3. Allow normal navigation
                    return true;
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
