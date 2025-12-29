import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { ImportService } from '../../src/services/importer';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ImportScreen() {
    const router = useRouter();
    const { system, refreshAlters } = useAuth();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const handlePickFile = async () => {
        if (!system) return;

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];

            // Note: En React Native "pur" sans expo-file-system avancé, fetch fonctionne pour les URI locaux
            // ou on doit utiliser FileReader.
            setLoading(true);
            addLog(`Lecture du fichier: ${file.name}...`);

            // Fetch local file content 
            const response = await fetch(file.uri);
            const jsonText = await response.text();

            // Basic validation
            let jsonData;
            try {
                jsonData = JSON.parse(jsonText);
            } catch (e: any) {
                addLog("Erreur: Le fichier n'est pas un JSON valide.");
                setLoading(false);
                return;
            }

            addLog("Analyse des données...");

            // Lancer l'import
            const importResult = await ImportService.importSimplyPluralData(jsonData, system.id, system.id); // userId = system.id ici par simplification

            addLog(`✅ Import terminé !`);
            addLog(`- ${importResult.altersCreated} alters créés`);
            addLog(`- ${importResult.historyEntriesCreated} entrées d'historique`);

            if (importResult.errors.length > 0) {
                addLog(`⚠️ ${importResult.errors.length} erreurs mineures`);
                importResult.errors.forEach(e => addLog(`  - ${e}`));
            }

            if (importResult.altersCreated > 0) {
                await refreshAlters();
            }

        } catch (error: any) {
            console.error(error);
            addLog(`❌ Erreur critique : ${error.message}`);
            Alert.alert("Erreur", "Problème lors de la lecture ou de l'import du fichier.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Importer Simply Plural</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={24} color={colors.primary} style={{ marginBottom: spacing.sm }} />
                    <Text style={styles.infoText}>
                        Vous pouvez importer vos données depuis Simply Plural.
                    </Text>
                    <Text style={styles.infoSteps}>
                        1. Ouvrez Simply Plural{'\n'}
                        2. Allez dans Paramètres {'>'} Sauvegardes{'\n'}
                        3. Créez une sauvegarde (fichier .json){'\n'}
                        4. Importez ce fichier ici
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.importButton, loading && styles.disabledButton]}
                    onPress={handlePickFile}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={24} color="white" style={{ marginRight: spacing.sm }} />
                            <Text style={styles.importButtonText}>Sélectionner le fichier JSON</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Console Logs */}
                <View style={styles.logsContainer}>
                    <Text style={styles.logsTitle}>Journal d'import :</Text>
                    {logs.length === 0 ? (
                        <Text style={styles.emptyLogs}>En attente...</Text>
                    ) : (
                        logs.map((log, index) => (
                            <Text key={index} style={styles.logText}>
                                {log}
                            </Text>
                        ))
                    )}
                </View>

            </ScrollView>
        </View>
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
        padding: spacing.md,
        paddingTop: 60,
        backgroundColor: colors.backgroundCard,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        marginRight: spacing.md,
    },
    title: {
        ...typography.h3,
    },
    content: {
        padding: spacing.lg,
    },
    infoBox: {
        backgroundColor: colors.backgroundCard,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.xl,
        alignItems: 'center',
    },
    infoText: {
        ...typography.body,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    infoSteps: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    importButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.full,
        marginBottom: spacing.xl,
    },
    disabledButton: {
        opacity: 0.7,
    },
    importButtonText: {
        ...typography.button,
        color: 'white',
    },
    logsContainer: {
        backgroundColor: '#1E1E1E',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        minHeight: 200,
    },
    logsTitle: {
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
    },
    emptyLogs: {
        color: '#4B5563',
        fontStyle: 'italic',
    },
    logText: {
        color: '#E5E7EB',
        fontFamily: 'monospace', // Si dispo, sinon defaut
        fontSize: 12,
        marginBottom: 4,
    }
});
