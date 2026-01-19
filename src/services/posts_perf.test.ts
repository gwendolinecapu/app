import { PostService } from './posts';
import { getDoc, getDocs, doc, query, where, documentId, collection } from 'firebase/firestore';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    doc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    documentId: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
    addDoc: jest.fn(),
    serverTimestamp: jest.fn(),
    updateDoc: jest.fn(),
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn(),
    deleteDoc: jest.fn(),
}));

// Mock firebase/storage
jest.mock('firebase/storage', () => ({
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
}));

// Mock ../lib/firebase
jest.mock('../lib/firebase', () => ({
    db: {},
    storage: {}
}));

describe('PostService Performance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mock returns
        (doc as jest.Mock).mockReturnValue('doc-ref');
        (collection as jest.Mock).mockReturnValue('collection-ref');
        (documentId as jest.Mock).mockReturnValue('__name__');
    });

    it('measures calls to getDoc vs getDocs in _enrichPostsWithAuthors', async () => {
        // Create 20 posts with unique alter_id and system_id
        const posts = Array.from({ length: 20 }, (_, i) => ({
            id: `post-${i}`,
            content: 'test',
            alter_id: `alter-${i}`,
            system_id: `system-${i}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            likes: [],
            comments_count: 0,
        })) as any[];

        // Mock getDoc to return exists: true
        (getDoc as jest.Mock).mockResolvedValue({
            exists: () => true,
            data: () => ({ name: 'Test User', avatar: 'url' })
        });

         // Mock getDocs for the optimized version
        (getDocs as jest.Mock).mockResolvedValue({
            docs: [],
            forEach: (cb: any) => {},
            empty: true
        });

        await PostService._enrichPostsWithAuthors(posts);

        const getDocCalls = (getDoc as jest.Mock).mock.calls.length;
        const getDocsCalls = (getDocs as jest.Mock).mock.calls.length;

        console.log(`Performance Report:
        getDoc calls: ${getDocCalls}
        getDocs calls: ${getDocsCalls}
        Total unique IDs to fetch: ${new Set(posts.map(p => p.alter_id)).size + new Set(posts.map(p => p.system_id)).size}
        `);

        // We assert the optimized behavior
        // 20 alters / 10 = 2 calls
        // 20 systems / 10 = 2 calls
        // Total getDocs calls = 4
        // getDoc calls should be 0 (for enrichment)

        expect(getDocCalls).toBe(0);
        expect(getDocsCalls).toBe(4);
    });
});
