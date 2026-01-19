import { GroupService } from './groups';
import {
    collection,
    doc,
    query,
    where,
    getDocs,
    deleteDoc,
    updateDoc,
    arrayRemove
} from 'firebase/firestore';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    deleteDoc: jest.fn(),
    updateDoc: jest.fn(),
    arrayRemove: jest.fn(),
    addDoc: jest.fn(),
    getDoc: jest.fn(),
    orderBy: jest.fn(),
    arrayUnion: jest.fn(),
    setDoc: jest.fn(),
    onSnapshot: jest.fn(),
}));

// Mock ../lib/firebase
jest.mock('../lib/firebase', () => ({
    db: {}
}));

describe('GroupService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('leaveGroup', () => {
        it('should remove user from group_members and groups collection', async () => {
            const groupId = 'group-123';
            const systemId = 'user-123';

            // Mock getDocs response
            const mockDoc = {
                id: 'member-doc-id',
                ref: { path: 'group_members/member-doc-id' }
            };
            (getDocs as jest.Mock).mockResolvedValue({
                docs: [mockDoc]
            });

            await GroupService.leaveGroup(groupId, systemId);

            // Verify query was constructed correctly
            expect(collection).toHaveBeenCalledWith(expect.anything(), 'group_members');
            expect(where).toHaveBeenCalledWith('group_id', '==', groupId);
            expect(where).toHaveBeenCalledWith('system_id', '==', systemId);
            expect(query).toHaveBeenCalled();
            expect(getDocs).toHaveBeenCalled();

            // Verify deleteDoc was called
            expect(deleteDoc).toHaveBeenCalledWith(mockDoc.ref);

            // Verify updateDoc was called with arrayRemove
            expect(doc).toHaveBeenCalledWith(expect.anything(), 'groups', groupId);
            expect(arrayRemove).toHaveBeenCalledWith(systemId);
            expect(updateDoc).toHaveBeenCalled();
        });
    });
});
