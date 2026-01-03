
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    KeyboardAvoidingView
} from 'react-native';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarService, EventType } from '../../services/CalendarService';
import { useToast } from '../ui/Toast';
import { triggerHaptic } from '../../lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface EventCreationModalProps {
    visible: boolean;
    onClose: () => void;
    onEventCreated: () => void;
    selectedDate?: string; // YYYY-MM-DD
}

const EVENT_TYPES: { type: EventType; label: string; color: string }[] = [
    { type: 'appointment', label: 'Rendez-vous', color: '#FF6B6B' },
    { type: 'social', label: 'Social', color: '#4ECDC4' },
    { type: 'fronting', label: 'Fronting', color: '#45B7D1' },
    { type: 'reminder', label: 'Rappel', color: '#96CEB4' },
    { type: 'other', label: 'Autre', color: '#FFEEAD' },
];

export const EventCreationModal: React.FC<EventCreationModalProps> = ({
    visible,
    onClose,
    onEventCreated,
    selectedDate
}) => {
    const { alters, user, currentAlter } = useAuth();
    const { showToast } = useToast();

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // +1h
    const [selectedType, setSelectedType] = useState<EventType>('appointment');
    const [selectedAlters, setSelectedAlters] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial date setup from props
    React.useEffect(() => {
        if (selectedDate) {
            const date = new Date(selectedDate);
            // Defaut at 9am if selected from calendar grid
            date.setHours(9, 0, 0, 0);
            setStartDate(date);
            setEndDate(new Date(date.getTime() + 60 * 60 * 1000));
        }
    }, [selectedDate, visible]);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Titre requis', 'Veuillez donner un titre à l\'événement.');
            return;
        }

        if (!user) return;

        setLoading(true);
        try {
            await CalendarService.createEvent({
                systemId: user.uid,
                title: title.trim(),
                description: description.trim(),
                startTime: startDate.getTime(),
                endTime: endDate.getTime(),
                type: selectedType,
                concernedAlters: selectedAlters.length > 0 ? selectedAlters : alters.map(a => a.id), // Default to all if none selected? Or just creator? keeping explicit.
                createdBy: currentAlter?.id || 'unknown',
            });

            triggerHaptic.success();
            showToast('Événement créé avec succès', 'success');
            onEventCreated();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setSelectedAlters([]);
        } catch (error) {
            console.error(error);
            triggerHaptic.error();
            showToast('Erreur lors de la création', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleAlter = (id: string) => {
        triggerHaptic.selection();
        if (selectedAlters.includes(id)) {
            setSelectedAlters(prev => prev.filter(a => a !== id));
        } else {
            setSelectedAlters(prev => [...prev, id]);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Nouvel Événement</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            {/* Title */}
                            <Text style={styles.label}>Titre</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: RDV Médecin, Soirée jeu..."
                                placeholderTextColor="#FFFFFF60"
                                value={title}
                                onChangeText={setTitle}
                            />

                            {/* Type */}
                            <Text style={styles.label}>Type</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                                {EVENT_TYPES.map((t) => (
                                    <TouchableOpacity
                                        key={t.type}
                                        style={[
                                            styles.chip,
                                            selectedType === t.type && { backgroundColor: t.color, borderColor: t.color }
                                        ]}
                                        onPress={() => {
                                            triggerHaptic.selection();
                                            setSelectedType(t.type);
                                        }}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedType === t.type && { color: '#000', fontWeight: 'bold' }
                                        ]}>
                                            {t.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Date & Time */}
                            <View style={styles.row}>
                                <View style={styles.dateContainer}>
                                    <Text style={styles.label}>Début</Text>
                                    <DateTimePicker
                                        value={startDate}
                                        mode="datetime"
                                        display="default"
                                        onChange={(e, d) => d && setStartDate(d)}
                                        themeVariant="dark"
                                        style={{ alignSelf: 'flex-start' }}
                                    />
                                </View>
                                <View style={styles.dateContainer}>
                                    <Text style={styles.label}>Fin</Text>
                                    <DateTimePicker
                                        value={endDate}
                                        mode="datetime"
                                        display="default"
                                        onChange={(e, d) => d && setEndDate(d)}
                                        minimumDate={startDate}
                                        themeVariant="dark"
                                        style={{ alignSelf: 'flex-start' }}
                                    />
                                </View>
                            </View>

                            {/* Alters */}
                            <Text style={styles.label}>Alters concernés</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                                {alters.map((alter) => (
                                    <TouchableOpacity
                                        key={alter.id}
                                        style={[
                                            styles.alterChip,
                                            selectedAlters.includes(alter.id) && { backgroundColor: alter.color || '#FFF', borderColor: alter.color || '#FFF' }
                                        ]}
                                        onPress={() => toggleAlter(alter.id)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedAlters.includes(alter.id) && { color: '#000', fontWeight: 'bold' }
                                        ]}>
                                            {alter.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Description */}
                            <Text style={styles.label}>Notes</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Détails supplémentaires..."
                                placeholderTextColor="#FFFFFF60"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                            />

                            <View style={{ height: 40 }} />
                        </ScrollView>

                        {/* Footer Action */}
                        <TouchableOpacity onPress={handleSave} disabled={loading}>
                            <LinearGradient
                                colors={['#6a11cb', '#2575fc']}
                                style={styles.saveButton}
                            >
                                <Text style={styles.saveButtonText}>
                                    {loading ? 'Création...' : 'Ajouter au calendrier'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        height: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    closeButton: {
        padding: 5,
    },
    scrollContent: {
        flex: 1,
    },
    label: {
        color: '#AAA',
        fontSize: 14,
        marginBottom: 8,
        marginTop: 16,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#333',
        borderRadius: 12,
        padding: 12,
        color: '#FFF',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    dateContainer: {
        flex: 1,
        marginRight: 10,
    },
    chipsContainer: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    chip: {
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
    },
    alterChip: {
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
    },
    chipText: {
        color: '#FFF',
        fontSize: 14,
    },
    saveButton: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
