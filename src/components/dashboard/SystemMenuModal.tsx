import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { triggerHaptic } from '../../lib/haptics';
import { router } from 'expo-router';
import { StatusBadge } from '../ui/StatusBadge';

interface SystemMenuModalProps {
    visible: boolean;
    onClose: () => void;
    hasSelection: boolean;
}

import { StatusType } from '../ui/StatusBadge';

interface MenuItem {
    id: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    route: string;
    status?: StatusType;
}

const MENU_ITEMS: MenuItem[] = [
    { id: 'calendar', label: 'Calendrier', description: 'RDV & Agenda', icon: 'calendar', color: '#6a11cb', route: '/calendar', status: 'beta' },
    { id: 'journal', label: 'Journal', description: 'Journal du système', icon: 'book', color: '#E91E63', route: '/(tabs)/journal' },
    { id: 'tasks', label: 'Tâches', description: 'Liste partagée', icon: 'list', color: colors.success, route: '/tasks', status: 'beta' },
    { id: 'history', label: 'Historique', description: 'Stats & Fronts', icon: 'stats-chart', color: colors.warning, route: '/history', status: 'beta' },
    { id: 'courses', label: 'Cours', description: 'Notes & Matières', icon: 'school', color: '#2196F3', route: '/courses', status: 'new' },
    { id: 'help', label: 'Aide & SOS', description: 'Support système', icon: 'help-circle', color: colors.error, route: '/help' },
];

export const SystemMenuModal: React.FC<SystemMenuModalProps> = ({ visible, onClose, hasSelection }) => {
    const handleNavigation = (route: string) => {
        triggerHaptic.light();
        onClose();
        router.push(route as any);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
                <BlurView intensity={100} tint="dark" style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={styles.handle} />
                        <Text style={styles.title}>Menu Système</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.grid}>
                        {MENU_ITEMS.map((item) => {
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.gridItem,
                                        item.status === 'coming-soon' && styles.gridItemDisabled
                                    ]}
                                    onPress={() => {
                                        if (item.status !== 'coming-soon') {
                                            handleNavigation(item.route);
                                        }
                                    }}
                                    activeOpacity={item.status === 'coming-soon' ? 1 : 0.7}
                                >
                                    <View style={[styles.iconBg, { backgroundColor: `${item.color}20` }]}>
                                        <Ionicons
                                            name={item.icon as any}
                                            size={28}
                                            color={item.status === 'coming-soon' ? colors.textMuted : item.color}
                                        />
                                    </View>
                                    <View style={styles.itemTextContainer}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 2 }}>
                                            <Text style={[
                                                styles.itemLabel,
                                                item.status === 'coming-soon' && styles.itemTextDisabled
                                            ]}>
                                                {item.label}
                                            </Text>
                                            {item.status && <StatusBadge status={item.status as any} />}
                                        </View>
                                        <Text style={styles.itemDescription}>
                                            {item.description}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </BlurView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: 40,
        minHeight: 400,
        overflow: 'hidden',
    },
    header: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        marginBottom: 10,
    },
    title: {
        ...typography.h3,
        color: 'white',
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: spacing.lg,
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '46%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    iconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemLabel: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        fontSize: 14,
    },
    itemDescription: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 10,
    },
    gridItemDisabled: {
        opacity: 0.5,
    },
    itemTextDisabled: {
        color: colors.textMuted,
    },
});
