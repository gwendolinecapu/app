/**
 * NotificationTypes.ts
 * Types et constantes pour le système de notifications PluralConnect
 */

// Types de notifications disponibles
export type NotificationType =
    // Rappels Front
    | 'front_check'           // "Qui est en front ?"
    | 'front_long_duration'   // "Tu es en front depuis longtemps"
    | 'morning_checkin'       // Check-in matinal

    // Humeur & Bien-être
    | 'mood_check'            // "Comment te sens-tu ?"
    | 'breathing_reminder'    // Moment de respiration
    | 'post_switch_check'     // Check émotionnel après switch

    // Journal
    | 'journal_reminder'      // Rappel journal quotidien
    | 'streak_warning'        // "Ton streak va expirer"
    | 'streak_milestone'      // Félicitations milestone

    // Social (Push)
    | 'new_follower'          // Nouveau follower
    | 'new_message'           // Nouveau message
    | 'post_reaction'         // Réaction à un post

    // Système
    | 'backup_complete'       // Sauvegarde terminée
    | 'app_update'            // Mise à jour disponible

    // Soutien
    | 'daily_affirmation'     // Message du jour
    | 'self_compassion'       // Rappel auto-compassion
    | 'alter_message';        // Message d'un alter

// Configuration d'une notification
export interface NotificationConfig {
    id: NotificationType;
    title: string;
    body: string;
    category: 'front' | 'mood' | 'journal' | 'social' | 'system' | 'wellness';
    isLocal: boolean;           // vs Push notification
    defaultEnabled: boolean;
    defaultFrequency?: NotificationFrequency;
    icon?: string;
    sound?: string;
    priority: 'low' | 'default' | 'high';
}

// Fréquences disponibles
export type NotificationFrequency =
    | 'hourly'
    | 'every_2_hours'
    | 'every_4_hours'
    | 'every_6_hours'
    | 'twice_daily'
    | 'daily'
    | 'weekly'
    | 'custom';

// Préférences utilisateur pour une notification
export interface NotificationPreference {
    type: NotificationType;
    enabled: boolean;
    frequency: NotificationFrequency;
    customHours?: number[];      // Heures personnalisées (0-23)
    quietHoursStart?: number;    // Début heures calmes (ex: 22)
    quietHoursEnd?: number;      // Fin heures calmes (ex: 8)
}

// Configuration complète des notifications utilisateur
export interface NotificationSettings {
    globalEnabled: boolean;
    persistentNotification: boolean;     // Notif fond d'écran alter
    dynamicIslandEnabled: boolean;       // Dynamic Island iOS
    quietHoursEnabled: boolean;
    quietHoursStart: number;
    quietHoursEnd: number;
    preferences: NotificationPreference[];
}

// Configuration par défaut de chaque notification
export const NOTIFICATION_CONFIGS: NotificationConfig[] = [
    // === FRONT ===
    {
        id: 'front_check',
        title: 'Qui est en front ?',
        body: "Prends un moment pour noter qui est en front actuellement",
        category: 'front',
        isLocal: true,
        defaultEnabled: true,
        defaultFrequency: 'every_4_hours',
        priority: 'default',
    },
    {
        id: 'front_long_duration',
        title: 'Check-in Front',
        body: "Tu es en front depuis un moment. Comment ça va ?",
        category: 'front',
        isLocal: true,
        defaultEnabled: false,
        defaultFrequency: 'every_6_hours',
        priority: 'low',
    },
    {
        id: 'morning_checkin',
        title: 'Bonjour ! ☀️',
        body: "Qui commence la journée ?",
        category: 'front',
        isLocal: true,
        defaultEnabled: true,
        defaultFrequency: 'daily',
        priority: 'default',
    },

    // === HUMEUR ===
    {
        id: 'mood_check',
        title: 'Comment te sens-tu ?',
        body: "Prends un moment pour noter ton humeur",
        category: 'mood',
        isLocal: true,
        defaultEnabled: true,
        defaultFrequency: 'twice_daily',
        priority: 'default',
    },
    {
        id: 'breathing_reminder',
        title: 'Moment de pause 🌿',
        body: "Respire profondément. Tu fais du bon travail.",
        category: 'mood',
        isLocal: true,
        defaultEnabled: false,
        defaultFrequency: 'every_4_hours',
        priority: 'low',
    },
    {
        id: 'post_switch_check',
        title: 'Transition en cours',
        body: "Comment vas-tu après ce changement ?",
        category: 'mood',
        isLocal: true,
        defaultEnabled: false,
        priority: 'default',
    },

    // === JOURNAL ===
    {
        id: 'journal_reminder',
        title: 'Temps d\'écrire 📝',
        body: "N'oublie pas ton journal du soir",
        category: 'journal',
        isLocal: true,
        defaultEnabled: true,
        defaultFrequency: 'daily',
        priority: 'default',
    },
    {
        id: 'streak_warning',
        title: 'Streak en danger ! ⚠️',
        body: "Écris une entrée pour garder ton streak de {days} jours",
        category: 'journal',
        isLocal: true,
        defaultEnabled: true,
        priority: 'high',
    },
    {
        id: 'streak_milestone',
        title: 'Félicitations ! 🎉',
        body: "{days} jours de journal consécutifs !",
        category: 'journal',
        isLocal: true,
        defaultEnabled: true,
        priority: 'high',
    },

    // === SOCIAL ===
    {
        id: 'new_follower',
        title: 'Nouveau follower',
        body: "{username} a commencé à te suivre",
        category: 'social',
        isLocal: false,
        defaultEnabled: true,
        priority: 'default',
    },
    {
        id: 'new_message',
        title: 'Nouveau message',
        body: "Tu as un nouveau message de {username}",
        category: 'social',
        isLocal: false,
        defaultEnabled: true,
        priority: 'high',
    },
    {
        id: 'post_reaction',
        title: 'Nouvelle réaction',
        body: "{username} a réagi à ton post",
        category: 'social',
        isLocal: false,
        defaultEnabled: true,
        priority: 'low',
    },

    // === SYSTÈME ===
    {
        id: 'backup_complete',
        title: 'Sauvegarde terminée ✅',
        body: "Tes données ont été sauvegardées",
        category: 'system',
        isLocal: true,
        defaultEnabled: true,
        priority: 'low',
    },
    {
        id: 'app_update',
        title: 'Mise à jour disponible',
        body: "Une nouvelle version de PluralConnect est disponible",
        category: 'system',
        isLocal: false,
        defaultEnabled: true,
        priority: 'low',
    },

    // === BIEN-ÊTRE ===
    {
        id: 'daily_affirmation',
        title: '💜',
        body: "Tu es valide. Chaque alter compte.",
        category: 'wellness',
        isLocal: true,
        defaultEnabled: false,
        defaultFrequency: 'daily',
        priority: 'low',
    },
    {
        id: 'self_compassion',
        title: 'Rappel doux 💜',
        body: "Sois gentil(le) avec toi-même aujourd'hui",
        category: 'wellness',
        isLocal: true,
        defaultEnabled: false,
        defaultFrequency: 'daily',
        priority: 'low',
    },
    {
        id: 'alter_message',
        title: 'Message de {alterName}',
        body: "{message}",
        category: 'wellness',
        isLocal: true,
        defaultEnabled: false,
        priority: 'default',
    },
];

// Messages d'affirmation par défaut
export const AFFIRMATION_MESSAGES = [
    "Tu es valide. Chaque alter compte. 💜",
    "Prends soin de toi aujourd'hui.",
    "Tu mérites de te sentir bien.",
    "Chaque moment difficile est temporaire.",
    "Tu es plus fort(e) que tu ne le penses.",
    "N'oublie pas de respirer.",
    "Tu n'es pas seul(e).",
    "Chaque petit pas compte.",
    "Sois doux/douce avec toi-même.",
    "Tu fais de ton mieux, et c'est suffisant.",
    "Ton système est unique et précieux.",
    "La communication interne est une force.",
    "Tu mérites l'amour et le respect.",
    "Aujourd'hui est un nouveau jour.",
    "Tes émotions sont valides.",
];

// Fréquences en millisecondes
export const FREQUENCY_MS: Record<NotificationFrequency, number> = {
    hourly: 60 * 60 * 1000,
    every_2_hours: 2 * 60 * 60 * 1000,
    every_4_hours: 4 * 60 * 60 * 1000,
    every_6_hours: 6 * 60 * 60 * 1000,
    twice_daily: 12 * 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    custom: 0,
};

// Labels français pour les fréquences
export const FREQUENCY_LABELS: Record<NotificationFrequency, string> = {
    hourly: 'Toutes les heures',
    every_2_hours: 'Toutes les 2 heures',
    every_4_hours: 'Toutes les 4 heures',
    every_6_hours: 'Toutes les 6 heures',
    twice_daily: '2 fois par jour',
    daily: 'Une fois par jour',
    weekly: 'Une fois par semaine',
    custom: 'Personnalisé',
};

// Catégories avec labels
export const CATEGORY_LABELS = {
    front: '📍 Rappels Front',
    mood: '😊 Humeur & Bien-être',
    journal: '📝 Journal',
    social: '👥 Social',
    system: '⚙️ Système',
    wellness: '💜 Soutien',
};
