import { formatRelativeTime } from './date';

describe('formatRelativeTime', () => {
    it('formats dates specifically', () => {
        const now = new Date();
        const past = new Date(now.getTime() - 1000 * 60 * 5); // 5 minutes ago
        // formatRelativeTime removes "il y a " and shortens units (e.g. "5 minutes" -> "5min")
        const result = formatRelativeTime(past);
        console.log('Result:', result);
        expect(result).toMatch(/min/);
    });
});
