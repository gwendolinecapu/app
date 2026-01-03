
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarService, CalendarEvent, EventType } from '../../services/CalendarService';
import { useToast } from '../ui/Toast';
import { triggerHaptic } from '../../lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface EventDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    event: CalendarEvent | null;
    onEventUpdated: () => void;
}

const TYPE_COLORS: Record<string, string> = {
    appointment: '#FF6B6B',
    social: '#4ECDC4',
    fronting: '#45B7D1',
    reminder: '#96CEB4',
    other: '#FFEEAD',
};

const TYPE_LABELS: Record<string, string> = {
    appointment: 'Rendez-vous',
    social: 'Social',
    fronting: 'Fronting',
    reminder: 'Rappel',
    other: 'Autre',
};

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
    visible,
    onClose,
    event,
    onEventUpdated
}) => {
    const { alters, user, currentAlter } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    if (!event) return null;

    const handleDelete = () => {
        Alert.alert(
            "Supprimer l'événement",
            "Êtes-vous sûr de vouloir supprimer cet événement ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await CalendarService.deleteEvent(event.id);
                            triggerHaptic.success();
                            showToast("Événement supprimé", "success");
                            onEventUpdated();
                            onClose();
                        } catch (error) {
                            console.error(error);
                            showToast("Erreur lors de la suppression", "error");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const creator = alters.find(a => a.id === event.createdBy);

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
                    <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
                </BlurView>

                <View style={styles.modalContent}>
                    {/* Header with Type Color */}
                    <View style={[styles.headerStrip, { backgroundColor: TYPE_COLORS[event.type] || '#FFF' }]} />

                    <ScrollView style={styles.modalScroll} contentContainerStyle={styles.contentPadding}>
                        <View style={styles.header}>
                            <View style={styles.typeBadge}>
                                <Text style={[styles.typeText, { color: TYPE_COLORS[event.type] }]}>
                                    {TYPE_LABELS[event.type] || event.type}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.title}>{event.title}</Text>

                        <View style={styles.dateRow}>
                            <Ionicons name="time" size={16} color="#AAA" style={{ marginRight: 6 }} />
                            <Text style={styles.dateText}>
                                {formatDate(event.startTime)} - {new Date(event.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>

                        {event.description ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Notes</Text>
                                <Text style={styles.description}>{event.description}</Text>
                            </View>
                        ) : null}

                        {event.concernedAlters && event.concernedAlters.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Participants</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.altersContainer}>
                                    {event.concernedAlters.map(alterId => {
                                        const alter = alters.find(a => a.id === alterId);
                                        if (!alter) return null;
                                        return (
                                            <View key={alterId} style={[styles.alterChip, { borderColor: alter.color || '#555' }]}>
                                                <Text style={styles.alterName}>{alter.name}</Text>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        <View style={styles.footerInfo}>
                            <Text style={styles.footerText}>
                                Créé par {creator ? creator.name : 'Inconnu'}
                            </Text>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={handleDelete}
                                disabled={loading}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF453A" />
                                <Text style={styles.deleteText}>Supprimer</Text>
                            </TouchableOpacity>

                            {/* Edit button placeholder - for full edit implementation would reuse Add form logic */}
                            <TouchableOpacity
                                style={[styles.actionButton, styles.editButton]}
                                onPress={() => {
                                    Alert.alert("Bientôt disponible", "La modification sera disponible dans une prochaine mise à jour.");
                                }}
                            >
                                <Ionicons name="pencil" size={20} color="#FFF" />
                                <Text style={styles.editText}>Modifier</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    dismissArea: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        maxHeight: '80%', // Avoid full screen
        width: '100%',
    },
    modalScroll: {
        maxHeight: '100%',
    },
    headerStrip: {
        height: 6,
        width: '100%',
    },
    contentPadding: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    typeBadge: {
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    typeText: {
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#333',
        borderRadius: 12,
    },
    title: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dateText: {
        color: '#CCC',
        fontSize: 14,
    },
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        color: '#777',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    description: {
        color: '#EEE',
        fontSize: 15,
        lineHeight: 22,
    },
    altersContainer: {
        flexDirection: 'row',
    },
    alterChip: {
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    alterName: {
        color: '#FFF',
        fontSize: 13,
    },
    footerInfo: {
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 10,
    },
    footerText: {
        color: '#555',
        fontSize: 12,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    deleteButton: {
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
    },
    editButton: {
        backgroundColor: '#333',
    },
    deleteText: {
        color: '#FF453A',
        fontWeight: '600',
    },
    editText: {
        color: '#FFF',
        fontWeight: '600',
    },
});
