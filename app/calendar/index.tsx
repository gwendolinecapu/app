
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Agenda, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../src/contexts/AuthContext';
import { CalendarService } from '../../src/services/CalendarService';
import { EventCreationModal } from '../../src/components/calendar/EventCreationModal';
import { EventDetailsModal } from '../../src/components/calendar/EventDetailsModal';


// Configure French Locale
LocaleConfig.locales['fr'] = {
    monthNames: [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ],
    monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
    dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
    today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

// Map event types to colors
const TYPE_COLORS: Record<string, string> = {
    appointment: '#FF6B6B',
    social: '#4ECDC4',
    fronting: '#45B7D1',
    reminder: '#96CEB4',
    other: '#FFEEAD',
};

export default function CalendarScreen() {
    const { user, alters } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [items, setItems] = useState<{ [key: string]: any[] }>({});
    const [, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (user?.uid) {
            loadEvents();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    const loadEvents = async () => {
        if (!user) return;
        setRefreshing(true);
        try {
            // Fetch events (simplified: getting all for now, or last month + future)
            // Ideally we fetch based on visible range, but for MVP we fetch all system events
            const allEvents = await CalendarService.getEvents(user.uid, 0, 9999999999999);

            const newItems: { [key: string]: any[] } = {};

            allEvents.forEach(event => {
                const dateKey = new Date(event.startTime).toISOString().split('T')[0];
                if (!newItems[dateKey]) {
                    newItems[dateKey] = [];
                }
                newItems[dateKey].push({
                    ...event,
                    height: Math.max(50, Math.floor((event.endTime - event.startTime) / (1000 * 60))),
                    day: dateKey
                });
            });

            // Ensure today has an entry so it renders empty if needed
            const today = new Date().toISOString().split('T')[0];
            if (!newItems[today]) {
                newItems[today] = [];
            }

            setItems(newItems);
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    const renderItem = (item: any, firstItemInDay: boolean) => {
        const startDate = new Date(item.startTime);
        const endDate = new Date(item.endTime);
        const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <TouchableOpacity
                style={[styles.item, { borderLeftColor: TYPE_COLORS[item.type] || '#FFF' }]}
                onPress={() => setSelectedEvent(item)}
            >
                <View style={styles.itemHeader}>
                    <Text style={styles.itemTime}>{formatTime(startDate)} - {formatTime(endDate)}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.type] + '40' }]}>
                        <Text style={[styles.typeText, { color: TYPE_COLORS[item.type] }]}>{item.type}</Text>
                    </View>
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.description ? <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text> : null}

                {/* Alter avatars/names if concerned */}
                {item.concernedAlters?.length > 0 && (
                    <View style={styles.altersRow}>
                        {item.concernedAlters.map((alterId: string) => {
                            const alter = alters.find(a => a.id === alterId);
                            if (!alter) return null;
                            return (
                                <View key={alterId} style={[styles.alterBadge, { backgroundColor: alter.color || '#555' }]} />
                            );
                        })}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmptyDate = () => {
        return (
            <View style={styles.emptyDate}>
                <Text style={styles.emptyDateText}>Rien de prévu</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            {/* Custom Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calendrier Système</Text>
                <TouchableOpacity onPress={() => loadEvents()} style={styles.headerBtn}>
                    <Ionicons name="refresh" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <Agenda
                items={items}
                loadItemsForMonth={(month) => {
                    // Logic to load specific month if implementing lazy loading
                    // console.log('trigger items loading for', month);
                }}
                selected={selectedDate}
                renderItem={renderItem}
                renderEmptyDate={renderEmptyDate}
                rowHasChanged={(r1: any, r2: any) => r1.id !== r2.id}
                showClosingKnob={true}
                theme={{
                    calendarBackground: '#1A1A1A',
                    agendaKnobColor: '#555',
                    backgroundColor: '#000',
                    dayTextColor: '#FFF',
                    monthTextColor: '#FFF',
                    textSectionTitleColor: '#aaa',
                    selectedDayBackgroundColor: '#6a11cb',
                    selectedDayTextColor: '#FFF',
                    todayTextColor: '#6a11cb',
                    dotColor: '#6a11cb',
                    selectedDotColor: '#ffffff',
                    agendaDayTextColor: '#AAA',
                    agendaDayNumColor: '#FFF',
                    agendaTodayColor: '#6a11cb',
                }}
                onDayPress={(day) => {
                    setSelectedDate(day.dateString);
                }}
            />

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <LinearGradient
                    colors={['#6a11cb', '#2575fc']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={30} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>

            <EventCreationModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onEventCreated={loadEvents}
                selectedDate={selectedDate}
            />

            <EventDetailsModal
                visible={!!selectedEvent}
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onEventUpdated={loadEvents}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: '#1A1A1A',
        zIndex: 10,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerBtn: {
        padding: 5,
    },
    item: {
        backgroundColor: '#333',
        flex: 1,
        borderRadius: 8,
        padding: 10,
        marginRight: 10,
        marginTop: 17,
        borderLeftWidth: 4,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    itemTime: {
        color: '#AAA',
        fontSize: 12,
    },
    typeBadge: {
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    typeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    itemTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemDesc: {
        color: '#CCC',
        fontSize: 12,
        marginTop: 4,
    },
    emptyDate: {
        height: 15,
        flex: 1,
        paddingTop: 30,
        alignItems: 'center',
    },
    emptyDateText: {
        color: '#555',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    altersRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    alterBadge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 4,
    },
});
