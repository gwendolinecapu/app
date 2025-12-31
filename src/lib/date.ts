import { formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Compresse la chaîne de temps relative pour un format plus court.
 * Ex: "il y a 2 heures" -> "2h", "il y a 5 minutes" -> "5min", "il y a 1 jour" -> "1j"
 */
export const formatRelativeTime = (dateString: string | number | Date | any): string => {
    if (!dateString) return '';

    let date: Date;

    // Handle Firestore Timestamps
    if (dateString && typeof dateString === 'object' && 'seconds' in dateString) {
        date = new Date(dateString.seconds * 1000);
    } else {
        date = new Date(dateString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'récemment';
    }

    try {
        const distance = formatDistanceToNowStrict(date, {
            addSuffix: true,
            locale: fr,
        });

        // Nettoyage et raccourcissement pour un style "réseau social"
        return distance
            .replace('il y a ', '')
            .replace('environ ', '')
            .replace('secondes', 's')
            .replace('seconde', 's')
            .replace('minutes', 'min')
            .replace('minute', 'min')
            .replace('heures', 'h')
            .replace('heure', 'h')
            .replace('jours', 'j')
            .replace('jour', 'j')
            .replace('mois', 'mo')
            .replace('années', 'an')
            .replace('année', 'an');
    } catch (error) {
        console.warn('[formatRelativeTime] Error formatting date:', error);
        return 'récemment';
    }
};

export const timeAgo = formatRelativeTime;
