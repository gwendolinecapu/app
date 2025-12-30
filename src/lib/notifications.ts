import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configuration du handler pour que les notifs s'affichent même app ouverte
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
});

export const SUPPORT_MESSAGES = [
    "Prenez un moment pour respirer profondément. 🌿",
    "Vous êtes en sécurité ici et maintenant. 🛡️",
    "C'est OK de ne pas être OK. Accordez-vous de la douceur. 💙",
    "Petit rappel : Boire un verre d'eau ? 💧",
    "Avez-vous fait un check-in émotionnel aujourd'hui ? 📝",
    "N'oubliez pas, vous faites de votre mieux et c'est suffisant. ✨",
    "Regardez autour de vous et nommez 3 objets bleus. (Ancrage) 👁️",
    "La communauté PluralConnect est là pour vous. 🤝",
    "Votre système est précieux. Prenez soin de vous. 💎",
    "Une petite pause s'impose peut-être ? ☕",
];

export async function registerForPushNotificationsAsync() {
    let token;
    let finalStatus; // Moved declaration to a higher scope

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice || Platform.OS === 'ios') { // Allow on simulator for iOS (local notifications work)
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        finalStatus = existingStatus; // Assign to the higher-scoped variable

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {

            return false; // Changed return type to boolean
        }
    } else {
        // console.log('Must use physical device for Push Notifications'); 
        // Local notifications might still work on Android emulator depending on config, but mostly robust on device.
        finalStatus = 'granted'; // Set finalStatus for non-device scenarios
    }

    return finalStatus === 'granted';
}

export async function scheduleDailyNotification(hour: number, minute: number, message?: string) {
    const content = {
        title: "PluralConnect 🌿",
        body: message || SUPPORT_MESSAGES[Math.floor(Math.random() * SUPPORT_MESSAGES.length)],
        sound: true,
    };

    await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY, // Explicit type
            hour,
            minute,
        },
    });
}

export async function scheduleRandomNotification() {
    // Juste un exemple pour tester immédiatement ou planifier plus tard
    // Pour un vrai "aléatoire" au cours de la journée, c'est plus complexe avec le scheduling iOS
    // On va simuler un rappel dans 2 secondes pour tester
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Petit coucou 👋",
            body: SUPPORT_MESSAGES[Math.floor(Math.random() * SUPPORT_MESSAGES.length)],
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, // Explicit type
            seconds: 2,
            repeats: false, // Added repeats: false
        },
    });
}

export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
}
