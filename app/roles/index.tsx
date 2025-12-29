import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { RoleService } from '../../src/services/roles';
import { Role } from '../../src/types';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function RolesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRoles();
    }, [user?.uid]);

    const loadRoles = async () => {
        if (!user?.uid) return;
        try {
            setLoading(true);
            const loadedRoles = await RoleService.getRoles(user.uid);
            setRoles(loadedRoles);
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible de charger les rôles');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRole = (roleId: string, roleName: string) => {
        Alert.alert(
            "Supprimer le rôle",
            `Êtes-vous sûr de vouloir supprimer le rôle "${roleName}" ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await RoleService.deleteRole(roleId);
                            setRoles(roles.filter(r => r.id !== roleId));
                        } catch (error) {
                            Alert.alert("Erreur", "Impossible de supprimer le rôle");
                        }
                    }
                }
            ]
        );
    };

    const renderRoleItem = ({ item }: { item: Role }) => (
        <View style={styles.roleCard}>
            <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
            <View style={styles.roleInfo}>
                <Text style={styles.roleName}>{item.name}</Text>
                {item.description ? (
                    <Text style={styles.roleDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}
            </View>
            <TouchableOpacity
                onPress={() => handleDeleteRole(item.id, item.name)}
                style={styles.deleteButton}
            >
                <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.background, colors.backgroundCard]}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Rôles du Système</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/roles/create')}
                >
                    <Ionicons name="add" size={24} color={colors.text} />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.content}>
                <Text style={styles.subtitle}>
                    Définissez les rôles pour mieux organiser votre système (ex: Protecteur, Gatekeeper).
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : roles.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="pricetags-outline" size={64} color={colors.textMuted} />
                        <Text style={styles.emptyStateText}>Aucun rôle défini</Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push('/roles/create')}
                        >
                            <Text style={styles.createButtonText}>Créer un rôle</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={async () => {
                                if (user?.uid) {
                                    setLoading(true);
                                    await RoleService.initializeDefaultRoles(user.uid);
                                    await loadRoles();
                                }
                            }}
                        >
                            <Text style={styles.secondaryButtonText}>Ajouter les rôles par défaut</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={roles}
                        renderItem={renderRoleItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        ...typography.h2,
        flex: 1,
        textAlign: 'center',
    },
    addButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    listContainer: {
        paddingBottom: 80,
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    colorBadge: {
        width: 16,
        height: 16,
        borderRadius: borderRadius.full,
        marginRight: spacing.md,
    },
    roleInfo: {
        flex: 1,
    },
    roleName: {
        ...typography.h3,
        fontSize: 16,
    },
    roleDescription: {
        ...typography.caption,
        marginTop: 2,
    },
    deleteButton: {
        padding: spacing.xs,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    emptyStateText: {
        ...typography.body,
        color: colors.textMuted,
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
    createButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        marginBottom: spacing.md,
    },
    createButtonText: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.textOnPrimary || '#FFF',
    },
    secondaryButton: {
        paddingVertical: spacing.md,
    },
    secondaryButtonText: {
        ...typography.body,
        color: colors.primary,
    },
});
