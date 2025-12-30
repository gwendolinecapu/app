import { formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Compresse la chaîne de temps relative pour un format plus court.
 * Ex: "il y a 2 heures" -> "2h", "il y a 5 minutes" -> "5min", "il y a 1 jour" -> "1j"
 */
export const formatRelativeTime = (dateString: string | number | Date): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
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
};

export const timeAgo = formatRelativeTime;
