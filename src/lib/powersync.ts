import { AbstractPowerSyncDatabase, PowerSyncDatabase } from '@powersync/react-native';
import { AppSchema } from './schema';
import { supabase } from './supabase';

// Configuration PowerSync
const POWERSYNC_URL = process.env.EXPO_PUBLIC_POWERSYNC_URL || 'YOUR_POWERSYNC_URL';

class PowerSyncConnector {
    async fetchCredentials() {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            throw new Error('No session');
        }

        return {
            endpoint: POWERSYNC_URL,
            token: session.access_token,
            expiresAt: new Date(session.expires_at! * 1000),
        };
    }

    async uploadData(database: AbstractPowerSyncDatabase) {
        const transaction = await database.getNextCrudTransaction();

        if (!transaction) {
            return;
        }

        try {
            for (const op of transaction.crud) {
                const table = op.table;
                const data = op.opData;

                switch (op.op) {
                    case 'PUT':
                        await supabase.from(table).upsert(data);
                        break;
                    case 'PATCH':
                        await supabase.from(table).update(data).eq('id', op.id);
                        break;
                    case 'DELETE':
                        await supabase.from(table).delete().eq('id', op.id);
                        break;
                }
            }

            await transaction.complete();
        } catch (error) {
            console.error('Sync error:', error);
            throw error;
        }
    }
}

export const powerSyncDb = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
        dbFilename: 'pluralconnect.db',
    },
});

export const connector = new PowerSyncConnector();

export async function initPowerSync() {
    await powerSyncDb.init();

    try {
        const credentials = await connector.fetchCredentials();
        await powerSyncDb.connect(connector);
    } catch (error) {
        // Non connecté - mode offline
        console.log('PowerSync: mode offline');
    }
}

export async function disconnectPowerSync() {
    await powerSyncDb.disconnect();
}
