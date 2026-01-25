/**
 * Production-safe logger
 * Seuls les logs d'erreur sont conservés en développement
 * En production, tous les logs sont silencieux
 */

const isDev = __DEV__;

export const Logger = {
    /**
     * Log d'information (dev only)
     */
    info: (message: string, ...args: any[]) => {
        if (isDev) {
            console.log(`[INFO] ${message}`, ...args);
        }
    },

    /**
     * Log de warning (dev only)
     */
    warn: (message: string, ...args: any[]) => {
        if (isDev) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    },

    /**
     * Log d'erreur (dev only - en prod, utiliser un service de monitoring)
     */
    error: (message: string, error?: any) => {
        if (isDev) {
            console.error(`[ERROR] ${message}`, error);
        }
        // TODO: En production, envoyer vers un service comme Sentry/Crashlytics
        // if (!isDev && CrashReporting) {
        //     CrashReporting.recordError(error);
        // }
    },

    /**
     * Log de debug (dev only)
     */
    debug: (message: string, ...args: any[]) => {
        if (isDev) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    },
};

export default Logger;
