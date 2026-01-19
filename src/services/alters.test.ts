import { AlterService } from './alters';
import { getDocs, query, where, collection, orderBy, limit } from 'firebase/firestore';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => {
    return {
        collection: jest.fn(),
        query: jest.fn(),
        where: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
        getDocs: jest.fn(),
        doc: jest.fn(),
        getDoc: jest.fn(),
        updateDoc: jest.fn(),
        documentId: jest.fn(),
        getFirestore: jest.fn(),
        initializeFirestore: jest.fn(),
    };
});

// Mock ../lib/firebase
jest.mock('../lib/firebase', () => ({
    db: {},
}));

describe('AlterService.findPrimaryAlterId', () => {
    const mockGetDocs = getDocs as jest.Mock;
    const mockQuery = query as jest.Mock;
    const mockWhere = where as jest.Mock;
    const mockOrderBy = orderBy as jest.Mock;
    const mockLimit = limit as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetches host directly if exists', async () => {
        // Setup mock return for getDocs
        const mockSnapshotHost = {
            empty: false,
            size: 1,
            docs: [
                { id: 'host_id', data: () => ({ name: 'Host Alter', is_host: true, created_at: 200 }) },
            ],
        };

        // We need getDocs to return different values on sequential calls if needed,
        // but here it should only call once if host is found.
        mockGetDocs.mockResolvedValueOnce(mockSnapshotHost);

        const result = await AlterService.findPrimaryAlterId('system123');

        // Verify result
        expect(result).toBe('host_id');

        // Verify query structure
        expect(mockLimit).toHaveBeenCalledWith(1);
        expect(mockWhere).toHaveBeenCalledWith('is_host', '==', true);

        // Should NOT have called orderBy (because we found host)
        expect(mockOrderBy).not.toHaveBeenCalled();

        // Should have called getDocs once
        expect(mockGetDocs).toHaveBeenCalledTimes(1);
    });

    it('falls back to oldest alter if no host exists', async () => {
        const mockSnapshotHost = {
            empty: true,
            size: 0,
            docs: [],
        };
        const mockSnapshotOldest = {
            empty: false,
            size: 1,
            docs: [
                { id: 'oldest_id', data: () => ({ name: 'Oldest Alter', is_host: false, created_at: 100 }) },
            ],
        };

        mockGetDocs
            .mockResolvedValueOnce(mockSnapshotHost)
            .mockResolvedValueOnce(mockSnapshotOldest);

        const result = await AlterService.findPrimaryAlterId('system123');

        expect(result).toBe('oldest_id');

        // Should have called limit twice (once for each query)
        expect(mockLimit).toHaveBeenCalledTimes(2);

        // Should have called orderBy for the fallback
        expect(mockOrderBy).toHaveBeenCalledWith('created_at', 'asc');

        // Should have called getDocs twice
        expect(mockGetDocs).toHaveBeenCalledTimes(2);
    });

    it('returns null if no alters exist', async () => {
         const mockSnapshotEmpty = {
            empty: true,
            size: 0,
            docs: [],
        };

        mockGetDocs
            .mockResolvedValueOnce(mockSnapshotEmpty) // host query
            .mockResolvedValueOnce(mockSnapshotEmpty); // oldest query

        const result = await AlterService.findPrimaryAlterId('system123');

        expect(result).toBeNull();
        expect(mockGetDocs).toHaveBeenCalledTimes(2);
    });
});
