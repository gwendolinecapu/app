import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';

interface LegalModalProps {
    visible: boolean;
    type: 'tos' | 'privacy' | null;
    onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ visible, type, onClose }) => {
    if (!type) return null;

    const title = type === 'tos' ? "Conditions Générales d'Utilisation" : "Politique de Confidentialité";

    const renderContent = () => {
        if (type === 'privacy') {
            return (
                <>
                    <Text style={styles.sectionTitle}>1. Introduction</Text>
                    <Text style={styles.paragraph}>
                        Bienvenue sur PluralConnect. Nous prenons votre vie privée très au sérieux.
                        Cette politique explique comment nous collectons, utilisons et protégeons vos données personnelles
                        lorsque vous utilisez notre application.
                    </Text>

                    <Text style={styles.sectionTitle}>2. Données collectées</Text>
                    <Text style={styles.paragraph}>Nous collectons :</Text>
                    <View style={styles.list}>
                        <Text style={styles.listItem}>• Informations de profil (nom de système, alters, etc.)</Text>
                        <Text style={styles.listItem}>• Contenus créés (posts, journal, etc.) - chiffrés de bout en bout</Text>
                        <Text style={styles.listItem}>• Données d'utilisation anonymisées pour améliorer l'app</Text>
                    </View>

                    <Text style={styles.sectionTitle}>3. Utilisation des données</Text>
                    <Text style={styles.paragraph}>Vos données sont utilisées pour :</Text>
                    <View style={styles.list}>
                        <Text style={styles.listItem}>• Fournir les services de l'application</Text>
                        <Text style={styles.listItem}>• Gérer votre compte et votre authentification</Text>
                        <Text style={styles.listItem}>• Améliorer les performances et corriger les bugs</Text>
                    </View>
                    <Text style={styles.paragraphBold}>Nous ne vendons jamais vos données à des tiers.</Text>

                    <Text style={styles.sectionTitle}>4. Sécurité</Text>
                    <Text style={styles.paragraph}>Nous protégeons vos données via :</Text>
                    <View style={styles.list}>
                        <Text style={styles.listItem}>• Chiffrement HTTPS des communications</Text>
                        <Text style={styles.listItem}>• Règles de sécurité strictes sur la base de données</Text>
                    </View>

                    <Text style={styles.sectionTitle}>5. Vos droits (RGPD)</Text>
                    <Text style={styles.paragraph}>Vous avez le droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous à hello@pluralconnect.app ou via les paramètres de l'application.</Text>
                </>
            );
        }

        return (
            <>
                <Text style={styles.sectionTitle}>1. Acceptation des Conditions</Text>
                <Text style={styles.paragraph}>
                    En créant un compte sur PluralConnect, vous acceptez d'être lié par ces Conditions Générales d'Utilisation.
                    Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
                </Text>

                <Text style={styles.sectionTitle}>2. Compte Utilisateur</Text>
                <Text style={styles.paragraph}>
                    Vous êtes responsable de maintenir la confidentialité de votre compte et de votre mot de passe.
                    Vous acceptez de nous informer immédiatement de toute utilisation non autorisée de votre compte.
                </Text>

                <Text style={styles.sectionTitle}>3. Code de Conduite</Text>
                <Text style={styles.paragraph}>
                    PluralConnect est un espace sûr et bienveillant. Vous acceptez de ne pas :
                </Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}>• Harceler, intimider ou diffamer d'autres utilisateurs.</Text>
                    <Text style={styles.listItem}>• Publier du contenu illégal, haineux ou pornographique.</Text>
                    <Text style={styles.listItem}>• Tenter de pirater ou de perturber le service.</Text>
                </View>

                <Text style={styles.sectionTitle}>4. Contenu Utilisateur</Text>
                <Text style={styles.paragraph}>
                    Vous conservez tous les droits sur le contenu que vous publiez. En publiant du contenu, vous nous accordez une licence pour l'afficher et le distribuer dans le cadre du service.
                </Text>

                <Text style={styles.sectionTitle}>5. Résiliation</Text>
                <Text style={styles.paragraph}>
                    Nous nous réservons le droit de suspendre ou de supprimer votre compte en cas de violation de ces conditions.
                </Text>

                <Text style={styles.sectionTitle}>6. Responsabilité</Text>
                <Text style={styles.paragraph}>
                    L'application est fournie "telle quelle". Nous ne garantissons pas qu'elle sera exempte d'erreurs ou toujours disponible.
                </Text>
            </>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {renderContent()}
                        <View style={styles.footerSpacer} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        height: '90%',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        ...typography.h3,
        flex: 1,
    },
    closeButton: {
        padding: spacing.xs,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    sectionTitle: {
        ...typography.h4,
        color: colors.primary,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    paragraph: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        lineHeight: 22,
    },
    paragraphBold: {
        ...typography.body,
        color: colors.text,
        fontWeight: 'bold',
        marginBottom: spacing.md,
    },
    list: {
        marginBottom: spacing.md,
        paddingLeft: spacing.sm,
    },
    listItem: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        lineHeight: 22,
    },
    footerSpacer: {
        height: spacing.xxl,
    },
});
