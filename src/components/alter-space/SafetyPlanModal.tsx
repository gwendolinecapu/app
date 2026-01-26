import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alter, SafetyPlan } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BlurView } from 'expo-blur';

interface SafetyPlanModalProps {
    visible: boolean;
    onClose: () => void;
    alter: Alter;
    editable?: boolean;
}

export const SafetyPlanModal: React.FC<SafetyPlanModalProps> = ({ visible, onClose, alter, editable }) => {
    const [safetyPlan, setSafetyPlan] = useState<SafetyPlan>({
        emergency_numbers: [],
        trusted_contacts: [],
        custom_notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // New item states
    const [newNumberLabel, setNewNumberLabel] = useState('');
    const [newNumberValue, setNewNumberValue] = useState('');
    const [showAddNumber, setShowAddNumber] = useState(false);

    const [newContactName, setNewContactName] = useState('');
    const [newContactNote, setNewContactNote] = useState('');
    const [showAddContact, setShowAddContact] = useState(false);

    useEffect(() => {
        if (alter.safety_plan) {
            setSafetyPlan(alter.safety_plan);
        } else {
            // Initialize with default values if none exist
            setSafetyPlan({
                emergency_numbers: [
                    { label: "Urgence Européenne", number: "112" },
                    { label: "SAMU (Médical)", number: "15" },
                    { label: "Pompiers", number: "18" },
                    { label: "Police", number: "17" },
                    { label: "Prévention Suicide", number: "3114" }
                ],
                trusted_contacts: [],
                custom_notes: alter.safety_notes ||
                    `Personne à contacter en cas de besoin :
...

Personne de confiance :
...

Ce qui m'aide quand je ne vais pas bien :
- ...

Ce qu'il ne faut PAS faire :
- ...

Lieux sûrs pour moi :
...`
            });
        }
    }, [alter]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const alterRef = doc(db, 'alters', alter.id);
            await updateDoc(alterRef, {
                safety_plan: safetyPlan,
                safety_notes: safetyPlan.custom_notes // Keep sync for backward compat
            });
            Alert.alert("Succès", "Plan de sécurité mis à jour");
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de sauvegarder le plan de sécurité");
        } finally {
            setLoading(false);
        }
    };

    const addEmergencyNumber = () => {
        if (newNumberLabel && newNumberValue) {
            setSafetyPlan(prev => ({
                ...prev,
                emergency_numbers: [...prev.emergency_numbers, { label: newNumberLabel, number: newNumberValue }]
            }));
            setNewNumberLabel('');
            setNewNumberValue('');
            setShowAddNumber(false);
        }
    };

    const removeEmergencyNumber = (index: number) => {
        setSafetyPlan(prev => ({
            ...prev,
            emergency_numbers: prev.emergency_numbers.filter((_, i) => i !== index)
        }));
    };

    const addTrustedContact = () => {
        if (newContactName) {
            setSafetyPlan(prev => ({
                ...prev,
                trusted_contacts: [...prev.trusted_contacts, {
                    system_id: 'manual_entry_' + Date.now(), // Placeholder ID since we are manual entry for now
                    name: newContactName,
                    note: newContactNote,
                    avatar_url: undefined
                }]
            }));
            setNewContactName('');
            setNewContactNote('');
            setShowAddContact(false);
        }
    };

    const removeTrustedContact = (index: number) => {
        setSafetyPlan(prev => ({
            ...prev,
            trusted_contacts: prev.trusted_contacts.filter((_, i) => i !== index)
        }));
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>⚠️ Plan de Sécurité</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.description}>
                        Cet espace est dédié aux informations importantes en cas de crise ou de détresse.
                        Gardez ces informations à jour.
                    </Text>

                    {/* Emergency Numbers Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="call" size={20} color={colors.error} />
                            <Text style={styles.sectionTitle}>Numéros d'Urgence</Text>
                        </View>

                        {safetyPlan.emergency_numbers.map((num, index) => (
                            <View key={index} style={styles.card}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{num.label}</Text>
                                    <Text style={styles.cardValue}>{num.number}</Text>
                                </View>
                                {isEditing && (
                                    <TouchableOpacity onPress={() => removeEmergencyNumber(index)}>
                                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        {isEditing && (
                            <>
                                {showAddNumber ? (
                                    <View style={styles.addForm}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nom (ex: SAMU, Thérapeute)"
                                            placeholderTextColor={colors.textSecondary}
                                            value={newNumberLabel}
                                            onChangeText={setNewNumberLabel}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Numéro (ex: 15, 06...)"
                                            placeholderTextColor={colors.textSecondary}
                                            keyboardType="phone-pad"
                                            value={newNumberValue}
                                            onChangeText={setNewNumberValue}
                                        />
                                        <View style={styles.formActions}>
                                            <TouchableOpacity onPress={() => setShowAddNumber(false)} style={styles.cancelButton}>
                                                <Text style={styles.cancelButtonText}>Annuler</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={addEmergencyNumber} style={styles.addButton}>
                                                <Text style={styles.addButtonText}>Ajouter</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.addItemButton} onPress={() => setShowAddNumber(true)}>
                                        <Ionicons name="add-circle" size={20} color={colors.primary} />
                                        <Text style={styles.addItemText}>Ajouter un numéro</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>

                    {/* Trusted Contacts Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="people" size={20} color={colors.secondary} />
                            <Text style={styles.sectionTitle}>Personnes de Confiance</Text>
                        </View>

                        {safetyPlan.trusted_contacts.map((contact, index) => (
                            <View key={index} style={styles.card}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{contact.name}</Text>
                                    {contact.note ? <Text style={styles.cardNote}>"{contact.note}"</Text> : null}
                                </View>
                                {isEditing && (
                                    <TouchableOpacity onPress={() => removeTrustedContact(index)}>
                                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        {isEditing && (
                            <>
                                {showAddContact ? (
                                    <View style={styles.addForm}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nom de la personne / Système"
                                            placeholderTextColor={colors.textSecondary}
                                            value={newContactName}
                                            onChangeText={setNewContactName}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Note (ex: Tata des littles, Safe pour...)"
                                            placeholderTextColor={colors.textSecondary}
                                            value={newContactNote}
                                            onChangeText={setNewContactNote}
                                        />
                                        <View style={styles.formActions}>
                                            <TouchableOpacity onPress={() => setShowAddContact(false)} style={styles.cancelButton}>
                                                <Text style={styles.cancelButtonText}>Annuler</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={addTrustedContact} style={styles.addButton}>
                                                <Text style={styles.addButtonText}>Ajouter</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.addItemButton} onPress={() => setShowAddContact(true)}>
                                        <Ionicons name="add-circle" size={20} color={colors.primary} />
                                        <Text style={styles.addItemText}>Ajouter un contact</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>

                    {/* Custom Notes Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="clipboard" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Questions / Notes Libres</Text>
                        </View>

                        {isEditing ? (
                            <TextInput
                                style={styles.textArea}
                                placeholder="Personne de confiance à contacter : ...
Choses à faire en cas de crise : ..."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                value={safetyPlan.custom_notes}
                                onChangeText={(text) => setSafetyPlan(prev => ({ ...prev, custom_notes: text }))}
                            />
                        ) : (
                            <Text style={styles.noteContent}>
                                {safetyPlan.custom_notes || "Aucune note définie."}
                            </Text>
                        )}
                    </View>

                </ScrollView>

                {editable && (
                    <View style={styles.footer}>
                        {isEditing ? (
                            <TouchableOpacity style={styles.saveMainButton} onPress={handleSave} disabled={loading}>
                                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveMainButtonText}>Enregistrer le Plan</Text>}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.editMainButton} onPress={() => setIsEditing(true)}>
                                <Text style={styles.editMainButtonText}>Modifier le Plan</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        ...typography.h3,
        color: colors.text,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: spacing.xxl,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.h4,
        color: colors.text,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    cardValue: {
        color: colors.primary,
        fontSize: 14,
        marginTop: 2,
    },
    cardNote: {
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginTop: 2,
    },
    addItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        marginTop: spacing.xs,
        gap: 8,
    },
    addItemText: {
        color: colors.primary,
        fontWeight: '600',
    },
    addForm: {
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    input: {
        backgroundColor: colors.surface,
        color: colors.text,
        padding: 10,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md,
    },
    cancelButton: {
        padding: 8,
    },
    cancelButtonText: {
        color: colors.textSecondary,
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: borderRadius.sm,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    textArea: {
        backgroundColor: colors.surface,
        color: colors.text,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    noteContent: {
        color: colors.text,
        lineHeight: 24,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    saveMainButton: {
        backgroundColor: colors.success,
        padding: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: 'center',
    },
    saveMainButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    editMainButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: 'center',
    },
    editMainButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
