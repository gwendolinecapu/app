import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Alter, Role } from '../../src/types';
import { RoleService } from '../../src/services/roles';
import { colors, spacing, borderRadius, typography, alterColors } from '../../src/lib/theme';

export default function AlterProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user, alters, refreshAlters } = useAuth();
    const [alter, setAlter] = useState<Alter | null>(null);
    const [editing, setEditing] = useState(false);

    // Core info
    const [name, setName] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [bio, setBio] = useState('');
    const [selectedColor, setSelectedColor] = useState('');

    // Roles
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

    // Safety info
    const [triggers, setTriggers] = useState('');
    const [frontingHelp, setFrontingHelp] = useState('');
    const [safetyNotes, setSafetyNotes] = useState('');
    const [crisisContact, setCrisisContact] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadRoles();
    }, [user?.uid]);

    const loadRoles = async () => {
        if (user?.uid) {
            try {
                const roles = await RoleService.getRoles(user.uid);
                setAvailableRoles(roles);
            } catch (e) {
                console.error("Failed to load roles", e);
            }
        }
    };

    useEffect(() => {
        const foundAlter = alters.find((a) => a.id === id);
        if (foundAlter) {
            setAlter(foundAlter);
            setName(foundAlter.name);
            setPronouns(foundAlter.pronouns || '');
            setBio(foundAlter.bio || '');
            setSelectedColor(foundAlter.color || '#000000'); // Default color if undefined
            setSelectedRoleIds(foundAlter.role_ids || []);
            // Safety Init
            setTriggers(foundAlter.triggers?.join(', ') || '');
            setFrontingHelp(foundAlter.fronting_help || '');
            setSafetyNotes(foundAlter.safety_notes || '');
            setCrisisContact(foundAlter.crisis_contact || '');
        }
    }, [id, alters]);

    const toggleRole = (roleId: string) => {
        if (selectedRoleIds.includes(roleId)) {
            setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId));
        } else {
            setSelectedRoleIds([...selectedRoleIds, roleId]);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Erreur', 'Le nom est requis');
            return;
        }

        setLoading(true);
        try {
            const alterRef = doc(db, 'alters', id);

            // Convert comma-separated string to array, trimming whitespace
            const triggersArray = triggers
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            await updateDoc(alterRef, {
                name: name.trim(),
                pronouns: pronouns.trim() || null,
                bio: bio.trim() || null,
                color: selectedColor,
                role_ids: selectedRoleIds,
                triggers: triggersArray,
                fronting_help: frontingHelp.trim() || null,
                safety_notes: safetyNotes.trim() || null,
                crisis_contact: crisisContact.trim() || null,
            });

            await refreshAlters();
            setEditing(false);
            Alert.alert('Succès', 'Profil mis à jour !');
        } catch (error: any) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Supprimer cet alter ?',
            'Cette action est irréversible.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'alters', id));
                            await refreshAlters();
                            router.back();
                        } catch (error: any) {
                            Alert.alert('Erreur', error.message);
                        }
                    },
                },
            ]
        );
    };

    if (!alter && !loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.notFound}>Alter non trouvé</Text>
            </View>
        );
    }

    if (!alter) return null; // Loading state

    // Helper to get role details
    const getRoleDetails = (roleId: string) => availableRoles.find(r => r.id === roleId);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.avatar, { backgroundColor: editing ? selectedColor : alter.color }]}>
                    <Text style={styles.avatarText}>
                        {(editing ? name : alter.name).charAt(0).toUpperCase()}
                    </Text>
                </View>
                {alter.is_host && (
                    <View style={styles.hostBadge}>
                        <Text style={styles.hostBadgeText}>👑 Host</Text>
                    </View>
                )}

                {/* Roles Display (View Mode) */}
                {!editing && alter.role_ids && alter.role_ids.length > 0 && (
                    <View style={styles.roleBadgesContainer}>
                        {alter.role_ids.map(roleId => {
                            const role = getRoleDetails(roleId);
                            if (!role) return null;
                            return (
                                <View key={roleId} style={[styles.roleBadge, { backgroundColor: role.color }]}>
                                    <Text style={styles.roleBadgeText}>{role.name}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

            {editing ? (
                <View style={styles.form}>
                    <Text style={styles.sectionTitle}>Information Générale</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Nom</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Nom de l'alter"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Pronoms</Text>
                        <TextInput
                            style={styles.input}
                            value={pronouns}
                            onChangeText={setPronouns}
                            placeholder="Pronoms (ex: elle/lui, iel...)"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Une courte description..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Couleur</Text>
                        <View style={styles.colorPicker}>
                            {alterColors.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        selectedColor === color && styles.colorOptionSelected,
                                    ]}
                                    onPress={() => setSelectedColor(color)}
                                />
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Rôles</Text>
                        {availableRoles.length === 0 ? (
                            <Text style={styles.noRolesText}>
                                Aucun rôle défini. Créez-en dans les paramètres du système.
                            </Text>
                        ) : (
                            <View style={styles.rolesSelector}>
                                {availableRoles.map(role => (
                                    <TouchableOpacity
                                        key={role.id}
                                        style={[
                                            styles.roleChip,
                                            { borderColor: role.color },
                                            selectedRoleIds.includes(role.id) && { backgroundColor: role.color }
                                        ]}
                                        onPress={() => toggleRole(role.id)}
                                    >
                                        <Text style={[
                                            styles.roleChipText,
                                            selectedRoleIds.includes(role.id) ? { color: '#FFF' } : { color: role.color }
                                        ]}>
                                            {role.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Sécurité & Bien-être</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Triggers (séparés par des virgules)</Text>
                        <TextInput
                            style={styles.input}
                            value={triggers}
                            onChangeText={setTriggers}
                            placeholder="Ex: Bruit fort, foule, orage..."
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Comment m'aider au front ?</Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline]}
                            value={frontingHelp}
                            onChangeText={setFrontingHelp}
                            placeholder="Instructions pour l'entourage quand je suis là..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Notes de sécurité privées</Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline]}
                            value={safetyNotes}
                            onChangeText={setSafetyNotes}
                            placeholder="Infos médicales, contacts d'urgence, etc."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contact Crise (Téléphone)</Text>
                        <TextInput
                            style={styles.input}
                            value={crisisContact}
                            onChangeText={setCrisisContact}
                            placeholder="Numéro à appeler en cas d'urgence"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setEditing(false)}
                        >
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} disabled={loading}>
                            <LinearGradient
                                colors={[colors.gradientStart, colors.gradientEnd]}
                                style={styles.saveButton}
                            >
                                <Text style={styles.saveButtonText}>
                                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.profile}>
                    <Text style={styles.name}>{alter.name}</Text>
                    {alter.pronouns && (
                        <Text style={styles.pronouns}>{alter.pronouns}</Text>
                    )}
                    {alter.bio && <Text style={styles.bio}>{alter.bio}</Text>}

                    {/* Section Sécurité Affichage */}
                    {(alter.triggers?.length || alter.fronting_help || alter.safety_notes || alter.crisis_contact) ? (
                        <View style={styles.safetySection}>
                            <Text style={styles.sectionHeader}>🛡️ Sécurité & Aide</Text>

                            {alter.triggers && alter.triggers.length > 0 && (
                                <View style={styles.infoBlock}>
                                    <Text style={styles.infoLabel}>⚠️ Triggers :</Text>
                                    <View style={styles.tagsContainer}>
                                        {alter.triggers.map((trigger, idx) => (
                                            <View key={idx} style={styles.triggerTag}>
                                                <Text style={styles.triggerText}>{trigger}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {alter.fronting_help && (
                                <View style={styles.infoBlock}>
                                    <Text style={styles.infoLabel}>🤝 Comment m'aider :</Text>
                                    <Text style={styles.infoText}>{alter.fronting_help}</Text>
                                </View>
                            )}

                            {alter.safety_notes && (
                                <View style={styles.infoBlock}>
                                    <Text style={styles.infoLabel}>🔒 Notes privées :</Text>
                                    <Text style={styles.infoText}>{alter.safety_notes}</Text>
                                </View>
                            )}

                            {alter.crisis_contact && (
                                <View style={styles.infoBlock}>
                                    <Text style={styles.infoLabel}>📞 Contact Crise :</Text>
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(`tel:${alter.crisis_contact}`)}
                                        style={styles.contactLink}
                                    >
                                        <Text style={styles.contactLinkText}>{alter.crisis_contact}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setEditing(true)}
                    >
                        <Text style={styles.editButtonText}>✏️ Modifier le profil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.deleteButtonText}>🗑️ Supprimer cet alter</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    notFound: {
        ...typography.body,
        textAlign: 'center',
        marginTop: spacing.xxl,
    },
    header: {
        alignItems: 'center',
        padding: spacing.xl,
        paddingTop: spacing.xxl,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarText: {
        color: colors.text,
        fontSize: 48,
        fontWeight: 'bold',
    },
    hostBadge: {
        backgroundColor: colors.secondary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginBottom: spacing.sm,
    },
    hostBadgeText: {
        color: colors.text,
        fontWeight: 'bold',
    },
    roleBadgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        justifyContent: 'center',
        marginTop: spacing.xs,
    },
    roleBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    roleBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    profile: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    name: {
        ...typography.h1,
        marginBottom: spacing.xs,
    },
    pronouns: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    bio: {
        ...typography.body,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    editButton: {
        backgroundColor: colors.backgroundCard,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    editButtonText: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text
    },
    deleteButton: {
        backgroundColor: colors.error + '20',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
    },
    deleteButtonText: {
        color: colors.error,
        fontWeight: '600',
    },
    form: {
        padding: spacing.lg,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 16,
    },
    inputMultiline: {
        textAlignVertical: 'top',
        height: 100,
    },
    sectionTitle: {
        ...typography.h2,
        marginBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.sm,
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: colors.text,
        transform: [{ scale: 1.1 }],
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xl,
        marginBottom: spacing.xxl,
    },
    cancelButton: {
        padding: spacing.md,
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    saveButton: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    safetySection: {
        width: '100%',
        backgroundColor: colors.backgroundCard + '40', // slightly transparent
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    infoBlock: {
        marginBottom: spacing.lg,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    infoText: {
        fontSize: 16,
        color: colors.text,
        lineHeight: 22,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    triggerTag: {
        backgroundColor: '#FFE5E5',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: '#FFCDCD',
    },
    triggerText: {
        color: '#D32F2F',
        fontWeight: '600',
    },
    contactLink: {
        padding: spacing.md,
        backgroundColor: colors.primary + '10',
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    contactLinkText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 18,
    },
    noRolesText: {
        ...typography.caption,
        fontStyle: 'italic',
        marginTop: spacing.xs,
    },
    rolesSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    roleChip: {
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    roleChipText: {
        fontWeight: '600',
        fontSize: 14,
    }
});
