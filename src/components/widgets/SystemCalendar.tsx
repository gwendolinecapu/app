import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FrontHistoryItem {
    id: string;
    alter_id: string;
    started_at: number;
    ended_at?: number;
    alter_name?: string; // Resolved name
    alter_color?: string; // Resolved color
}

export const SystemCalendar = () => {
    const { user, alters } = useAuth();
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dayEvents, setDayEvents] = useState<FrontHistoryItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [history, setHistory] = useState<FrontHistoryItem[]>([]);

    useEffect(() => {
        if (!user) return;

        // Fetch history
        // Note: For a real calendar, we should probably fetch by month range to avoid loading ALL history
        // For MVP, limiting to last 100 entries or similar is safer
        const q = query(
            collection(db, 'front_history'),
            where('system_id', '==', user.uid),
            orderBy('started_at', 'desc'),
            // limit(500) // Uncomment in prod
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FrontHistoryItem));
            setHistory(items);
            processHistoryToMarks(items);
        });

        return () => unsubscribe();
    }, [user]);

    const processHistoryToMarks = (items: FrontHistoryItem[]) => {
        const marks: any = {};

        items.forEach(item => {
            const dateStr = new Date(item.started_at).toISOString().split('T')[0];

            // Resolve alter color
            const alter = alters.find(a => a.id === item.alter_id);
            const color = alter?.color || colors.primary;

            if (!marks[dateStr]) {
                marks[dateStr] = {
                    dots: []
                };
            }

            // Avoid duplicate dots for same alter on same day (optional, but cleaner)
            const hasDot = marks[dateStr].dots.find((d: any) => d.color === color);
            if (!hasDot && marks[dateStr].dots.length < 3) {
                marks[dateStr].dots.push({ color: color });
            }
        });

        setMarkedDates(marks);
    };

    const handleDayPress = (day: DateData) => {
        setSelectedDate(day.dateString);

        // Filter history for this day
        // Be careful with timezones. comparing date strings is usually safe enough if standardized.
        // History timestamps are UTC or local? Usually Date.now().

        const dayStart = new Date(day.dateString).getTime(); // Local midnight? 
        // Actually dateString is YYYY-MM-DD. 
        // Better logic: check if ISO string starts with YYYY-MM-DD

        const events = history.filter(item => {
            const itemDateStr = new Date(item.started_at).toISOString().split('T')[0];
            return itemDateStr === day.dateString;
        }).map(item => {
            const alter = alters.find(a => a.id === item.alter_id);
            return {
                ...item,
                alter_name: alter?.name || 'Inconnu',
                alter_color: alter?.color || colors.textMuted
            };
        });

        setDayEvents(events);
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Calendrier Système</Text>
            </View>

            <Calendar
                style={styles.calendar}
                theme={{
                    backgroundColor: colors.backgroundCard,
                    calendarBackground: colors.backgroundCard,
                    textSectionTitleColor: colors.textSecondary,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colors.primary,
                    dayTextColor: colors.text,
                    textDisabledColor: colors.textMuted,
                    dotColor: colors.primary,
                    selectedDotColor: '#ffffff',
                    arrowColor: colors.primary,
                    monthTextColor: colors.text,
                    textDayFontFamily: 'System',
                    textMonthFontFamily: 'System',
                    textDayHeaderFontFamily: 'System',
                    textDayFontWeight: '300',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '300',
                    textDayFontSize: 14,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 13
                }}
                markingType={'multi-dot'}
                markedDates={markedDates}
                onDayPress={handleDayPress}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedDate ? format(parseISO(selectedDate), 'd MMMM yyyy', { locale: fr }) : ''}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.eventList}>
                            {dayEvents.length === 0 ? (
                                <Text style={styles.emptyText}>Aucune activité enregistrée ce jour-là.</Text>
                            ) : (
                                dayEvents.map((event, index) => (
                                    <View key={index} style={styles.eventItem}>
                                        <View style={[styles.eventDot, { backgroundColor: event.alter_color }]} />
                                        <View>
                                            <Text style={styles.eventName}>{event.alter_name}</Text>
                                            <Text style={styles.eventTime}>
                                                {format(new Date(event.started_at), 'HH:mm')}
                                                {event.ended_at ? ` - ${format(new Date(event.ended_at), 'HH:mm')}` : ' - ...'}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        marginBottom: spacing.sm,
    },
    title: {
        ...typography.h3,
        color: colors.text,
        fontSize: 18,
    },
    calendar: {
        borderRadius: borderRadius.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        minHeight: 300,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        ...typography.h2,
        color: colors.text,
    },
    eventList: {
        flex: 1,
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    eventDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: spacing.md,
    },
    eventName: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    eventTime: {
        ...typography.caption,
        color: colors.textMuted,
    },
    emptyText: {
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xl,
    }
});
