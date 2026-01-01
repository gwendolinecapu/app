import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { RoleService } from '../../src/services/roles';
import { colors, spacing, borderRadius, typography, alterColors } from '../../src/lib/theme';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { Alter, Role } from '../../src/types';

const ROLE_DEFINITIONS: Record<string, string> = {
    'host': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'hote': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'hôte': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'protector': "Protège le système, le corps ou d'autres alters des menaces ou des traumas.",
    'protecteur': "Protège le système, le corps ou d'autres alters des menaces ou des traumas.",
    'gatekeeper': "Contrôle les switchs (changements), l'accès aux souvenirs ou aux zones du monde intérieur.",
    'persecutor': "Peut agir de manière nuisible envers le système, souvent par mécanisme de défense déformé ou traumatisme.",
    'persecuteur': "Peut agir de manière nuisible envers le système, souvent par mécanisme de défense déformé ou traumatisme.",
    'persécuteur': "Peut agir de manière nuisible envers le système, souvent par mécanisme de défense déformé ou traumatisme.",
    'little': "Un alter enfant, souvent porteur d'innocence ou de souvenirs traumatiques précoces.",
    'caretaker': "Prend soin des autres alters (souvent les littles) ou apaise le système.",
    'soigneur': "Prend soin des autres alters (souvent les littles) ou apaise le système.",
    'trauma holder': "Détient les souvenirs ou les émotions liés aux traumas pour protéger les autres.",
    'porteur de trauma': "Détient les souvenirs ou les émotions liés aux traumas pour protéger les autres.",
    'fictive': "Introject basé sur un personnage de fiction.",
    'factive': "Introject basé sur une personne réelle.",
};

const getRoleDefinition = (roleName: string) => {
    const key = roleName.toLowerCase().trim();
    if (ROLE_DEFINITIONS[key]) return ROLE_DEFINITIONS[key];
    const found = Object.keys(ROLE_DEFINITIONS).find(k => key.includes(k));
    if (found) return ROLE_DEFINITIONS[found];
    return "Définition non disponible pour ce rôle spécifique.";
};

export default function AlterProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user, alters, refreshAlters } = useAuth();
    // ... (rest of state)

    const [alter, setAlter] = useState<Alter | null>(null);
    const [editing, setEditing] = useState(false);

    // ... state declarations ...

    // Core info
    const [name, setName] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [bio, setBio] = useState('');
    const [selectedColor, setSelectedColor] = useState('');

    // Roles
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

    // Safety
    const [triggers, setTriggers] = useState('');
    const [frontingHelp, setFrontingHelp] = useState('');
    const [safetyNotes, setSafetyNotes] = useState('');
    const [crisisContact, setCrisisContact] = useState('');

    // Customization
    const [likes, setLikes] = useState<string[]>([]);
    const [dislikes, setDislikes] = useState<string[]>([]);
    const [newLike, setNewLike] = useState('');
    const [newDislike, setNewDislike] = useState('');

    // Custom Fields
    const [customFields, setCustomFields] = useState<{ label: string, value: string }[]>([]);
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');
    const [isAddingField, setIsAddingField] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => { loadRoles(); }, [user?.uid]);

    const loadRoles = async () => { /* ... */
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
            setSelectedColor(foundAlter.color || '#000000');
            setSelectedRoleIds(foundAlter.role_ids || []);
            setTriggers(foundAlter.triggers?.join(', ') || '');
            setFrontingHelp(foundAlter.fronting_help || '');
            setSafetyNotes(foundAlter.safety_notes || '');
            setCrisisContact(foundAlter.crisis_contact || '');


            setLikes(foundAlter.likes || []);
            setDislikes(foundAlter.dislikes || []);
            setCustomFields(foundAlter.custom_fields || []);
        }
    }, [id, alters]);

    // ... helper logic ...
    const toggleRole = (roleId: string) => {
        if (selectedRoleIds.includes(roleId)) {
            setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId));
        } else {
            setSelectedRoleIds([...selectedRoleIds, roleId]);
        }
    };

    // Customization Handlers
    const addLike = () => {
        if (newLike.trim()) {
            setLikes([...likes, newLike.trim()]);
            setNewLike('');
        }
    };

    const removeLike = (index: number) => {
        setLikes(likes.filter((_, i) => i !== index));
    };

    const addDislike = () => {
        if (newDislike.trim()) {
            setDislikes([...dislikes, newDislike.trim()]);
            setNewDislike('');
        }
    };

    const removeDislike = (index: number) => {
        setDislikes(dislikes.filter((_, i) => i !== index));
    };

    const addCustomField = () => {
        if (newFieldLabel.trim() && newFieldValue.trim()) {
            setCustomFields([...customFields, { label: newFieldLabel.trim(), value: newFieldValue.trim() }]);
            setNewFieldLabel('');
            setNewFieldValue('');
            setIsAddingField(false);
        }
    };

    const removeCustomField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const handleSave = async () => { /* ... existing logic ... */
        if (!name.trim()) {
            Alert.alert('Erreur', 'Le nom est requis');
            return;
        }

        setLoading(true);
        try {
            const alterRef = doc(db, 'alters', id);
            const triggersArray = triggers.split(',').map(t => t.trim()).filter(t => t.length > 0);

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
                likes: likes,
                dislikes: dislikes,
                custom_fields: customFields,
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

    const handleDelete = () => { /* ... existing logic ... */
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
            <SafeAreaView style={styles.container}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 20 }}>
                    <Ionicons name="close-circle" size={32} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.notFound}>Alter non trouvé</Text>
            </SafeAreaView>
        );
    }

    if (!alter) return null;

    const getRoleDetails = (roleId: string) => availableRoles.find(r => r.id === roleId);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')} style={{ padding: 4 }}>
                    <Ionicons name="notifications-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollContent}>
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
                                    <TouchableOpacity
                                        key={roleId}
                                        style={[styles.roleBadge, { backgroundColor: role.color }]}
                                        onPress={() => Alert.alert(role.name, getRoleDefinition(role.name))}
                                    >
                                        <Text style={styles.roleBadgeText}>{role.name}</Text>
                                    </TouchableOpacity>
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

                        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Personnalisation</Text>

                        {/* Likes */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>J'aime</Text>
                            <View style={styles.addItemRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    value={newLike}
                                    onChangeText={setNewLike}
                                    placeholder="Ajouter (ex: Pizza)..."
                                    placeholderTextColor={colors.textMuted}
                                    onSubmitEditing={addLike}
                                />
                                <TouchableOpacity onPress={addLike} style={styles.addButton}>
                                    <Ionicons name="add" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.tagsContainer}>
                                {likes.map((item, idx) => (
                                    <View key={idx} style={styles.tagChip}>
                                        <Text style={styles.tagText}>{item}</Text>
                                        <TouchableOpacity onPress={() => removeLike(idx)}>
                                            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Dislikes */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Je n'aime pas</Text>
                            <View style={styles.addItemRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    value={newDislike}
                                    onChangeText={setNewDislike}
                                    placeholder="Ajouter (ex: Orages)..."
                                    placeholderTextColor={colors.textMuted}
                                    onSubmitEditing={addDislike}
                                />
                                <TouchableOpacity onPress={addDislike} style={[styles.addButton, { backgroundColor: colors.error }]}>
                                    <Ionicons name="add" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.tagsContainer}>
                                {dislikes.map((item, idx) => (
                                    <View key={idx} style={[styles.tagChip, { borderColor: colors.error + '50' }]}>
                                        <Text style={styles.tagText}>{item}</Text>
                                        <TouchableOpacity onPress={() => removeDislike(idx)}>
                                            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Custom Fields */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Infos Personnalisées</Text>
                            {customFields.map((field, idx) => (
                                <View key={idx} style={styles.customFieldRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.customFieldLabel}>{field.label}</Text>
                                        <Text style={styles.customFieldValue}>{field.value}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeCustomField(idx)} style={{ padding: 4 }}>
                                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {isAddingField ? (
                                <View style={styles.addCustomFieldForm}>
                                    <TextInput
                                        style={[styles.input, { marginBottom: spacing.xs }]}
                                        placeholder="Label (ex: Animal Totem)"
                                        placeholderTextColor={colors.textMuted}
                                        value={newFieldLabel}
                                        onChangeText={setNewFieldLabel}
                                    />
                                    <TextInput
                                        style={[styles.input, { marginBottom: spacing.xs }]}
                                        placeholder="Valeur (ex: Loup)"
                                        placeholderTextColor={colors.textMuted}
                                        value={newFieldValue}
                                        onChangeText={setNewFieldValue}
                                    />
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md }}>
                                        <TouchableOpacity onPress={() => setIsAddingField(false)}>
                                            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Annuler</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={addCustomField}>
                                            <Text style={{ color: colors.primary, fontWeight: 'bold', marginTop: 8 }}>Ajouter</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.addCustomFieldButton}
                                    onPress={() => setIsAddingField(true)}
                                >
                                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                                    <Text style={{ color: colors.primary, fontWeight: '600' }}>Ajouter une info</Text>
                                </TouchableOpacity>
                            )}
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

                        {/* Display Customization */}
                        {(alter.likes?.length || alter.dislikes?.length || alter.custom_fields?.length) ? (
                            <View style={styles.customSection}>
                                <Text style={styles.sectionHeader}>👤 À propos</Text>

                                <View style={styles.likesDislikesContainer}>
                                    {alter.likes && alter.likes.length > 0 && (
                                        <View style={styles.column}>
                                            <Text style={styles.columnHeader}>👍 J'aime</Text>
                                            {alter.likes.map((l, i) => (
                                                <Text key={i} style={styles.listItem}>• {l}</Text>
                                            ))}
                                        </View>
                                    )}
                                    {alter.dislikes && alter.dislikes.length > 0 && (
                                        <View style={styles.column}>
                                            <Text style={styles.columnHeader}>👎 J'aime pas</Text>
                                            {alter.dislikes.map((d, i) => (
                                                <Text key={i} style={styles.listItem}>• {d}</Text>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {alter.custom_fields && alter.custom_fields.length > 0 && (
                                    <View style={styles.customFieldsList}>
                                        {alter.custom_fields.map((f, i) => (
                                            <View key={i} style={styles.displayFieldRow}>
                                                <Text style={styles.displayFieldLabel}>{f.label}:</Text>
                                                <Text style={styles.displayFieldValue}>{f.value}</Text>
                                            </View>
                                        ))}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        zIndex: 10,
    },
    closeButton: {
        padding: spacing.xs,
    },
    scrollContent: {
        flex: 1,
    },
    notFound: {
        ...typography.body,
        textAlign: 'center',
        marginTop: spacing.xxl,
    },
    header: {
        alignItems: 'center',
        padding: spacing.xl,
        // paddingTop removed as it's now scrolled
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
    },
    addItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    addButton: {
        backgroundColor: colors.primary,
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    tagText: {
        color: colors.text,
        fontSize: 14,
    },
    customFieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
    },
    customFieldLabel: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    customFieldValue: {
        color: colors.text,
        fontSize: 16,
    },
    addCustomFieldForm: {
        backgroundColor: colors.backgroundCard + '80',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    addCustomFieldButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        padding: spacing.sm,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.md,
        borderStyle: 'dashed',
    },
    customSection: {
        width: '100%',
        marginBottom: spacing.xl,
    },
    likesDislikesContainer: {
        flexDirection: 'row',
        gap: spacing.xl,
        marginBottom: spacing.lg,
    },
    column: {
        flex: 1,
    },
    columnHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: 4,
    },
    listItem: {
        color: colors.textSecondary,
        marginBottom: 4,
        fontSize: 14,
    },
    customFieldsList: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    displayFieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '40',
    },
    displayFieldLabel: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    displayFieldValue: {
        color: colors.text,
        fontWeight: 'bold',
    },
});
