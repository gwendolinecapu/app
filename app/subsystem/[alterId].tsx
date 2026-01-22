import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    TextInput,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { Alter, Subsystem } from '../../src/types';
import { SubsystemService } from '../../src/services/SubsystemService';
import { triggerHaptic } from '../../src/lib/haptics';
import { AnimatedPressable } from '../../src/components/ui/AnimatedPressable';
import { AddAlterModal } from '../../src/components/dashboard/AddAlterModal';
import { db, storage } from '../../src/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export default function SubsystemDashboard() {
    const { alterId } = useLocalSearchParams<{ alterId: string }>();
    const { user, alters, refreshAlters } = useAuth();

    const [hostAlter, setHostAlter] = useState<Alter | null>(null);
    const [subsystem, setSubsystem] = useState<Subsystem | null>(null);
    const [subsystemAlters, setSubsystemAlters] = useState<Alter[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        if (alterId && alters.length > 0) {
            const host = alters.find(a => a.id === alterId);
            setHostAlter(host || null);
            loadSubsystem();
        }
    }, [alterId, alters]);

    const loadSubsystem = async () => {
        if (!user || !alterId) return;
        setLoading(true);
        try {
            // Find the host alter first
            const host = alters.find(a => a.id === alterId);
            setHostAlter(host || null);

            const hostName = host?.name || 'Sous-système';
            const hostColor = host?.color || '#7C3AED';

            // Check if a subsystem exists with this host's name
            const allSubsystems = await SubsystemService.listSubsystems(user.uid);
            let existingSubsystem = allSubsystems.find(s => s.name === hostName);

            if (!existingSubsystem) {
                // Create a new subsystem for this alter
                const newSubsystemId = await SubsystemService.createSubsystem(
                    user.uid,
                    hostName,
                    hostColor
                );
                existingSubsystem = await SubsystemService.getSubsystem(newSubsystemId);
            }

            setSubsystem(existingSubsystem);

            // Filter alters that belong to this subsystem
            const subsystemAltersList = alters.filter(a => a.subsystem_id === existingSubsystem?.id);
            setSubsystemAlters(subsystemAltersList);

        } catch (error) {
            console.error('Error loading subsystem:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadSubsystem();
        setRefreshing(false);
    }, []);

    const filteredAlters = useMemo(() => {
        if (!searchQuery.trim()) return subsystemAlters;
        const q = searchQuery.toLowerCase();
        return subsystemAlters.filter(a =>
            a.name.toLowerCase().includes(q)
        );
    }, [subsystemAlters, searchQuery]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        return result.canceled ? null : result.assets[0].uri;
    };

    const handleCreateAlter = async (data: { name: string, pronouns: string, bio: string, color: string, image: string | null }) => {
        if (!user || !subsystem) return;
        setCreateLoading(true);
        try {
            let avatarUrl = null;
            if (data.image) {
                const response = await fetch(data.image);
                const blob = await response.blob();
                const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}.jpg`);
                await uploadBytes(storageRef, blob);
                avatarUrl = await getDownloadURL(storageRef);
            }

            const newAlter = {
                system_id: user.uid,
                subsystem_id: subsystem.id, // Assign to this subsystem
                name: data.name,
                pronouns: data.pronouns || null,
                bio: data.bio || null,
                color: data.color,
                avatar_url: avatarUrl,
                is_host: false,
                is_active: false,
                created_at: new Date().toISOString(),
            };

            await addDoc(collection(db, 'alters'), newAlter);
            await refreshAlters();
            await loadSubsystem();
            setModalVisible(false);
            triggerHaptic.success();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de créer l\'alter');
        } finally {
            setCreateLoading(false);
        }
    };

    const renderAlterItem = ({ item }: { item: Alter }) => (
        <TouchableOpacity
            style={styles.alterItem}
            onPress={() => router.push(`/alter-space/${item.id}` as any)}
        >
            {item.avatar_url || item.avatar ? (
                <Image
                    source={{ uri: item.avatar_url || item.avatar }}
                    style={styles.avatar}
                />
            ) : (
                <View style={[styles.avatar, { backgroundColor: item.color || colors.primary }]}>
                    <Text style={styles.avatarInitial}>{item.name.charAt(0)}</Text>
                </View>
            )}
            <Text style={styles.alterName} numberOfLines={1}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    {hostAlter && (
                        <>
                            {hostAlter.avatar_url || hostAlter.avatar ? (
                                <Image
                                    source={{ uri: hostAlter.avatar_url || hostAlter.avatar }}
                                    style={styles.hostAvatar}
                                />
                            ) : (
                                <View style={[styles.hostAvatar, { backgroundColor: hostAlter.color || colors.primary }]}>
                                    <Text style={styles.hostInitial}>{hostAlter.name.charAt(0)}</Text>
                                </View>
                            )}
                            <Text style={styles.headerTitle}>Sous-système de {hostAlter.name}</Text>
                        </>
                    )}
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Content */}
            <FlatList
                data={filteredAlters}
                keyExtractor={item => item.id}
                renderItem={renderAlterItem}
                numColumns={4}
                contentContainerStyle={styles.grid}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                ListHeaderComponent={
                    <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                        <View style={styles.addIcon}>
                            <Ionicons name="add" size={32} color={colors.textMuted} />
                        </View>
                        <Text style={styles.addText}>Ajouter</Text>
                    </TouchableOpacity>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="planet-outline" size={64} color={colors.textMuted} />
                        <Text style={styles.emptyTitle}>Sous-système vide</Text>
                        <Text style={styles.emptyText}>
                            Ajoute des alters à ce sous-système
                        </Text>
                    </View>
                }
            />

            {/* Add Alter Modal */}
            <AddAlterModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onCreate={handleCreateAlter}
                loading={createLoading}
                pickImage={pickImage}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        padding: spacing.xs,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    hostAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hostInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    headerTitle: {
        ...typography.h3,
        color: colors.text,
        fontSize: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.md,
        marginVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        height: 44,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
    },
    grid: {
        paddingHorizontal: spacing.md,
        paddingBottom: 100,
    },
    alterItem: {
        width: '25%',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    alterName: {
        marginTop: spacing.xs,
        fontSize: 12,
        color: colors.text,
        textAlign: 'center',
        maxWidth: 70,
    },
    addButton: {
        width: '25%',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    addIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addText: {
        marginTop: spacing.xs,
        fontSize: 12,
        color: colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.lg,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptyText: {
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
});
