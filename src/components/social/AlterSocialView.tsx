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

import { getThemeColors } from '../../lib/cosmetics';
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

    // --- THEME COLORS ---
    const themeColors = getThemeColors(alter.equipped_items?.theme);
    // Default to black/dark for social view if no theme, but allow theme override
    const backgroundColor = themeColors?.background || '#000';
    const headerColor = themeColors?.backgroundCard || '#000';
    const textColor = themeColors?.text || '#fff';
    const borderColor = themeColors?.border || '#333';

    if (!isReady) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor }]}>
                <ActivityIndicator size="large" color={themeColors?.primary || "#FF0050"} />
                <Text style={[styles.loadingText, { color: textColor }]}>Connexion au compte de {alter.name}...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <View style={[styles.header, { backgroundColor: headerColor, borderBottomColor: borderColor }]}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>{platform.charAt(0).toUpperCase() + platform.slice(1)} ({alter.name})</Text>
            </View>
            <WebView
                ref={webViewRef}
                source={{ uri: url }}
                style={[styles.webview, { backgroundColor }]}
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
                    (function() {
                        window.open = function() { return null; };

                        // --- IMMEDIATE VIDEO PATCHING ---
                        // 1. Monkey-patch document.createElement to catch videos at birth
                        const originalCreateElement = document.createElement;
                        document.createElement = function(tagName) {
                            const element = originalCreateElement.apply(this, arguments);
                            if (tagName && tagName.toLowerCase() === 'video') {
                                element.setAttribute('playsinline', 'true');
                                element.setAttribute('webkit-playsinline', 'true');
                                element.setAttribute('x5-playsinline', 'true');
                                element.webkitEnterFullscreen = function() {}; // Disable native fullscreen
                            }
                            return element;
                        };

                        // 2. Monkey-patch play to ensure attributes are there before playing
                        const originalPlay = HTMLMediaElement.prototype.play;
                        HTMLMediaElement.prototype.play = function() {
                            this.setAttribute('playsinline', 'true');
                            this.setAttribute('webkit-playsinline', 'true');
                            this.setAttribute('x5-playsinline', 'true');
                            this.webkitEnterFullscreen = function() {}; 
                            return originalPlay.apply(this, arguments);
                        };

                        // 3. Disable native fullscreen method on prototype
                        HTMLMediaElement.prototype.webkitEnterFullscreen = function() {};
                    })();
                `}
                injectedJavaScript={`
                    (function() {
                        const style = document.createElement('style');
                        style.innerHTML = \`
                            /* --- GLOBAL RESET FOR MOBILE FEEL --- */
                            * {
                                -webkit-tap-highlight-color: transparent;
                            }
                            html, body, #app {
                                width: 100vw !important;
                                height: 100vh !important;
                                overflow: hidden !important; /* Let the feed container handle scroll */
                                margin: 0 !important;
                                padding: 0 !important;
                                background-color: #000 !important;
                            }

                            /* --- HIDE DESKTOP SIDEBAR & HEADER --- */
                            nav, header, aside,
                            [data-e2e="sidebar-container-wrapper"], 
                            [data-e2e="top-header-container"],
                            [class*="SideNavContainer"], 
                            [class*="HeaderContainer"],
                            .e19f2d12, [data-e2e="open-app-modal"], #tiktok-verify-ele, 
                            [class*="OpenApp"], .index-open-app-btn, [id*="login-modal"], 
                            div[role="dialog"], #loginContainer, #header-login-button,
                            [data-e2e="top-login-button"], [class*="banner"]
                            { 
                                display: none !important; 
                                width: 0 !important;
                                height: 0 !important;
                                opacity: 0 !important;
                                pointer-events: none !important;
                            }

                            /* --- FORCE MAIN CONTENT FULL WIDTH --- */
                            [class*="DivBodyContainer"], [class*="MainContainer"], [data-e2e="main-content-response"] {
                                display: flex !important;
                                width: 100vw !important;
                                max-width: 100vw !important;
                                height: 100vh !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                justify-content: center !important;
                                align-items: flex-start !important;
                            }

                            /* --- FEED CONTAINER & SCROLL --- */
                            [data-e2e="feed-container"] {
                                width: 100vw !important;
                                height: 100vh !important;
                                overflow-y: scroll !important; /* Enable vertical scroll for feed */
                                overflow-x: hidden !important;
                                scroll-snap-type: y mandatory; /* Snap effect for app feel */
                                padding-top: 0 !important;
                            }

                            /* --- VIDEO CARD ITEMS --- */
                            [data-e2e="recommend-list-item-container"] {
                                width: 100vw !important;
                                height: 100vh !important;
                                scroll-snap-align: start;
                                margin-bottom: 0 !important;
                                padding: 0 !important;
                                border: none !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                background: #000 !important;
                            }

                            /* --- VIDEO PLAYER --- */
                            video {
                                width: 100vw !important;
                                height: 100vh !important;
                                object-fit: cover !important; /* Fills screen "Epose totalement l'ecran" */
                                border-radius: 0 !important;
                            }
                            
                            /* Adjust video wrapper if it exists */
                            [data-e2e="video-container"] {
                                width: 100% !important;
                                height: 100% !important;
                            }

                            /* Hide text/UI overlays if user wants pure video (Optional, likely kept for context) */
                            /* For now, we keep the captions overlay but ensure it doesn't break layout */
                        \`;
                        document.head.appendChild(style);

                        // --- Fallback Observer for innerHTML injections ---
                         const observer = new MutationObserver((mutations) => {
                            mutations.forEach((mutation) => {
                                mutation.addedNodes.forEach((node) => {
                                    // Clean generic overlays
                                    if (node.classList && (node.classList.contains('im-sheet-mask') || node.id === 'login-modal')) {
                                       node.remove();
                                    }

                                    if (node.tagName === 'VIDEO') {
                                        node.setAttribute('playsinline', 'true');
                                        node.setAttribute('webkit-playsinline', 'true');
                                    }
                                    if (node.querySelectorAll) {
                                        node.querySelectorAll('video').forEach(v => {
                                            v.setAttribute('playsinline', 'true');
                                            v.setAttribute('webkit-playsinline', 'true');
                                        });
                                    }
                                });
                            });
                        });
                        observer.observe(document.body, { childList: true, subtree: true });

                        // --- DISABLE SCROLL PROPAGATION ---
                        window.addEventListener('scroll', (e) => {
                            e.stopImmediatePropagation();
                        }, true);

                        // --- DOUBLE TAP TO LIKE ---
                        let lastTap = 0;
                        document.addEventListener('touchstart', function(e) {
                            const currentTime = new Date().getTime();
                            const tapLength = currentTime - lastTap;
                            
                            if (tapLength < 300 && tapLength > 0) {
                                // Double Tap Detected
                                // Prevent zoom if it's not handled by meta
                                e.preventDefault(); 
                                
                                const touch = e.touches[0];
                                showHeartAnimation(touch.clientX, touch.clientY);
                                triggerLikeAction(touch.target);
                            }
                            lastTap = currentTime;
                        });

                        function triggerLikeAction(target) {
                            // Try to find the like button. 
                            // Strategy 1: Look for the specific data-e2e icon
                            // Strategy 2: Look for button with 'Like' in aria-label or title
                            let likeBtn = document.querySelector('[data-e2e="like-icon"]') || 
                                          document.querySelector('[data-e2e="browse-like-icon"]') ||
                                          document.querySelector('span[class*="Like"]');
                            
                            // If we have multiple videos (scrolling list), the simple querySelector might pick the first one, 
                            // which might not be the visible one. 
                            // Ideally we find the one closest to the view center.
                            
                            // Advanced Search: Find visible like button
                            const allLikeBtns = document.querySelectorAll('[data-e2e="like-icon"], [data-e2e="browse-like-icon"]');
                            if (allLikeBtns.length > 0) {
                                // Simple heuristic: Pick the one closest to the middle of the screen
                                let bestBtn = allLikeBtns[0];
                                let minMsg = 99999;
                                const centerY = window.innerHeight / 2;
                                
                                allLikeBtns.forEach(btn => {
                                    const rect = btn.getBoundingClientRect();
                                    const dist = Math.abs(rect.top - centerY);
                                    if (dist < minMsg) {
                                        minMsg = dist;
                                        bestBtn = btn;
                                    }
                                });
                                likeBtn = bestBtn;
                            }

                            if (likeBtn) {
                                console.log('[DoubleTap] Clicking like button:', likeBtn);
                                likeBtn.click();
                            }
                        }

                        function showHeartAnimation(x, y) {
                            const heart = document.createElement('div');
                            heart.textContent = '❤️'; 
                            heart.style.position = 'fixed';
                            heart.style.left = (x - 50) + 'px'; // Center roughly
                            heart.style.top = (y - 50) + 'px';
                            heart.style.fontSize = '80px';
                            heart.style.zIndex = '100000';
                            heart.style.pointerEvents = 'none';
                            heart.style.textShadow = '0 0 10px rgba(0,0,0,0.5)';
                            heart.style.animation = 'pop-heart 0.8s ease-out forwards';
                            
                            // Inject generic animation style if missing
                            if (!document.getElementById('heart-keyframe')) {
                                const s = document.createElement('style');
                                s.id = 'heart-keyframe';
                                s.innerHTML = \`
                                    @keyframes pop-heart {
                                        0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
                                        20% { transform: scale(1.2) rotate(10deg); opacity: 1; }
                                        40% { transform: scale(1.0) rotate(-5deg); opacity: 1; }
                                        100% { transform: scale(1.5) translateY(-50px); opacity: 0; }
                                    }
                                \`;
                                document.head.appendChild(s);
                            }
                            
                            document.body.appendChild(heart);
                            setTimeout(() => heart.remove(), 800);
                        }

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
        // backgroundColor set dynamically via style prop
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
