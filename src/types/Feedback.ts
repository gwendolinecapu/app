export type FeedbackType = 'BUG' | 'FEATURE';

export type FeedbackStatus =
    | 'NEW'             // Just submitted
    | 'NEED_INFO'       // Admin asked for more details
    | 'CONFIRMED_BUG'   // Bug validated (eligible for reward)
    | 'PLANNED'         // Feature idea accepted
    | 'DONE'            // Fixed or Implemented
    | 'NOT_A_BUG'       // Working as intended or user error
    | 'DUPLICATE'       // Already known
    | 'REJECTED';       // Won't do

export interface Feedback {
    id: string;
    userId: string;
    userEmail?: string; // Optional, snapshot at creation
    type: FeedbackType;
    status: FeedbackStatus;
    title: string;
    description: string;
    createdAt: number;
    updatedAt: number;

    // Metadata
    appVersion?: string;
    deviceInfo?: string; // e.g. "iOS 17.2, iPhone 14"
    tags?: string[];

    // Bug specific
    stepsToReproduce?: string;
    expectedResult?: string;
    actualResult?: string;
    frequency?: 'ONCE' | 'SOMETIMES' | 'ALWAYS';

    // Feature specific
    problemToSolve?: string;
    usageExample?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';

    // Admin
    adminNotes?: string;
    creditRewardAmount?: number; // distinct from transaction, just for memory
    screenshotUrl?: string; // Optional attachment

    // Voting System
    votes?: string[]; // Array of userIds who voted
    voteCount?: number; // Denormalized count for sorting
}
