import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { triggerHaptic } from '../../lib/haptics';
import { router } from 'expo-router';

interface SystemMenuModalProps {
    visible: boolean;
    onClose: () => void;
}

const MENU_ITEMS = [
    { id: 'tasks', label: 'Tâches', icon: 'list', color: colors.success, route: '/tasks' },
    { id: 'history', label: 'Suivi', icon: 'stats-chart', color: colors.warning, route: '/history' },
    { id: 'help', label: 'Aide & SOS', icon: 'help-circle', color: colors.error, route: '/help' },
];

export const SystemMenuModal: React.FC<SystemMenuModalProps> = ({ visible, onClose }) => {
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
                        {MENU_ITEMS.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.gridItem}
                                onPress={() => handleNavigation(item.route)}
                            >
                                <View style={[styles.iconBg, { backgroundColor: `${item.color}20` }]}>
                                    <Ionicons name={item.icon as any} size={28} color={item.color} />
                                </View>
                                <Text style={styles.itemLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
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
        width: '30%',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    iconBg: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemLabel: {
        ...typography.body,
        color: colors.text,
        fontSize: 12,
        textAlign: 'center',
    },
});
