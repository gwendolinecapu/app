import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { InnerWorldService } from '../../src/services/InnerWorldService';
import { InnerWorld } from '../../src/types';
import { colors, spacing, borderRadius } from '../../src/lib/theme';
import { triggerHaptic } from '../../src/lib/haptics';

const { width } = Dimensions.get('window');

const BG_THEMES = [
    { id: 'paper', color: '#F8F9FA', label: 'Papier Blanc' },
    { id: 'night', color: '#1A1B26', label: 'Nuit Douce' },
    { id: 'pastel_blue', color: '#E3F2FD', label: 'Ciel' },
    { id: 'pastel_green', color: '#F1F8E9', label: 'Nature' },
    { id: 'pastel_pink', color: '#FCE4EC', label: 'Rêve' },
    { id: 'sunset', color: '#FFF3E0', label: 'Aurore' },
];

export default function InnerWorldHome() {
    const { user, currentAlter } = useAuth();
    const router = useRouter();
    const [worlds, setWorlds] = useState<InnerWorld[]>([]);
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);

    // Create State
    const [newWorldName, setNewWorldName] = useState('');
    const [selectedTheme, setSelectedTheme] = useState(BG_THEMES[0]);

    useEffect(() => {
        if (user && currentAlter) {
            loadWorlds();
        }
    }, [user, currentAlter]);

    const loadWorlds = async () => {
        if (!user || !currentAlter) return;
        setLoading(true);
        try {
            const data = await InnerWorldService.fetchWorlds(currentAlter.id, user.uid);
            setWorlds(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorld = async () => {
        if (!newWorldName.trim() || !user || !currentAlter) return;

        try {
            const id = await InnerWorldService.createWorld({
                system_id: user.uid,
                alter_id: currentAlter.id,
                name: newWorldName.trim(),
                background_color: selectedTheme.color,
                description: selectedTheme.id, // Storing theme ID in description for now or extra field
            });
            setCreateModalVisible(false);
            setNewWorldName('');
            triggerHaptic.success();
            // Go to new world
            router.push(`/inner-world/${id}`);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Mes Mondes</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.grid}>
                {/* Create New Card */}
                <TouchableOpacity
                    style={styles.createCard}
                    onPress={() => setCreateModalVisible(true)}
                >
                    <View style={styles.createIcon}>
                        <Ionicons name="add" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.createLabel}>Nouveau Monde</Text>
                </TouchableOpacity>

                {/* World Cards */}
                {worlds.map(world => (
                    <TouchableOpacity
                        key={world.id}
                        style={[styles.worldCard, { backgroundColor: world.background_color || '#FFF' }]}
                        onPress={() => router.push(`/inner-world/${world.id}`)}
                    >
                        <View style={styles.cardContent}>
                            <Text style={[styles.worldName, { color: world.background_color === '#1A1B26' ? 'white' : '#333' }]}>
                                {world.name}
                            </Text>
                            <Text style={[styles.worldDate, { color: world.background_color === '#1A1B26' ? '#BBB' : '#888' }]}>
                                Modifié le {new Date(world.updated_at).toLocaleDateString()}
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={world.background_color === '#1A1B26' ? 'white' : '#CCC'}
                            style={{ opacity: 0.5 }}
                        />
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Create Modal */}
            <Modal visible={createModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Créer un Monde</Text>

                        <Text style={styles.label}>Nom du monde</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Mon Refuge, Le Jardin..."
                            value={newWorldName}
                            onChangeText={setNewWorldName}
                            autoFocus
                        />

                        <Text style={styles.label}>Ambiance</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeList}>
                            {BG_THEMES.map(theme => (
                                <TouchableOpacity
                                    key={theme.id}
                                    style={[
                                        styles.themeOption,
                                        { backgroundColor: theme.color },
                                        selectedTheme.id === theme.id && styles.themeSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedTheme(theme);
                                        triggerHaptic.selection();
                                    }}
                                >
                                    {selectedTheme.id === theme.id && (
                                        <Ionicons name="checkmark" size={16} color={theme.id === 'night' ? 'white' : 'black'} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <Text style={styles.themeLabel}>{selectedTheme.label}</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModalVisible(false)}>
                                <Text style={styles.cancelText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, !newWorldName && { opacity: 0.5 }]}
                                onPress={handleCreateWorld}
                                disabled={!newWorldName}
                            >
                                <Text style={styles.saveText}>Créer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
    },
    backBtn: { padding: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
    title: { fontSize: 20, fontWeight: '700', color: '#333' },

    grid: { padding: 16, gap: 16 },

    createCard: {
        flexDirection: 'row', alignItems: 'center',
        padding: 20, borderRadius: 16,
        backgroundColor: '#FFF',
        borderWidth: 2, borderColor: '#F0F0F0', borderStyle: 'dashed',
    },
    createIcon: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center',
        marginRight: 16,
    },
    createLabel: { fontSize: 16, fontWeight: '600', color: colors.primary },

    worldCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 24, borderRadius: 20,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    cardContent: { flex: 1 },
    worldName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    worldDate: { fontSize: 12 },

    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#666' },
    input: {
        backgroundColor: '#F5F5F5', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 24,
    },
    themeList: { flexDirection: 'row', marginBottom: 8 },
    themeOption: {
        width: 48, height: 48, borderRadius: 24, marginRight: 12,
        borderWidth: 1, borderColor: '#DDD',
        justifyContent: 'center', alignItems: 'center',
    },
    themeSelected: { borderWidth: 3, borderColor: colors.primary },
    themeLabel: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 },

    modalActions: { flexDirection: 'row', gap: 16 },
    cancelBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F5F5' },
    cancelText: { fontWeight: '600', color: '#666' },
    saveBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: colors.primary },
    saveText: { fontWeight: '600', color: 'white' },
});
