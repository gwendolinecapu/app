import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ShopMenuProps {
    visible: boolean;
    onClose: () => void;
    onOptionSelect: (option: 'inventory' | 'bank' | 'history' | 'catalog') => void;
}

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

export function ShopMenu({ visible, onClose, onOptionSelect }: ShopMenuProps) {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -MENU_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleOption = (option: 'inventory' | 'bank' | 'history' | 'catalog') => {
        onOptionSelect(option);
        // Do not close immediately here, let parent handle it or close after delay if desired
        // But typically menus close on selection:
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={onClose}
            animationType="none" // We handle animation manually
        >
            <View style={styles.overlay}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
                </Animated.View>

                {/* Drawer */}
                <Animated.View style={[
                    styles.drawer,
                    {
                        transform: [{ translateX: slideAnim }],
                        paddingTop: insets.top + spacing.lg,
                        paddingBottom: insets.bottom + spacing.lg
                    }
                ]}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

                    <View style={styles.header}>
                        <Text style={styles.title}>MENU BOUTIQUE</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.menuItems}>
                        <MenuOption
                            icon="bag-handle"
                            label="Mon Inventaire"
                            sublabel="Voir mes objets"
                            onPress={() => handleOption('inventory')}
                        />
                        <MenuOption
                            icon="card"
                            label="Banque"
                            sublabel="Acheter des crédits"
                            onPress={() => handleOption('bank')}
                        />
                        <MenuOption
                            icon="grid"
                            label="Catalogue Complet"
                            sublabel="Tous les objets"
                            onPress={() => handleOption('catalog')}
                        />

                        {/* Future / Disabled */}
                        <MenuOption
                            icon="time"
                            label="Historique"
                            sublabel="Achats récents (Bientôt)"
                            onPress={() => { }}
                            disabled
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.versionText}>PluralConnect Shop v2.0</Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const MenuOption = ({ icon, label, sublabel, onPress, disabled = false }: any) => (
    <TouchableOpacity
        style={[styles.menuOption, disabled && styles.menuOptionDisabled]}
        onPress={onPress}
        disabled={disabled}
    >
        <View style={[styles.iconBox, disabled && styles.iconBoxDisabled]}>
            <Ionicons name={icon} size={24} color={disabled ? '#6B7280' : '#FFF'} />
        </View>
        <View style={styles.optionText}>
            <Text style={[styles.optionLabel, disabled && styles.optionLabelDisabled]}>{label}</Text>
            {sublabel && <Text style={styles.optionSublabel}>{sublabel}</Text>}
        </View>
        {!disabled && <Ionicons name="chevron-forward" size={20} color="#6B7280" />}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawer: {
        width: MENU_WIDTH,
        height: '100%',
        backgroundColor: '#111827',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
    closeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    menuItems: {
        flex: 1,
        paddingHorizontal: spacing.md,
        gap: spacing.md,
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    menuOptionDisabled: {
        opacity: 0.5,
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    iconBoxDisabled: {
        backgroundColor: '#374151',
    },
    optionText: {
        flex: 1,
    },
    optionLabel: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    optionLabelDisabled: {
        color: '#9CA3AF',
    },
    optionSublabel: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    footer: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    versionText: {
        color: '#4B5563',
        fontSize: 12,
    },
});
