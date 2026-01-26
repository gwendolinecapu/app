import { SafetyPlanModal } from './SafetyPlanModal';

// ...

export const AlterSettings: React.FC<AlterSettingsProps> = ({ alter, themeColors }) => {
    // ... (previous variables)

    // Password modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    // ... (other states)

    // ... (existing functions)

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeColors?.background || 'transparent' }]}>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>Compte</Text>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]} onPress={() => router.push(`/alter-space/${alter.id}/edit`)}>
                    <Ionicons name="person-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Modifier le profil</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>

                {/* SAFETY PLAN */}
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]} onPress={() => setShowSafetyModal(true)}>
                    <Ionicons name="warning-outline" size={24} color={colors.error} />
                    <Text style={[styles.itemText, { color: colors.error }]}>Plan de Sécurité</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>

                {/* PASSWORD OPTION */}
                <TouchableOpacity
                    style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}
                // ... (rest of password implementation)
                >
                    <Ionicons name="key-outline" size={24} color={iconColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Mot de passe</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {hasPassword ? (
                            <View style={[styles.statusBadge, { backgroundColor: `${colors.success}20` }]}>
                                <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>Actif</Text>
                            </View>
                        ) : (
                            <View style={[styles.statusBadge, { backgroundColor: `${colors.textSecondary}20` }]}>
                                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>Désactivé</Text>
                            </View>
                        )}
                        <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="lock-closed-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Confidentialité</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="notifications-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]} onPress={() => router.push('/settings')}>
                    <Ionicons name="settings-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Paramètres de l'application</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>Interactions</Text>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="people-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Abonnés proches</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="ban-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Comptes bloqués</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>Système</Text>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="eye-off-outline" size={24} color={colors.error} />
                    <Text style={[styles.itemText, { color: colors.error }]}>Masquer cet alter</Text>
                </TouchableOpacity>
            </View>

            {/* PASSWORD MODAL */}
            <Modal visible={showPasswordModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: cardBg }]}>
                        <View style={[styles.modalIconContainer, { backgroundColor: `${iconColor}20` }]}>
                            <Ionicons name="key" size={32} color={iconColor} />
                        </View>

                        <Text style={[styles.modalTitle, { color: textColor }]}>
                            {hasPassword ? 'Modifier le mot de passe' : 'Définir un mot de passe'}
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: textSecondaryColor }]}>
                            Protégez l'accès à cet espace alter
                        </Text>

                        <View style={[styles.inputContainer, { backgroundColor: bgColor, borderColor }]}>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Nouveau mot de passe"
                                placeholderTextColor={textSecondaryColor}
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={22} color={textSecondaryColor} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: bgColor, borderColor }]}>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirmer le mot de passe"
                                placeholderTextColor={textSecondaryColor}
                                secureTextEntry={!showNewPassword}
                            />
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { borderColor }]}
                                onPress={() => {
                                    setShowPasswordModal(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                            >
                                <Text style={[styles.cancelButtonText, { color: textSecondaryColor }]}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.saveButton, { backgroundColor: iconColor }]}
                                onPress={handleSavePassword}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.h3,
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginBottom: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemText: {
        flex: 1,
        marginLeft: spacing.md,
        fontSize: 16,
        color: colors.text,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
        marginRight: spacing.sm,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    button: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: colors.primary,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
});
