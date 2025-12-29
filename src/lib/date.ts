import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

export const timeAgo = (date: any): string => {
    if (!date) return '';

    let targetDate: Date;

    if (date instanceof Timestamp) {
        targetDate = date.toDate();
    } else if (date?.seconds) {
        // Handle serialized timestamp
        targetDate = new Date(date.seconds * 1000);
    } else if (typeof date === 'string') {
        targetDate = new Date(date);
    } else if (date instanceof Date) {
        targetDate = date;
    } else {
        return '';
    }

    // Check for invalid date
    if (isNaN(targetDate.getTime())) return '';

    return formatDistance(targetDate, new Date(), { locale: fr });
};

export const formatTimeSince = (date: any): string => {
    const duration = timeAgo(date);
    return `depuis ${duration}`;
};
