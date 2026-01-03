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
                // Use Desktop Chrome UA to bypass mobile-specific "force app" logic
                userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                injectedJavaScriptBeforeContentLoaded={`
                    // Forcefully disable window.open
                    window.open = function() { return null; };
                `}
                injectedJavaScript={`
                    (function() {
                        const style = document.createElement('style');
                        style.innerHTML = \`
                            /* Hide specific app upsell elements */
                            .e19f2d12, 
                            [data-e2e="open-app-modal"], 
                            #tiktok-verify-ele, 
                            [class*="OpenApp"], 
                            .index-open-app-btn,
                            [id*="login-modal"],
                            div[role="dialog"],
                            a[href^="tiktok://"],
                            a[href*="apps.apple.com"],
                            [class*="banner"],
                            [class*="modal"],
                            #loginContainer,
                            #header-login-button,
                            [data-e2e="top-login-button"]
                            { display: none !important; }

                            /* Fix Desktop layout on Mobile Screen if needed */
                            body {
                                min-width: 100vw !important;
                                overflow-x: hidden !important;
                            }
                        \`;
                        document.head.appendChild(style);

                        // Aggressive cleanup loop
                        const clickVariants = ['pas maintenant', 'not now', 'later', 'plus tard', 'continuer sur le web', 'continue on web', 'cancel', 'annuler', 'fermer', 'close', 'guest', 'invité'];
                        const hideVariants = ['ouvrir l\\'application', 'open app', 'get app', 'installer', 'install', 'connexion', 'login', 'se connecter'];

                        setInterval(() => {
                            // 1. Text-based filtering
                            const allElements = document.querySelectorAll('div, button, a, span, p');
                            for (let el of allElements) {
                                const text = el.textContent ? el.textContent.trim().toLowerCase() : '';
                                
                                // Action 1: Click "Not Now" / "Guest" buttons
                                if (clickVariants.some(v => text === v)) {
                                    try { el.click(); } catch(e) {}
                                    
                                    // Also hide parent if it looks like a modal
                                    let current = el;
                                    let depth = 0;
                                    while (current && current !== document.body && depth < 10) {
                                        const style = window.getComputedStyle(current);
                                        if ((style.position === 'fixed' || style.position === 'absolute') && style.zIndex > 50) {
                                            current.style.display = 'none';
                                            current.style.pointerEvents = 'none';
                                            break;
                                        }
                                        current = current.parentElement;
                                        depth++;
                                    }
                                }

                                // Action 2: Hide "Open App" banners & Login prompts
                                if (hideVariants.some(v => text.includes(v))) {
                                    // Be careful not to hide the whole page, check strictly for banners/buttons/links
                                    if (el.tagName === 'BUTTON' || (el.tagName === 'DIV' && el.role === 'button') || el.tagName === 'A') {
                                         el.style.display = 'none';
                                    }
                                    
                                    // Special case: The sticky bottom login banner
                                    if (el.tagName === 'DIV' && (text.includes('connexion') || text.includes('log in')) && style.position === 'fixed' && style.bottom === '0px') {
                                        el.style.display = 'none';
                                    }
                                }
                            }

                            // 2. Remove generic overlay masks
                            const masks = document.querySelectorAll('[class*="mask"], [class*="overlay"]');
                            masks.forEach(mask => {
                                mask.style.display = 'none';
                                mask.style.pointerEvents = 'none';
                            });
                            
                            // 3. Prevent deep links
                            document.querySelectorAll('a').forEach(a => {
                                if (a.href.includes('apps.apple.com') || a.href.includes('tiktok://')) {
                                    a.href = 'javascript:void(0);';
                                    a.onclick = function(e) { e.preventDefault(); };
                                }
                            });

                        }, 500);
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
